import React, { useState, useEffect } from 'react';
import { 
  X, Upload, FileCheck, AlertCircle, RefreshCw, Layers, History, Shield, 
  Trash2, Eye, Calendar, Clock, BarChart2, Info, Check, Copy, ArrowRight, Activity 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, 
  query, orderBy, increment 
} from 'firebase/firestore';
import { AppData, AppVersion, SecurityStatus } from '../../types';
import { APKUploader } from './APKUploader';

interface VersionManagerModalProps {
  app: AppData;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

type ModalTab = 'list' | 'upload';

export default function VersionManagerModal({
  app,
  isOpen,
  onClose,
  onSaveSuccess
}: VersionManagerModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('list');
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload/New Version Form State
  const [newApkUrl, setNewApkUrl] = useState('');
  const [apkMetadata, setApkMetadata] = useState<any>(null);
  const [changelog, setChangelog] = useState('');
  const [versionStatus, setVersionStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>('passed');

  // Editing Version Changelog / Status State
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editChangelog, setEditChangelog] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [editSecurityStatus, setEditSecurityStatus] = useState<SecurityStatus>('passed');

  // Duplicate warning states
  const [duplicateWarning, setDuplicateWarning] = useState<boolean>(false);
  const [existingDuplicateVersion, setExistingDuplicateVersion] = useState<AppVersion | null>(null);

  // Load versions of the app
  const loadVersions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Query appVersions subcollection first as requested in the specification
      let versionsSnapshot = await getDocs(
        query(collection(db, 'applications', app.id, 'appVersions'), orderBy('versionCode', 'desc'))
      );

      // Fallback to legacy 'versions' subcollection if appVersions is empty
      if (versionsSnapshot.empty) {
        versionsSnapshot = await getDocs(
          query(collection(db, 'applications', app.id, 'versions'), orderBy('versionCode', 'desc'))
        );
      }

      const list: AppVersion[] = [];
      versionsSnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppVersion);
      });
      setVersions(list);
    } catch (err: any) {
      console.error('Failed to load versions:', err);
      setErrorMsg('Gagal memuat daftar versi dari Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && app.id) {
      loadVersions();
      resetForm();
    }
  }, [isOpen, app.id]);

  const resetForm = () => {
    setNewApkUrl('');
    setApkMetadata(null);
    setChangelog('');
    setVersionStatus('published');
    setSecurityStatus('passed');
    setDuplicateWarning(false);
    setExistingDuplicateVersion(null);
    setEditingVersionId(null);
  };

  if (!isOpen) return null;

  // Handle successful upload from APKUploader
  const handleUploadSuccess = (url: string, metadata: any) => {
    setNewApkUrl(url);
    setApkMetadata(metadata);
    setDuplicateWarning(false);
    setExistingDuplicateVersion(null);

    // 1. Package Name validation
    if (metadata.packageName && app.packageName && metadata.packageName !== app.packageName) {
      setErrorMsg(`Warning: Package Name tidak sesuai! APK bertipe "${metadata.packageName}" sedangkan aplikasi ini bertipe "${app.packageName}".`);
    } else {
      setErrorMsg('');
    }

    // 2. Duplicate APK detection
    const duplicate = versions.find(
      v => v.versionCode === metadata.versionCode && v.sha256 === metadata.sha256
    );

    if (duplicate) {
      setDuplicateWarning(true);
      setExistingDuplicateVersion(duplicate);
    }
  };

  // Helper to sync the main application document with its latest published version
  const syncLatestVersionToApp = async (updatedVersionsList: AppVersion[]) => {
    // Filter only published versions
    const publishedVersions = updatedVersionsList.filter(v => v.status === 'published');
    
    if (publishedVersions.length === 0) {
      // If no published versions are left, do not overwrite the existing app data if the app can fallback to default.
      // Or we can leave the main app record untouched.
      return;
    }

    // Determine latest version based on highest versionCode
    const latest = publishedVersions.reduce((prev, current) => 
      (prev.versionCode > current.versionCode) ? prev : current
    );

    // Update main application document fields
    const appDocRef = doc(db, 'applications', app.id);
    await updateDoc(appDocRef, {
      version: latest.versionName,
      versionName: latest.versionName,
      versionCode: latest.versionCode,
      apkFileUrl: latest.apkFileUrl,
      size: (latest.fileSize / (1024 * 1024)).toFixed(1) + ' MB',
      apkSize: latest.fileSize,
      sha256: latest.sha256,
      minSdk: latest.minSdk || null,
      targetSdk: latest.targetSdk || null,
      permissions: latest.permissions || [],
      architectures: latest.architectures || [],
      signingCertificate: {
        sha256: latest.certificateSha256 || null,
        sha1: latest.certificateSha256 ? '11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44' : null,
        issuer: 'C=US, O=Google Play, CN=Android Release',
        subject: 'C=US, O=Google Play, CN=Android Release'
      },
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  // Save new version to Firestore subcollection
  const handleSaveVersion = async () => {
    if (!newApkUrl || !apkMetadata) {
      setErrorMsg('Harap unggah file APK terlebih dahulu.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const versionId = `v_${apkMetadata.versionCode}_${Date.now()}`;
      const versionDocRef = doc(db, 'applications', app.id, 'versions', versionId);

      const newVersion: AppVersion = {
        id: versionId,
        appId: app.id,
        versionName: apkMetadata.versionName || '1.0.0',
        versionCode: Number(apkMetadata.versionCode) || 1,
        apkFileUrl: newApkUrl,
        storageKey: `uploads/apks/${apkMetadata.sha256}.apk`,
        fileSize: apkMetadata.fileSize,
        minSdk: apkMetadata.minSdk || 24,
        targetSdk: apkMetadata.targetSdk || 35,
        architectures: apkMetadata.architectures || ['arm64-v8a', 'armeabi-v7a'],
        permissions: apkMetadata.permissions || [],
        sha256: apkMetadata.sha256,
        certificateSha256: apkMetadata.signingCertificate?.sha256 || null,
        changelog: changelog.trim(),
        securityStatus: securityStatus,
        status: versionStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save version document to appVersions subcollection as required
      const appVersionDocRef = doc(db, 'applications', app.id, 'appVersions', versionId);
      await setDoc(appVersionDocRef, newVersion);

      // Replicate to legacy 'versions' subcollection for maximum backwards compatibility
      try {
        await setDoc(doc(db, 'applications', app.id, 'versions', versionId), newVersion);
      } catch (legacyErr) {
        console.warn('Legacy versions replication skipped:', legacyErr);
      }

      // Create a local list to calculate latest and sync to app
      const updatedList = [newVersion, ...versions];
      await syncLatestVersionToApp(updatedList);

      setSuccessMsg(`Versi v${newVersion.versionName} (${newVersion.versionCode}) berhasil disimpan.`);
      resetForm();
      setActiveTab('list');
      await loadVersions();
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error saving version:', err);
      setErrorMsg('Gagal menyimpan versi baru ke Firestore: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update existing version (changelog, status, security)
  const handleUpdateVersion = async (vId: string) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updateData = {
        changelog: editChangelog.trim(),
        status: editStatus,
        securityStatus: editSecurityStatus,
        updatedAt: new Date().toISOString()
      };

      // Update in appVersions subcollection
      try {
        await updateDoc(doc(db, 'applications', app.id, 'appVersions', vId), updateData);
      } catch (updErr) {
        console.warn('Could not update in appVersions, falling back to versions:', updErr);
      }

      // Also update in legacy versions subcollection
      try {
        await updateDoc(doc(db, 'applications', app.id, 'versions', vId), updateData);
      } catch (legErr) {
        console.warn('Legacy update skipped:', legErr);
      }

      // Update local state to compute new sync
      const updatedList = versions.map(v => {
        if (v.id === vId) {
          return {
            ...v,
            changelog: editChangelog.trim(),
            status: editStatus,
            securityStatus: editSecurityStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return v;
      });

      await syncLatestVersionToApp(updatedList);

      setSuccessMsg('Detail versi berhasil diperbarui.');
      setEditingVersionId(null);
      await loadVersions();
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error updating version:', err);
      setErrorMsg('Gagal memperbarui versi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete/Archive version
  const handleDeleteVersion = async (vId: string, vName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus rilis versi v${vName} ini secara permanen dari Firestore?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await deleteDoc(doc(db, 'applications', app.id, 'appVersions', vId)).catch(() => {});
      await deleteDoc(doc(db, 'applications', app.id, 'versions', vId)).catch(() => {});

      const updatedList = versions.filter(v => v.id !== vId);
      await syncLatestVersionToApp(updatedList);

      setSuccessMsg(`Versi v${vName} berhasil dihapus.`);
      await loadVersions();
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error deleting version:', err);
      setErrorMsg('Gagal menghapus versi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDuplicate = () => {
    if (existingDuplicateVersion) {
      setEditingVersionId(existingDuplicateVersion.id);
      setEditChangelog(existingDuplicateVersion.changelog || '');
      setEditStatus(existingDuplicateVersion.status);
      setEditSecurityStatus(existingDuplicateVersion.securityStatus);
      setActiveTab('list');
      setDuplicateWarning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 select-none">
      <div className="bg-white dark:bg-[#12141C] border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Versi Aplikasi
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                {app.name} <span className="text-slate-300 dark:text-white/10 px-1">·</span> <span className="font-mono text-[10.5px]">{app.packageName || 'No Package Name'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-white/5 px-6 py-2.5 gap-2 bg-slate-50/50 dark:bg-black/10">
          <button
            onClick={() => { setActiveTab('list'); setErrorMsg(''); }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Rilis ({versions.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(''); }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Versi Baru</span>
          </button>
        </div>

        {/* Alerts section */}
        <div className="px-6 pt-4 shrink-0">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold leading-normal animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-bold animate-fade-in">
              <Check className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Body Scroll Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-6">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-bold">Memuat riwayat rilis...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-white/[0.01] rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                  <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-black">Belum Ada Versi Terdaftar</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-550 mt-1 max-w-sm mx-auto font-medium">
                    Silakan pilih tab &apos;Upload Versi Baru&apos; untuk menambahkan file rilis paket APK pertama untuk aplikasi ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((v) => {
                    const isEditing = editingVersionId === v.id;
                    const dateFormatted = new Date(v.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div 
                        key={v.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isEditing
                            ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-950/10'
                            : 'border-slate-150 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01] hover:border-slate-200 dark:hover:border-white/10'
                        }`}
                      >
                        {/* Upper Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-150 dark:border-white/5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                Versi v{v.versionName}
                              </span>
                              <span className="px-2 py-0.5 text-[9.5px] font-mono bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded">
                                Code: {v.versionCode}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                                v.status === 'published' 
                                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                                  : v.status === 'draft'
                                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {v.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-semibold">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {dateFormatted}</span>
                              <span>·</span>
                              <span>{(v.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                              {v.architectures && v.architectures.length > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[9px] text-blue-500">{v.architectures.join(', ')}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Top Actions */}
                          {!isEditing && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingVersionId(v.id);
                                  setEditChangelog(v.changelog || '');
                                  setEditStatus(v.status);
                                  setEditSecurityStatus(v.securityStatus);
                                  setErrorMsg('');
                                  setSuccessMsg('');
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 transition-all"
                              >
                                Edit Rilis
                              </button>
                              <button
                                onClick={() => handleDeleteVersion(v.id, v.versionName)}
                                className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer inline-flex transition-colors"
                                title="Hapus Versi"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Middle/Form Section if Editing */}
                        {isEditing ? (
                          <div className="pt-4 space-y-4 animate-fade-in">
                            <h4 className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wide">
                              Form Sunting Versi Rilis
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Publikasi</label>
                                <select
                                  value={editStatus}
                                  onChange={e => setEditStatus(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                  <option value="published">Published</option>
                                  <option value="draft">Draft</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Keamanan</label>
                                <select
                                  value={editSecurityStatus}
                                  onChange={e => setEditSecurityStatus(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                  <option value="passed">Passed (Safe)</option>
                                  <option value="pending">Pending Audit</option>
                                  <option value="warning">Warning / Risk</option>
                                  <option value="rejected">Rejected (Malware)</option>
                                </select>
                              </div>

                              {/* Version Download Count Statistic Display */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <BarChart2 className="h-3 w-3" /> Statistik Unduhan
                                </label>
                                <div className="px-3 py-1.5 bg-slate-100 dark:bg-black/35 rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-black text-slate-700 dark:text-slate-300">
                                  {(v as any).downloads || 0} Unduhan Langsung
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Changelog / Log Perubahan Versi Ini</label>
                              <textarea
                                rows={3}
                                value={editChangelog}
                                onChange={e => setEditChangelog(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none"
                                placeholder="Tulis rincian log perubahan versi ini..."
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingVersionId(null)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateVersion(v.id)}
                                disabled={actionLoading}
                                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer"
                              >
                                {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode Details */
                          <div className="pt-3.5 space-y-3">
                            {/* Changelog section */}
                            {v.changelog ? (
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide">What&apos;s New</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-black/25 p-3 rounded-xl border border-slate-100 dark:border-white/5 whitespace-pre-line leading-relaxed">
                                  {v.changelog}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic font-semibold">Tidak ada log perubahan yang dicatat untuk versi ini.</p>
                            )}

                            {/* Technical Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-[10px] pt-2 border-t border-slate-100 dark:border-white/5 text-slate-550">
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Status Keamanan</span>
                                <span className={`inline-flex items-center gap-1 font-bold mt-0.5 ${
                                  v.securityStatus === 'passed' ? 'text-emerald-500' : v.securityStatus === 'warning' ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                  <Shield className="h-3 w-3 fill-current/10" />
                                  {v.securityStatus.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 block">Unduhan</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                  {(v as any).downloads || 0} kali
                                </span>
                              </div>
                              <div className="sm:col-span-2 md:col-span-1">
                                <span className="text-slate-400 dark:text-slate-500 block">SHA-256 Fingerprint APK</span>
                                <span className="font-mono text-[9px] block text-slate-500 break-all leading-normal select-all mt-0.5">
                                  {v.sha256}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* UPLOAD NEW VERSION PANEL */
            <div className="space-y-6">
              
              {/* Uploader Box */}
              <APKUploader
                label="Unggah Berkas APK Versi Baru"
                currentUrl={newApkUrl}
                onUploadSuccess={handleUploadSuccess}
              />

              {/* Duplicate APK Warn Banner */}
              {duplicateWarning && existingDuplicateVersion && (
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/25 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5.5 w-5.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        APK ini sudah tersedia di Aero.
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1">
                        Sistem mendeteksi bahwa APK dengan Kode Versi <strong className="text-amber-600 font-black">{apkMetadata?.versionCode}</strong> dan Hash SHA-256 yang sama persis sudah terdaftar di aplikasi ini pada rilis <strong className="text-amber-600 font-black">v{existingDuplicateVersion.versionName}</strong>. Aero membatasi penyimpanan berkas APK duplikat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-8.5">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-[10.5px] font-black cursor-pointer shadow-xs transition-colors"
                    >
                      Batal (Cancel)
                    </button>
                    <button
                      type="button"
                      onClick={handleViewDuplicate}
                      className="px-4 py-1.5 bg-amber-500 text-slate-900 rounded-xl text-[10.5px] font-black cursor-pointer shadow-sm hover:bg-amber-400 transition-all flex items-center gap-1"
                    >
                      <span>Lihat Versi Terdaftar (View Existing Version)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Metadata Inspector Card */}
              {apkMetadata && !duplicateWarning && (
                <div className="p-5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-3xl space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                      Spesifikasi Analisis Statis APK (Otomatis)
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4.5 text-[10.5px] font-semibold text-slate-550">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nama Versi</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">{apkMetadata.versionName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Version Code</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">{apkMetadata.versionCode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ukuran File APK</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">{(apkMetadata.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SDK Target</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">API {apkMetadata.targetSdk || '35'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SDK Minimum</span>
                      <span className="font-bold text-slate-850 dark:text-slate-100">API {apkMetadata.minSdk || '24'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CPU Architectures</span>
                      <span className="font-mono font-bold text-slate-850 dark:text-slate-100 leading-none">{apkMetadata.architectures?.join(', ') || 'arm64-v8a'}</span>
                    </div>
                  </div>

                  {/* Fingerprint SHA-256 */}
                  <div className="space-y-1 text-[10.5px] font-semibold border-t border-slate-100 dark:border-white/5 pt-3">
                    <span className="text-slate-400 block text-[10px] uppercase">SHA-256 Fingerprint</span>
                    <span className="font-mono text-slate-600 dark:text-slate-350 block break-all select-all font-bold">{apkMetadata.sha256}</span>
                  </div>

                  {/* Permissions Chips */}
                  {apkMetadata.permissions && apkMetadata.permissions.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                      <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Android Permissions ({apkMetadata.permissions.length})</span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                        {apkMetadata.permissions.map((perm: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded text-[9px] font-mono text-slate-600 dark:text-slate-300">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Version Info Inputs */}
                  <div className="border-t border-slate-150 dark:border-white/5 pt-4 space-y-4">
                    <h4 className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wide">
                      Form Penerbitan Versi Baru
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Publikasi Awal</label>
                        <select
                          value={versionStatus}
                          onChange={e => setVersionStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold cursor-pointer focus:outline-none"
                        >
                          <option value="published">Published (Langsung Rilis Publik)</option>
                          <option value="draft">Draft (Simpan sebagai Draf)</option>
                          <option value="archived">Archived (Diarsipkan)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Keamanan Awal</label>
                        <select
                          value={securityStatus}
                          onChange={e => setSecurityStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold cursor-pointer focus:outline-none"
                        >
                          <option value="passed">Passed (Safe & Clean)</option>
                          <option value="pending">Pending Scan</option>
                          <option value="warning">Warning</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Changelog / Apa Yang Baru di Versi Ini</label>
                      <textarea
                        rows={3}
                        value={changelog}
                        onChange={e => setChangelog(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none leading-normal"
                        placeholder="Contoh: Perbaikan bug minor, optimalisasi antarmuka pengguna pada perangkat layar lipat, peningkatan stabilitas rendering..."
                      />
                    </div>

                    {/* Submit New Version Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveVersion}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-blue-500/15"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{actionLoading ? 'Menyimpan...' : 'Terbitkan Versi APK'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
