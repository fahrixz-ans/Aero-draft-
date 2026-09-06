import React, { useState, useEffect } from 'react';
import { 
  HardDrive, Trash2, RefreshCw, AlertTriangle, CheckCircle2, 
  FileCheck, Smartphone, Image, ShieldAlert, X
} from 'lucide-react';
import { StorageAuditReport } from '../../types';
import { logAdminAction } from '../../services/admin/auditLogService';

export default function AdminStorageManagement() {
  const [report, setReport] = useState<StorageAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchStorageAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/storage-audit');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.warn('Failed fetching storage audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageAudit();
  }, []);

  const handleCleanupOrphans = async () => {
    if (!report || !report.orphanedFiles || report.orphanedFiles.length === 0) return;

    setCleaning(true);
    setCleanResult(null);
    try {
      const filePaths = report.orphanedFiles.map(f => f.path);
      const res = await fetch('/api/admin/storage/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths })
      });
      const data = await res.json();

      if (res.ok) {
        setCleanResult({
          text: `Berhasil membersihkan ${data.deletedCount} berkas yatim (${data.freedFormatted} ruang dikosongkan).`,
          type: 'success'
        });
        await logAdminAction({
          action: 'admin_setting_changed',
          entityType: 'system',
          entityId: 'storage_cleanup',
          entityName: 'Storage Cleanup Run',
          metadata: { deletedCount: data.deletedCount, freedBytes: data.freedBytes }
        });
        fetchStorageAudit();
      } else {
        setCleanResult({ text: data.error || 'Gagal membersihkan berkas.', type: 'error' });
      }
    } catch (err: any) {
      setCleanResult({ text: 'Terjadi kegagalan jaringan saat pembersihan.', type: 'error' });
    } finally {
      setCleaning(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" />
            Manajemen Penyimpanan & Berkas (Storage Control)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau volume berkas APK, aset gambar terunggah, deteksi berkas yatim (orphaned), dan optimasi penyimpanan.
          </p>
        </div>

        <button
          onClick={fetchStorageAudit}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Audit</span>
        </button>
      </div>

      {cleanResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          cleanResult.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <span>{cleanResult.text}</span>
          <button onClick={() => setCleanResult(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Storage Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Total Penggunaan Disk</span>
            <HardDrive className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{report?.totalSizeFormatted || '0 MB'}</p>
          <p className="text-[11px] text-slate-500 mt-1">{report?.totalFiles || 0} total berkas terkelola</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Paket APK Tersimpan</span>
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{report?.activeApkFiles || 0} Berkas</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Integritas SHA-256 Valid</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Ikon & Tangkapan Layar</span>
            <Image className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{report?.activeImageFiles || 0} Gambar</p>
          <p className="text-[11px] text-slate-500 mt-1">Format WebP / AVIF / PNG</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Berkas Yatim (Orphans)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {report?.orphanedFiles?.length || 0} Berkas
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Tidak terhubung ke database aplikasi</p>
        </div>
      </div>

      {/* Orphan Cleanup Action Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Pembersihan Berkas Yatim & Sampah Unggahan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menghapus berkas sementara dan paket APK yang sudah tidak terdaftar di database aplikasi untuk menghemat ruang disk server.
            </p>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!report?.orphanedFiles || report.orphanedFiles.length === 0 || cleaning}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-40 transition-all cursor-pointer"
          >
            {cleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Bersihkan {report?.orphanedFiles?.length || 0} Berkas Yatim</span>
          </button>
        </div>

        {report?.orphanedFiles && report.orphanedFiles.length > 0 ? (
          <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {report.orphanedFiles.map((file, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="font-mono text-slate-700 dark:text-slate-300">{file.filename}</span>
                <span className="text-slate-400">{file.sizeFormatted}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Penyimpanan Bersih & Terintegrasi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh berkas fisik di disk cocok dengan entri database aplikasi.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Konfirmasi Pembersihan Disk</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus berkas yatim secara permanen.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus <strong>{report?.orphanedFiles?.length || 0} berkas</strong> yatim dari penyimpanan server? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleCleanupOrphans}
                disabled={cleaning}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {cleaning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
