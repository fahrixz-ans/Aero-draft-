// ---------------------------------------------------------------------------
// AUTHENTICATION ROUTER (/api/auth/*) (STAGE 8.8 & 8.9)
// Auth.js Contract, Credentials Register, Google OAuth & Session Store
// ---------------------------------------------------------------------------

import { Router } from 'express';
import { ExpressAuth } from '@auth/express';
import { authConfig } from '../../auth';
import bcrypt from 'bcryptjs';
import { db } from '../../src/lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { SUPER_ADMIN_EMAILS } from '../auth';

const router = Router();

// Registration (Saves to pending registrations and generates verification code)
router.post('/register', async (req: any, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, error: { message: 'Semua kolom wajib diisi.' } });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: { message: 'Konfirmasi kata sandi tidak cocok.' } });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: { message: 'Kata sandi minimal harus 6 karakter.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in Firestore users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(400).json({ success: false, error: { message: 'Email sudah terdaftar. Silakan login.' } });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // Save registration as pending
    const pendingId = `pending_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;
    const pendingData = {
      id: pendingId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      verificationCode,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'pending_registrations', pendingId), pendingData);

    console.log(`[REGISTRATION CODE] For ${normalizedEmail}: ${verificationCode}`);

    return res.json({ 
      success: true, 
      requiresVerification: true, 
      email: normalizedEmail,
      message: 'Kode verifikasi telah dikirim ke email Anda.' 
    });
  } catch (error: any) {
    console.error('[Register Error]:', error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Terjadi kesalahan pada server.' } });
  }
});

// Verify Registration Endpoint
router.post('/register/verify', async (req: any, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: { message: 'Email dan kode verifikasi wajib diisi.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pendingId = `pending_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;
    
    const pendingDocRef = doc(db, 'pending_registrations', pendingId);
    const pendingSnap = await getDoc(pendingDocRef);

    if (!pendingSnap.exists()) {
      return res.status(400).json({ success: false, error: { message: 'Proses registrasi tidak ditemukan atau sudah kedaluwarsa.' } });
    }

    const pendingData = pendingSnap.data();

    if (pendingData.verificationCode !== code.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Kode verifikasi yang Anda masukkan salah.' } });
    }

    if (new Date() > new Date(pendingData.expiresAt)) {
      await deleteDoc(pendingDocRef);
      return res.status(400).json({ success: false, error: { message: 'Kode verifikasi telah kedaluwarsa. Silakan daftar ulang.' } });
    }

    // Complete registration - create user
    const userId = `usr_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);
    const role = isSuperAdmin ? 'SUPER_ADMIN' : 'USER';

    const newUser = {
      id: userId,
      name: pendingData.name,
      username: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash: pendingData.passwordHash,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(pendingData.name)}&background=0D8ABC&color=fff`,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', userId), newUser);
    await deleteDoc(pendingDocRef);

    return res.json({ success: true, message: 'Verifikasi berhasil! Akun Anda telah aktif.' });
  } catch (error: any) {
    console.error('[Verify Register Error]:', error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Terjadi kesalahan pada server.' } });
  }
});

// Send Forgot Password Code
router.post('/forgot-password/send', async (req: any, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email wajib diisi.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(400).json({ success: false, error: { message: 'Email tidak terdaftar.' } });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins expiry

    const resetId = `reset_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;
    await setDoc(doc(db, 'reset_codes', resetId), {
      id: resetId,
      email: normalizedEmail,
      resetCode,
      expiresAt,
      createdAt: new Date().toISOString()
    });

    console.log(`[RESET PASSWORD CODE] For ${normalizedEmail}: ${resetCode}`);

    return res.json({ success: true, message: 'Kode verifikasi telah dikirim ke email Anda.' });
  } catch (error: any) {
    console.error('[Send Reset Code Error]:', error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Terjadi kesalahan pada server.' } });
  }
});

// Verify Forgot Password & Reset Password
router.post('/forgot-password/verify', async (req: any, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, error: { message: 'Email, kode, dan kata sandi baru wajib diisi.' } });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: { message: 'Kata sandi baru minimal harus 6 karakter.' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const resetId = `reset_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;

    const resetDocRef = doc(db, 'reset_codes', resetId);
    const resetSnap = await getDoc(resetDocRef);

    if (!resetSnap.exists()) {
      return res.status(400).json({ success: false, error: { message: 'Permintaan reset tidak ditemukan atau sudah kedaluwarsa.' } });
    }

    const resetData = resetSnap.data();

    if (resetData.resetCode !== code.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Kode verifikasi yang Anda masukkan salah.' } });
    }

    if (new Date() > new Date(resetData.expiresAt)) {
      await deleteDoc(resetDocRef);
      return res.status(400).json({ success: false, error: { message: 'Kode verifikasi telah kedaluwarsa.' } });
    }

    // Find the user to update their password
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(400).json({ success: false, error: { message: 'User tidak ditemukan.' } });
    }

    let userDocId = "";
    querySnapshot.forEach((docSnap) => {
      userDocId = docSnap.id;
    });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password Hash
    await setDoc(doc(db, 'users', userDocId), {
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await deleteDoc(resetDocRef);

    return res.json({ success: true, message: 'Kata sandi Anda berhasil diperbarui. Silakan login.' });
  } catch (error: any) {
    console.error('[Verify Reset Error]:', error);
    return res.status(500).json({ success: false, error: { message: error.message || 'Terjadi kesalahan pada server.' } });
  }
});

// Mount Auth.js handlers
const authHandler = ExpressAuth(authConfig as any);
router.use(authHandler);

export const authRouter = router;
