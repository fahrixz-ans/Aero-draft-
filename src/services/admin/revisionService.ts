import { AppRevision, AppData } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, setDoc, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';

export async function logAppRevision(params: {
  appId: string;
  appName: string;
  previousData: Partial<AppData>;
  newData: Partial<AppData>;
  changedFields: string[];
  reason?: string;
}): Promise<void> {
  try {
    const editorId = 'admin_system';
    const editorEmail = 'admin@aeroapk.com';

    const revisionId = `rev_${Date.now()}`;
    const docRef = doc(db, 'applications', params.appId, 'revisions', revisionId);

    const revisionPayload: AppRevision = {
      id: revisionId,
      appId: params.appId,
      appName: params.appName,
      editorId,
      editorEmail,
      changedFields: params.changedFields,
      previousData: params.previousData,
      newData: params.newData,
      reason: params.reason || 'Pembaruan metadata aplikasi',
      createdAt: new Date().toISOString()
    };

    await setDoc(docRef, revisionPayload);
  } catch (err) {
    console.warn('Failed logging app revision:', err);
  }
}

export async function fetchAppRevisions(appId: string, maxCount = 20): Promise<AppRevision[]> {
  try {
    const colRef = collection(db, 'applications', appId, 'revisions');
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(maxCount));
    const snap = await getDocs(q);

    const revisions: AppRevision[] = [];
    snap.forEach(d => {
      revisions.push({ id: d.id, ...(d.data() as any) });
    });
    return revisions;
  } catch (err) {
    console.warn('Failed fetching app revisions:', err);
    return [];
  }
}
