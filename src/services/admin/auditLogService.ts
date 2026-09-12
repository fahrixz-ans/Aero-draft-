import { AdminAuditLog, AdminAuditAction } from '../../types';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit as firestoreLimit, onSnapshot } from 'firebase/firestore';

export async function logAdminAction(params: {
  action: AdminAuditAction;
  entityType: 'application' | 'version' | 'review' | 'report' | 'category' | 'collection' | 'security' | 'system' | 'notification' | 'banner';
  entityId: string;
  entityName?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const adminId = 'admin_master';
  const adminEmail = 'fahriandriansaputra123@gmail.com';

  const logPayload = {
    adminId,
    adminEmail,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName || '',
    metadata: params.metadata || {},
    createdAt: new Date().toISOString()
  };

  // 1. Log to server Express endpoint
  try {
    await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    });
  } catch (err) {
    // Non-blocking fallback
  }

  // 2. Log to Firestore admin_audit_logs canonical collection
  try {
    const colRef = collection(db, 'admin_audit_logs');
    await addDoc(colRef, logPayload);
  } catch (err) {
    // Also attempt fallback to adminAuditLogs
    try {
      const colRefLegacy = collection(db, 'adminAuditLogs');
      await addDoc(colRefLegacy, logPayload);
    } catch (e) {
      // Non-blocking
    }
  }
}

export async function fetchAdminAuditLogs(maxCount = 50): Promise<AdminAuditLog[]> {
  // 1. Try canonical Firestore admin_audit_logs first
  try {
    const colRef = collection(db, 'admin_audit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(maxCount));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const logs: AdminAuditLog[] = [];
      snap.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      return logs;
    }
  } catch (err) {
    // fallback to server or legacy
  }

  // 2. Try server API
  try {
    const res = await fetch(`/api/admin/audit-logs?limit=${maxCount}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.logs) && data.logs.length > 0) {
        return data.logs;
      }
    }
  } catch (err) {
    // Fallback
  }

  // 3. Fallback to legacy adminAuditLogs
  try {
    const colRef = collection(db, 'adminAuditLogs');
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(maxCount));
    const snap = await getDocs(q);
    const logs: AdminAuditLog[] = [];
    snap.forEach(docSnap => {
      logs.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return logs;
  } catch (err) {
    return [];
  }
}

export function subscribeAdminAuditLogs(
  callback: (logs: AdminAuditLog[]) => void,
  maxCount = 50
): () => void {
  try {
    const colRef = collection(db, 'admin_audit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(maxCount));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: AdminAuditLog[] = [];
        snapshot.forEach((d) => {
          logs.push({ id: d.id, ...(d.data() as any) });
        });
        callback(logs);
      },
      (err) => {
        console.warn('Live audit log subscription fallback:', err);
        fetchAdminAuditLogs(maxCount).then(callback);
      }
    );
  } catch (err) {
    fetchAdminAuditLogs(maxCount).then(callback);
    return () => {};
  }
}
