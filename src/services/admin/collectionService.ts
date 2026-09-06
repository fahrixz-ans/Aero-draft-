import { AppCollection } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore';

export const DEFAULT_COLLECTIONS: AppCollection[] = [
  {
    id: 'col_best_week',
    title: 'Aplikasi Terbaik Minggu Ini',
    slug: 'best-apps-this-week',
    description: 'Pilihan aplikasi teratas dengan performa dan ulasan pengguna tertinggi.',
    appIds: ['1', '2', '3', '4'],
    sortOrder: 1,
    isPublished: true,
    type: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'col_essential',
    title: 'Aplikasi Android Wajib (Essentials)',
    slug: 'essential-android-apps',
    description: 'Kumpulan utilitas dan komunikasi esensial untuk perangkat Android baru.',
    appIds: ['2', '4', '6', '8'],
    sortOrder: 2,
    isPublished: true,
    type: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'col_editors_pick',
    title: "Pilihan Redaksi (Editor's Picks)",
    slug: 'editors-picks',
    description: 'Aplikasi terverifikasi pilihan kurator Aero dengan integritas tinggi.',
    appIds: ['1', '3', '5', '7'],
    sortOrder: 3,
    isPublished: true,
    type: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'col_lightweight',
    title: 'Aplikasi Ringan & Hemat Baterai',
    slug: 'lightweight-apps',
    description: 'Ukuran di bawah 25MB dengan optimasi memori dan performa cepat.',
    appIds: ['4', '7', '8'],
    sortOrder: 4,
    isPublished: true,
    type: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function fetchAllCollections(): Promise<AppCollection[]> {
  try {
    const colRef = collection(db, 'collections');
    const q = query(colRef, orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      // Seed default collections if empty in firestore
      for (const col of DEFAULT_COLLECTIONS) {
        await setDoc(doc(db, 'collections', col.id), col);
      }
      return DEFAULT_COLLECTIONS;
    }

    const list: AppCollection[] = [];
    snap.forEach(d => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    return list;
  } catch (err) {
    console.warn('Firestore collections fetch error, using defaults:', err);
    return DEFAULT_COLLECTIONS;
  }
}

export async function saveCollection(col: AppCollection): Promise<void> {
  const docRef = doc(db, 'collections', col.id);
  await setDoc(docRef, {
    ...col,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteCollection(id: string): Promise<void> {
  const docRef = doc(db, 'collections', id);
  await deleteDoc(docRef);
}
