import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Eye, ShieldCheck, 
  FileText, Download, Code, ExternalLink, RefreshCw, Sparkles, Send, ShieldAlert, Check
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { logAdminAction } from '../../services/admin/auditLogService';
import { AppData } from '../../types';

interface AdminReviewWorkspaceProps {
  onNavigateTab: (tab: string, slug?: string) => void;
  user: any;
}

export default function AdminReviewWorkspace({ onNavigateTab, user }: AdminReviewWorkspaceProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal note states
  const [modalType, setModalType] = useState<'reject' | 'changes' | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const list: any[] = [];
      try {
        const snap = await getDocs(collection(db, 'developerSubmissions'));
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Firestore developerSubmissions read notice:', e);
      }

      // Also fetch from API endpoint fallback
      try {
        const res = await fetch('/api/developer/submissions?all=true');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((item: any) => {
            if (!list.some(l => l.id === item.id)) {
              list.push(item);
            }
          });
        }
      } catch (e) {
        console.warn('API submissions fetch notice:', e);
      }

      setSubmissions(list);
    } catch (err: any) {
      setMessage({ text: 'Gagal memuat daftar pengajuan: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const docRef = doc(db, 'developerSubmissions', item.id);
      await updateDoc(docRef, {
        submissionStatus: 'APPROVED',
        reviewStatus: 'APPROVED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.email || 'Owner Console'
      });

      // Also create or update in applications collection
      const appRef = doc(db, 'applications', item.id || item.appId || item.slug);
      await setDoc(appRef, {
        id: item.id || item.appId || item.slug,
        name: item.appName || item.name,
        slug: item.slug || (item.appName || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        developer: item.developerName || item.developer || 'Unknown Developer',
        developerEmail: item.developerEmail,
        developerId: item.developerId,
        packageName: item.packageName,
        version: item.versionName || item.version || '1.0.0',
        versionName: item.versionName || item.version || '1.0.0',
        versionCode: item.versionCode || 1,
        category: item.category || 'Alat & Utilitas',
        shortDescription: item.shortDescription || item.description?.slice(0, 150),
        description: item.description || '',
        iconUrl: item.iconUrl || item.icon || '/icon.png',
        icon: item.iconUrl || item.icon || '/icon.png',
        apkFileUrl: item.apkFileUrl || item.downloadUrl,
        downloadUrl: item.apkFileUrl || item.downloadUrl || '',
        officialUrl: item.officialUrl || '',
        sourceType: item.sourceType || 'apk',
        sha256: item.sha256 || '',
        permissions: item.permissions || [],
        screenshots: item.screenshots || [],
        lifecycleStatus: 'DRAFT',
        submissionStatus: 'APPROVED',
        reviewStatus: 'APPROVED',
        publicationStatus: 'UNPUBLISHED',
        securityStatus: item.securityStatus || 'PASSED',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await logAdminAction({
        action: 'submission_approved',
        entityType: 'developer_submission',
        entityId: item.id,
        entityName: item.appName || item.name,
        metadata: { reviewer: user?.email }
      });

      setMessage({ text: `Pengajuan "${item.appName || item.name}" BERHASIL DISETUJUI! Anda sekarang dapat menerbitkannya ke publik.`, type: 'success' });
      setSelectedItem(null);
      await loadSubmissions();
    } catch (err: any) {
      setMessage({ text: 'Gagal menyetujui pengajuan: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNow = async (item: any) => {
    setActionLoading(true);
    setMessage(null);
    try {
      // Validate Publish Gate
      if (!item.packageName) {
        throw new Error('Gagal mempublikasikan: Package Name aplikasi tidak boleh kosong.');
      }
      if (!item.category) {
        throw new Error('Gagal mempublikasikan: Kategori aplikasi wajib ditentukan.');
      }

      const appRef = doc(db, 'applications', item.id || item.appId || item.slug);
      await updateDoc(appRef, {
        lifecycleStatus: 'ACTIVE',
        publicationStatus: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
        publishedBy: user?.email || 'Owner Console'
      });

      const subRef = doc(db, 'developerSubmissions', item.id);
      await updateDoc(subRef, {
        publicationStatus: 'PUBLISHED'
      });

      await logAdminAction({
        action: 'app_published',
        entityType: 'application',
        entityId: item.id,
        entityName: item.appName || item.name,
        metadata: { publisher: user?.email }
      });

      setMessage({ text: `Aplikasi "${item.appName || item.name}" SEKARANG RESMI TERBIT DI KATALOG PUBLIK!`, type: 'success' });
      setSelectedItem(null);
      await loadSubmissions();
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menerbitkan aplikasi.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalSubmit = async () => {
    if (!selectedItem || !modalType) return;
    if (!noteText.trim()) {
      setMessage({ text: 'Catatan wajib diisi!', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const newStatus = modalType === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';
      const docRef = doc(db, 'developerSubmissions', selectedItem.id);
      await updateDoc(docRef, {
        submissionStatus: newStatus,
        reviewStatus: newStatus,
        reviewNote: noteText.trim(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.email || 'Owner Console'
      });

      await logAdminAction({
        action: modalType === 'reject' ? 'submission_rejected' : 'submission_changes_requested',
        entityType: 'developer_submission',
        entityId: selectedItem.id,
        entityName: selectedItem.appName || selectedItem.name,
        metadata: { note: noteText.trim(), reviewer: user?.email }
      });

      setMessage({ 
        text: modalType === 'reject' 
          ? `Pengajuan "${selectedItem.appName || selectedItem.name}" DITOLAK dengan catatan yang dikirimkan ke developer.`
          : `Permintaan revisi dikirimkan ke developer untuk "${selectedItem.appName || selectedItem.name}".`, 
        type: 'success' 
      });
      setModalType(null);
      setNoteText('');
      setSelectedItem(null);
      await loadSubmissions();
    } catch (err: any) {
      setMessage({ text: 'Gagal memperbarui status: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingList = submissions.filter(s => 
    !s.submissionStatus || ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(s.submissionStatus)
  );
  const reviewedList = submissions.filter(s => 
    ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(s.submissionStatus)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Owner Review Workspace & Submission Gate
          </div>
          <h2 className="text-xl font-black mt-1">Workspace Peninjauan Pengajuan Aplikasi</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspeksi menyeluruh terhadap metadata, berkas APK, tandatangan SHA-256, izin Android, serta validasi domain unduhan sebelum memberikan persetujuan atau menerbitkan ke katalog publik.
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Workspace</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Pending Submissions vs Reviewed Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Submissions Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              Menunggu Peninjauan Owner ({pendingList.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingList.map((item, idx) => (
              <div key={item.id || idx} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/20 shadow-2xs space-y-4 hover:border-amber-500/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.iconUrl || item.icon || '/icon.png'}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.appName || item.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400">{item.packageName || 'com.example.app'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                          v{item.versionName || item.version || '1.0'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          SUBMITTED
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspeksi</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Developer: <strong className="text-slate-900 dark:text-white">{item.developerName || item.developer || item.developerEmail}</strong> ({item.developerEmail})
                </div>
              </div>
            ))}

            {pendingList.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                Tidak ada pengajuan baru yang menunggu peninjauan.
              </div>
            )}
          </div>
        </div>

        {/* Reviewed Submissions Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Riwayat Peninjauan Terakhir ({reviewedList.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {reviewedList.map((item, idx) => (
              <div key={item.id || idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={item.iconUrl || item.icon || '/icon.png'}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.appName || item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.developerEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    item.submissionStatus === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : item.submissionStatus === 'REJECTED'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {item.submissionStatus}
                  </span>

                  {item.submissionStatus === 'APPROVED' && item.publicationStatus !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublishNow(item)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Terbitkan
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {reviewedList.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                Belum ada riwayat peninjauan aplikasi.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detailed Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedItem.iconUrl || selectedItem.icon || '/icon.png'}
                  alt=""
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedItem.appName || selectedItem.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedItem.packageName || 'com.example.app'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Developer: <strong>{selectedItem.developerName || selectedItem.developer}</strong> ({selectedItem.developerEmail})</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inspection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">Spesifikasi Versi & APK</span>
                <p>Versi: <strong className="font-mono">{selectedItem.versionName || selectedItem.version || '1.0'}</strong> (Code: {selectedItem.versionCode || 1})</p>
                <p>Metode Distribusi: <strong className="uppercase font-mono">{selectedItem.sourceType || 'apk'}</strong></p>
                <p>Kategori: <strong>{selectedItem.category || 'Alat & Utilitas'}</strong></p>
                <p>SHA-256: <code className="text-[10px] break-all bg-white dark:bg-slate-900 p-1 rounded font-mono">{selectedItem.sha256 || 'N/A'}</code></p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">Tautan Unduhan & Keamanan</span>
                {selectedItem.apkFileUrl && (
                  <a href={selectedItem.apkFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 font-mono text-[11px] truncate">
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedItem.apkFileUrl}</span>
                  </a>
                )}
                {selectedItem.officialUrl && (
                  <a href={selectedItem.officialUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline flex items-center gap-1 font-mono text-[11px] truncate">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedItem.officialUrl}</span>
                  </a>
                )}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500">Status Keamanan:</span>
                  <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-[10px]">
                    {selectedItem.securityStatus || 'PASSED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Aplikasi</label>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line max-h-40 overflow-y-auto">
                {selectedItem.description || 'Tidak ada deskripsi.'}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setModalType('reject');
                  setNoteText('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Pengajuan</span>
              </button>

              <button
                onClick={() => {
                  setModalType('changes');
                  setNoteText('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Minta Revisi</span>
              </button>

              <button
                onClick={() => handleApprove(selectedItem)}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Setujui (Approve)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Reject / Request Changes Note Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {modalType === 'reject' ? 'Tolak Pengajuan Aplikasi' : 'Minta Revisi dari Developer'}
            </h3>
            <p className="text-xs text-slate-400">
              {modalType === 'reject' 
                ? 'Berikan alasan penolakan secara jelas. Pesan ini akan dikirimkan kepada developer.' 
                : 'Berikan rincian hal-hal yang perlu diperbaiki oleh developer sebelum disetujui.'}
            </p>

            <textarea
              rows={4}
              required
              placeholder="Tuliskan alasan atau instruksi revisi..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={actionLoading || !noteText.trim()}
                className={`px-4 py-2 font-bold text-xs text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                  modalType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Keputusan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
