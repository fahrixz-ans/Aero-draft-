import { WorkerQueueJob } from '../../types';

export async function fetchSystemJobs(): Promise<{ active: WorkerQueueJob[]; completed: WorkerQueueJob[]; totalQueued: number; totalCompleted: number }> {
  try {
    const res = await fetch('/api/admin/jobs');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      active: [],
      completed: [],
      totalQueued: 0,
      totalCompleted: 0
    };
  }
}

export async function retrySystemJob(jobId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/jobs/retry/${jobId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Gagal menjadwalkan ulang job.' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createManualJob(type: string, payload: Record<string, any> = {}): Promise<{ success: boolean; job?: WorkerQueueJob; error?: string }> {
  try {
    const res = await fetch('/api/admin/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, job: data.job };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
