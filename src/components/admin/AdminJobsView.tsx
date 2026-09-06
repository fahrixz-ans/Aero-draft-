import React, { useState, useEffect } from 'react';
import { 
  Cpu, RotateCw, CheckCircle2, AlertTriangle, Clock, 
  Play, RefreshCw, XCircle, Terminal, Layers
} from 'lucide-react';
import { WorkerQueueJob } from '../../types';
import { fetchSystemJobs, retrySystemJob } from '../../services/admin/jobsService';

export default function AdminJobsView() {
  const [activeJobs, setActiveJobs] = useState<WorkerQueueJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<WorkerQueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemJobs();
      setActiveJobs(data.active || []);
      setCompletedJobs(data.completed || []);
    } catch (err) {
      console.warn('Failed loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (jobId: string) => {
    setRetryingId(jobId);
    setMessage(null);
    try {
      const res = await retrySystemJob(jobId);
      if (res.success) {
        setMessage({ text: 'Job berhasil dijadwalkan ulang ke antrean worker.', type: 'success' });
        loadJobs();
      } else {
        setMessage({ text: res.error || 'Gagal menjadwalkan ulang job.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Terjadi kegagalan jaringan.', type: 'error' });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            Pemantau Pekerjaan Latar Belakang (Background Worker Jobs)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau eksekusi antrean asinkron (Analisis APK statis, Reindexing search, Pembersihan disk, Notifikasi).
          </p>
        </div>

        <button
          onClick={loadJobs}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Status Worker</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Pekerjaan Sedang Berjalan / Antre</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeJobs.length} Job</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Status: Active / Queued</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Total Pekerjaan Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {completedJobs.filter(j => j.status === 'completed').length} Job
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Sukses tanpa kegagalan fatal</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Pekerjaan Gagal (Failed)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {completedJobs.filter(j => j.status === 'failed').length} Job
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Tersedia fitur retry otomatis</p>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* Active Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pekerjaan Aktif dalam Antrean Worker
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Job ID & Tipe</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Percobaan</th>
                  <th className="pb-2">Waktu Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {activeJobs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Tidak ada pekerjaan aktif dalam antrean saat ini. Worker dalam kondisi siap.
                    </td>
                  </tr>
                ) : (
                  activeJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{job.id}</p>
                        <p className="text-slate-400 text-[11px]">{job.type}</p>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>{job.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {job.attempts} / {job.maxAttempts}
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(job.createdAt).toLocaleTimeString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed / Failed Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Riwayat Pekerjaan Selesai & Gagal
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">Job ID & Tipe</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Hasil / Catatan</th>
                  <th className="pb-2">Waktu Selesai</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {completedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada riwayat eksekusi pekerjaan.
                    </td>
                  </tr>
                ) : (
                  completedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{job.id}</p>
                        <p className="text-slate-400 text-[11px]">{job.type}</p>
                      </td>
                      <td className="py-2.5">
                        {job.status === 'completed' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Selesai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Gagal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate font-mono text-[11px]">
                        {job.error ? job.error : JSON.stringify(job.result || 'OK')}
                      </td>
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {job.completedAt ? new Date(job.completedAt).toLocaleTimeString('id-ID') : '-'}
                      </td>
                      <td className="py-2.5 text-right">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingId === job.id}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingId === job.id ? 'animate-spin' : ''}`} />
                            <span>Retry</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
