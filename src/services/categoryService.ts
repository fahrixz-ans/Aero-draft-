import { CATEGORIES as INITIAL_CATEGORIES } from '../data/appsData';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { 
  getCustomCategories, 
  saveCustomCategories, 
  getDeletedCategories, 
  addDeletedCategory, 
  removeDeletedCategory 
} from '../utils/appStorage';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt?: string;
}

export const sanitizeCategorySlug = (name: string): string => {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'kategori';
};

/**
 * Loads all active categories from Firestore + Defaults + Apps
 */
export const loadAllCategories = async (appCategories: string[] = []): Promise<string[]> => {
  const deletedCats = getDeletedCategories();
  const firestoreCategories: string[] = [];

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.name && typeof data.name === 'string') {
        firestoreCategories.push(data.name.trim());
      }
    });
  } catch (err) {
    console.warn('Firestore categories load error, using local fallback:', err);
  }

  const localCustom = getCustomCategories();
  
  // Combine initial categories, firestore categories, local custom categories, and app categories
  const allCandidates = [
    ...INITIAL_CATEGORIES,
    ...firestoreCategories,
    ...localCustom,
    ...appCategories
  ];

  // Filter out deleted categories and deduplicate case-insensitively
  const seen = new Set<string>();
  const finalCategories: string[] = [];

  for (const cat of allCandidates) {
    const trimmed = cat.trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || deletedCats.includes(lower)) continue;
    if (!seen.has(lower)) {
      seen.add(lower);
      finalCategories.push(trimmed);
    }
  }

  // Keep custom categories synced in localStorage
  saveCustomCategories(finalCategories);

  return finalCategories;
};

/**
 * Creates or saves a new category to Firestore and LocalStorage
 */
export const addCategoryToDb = async (name: string, description?: string): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: false, error: 'Nama kategori minimal 2 karakter.', updatedList: [] };
  }

  const currentCats = await loadAllCategories();
  const exists = currentCats.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { success: false, error: `Kategori "${trimmed}" sudah ada di database.`, updatedList: currentCats };
  }

  const slug = sanitizeCategorySlug(trimmed);

  try {
    await setDoc(doc(db, 'categories', slug), {
      id: slug,
      name: trimmed,
      slug,
      description: description || '',
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.warn('Firestore add category write warning:', err);
  }

  // Remove from deleted list if previously deleted
  removeDeletedCategory(trimmed);

  const updatedList = [...currentCats, trimmed];
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};

/**
 * Deletes a category from Firestore, marks it deleted, and updates affected apps
 */
export const deleteCategoryFromDb = async (
  categoryName: string, 
  fallbackCategory: string = 'Utilities'
): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmed = categoryName.trim();
  if (!trimmed) {
    return { success: false, error: 'Nama kategori tidak valid.', updatedList: [] };
  }

  const slug = sanitizeCategorySlug(trimmed);

  try {
    await deleteDoc(doc(db, 'categories', slug));
  } catch (err: any) {
    console.warn('Firestore delete category warning:', err);
  }

  // Mark as deleted in storage
  addDeletedCategory(trimmed);

  // Re-assign any applications in Firestore using this category to fallbackCategory
  try {
    const q = query(collection(db, 'applications'), where('category', '==', trimmed));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { category: fallbackCategory });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore update affected apps error:', err);
  }

  const currentCats = await loadAllCategories();
  const updatedList = currentCats.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};

/**
 * Renames an existing category across Firestore, storage, and applications
 */
export const renameCategoryInDb = async (
  oldName: string,
  newName: string
): Promise<{ success: boolean; error?: string; updatedList: string[] }> => {
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();

  if (!trimmedNew || trimmedNew.length < 2) {
    return { success: false, error: 'Nama baru kategori minimal 2 karakter.', updatedList: [] };
  }

  if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
    return { success: true, updatedList: await loadAllCategories() };
  }

  // Check if new name exists
  const currentCats = await loadAllCategories();
  if (currentCats.some(c => c.toLowerCase() === trimmedNew.toLowerCase())) {
    return { success: false, error: `Kategori "${trimmedNew}" sudah digunakan.`, updatedList: currentCats };
  }

  const oldSlug = sanitizeCategorySlug(trimmedOld);
  const newSlug = sanitizeCategorySlug(trimmedNew);

  try {
    // 1. Create new category doc
    await setDoc(doc(db, 'categories', newSlug), {
      id: newSlug,
      name: trimmedNew,
      slug: newSlug,
      createdAt: new Date().toISOString()
    });

    // 2. Delete old category doc
    await deleteDoc(doc(db, 'categories', oldSlug));

    // 3. Batch update all applications that have oldName
    const q = query(collection(db, 'applications'), where('category', '==', trimmedOld));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.update(docSnap.ref, { category: trimmedNew });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore rename category warning:', err);
  }

  // Update categories list in storage
  removeDeletedCategory(trimmedNew);
  addDeletedCategory(trimmedOld);

  const updatedList = (await loadAllCategories())
    .filter(c => c.toLowerCase() !== trimmedOld.toLowerCase());
  
  if (!updatedList.some(c => c.toLowerCase() === trimmedNew.toLowerCase())) {
    updatedList.push(trimmedNew);
  }
  
  saveCustomCategories(updatedList);

  return { success: true, updatedList };
};
