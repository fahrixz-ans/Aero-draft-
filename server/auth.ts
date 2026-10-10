// ---------------------------------------------------------------------------
// MOD STATION FIREBASE AUTHENTICATION & RBAC PERMISSION ENFORCEMENT
// Single source of truth for Firebase ID Token verification & role resolution
// ---------------------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert, type App as FirebaseAdminApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ERROR_CODES, sendError } from './errors';
import fs from 'fs';
import path from 'path';

export interface AuthSessionUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  image?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'MODERATOR' | 'DEVELOPER' | 'USER';
  permissions: string[];
}

export const SUPER_ADMIN_EMAILS = [
  'fantrastore.id@gmail.com',
  'fahriandriansaputra123@gmail.com',
  'fahriandriansptr@gmail.com',
  'admin@aeroapk.com'
];

export const ALL_PERMISSIONS = [
  'apps.read', 'apps.create', 'apps.update', 'apps.publish', 'apps.archive',
  'versions.read', 'versions.create', 'versions.update', 'versions.publish',
  'categories.read', 'categories.create', 'categories.update',
  'collections.read', 'collections.create', 'collections.update', 'collections.publish',
  'reviews.read', 'reviews.moderate', 'reviews.delete',
  'developers.read', 'developers.update',
  'homepage.read', 'homepage.update',
  'moderation.read', 'moderation.approve', 'moderation.reject', 'moderation.review',
  'analytics.read',
  'audit.read',
  'access.read', 'access.update',
  'settings.read', 'settings.update',
  'ai.generate', 'ai.moderate'
];

export function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [...ALL_PERMISSIONS];
    case 'ADMIN':
      return ALL_PERMISSIONS.filter(p => !p.startsWith('access.update'));
    case 'EDITOR':
      return ['apps.read', 'apps.create', 'apps.update', 'categories.read', 'collections.read', 'homepage.read', 'ai.generate'];
    case 'MODERATOR':
      return ['moderation.read', 'moderation.approve', 'moderation.reject', 'moderation.review', 'reviews.read', 'reviews.moderate', 'apps.read'];
    case 'DEVELOPER':
      return ['apps.read', 'apps.create', 'apps.update', 'versions.read', 'versions.create', 'analytics.read'];
    case 'ANALYST':
      return ['analytics.read', 'audit.read', 'apps.read'];
    default:
      return ['apps.read'];
  }
}

// Helper to resolve admin app for Auth
let configProjectId: string | undefined;
let configDbId: string | undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (configData.projectId) configProjectId = configData.projectId;
    if (configData.firestoreDatabaseId && configData.firestoreDatabaseId !== '(default)') {
      configDbId = configData.firestoreDatabaseId;
    }
  }
} catch (e) {
  console.warn('[Auth] Error reading firebase-applet-config.json:', e);
}

function getAdminApp(): FirebaseAdminApp {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID || configProjectId || 'mod-station-prod';
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')?.trim();

  if (clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } catch (err) {
      console.warn('[Auth] Failed to init Firebase Admin with credentials, falling back to default:', err);
    }
  }

  return initializeApp({ projectId });
}

const db = getFirestore(getAdminApp(), configDbId || '(default)');
const auth = getAdminAuth(getAdminApp());

/**
 * Resolves user from verified Firebase ID Token and Firestore profile.
 */
export async function resolveUserSession(req: Request): Promise<AuthSessionUser | null> {
  // If already resolved on this request cycle
  if ((req as any).user) {
    return (req as any).user;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) return null;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = (decodedToken.email || '').toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);

    // Read user record from Firestore
    let role: AuthSessionUser['role'] = isSuperAdmin ? 'SUPER_ADMIN' : 'USER';
    let name = decodedToken.name || email.split('@')[0] || 'Mod Station User';
    let image = decodedToken.picture || '';

    try {
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        if (isSuperAdmin) {
          role = 'SUPER_ADMIN';
        } else if (userData.role) {
          role = userData.role as any;
        }
        if (userData.displayName || userData.name) name = userData.displayName || userData.name;
        if (userData.photoURL || userData.image) image = userData.photoURL || userData.image;

        // Update last login timestamp
        userRef.update({
          lastLogin: Timestamp.now(),
          updatedAt: Timestamp.now()
        }).catch(() => undefined);
      } else {
        // First login: provision profile in Firestore
        await userRef.set({
          id: uid,
          uid,
          email,
          name,
          displayName: name,
          image,
          photoURL: image,
          role: isSuperAdmin ? 'SUPER_ADMIN' : 'USER',
          status: 'ACTIVE',
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now(),
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (dbErr) {
      console.warn('[Auth] Firestore profile read warning:', (dbErr as any)?.message || dbErr);
    }

    const sessionUser: AuthSessionUser = {
      id: uid,
      uid,
      email,
      name,
      image,
      role,
      permissions: getRolePermissions(role)
    };

    (req as any).user = sessionUser;
    return sessionUser;
  } catch (err: any) {
    console.warn('[Auth] Token verification failed:', err?.message || err);
    return null;
  }
}

/**
 * Middleware: Requires valid Firebase Authentication.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await resolveUserSession(req);
  if (!user) {
    return sendError(res, ERROR_CODES.AUTH_REQUIRED, 'Otentikasi Firebase diperlukan untuk mengakses sumber daya ini.', 401);
  }
  (req as any).user = user;
  next();
}

/**
 * Middleware: Requires a specific RBAC permission.
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUserSession(req);
    if (!user) {
      return sendError(res, ERROR_CODES.AUTH_REQUIRED, 'Otentikasi Firebase diperlukan untuk mengakses sumber daya ini.', 401);
    }

    const hasPerm = user.role === 'SUPER_ADMIN' || user.permissions.includes(permission);
    if (!hasPerm) {
      return sendError(res, ERROR_CODES.FORBIDDEN, `Akses ditolak: Anda tidak memiliki izin '${permission}'.`, 403, {
        requiredPermission: permission,
        userRole: user.role
      });
    }

    (req as any).user = user;
    next();
  };
}

/**
 * Middleware: Requires one of the specified roles.
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUserSession(req);
    if (!user) {
      return sendError(res, ERROR_CODES.AUTH_REQUIRED, 'Otentikasi Firebase diperlukan untuk mengakses sumber daya ini.', 401);
    }

    if (user.role === 'SUPER_ADMIN' || roles.includes(user.role)) {
      (req as any).user = user;
      return next();
    }

    return sendError(res, ERROR_CODES.FORBIDDEN, `Akses ditolak: Peran '${user.role}' tidak memiliki akses ke endpoint ini.`, 403, {
      allowedRoles: roles,
      userRole: user.role
    });
  };
}
