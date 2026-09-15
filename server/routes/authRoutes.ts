// ---------------------------------------------------------------------------
// FIREBASE AUTHENTICATION API ROUTER (/api/auth/*)
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { requireAuth, resolveUserSession } from '../auth';
import { firestore } from '../repositories';

const router = Router();

/**
 * Get current authenticated user details from Firestore (source of truth).
 */
router.get('/me', async (req: any, res) => {
  try {
    const user = await resolveUserSession(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Otentikasi diperlukan.' }
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error: any) {
    console.error('[Auth GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Terjadi kesalahan internal.' }
    });
  }
});

/**
 * Change password for authenticated user via Firebase Admin SDK.
 */
router.post('/change-password', requireAuth as any, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'Otentikasi diperlukan.' }
      });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Kata sandi baru dan konfirmasi wajib diisi.' }
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Konfirmasi kata sandi baru tidak cocok.' }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Kata sandi baru minimal harus 6 karakter.' }
      });
    }

    // Update user password in Firebase Authentication using Admin SDK
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(user.id, {
      password: newPassword
    });

    // Update firestore updatedAt
    const userDocRef = firestore.collection('users').doc(user.id);
    await userDocRef.update({
      updatedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.'
    });
  } catch (error: any) {
    console.error('[Change Password Error]:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Gagal memperbarui kata sandi.' }
    });
  }
});

export const authRouter = router;
