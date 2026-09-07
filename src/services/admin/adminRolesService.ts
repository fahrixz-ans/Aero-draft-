import { AdminUser, AdminRole } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'apps.read', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'apps.review',
    'categories.manage', 'collections.manage', 'moderation.manage', 'security.manage',
    'analytics.read', 'settings.manage', 'users.manage', 'storage.cleanup', 'audit.view'
  ],
  admin: [
    'apps.read', 'apps.create', 'apps.update', 'apps.publish', 'apps.review',
    'categories.manage', 'collections.manage', 'moderation.manage',
    'analytics.read', 'settings.manage', 'audit.view'
  ],
  moderator: [
    'apps.read', 'apps.review', 'moderation.manage', 'audit.view'
  ],
  content_manager: [
    'apps.read', 'apps.create', 'apps.update', 'categories.manage', 'collections.manage', 'audit.view'
  ],
  analyst: [
    'apps.read', 'analytics.read', 'audit.view'
  ]
};

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin_owner',
    email: 'fantrastore.id@gmail.com',
    displayName: 'Aero Super Admin',
    role: 'super_admin',
    permissions: ROLE_PERMISSIONS.super_admin,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin_primary',
    email: 'fahriandriansaputra123@gmail.com',
    displayName: 'Fahri Andrian (Super Administrator)',
    role: 'super_admin',
    permissions: ROLE_PERMISSIONS.super_admin,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin_team',
    email: 'admin@aeroapk.com',
    displayName: 'Aero Internal Operations',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, 'adminUsers');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const adm of INITIAL_ADMINS) {
        await setDoc(doc(db, 'adminUsers', adm.id), adm);
      }
      return INITIAL_ADMINS;
    }

    const admins: AdminUser[] = [];
    snap.forEach(d => {
      admins.push({ id: d.id, ...(d.data() as any) });
    });
    return admins;
  } catch (err) {
    console.warn('Firestore adminUsers fetch error, using defaults:', err);
    return INITIAL_ADMINS;
  }
}

export async function saveAdminUser(user: AdminUser): Promise<void> {
  const docRef = doc(db, 'adminUsers', user.id);
  await setDoc(docRef, user);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const docRef = doc(db, 'adminUsers', id);
  await deleteDoc(docRef);
}
