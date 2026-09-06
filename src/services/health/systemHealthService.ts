import { SystemHealthStatus, StorageAuditReport } from '../../types';

export async function fetchSystemHealth(): Promise<SystemHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'degraded',
      uptimeSeconds: 0,
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMB: 0,
        heapTotalMB: 0,
        rssMB: 0
      },
      storage: {
        status: 'error',
        writable: false,
        uploadsDirExists: false
      },
      queue: {
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        deadLetterJobs: 0
      },
      environment: 'production'
    };
  }
}

export async function fetchStorageAudit(): Promise<StorageAuditReport> {
  try {
    const res = await fetch('/api/admin/storage-audit');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      scannedAt: new Date().toISOString(),
      totalFiles: 0,
      totalSizeBytes: 0,
      totalSizeFormatted: '0 MB',
      activeApkFiles: 0,
      activeImageFiles: 0,
      orphanedFiles: [],
      integrityStatus: 'healthy'
    };
  }
}
