// ---------------------------------------------------------------------------
// AUTHENTICATION ROUTER (/api/auth/*) (STAGE 8.8 & 8.9)
// Auth.js Contract, Google OAuth Identity Resolution & Session Store
// ---------------------------------------------------------------------------

import { Router } from 'express';
import {
  resolveUserSession,
  activeSessions,
  SUPER_ADMIN_EMAILS,
  getRolePermissions,
  AuthSession
} from '../auth';
import { sendSuccess, sendError, ERROR_CODES } from '../errors';
import crypto from 'crypto';

export const authRouter = Router();

// GET /api/auth/session
authRouter.get('/session', (req, res) => {
  const user = resolveUserSession(req);
  if (!user) {
    return res.status(200).json({ user: null });
  }
  return res.status(200).json({
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

// GET /api/auth/csrf
authRouter.get('/csrf', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  return res.status(200).json({ csrfToken });
});

// POST /api/auth/signin/google
authRouter.post('/signin/google', (req, res) => {
  try {
    const { email, name, image } = req.body;
    if (!email) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, 'Alamat email wajib disertakan.', 400);
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);
    const role = isSuperAdmin ? 'SUPER_ADMIN' : 'USER';
    const permissions = getRolePermissions(role);

    const user = {
      id: `usr_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`,
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || normalizedEmail)}&background=0D8ABC&color=fff`,
      role: role as any,
      permissions
    };

    const sessionToken = `sess_${crypto.randomBytes(24).toString('hex')}`;
    const session: AuthSession = {
      user,
      expires: new Date(Date.now() + 30 * 86400000).toISOString()
    };

    activeSessions.set(sessionToken, session);

    // Set cookie for browser session persistence
    res.cookie('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 86400000
    });

    return sendSuccess(res, {
      user,
      sessionToken,
      expires: session.expires
    });
  } catch (err: any) {
    return sendError(res, ERROR_CODES.AUTH_PROVIDER_ERROR, err.message, 500);
  }
});

// POST /api/auth/signout
authRouter.post('/signout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    activeSessions.delete(token);
  }
  res.clearCookie('next-auth.session-token');
  return sendSuccess(res, { message: 'Berhasil keluar.' });
});
