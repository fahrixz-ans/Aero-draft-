import React, { useState, useEffect } from 'react';
import { 
  X, Save, CheckCircle, AlertCircle, Upload, Eye, 
  FileText, ShieldCheck, Globe, Smartphone, Tag, ArrowRight,
  Layers, Info, Check, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, RefreshCw
} from 'lucide-react';
import { AppData, AppStatus, PublishMode, AppSourceType } from '../../types';
import { APKUploader } from './APKUploader';
import { ImageUploader } from './ImageUploader';
import AppPreviewModal from './AppPreviewModal';
import { logAppRevision } from '../../services/admin/revisionService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AppEditorModalProps {
  app: AppData | null;
  isNew: boolean;
  categories: string[];
  onSave: (appData: AppData) => Promise<void>;
  onClose: () => void;
}

const REJECTION_REASONS = [
  'Invalid APK / Berkas Korup',
  'Broken Metadata / Informasi Tidak Lengkap',
  'Security Concern / Peringatan Keamanan',
  'Duplicate App / Aplikasi Duplikat',
  'Copyright Concern / Pelanggaran Hak Cipta',
  'Invalid Official Website / Tautan Tidak Valid',
  'Unsupported Content / Konten Tidak Didukung'
];

export default function AppEditorModal({
  app,
  isNew,
  categories,
  onSave,
  onClose
}: AppEditorModalProps) {
  const [formData, setFormData] = useState<Partial<AppData>>({
    name: '',
    slug: '',
    developer: '',
    developerName: '',
    category: categories[0] || 'Utilitas',
    description: '',
    shortDescription: '',
    version: '1.0.0',
    versionName: '1.0.0',
    versionCode: 1,
    size: '0 MB',
    androidVersion: 'Android 6.0+',
    rating: 5.0,
    downloads: 0,
    status: 'draft',
    sourceType: 'apk',
    downloadUrl: '',
    officialUrl: '',
    officialDownloadUrl: '',
    icon: '',
    iconUrl: '',
    bannerUrl: '',
    screenshots: [],
    whatsNew: '',
    permissions: [],
    minSdk: 23,
    targetSdk: 34,
    featured: false,
    popular: false,
    verifiedSource: true,
    sha256: '',
    architectures: ['arm64-v8a', 'armeabi-v7a']
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishChecklist, setShowPublishChecklist] = useState(false);
  
  // Official URL validator state
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [urlValidationResult, setUrlValidationResult] = useState<{
    valid: boolean;
    statusCode?: number;
    statusText?: string;
    isHttps?: boolean;
    domain?: string;
    responseTimeMs?: number;
  } | null>(null);

  // Rejection modal state
  const [showRejectionPicker, setShowRejectionPicker] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState(REJECTION_REASONS[0]);

  // Temporary permissions string for input
  const [tempPermissions, setTempPermissions] = useState('');

  useEffect(() => {
    if (app) {
      setFormData({
        ...app,
        developerName: app.developerName || app.developer,
        iconUrl: app.iconUrl || app.icon,
        sourceType: app.sourceType || (app.officialUrl ? 'official_link' : 'apk')
      });
      if (app.permissions && Array.isArray(app.permissions)) {
        setTempPermissions(app.permissions.join(', '));
      }
    }
  }, [app]);

  // Handle URL Validation
  const handleValidateUrl = async () => {
    if (!formData.officialUrl) {
      setError('Masukkan URL website resmi terlebih dahulu.');
      return;
    }

    setValidatingUrl(true);
    setError('');
    try {
      const res = await fetch('/api/admin/validate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.officialUrl })
      });
      const data = await res.json();
      setUrlValidationResult(data);
      if (data.valid) {
        setFormData(prev => ({
          ...prev,
          officialDownloadUrl: formData.officialUrl,
          verifiedSource: true
        }));
      }
    } catch (err: any) {
      setUrlValidationResult({ valid: false, statusText: 'Gagal menghubungi server validasi.' });
    } finally {
      setValidatingUrl(false);
    }
  };

  // Pre-publish validation check
  const publishChecks = [
    { title: 'Nama Aplikasi', pass: Boolean(formData.name?.trim()) },
    { title: 'Pengembang (Developer)', pass: Boolean(formData.developerName?.trim() || formData.developer?.trim()) },
    { title: 'Kategori Aplikasi', pass: Boolean(formData.category) },
    { title: 'Ikon Aplikasi (App Icon)', pass: Boolean(formData.iconUrl || formData.icon) },
    { title: 'Deskripsi Aplikasi', pass: Boolean(formData.description && formData.description.length >= 10) },
    { title: 'Tangkapan Layar (Screenshots)', pass: Boolean(formData.screenshots && formData.screenshots.length > 0) },
    { 
      title: formData.sourceType === 'apk' ? 'Berkas APK & SHA-256' : 'Validasi Website Resmi (HTTPS)', 
      pass: formData.sourceType === 'apk' ? Boolean(formData.sha256 && (formData.apkFileUrl || formData.downloadUrl)) : Boolean(formData.officialUrl && formData.officialUrl.startsWith('https://')) 
    }
  ];

  const allChecksPass = publishChecks.every(c => c.pass);

  // Submit Handler
  const handleSubmit = async (targetStatus?: AppStatus) => {
    setError('');
    
    // Auto-generate slug if missing
    let slug = formData.slug || formData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app-${Date.now()}`;
    
    const finalApp: AppData = {
      id: app?.id || `app_${Date.now()}`,
      name: formData.name || '',
      slug,
      developer: formData.developerName || formData.developer || '',
      developerName: formData.developerName || formData.developer || '',
      category: formData.category || 'Utilitas',
      description: formData.description || '',
      version: formData.versionName || formData.version || '1.0.0',
      versionName: formData.versionName || formData.version || '1.0.0',
      versionCode: Number(formData.versionCode) || 1,
      size: formData.size || (formData.apkSize ? `${(formData.apkSize / 1024 / 1024).toFixed(1)} MB` : 'Ukuran bervariasi'),
      androidVersion: formData.androidVersion || 'Android 6.0+',
      rating: app?.rating || 5.0,
      downloads: app?.downloads || 0,
      releaseDate: app?.releaseDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      createdAt: app?.createdAt || new Date().toISOString(),
      downloadUrl: formData.apkFileUrl || formData.downloadUrl || '',
      officialDownloadUrl: formData.officialUrl || formData.officialDownloadUrl || '',
      officialUrl: formData.officialUrl || '',
      apkFileUrl: formData.apkFileUrl || '',
      sourceType: formData.sourceType || 'apk',
      icon: formData.iconUrl || formData.icon || '/icon.png',
      iconUrl: formData.iconUrl || formData.icon || '/icon.png',
      bannerUrl: formData.bannerUrl || '',
      screenshots: formData.screenshots || [],
      whatsNew: formData.whatsNew || '',
      permissions: tempPermissions ? tempPermissions.split(',').map(p => p.trim()).filter(Boolean) : (formData.permissions || []),
      minSdk: Number(formData.minSdk) || 23,
      targetSdk: Number(formData.targetSdk) || 34,
      featured: Boolean(formData.featured),
      popular: Boolean(formData.popular),
      verifiedSource: Boolean(formData.verifiedSource),
      sha256: formData.sha256 || '',
      architectures: formData.architectures || ['arm64-v8a', 'armeabi-v7a'],
      status: targetStatus || formData.status || 'published',
      publishMode: formData.publishMode || 'immediate'
    };

    setSaving(true);
    try {
      // Save to main workflow
      await onSave(finalApp);

      // Log revision history if editing
      if (app) {
        await logAppRevision({
          appId: finalApp.id,
          appName: finalApp.name,
          previousData: app,
          newData: finalApp,
          changedFields: Object.keys(finalApp).filter(k => (finalApp as any)[k] !== (app as any)[k]),
          reason: targetStatus ? `Status diubah menjadi ${targetStatus}` : 'Pembaruan detail aplikasi'
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan aplikasi. Silakan coba kembali.');
    } finally {
      setSaving(false);
    }
  };

  // Reorder Screenshots
  const moveScreenshot = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.screenshots || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setFormData(prev => ({ ...prev, screenshots: list }));
  };

  const removeScreenshot = (index: number) => {
    const list = [...(formData.screenshots || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, screenshots: list }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isNew ? 'Tambah Aplikasi Baru' : `Edit Aplikasi: ${formData.name || 'Aero'}`}
            </h2>
            <p className="text-xs text-slate-500">
              Kelola metadata aplikasi, berkas APK/website resmi, dan pipeline keamanan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Section 1: Type Selection (APK vs Official Website) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tipe Distribusi Aplikasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'apk' }))}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.sourceType === 'apk'
                    ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Paket APK Mandiri (Aero Storage)</p>
                  <p className="text-xs opacity-80 mt-0.5">Unggah berkas APK langsung, diekstrak manifest & dianalisis SHA-256 secara statis.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'official_link' }))}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  formData.sourceType === 'official_link'
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Website Resmi Pengembang (Official Link)</p>
                  <p className="text-xs opacity-80 mt-0.5">Mengarahkan tombol aksi ke website resmi terverifikasi pengembang asli.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: APK Upload & Static Inspection Pipeline */}
          {formData.sourceType === 'apk' ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Pipeline Unggahan & Analisis APK
                </h3>
                {formData.sha256 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20">
                    SHA-256 Valid
                  </span>
                )}
              </div>

              <APKUploader
                onApkProcessed={(apkResult) => {
                  setFormData(prev => ({
                    ...prev,
                    apkFileUrl: apkResult.url,
                    downloadUrl: apkResult.url,
                    packageName: apkResult.metadata.packageName,
                    version: apkResult.metadata.versionName || prev.version,
                    versionName: apkResult.metadata.versionName || prev.versionName,
                    versionCode: apkResult.metadata.versionCode || prev.versionCode,
                    minSdk: apkResult.metadata.minSdk || prev.minSdk,
                    targetSdk: apkResult.metadata.targetSdk || prev.targetSdk,
                    androidVersion: `Android ${apkResult.metadata.minSdk ? (apkResult.metadata.minSdk >= 30 ? '11+' : apkResult.metadata.minSdk >= 26 ? '8.0+' : '6.0+') : '6.0+'}`,
                    apkSize: apkResult.metadata.fileSize,
                    size: `${(apkResult.metadata.fileSize / 1024 / 1024).toFixed(1)} MB`,
                    sha256: apkResult.metadata.sha256,
                    architectures: apkResult.metadata.architectures,
                    permissions: apkResult.metadata.permissions,
                    signingCertificate: apkResult.metadata.signingCertificate,
                    iconUrl: apkResult.metadata.extractedIconUrl || prev.iconUrl
                  }));
                  if (apkResult.metadata.permissions) {
                    setTempPermissions(apkResult.metadata.permissions.join(', '));
                  }
                }}
              />

              {/* Readonly extracted info */}
              {formData.sha256 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Package Name:</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.packageName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">SHA-256:</span>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">{formData.sha256}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Section 2 (Alternative): Official Website Link Validator */
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                Validasi Website Resmi Pengembang
              </h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/download"
                  value={formData.officialUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, officialUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleValidateUrl}
                  disabled={validatingUrl || !formData.officialUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {validatingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verifikasi Website</span>
                </button>
              </div>

              {urlValidationResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  urlValidationResult.valid 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                }`}>
                  {urlValidationResult.valid ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{urlValidationResult.valid ? 'Website Resmi Terverifikasi Valid' : 'Validasi Website Gagal'}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Status: HTTP {urlValidationResult.statusCode} ({urlValidationResult.statusText}) • HTTPS: {urlValidationResult.isHttps ? 'Ya' : 'Tidak'} • Respon: {urlValidationResult.responseTimeMs}ms
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Basic Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Dasar Aplikasi</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Aplikasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: WhatsApp Messenger"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pengembang (Developer) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meta Platforms, Inc."
                  value={formData.developerName || formData.developer || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, developerName: e.target.value, developer: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori *
                </label>
                <select
                  value={formData.category || categories[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Versi Aplikasi
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={formData.versionName || formData.version || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, versionName: e.target.value, version: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Min. Versi Android
                </label>
                <input
                  type="text"
                  placeholder="Android 6.0+"
                  value={formData.androidVersion || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, androidVersion: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deskripsi Lengkap *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Jelaskan fitur utama, kegunaan, dan keunggulan aplikasi..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Yang Baru di Versi Ini (What's New / Changelog)
              </label>
              <textarea
                rows={2}
                placeholder="• Fitur baru: ...&#10;• Peningkatan performa dan perbaikan bug..."
                value={formData.whatsNew || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsNew: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 4: Upload-Only Image Management */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Manajemen Gambar (Hanya Berkas Unggahan)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* App Icon Upload */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Ikon Aplikasi (App Icon 512x512 Master)
                </label>
                <ImageUploader
                  type="icon"
                  currentImage={formData.iconUrl || formData.icon}
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, iconUrl: url, icon: url }))}
                />
              </div>

              {/* Banner Upload */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Banner Aplikasi (Opsional)
                </label>
                <ImageUploader
                  type="banner"
                  currentImage={formData.bannerUrl}
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, bannerUrl: url }))}
                />
              </div>
            </div>

            {/* Screenshots Gallery Upload & Reorder */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tangkapan Layar (Screenshots)
              </label>
              
              <ImageUploader
                type="screenshot"
                onImageUploaded={(url) => {
                  setFormData(prev => ({
                    ...prev,
                    screenshots: [...(prev.screenshots || []), url]
                  }));
                }}
              />

              {/* Screenshots list with order controls */}
              {formData.screenshots && formData.screenshots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {formData.screenshots.map((src, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-9/16 flex flex-col justify-between p-2">
                      <img src={src} alt={`Screenshot ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover -z-0" />
                      <div className="z-10 flex justify-between items-center w-full">
                        <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="z-10 flex gap-1 justify-center bg-black/40 backdrop-blur-sm p-1 rounded-lg">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveScreenshot(idx, 'up')}
                          className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (formData.screenshots?.length || 1) - 1}
                          onClick={() => moveScreenshot(idx, 'down')}
                          className="p-1 text-white hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Badges & Editorial Flags */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Badge & Status Kuratorial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.featured)}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-bold text-xs">Editor's Pick</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.verifiedSource)}
                  onChange={(e) => setFormData(prev => ({ ...prev, verifiedSource: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-xs">Verified Source</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.popular)}
                  onChange={(e) => setFormData(prev => ({ ...prev, popular: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-xs">Trending / Populer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Simpan Sebagai Draf
            </button>
            <button
              type="button"
              onClick={() => setShowRejectionPicker(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tolak (Reject)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPublishChecklist(true)}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Publikasikan Aplikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Publish Checklist Modal */}
      {showPublishChecklist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Daftar Periksa Publikasi (Publish Checklist)
              </h3>
              <button onClick={() => setShowPublishChecklist(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {publishChecks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-slate-700 dark:text-slate-300">{check.title}</span>
                  {check.pass ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Lolos
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Belum Lengkap
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!allChecksPass && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                Lengkapi semua kriteria wajib di atas sebelum melakukan publikasi ke katalog publik Aero.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishChecklist(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!allChecksPass || saving}
                onClick={() => {
                  setShowPublishChecklist(false);
                  handleSubmit('published');
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Konfirmasi & Terbitkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pilih Alasan Penolakan Aplikasi
            </h3>
            <p className="text-xs text-slate-500">
              Admin wajib memilih alasan penolakan untuk dicatat dalam audit trail operasional.
            </p>

            <div className="space-y-2">
              {REJECTION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedRejectionReason === r
                      ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={selectedRejectionReason === r}
                    onChange={() => setSelectedRejectionReason(r)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectionPicker(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowRejectionPicker(false);
                  handleSubmit('archived');
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
              >
                Tolak Aplikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreview && (
        <AppPreviewModal
          app={formData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
