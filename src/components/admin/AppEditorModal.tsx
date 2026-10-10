import React, { useState, useEffect } from 'react';
import { 
  X, Save, CheckCircle, AlertCircle, Eye, 
  FileText, ShieldCheck, Globe, Smartphone, Tag, ArrowRight,
  Layers, Info, Check, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, RefreshCw, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';
import { AppData, AppStatus, PublishMode } from '../../types';
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
    version: '1.0.0',
    versionName: '1.0.0',
    versionCode: 1,
    size: '25.0 MB',
    androidVersion: 'Android 8.0+',
    rating: 5.0,
    downloads: 100,
    status: 'draft',
    downloadUrl: '',
    officialDownloadUrl: '',
    officialUrl: '',
    apkFileUrl: '',
    iconUrl: '',
    icon: '',
    screenshots: [],
    whatsNew: '',
    minSdk: 26,
    targetSdk: 34,
    featured: false,
    popular: false,
    verifiedSource: true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishChecklist, setShowPublishChecklist] = useState(false);

  // Rejection modal state
  const [showRejectionPicker, setShowRejectionPicker] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState(REJECTION_REASONS[0]);

  // New screenshot input field helper
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');

  useEffect(() => {
    if (app) {
      setFormData({
        ...app,
        developerName: app.developerName || app.developer,
        iconUrl: app.iconUrl || app.icon || '',
        screenshots: app.screenshots || []
      });
    }
  }, [app]);

  // Pre-publish validation check
  const publishChecks = [
    { title: 'Nama Aplikasi', pass: Boolean(formData.name?.trim()) },
    { title: 'Pengembang (Developer)', pass: Boolean(formData.developerName?.trim() || formData.developer?.trim()) },
    { title: 'Kategori Aplikasi', pass: Boolean(formData.category) },
    { title: 'URL Ikon Aplikasi', pass: Boolean(formData.iconUrl || formData.icon) },
    { title: 'Deskripsi Aplikasi', pass: Boolean(formData.description && formData.description.length >= 10) },
    { title: 'Tangkapan Layar (Screenshots)', pass: Boolean(formData.screenshots && formData.screenshots.length > 0) },
    { title: 'Tautan Unduh APK', pass: Boolean(formData.downloadUrl || formData.officialDownloadUrl || formData.apkFileUrl) }
  ];

  const allChecksPass = publishChecks.every(c => c.pass);

  // Submit Handler
  const handleSubmit = async (targetStatus?: AppStatus) => {
    setError('');
    
    let slug = formData.slug || formData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app_${Date.now()}`;
    const finalStatus = targetStatus || formData.status || 'published';
    const now = new Date().toISOString();

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
      size: formData.size || '25.0 MB',
      androidVersion: formData.androidVersion || 'Android 8.0+',
      rating: app?.rating || 4.8,
      downloads: app?.downloads || 100,
      releaseDate: app?.releaseDate || now.split('T')[0],
      updatedAt: now,
      createdAt: app?.createdAt || now,
      downloadUrl: formData.downloadUrl || formData.officialDownloadUrl || formData.apkFileUrl || '',
      officialDownloadUrl: formData.officialDownloadUrl || formData.downloadUrl || '',
      officialUrl: formData.officialUrl || '',
      apkFileUrl: formData.apkFileUrl || formData.downloadUrl || '',
      sourceType: 'apk',
      icon: formData.iconUrl || formData.icon || '',
      iconUrl: formData.iconUrl || formData.icon || '',
      screenshots: formData.screenshots || [],
      whatsNew: formData.whatsNew || '',
      permissions: formData.permissions || ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      minSdk: Number(formData.minSdk) || 26,
      targetSdk: Number(formData.targetSdk) || 34,
      featured: Boolean(formData.featured),
      popular: Boolean(formData.popular),
      verifiedSource: Boolean(formData.verifiedSource),
      status: finalStatus,
      publishMode: 'immediate' as PublishMode
    };

    setSaving(true);
    try {
      await onSave(finalApp);

      if (app) {
        await logAppRevision({
          appId: finalApp.id,
          appName: finalApp.name,
          previousData: app,
          newData: finalApp,
          changedFields: Object.keys(finalApp).filter(k => (finalApp as any)[k] !== (app as any)[k]),
          reason: targetStatus ? `Status diubah menjadi ${targetStatus}` : 'Pembaruan detail aplikasi via URL'
        });
      }

      await logAdminAction({
        action: app ? 'app_updated' : 'app_created',
        entityType: 'application',
        entityId: finalApp.id,
        entityName: finalApp.name,
        metadata: { slug: finalApp.slug, status: finalApp.status }
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan aplikasi. Silakan coba kembali.');
    } finally {
      setSaving(false);
    }
  };

  const addScreenshot = () => {
    if (!newScreenshotUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      screenshots: [...(prev.screenshots || []), newScreenshotUrl.trim()]
    }));
    setNewScreenshotUrl('');
  };

  const removeScreenshot = (index: number) => {
    const list = [...(formData.screenshots || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, screenshots: list }));
  };

  const moveScreenshot = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.screenshots || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setFormData(prev => ({ ...prev, screenshots: list }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-lg font-black text-white">
              {isNew ? 'Tambah Aplikasi Baru' : `Edit Aplikasi: ${formData.name || 'Aero'}`}
            </h2>
            <p className="text-xs text-slate-400">
              Kelola metadata aplikasi, tautan APK resmi, ikon, dan screenshot berbasis URL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Section 1: Tautan APK */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              1. Tautan Download APK & Website Resmi
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Download APK Resmi *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://domain-resmi.com/aplikasi.apk"
                  value={formData.downloadUrl || formData.officialDownloadUrl || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    downloadUrl: e.target.value, 
                    officialDownloadUrl: e.target.value,
                    apkFileUrl: e.target.value 
                  }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Halaman Website Resmi (opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://domain-resmi.com/aplikasi"
                  value={formData.officialUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, officialUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Identitas Aplikasi */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              2. Identitas Aplikasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Aplikasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: WhatsApp Messenger"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slug URL (ID unik) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="whatsapp-messenger"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pengembang / Developer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama perusahaan resmi"
                  value={formData.developerName || formData.developer || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, developerName: e.target.value, developer: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kategori *
                </label>
                <select
                  value={formData.category || categories[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Versi Rilis
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={formData.versionName || formData.version || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, versionName: e.target.value, version: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ukuran Berkas (opsional)
                </label>
                <input
                  type="text"
                  placeholder="25.0 MB"
                  value={formData.size || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deskripsi Lengkap Aplikasi *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Jelaskan fitur utama, keunggulan, dan panduan penggunaan aplikasi..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 3: URL Ikon & Screenshot */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              3. Ikon, Screenshot & Preview Berbasis URL
            </h3>

            {/* Icon URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                URL Ikon Aplikasi *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  required
                  placeholder="https://cdn.domain.com/images/app-icon.png"
                  value={formData.iconUrl || formData.icon || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, iconUrl: e.target.value, icon: e.target.value }))}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <div className="w-12 h-12 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  {(formData.iconUrl || formData.icon) ? (
                    <img src={formData.iconUrl || formData.icon} alt="Icon preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Screenshots URLs */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300">
                URL Screenshot Aplikasi
              </label>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://cdn.domain.com/screenshots/screen-1.jpg"
                  value={newScreenshotUrl}
                  onChange={(e) => setNewScreenshotUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addScreenshot}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah URL</span>
                </button>
              </div>

              {formData.screenshots && formData.screenshots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {formData.screenshots.map((src, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-9/16 flex flex-col justify-between p-2">
                      <img src={src} alt={`Screenshot ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="z-10 flex justify-between items-center w-full">
                        <span className="px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="z-10 flex gap-1 justify-center bg-black/60 p-1 rounded-lg">
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

          {/* Section 4: Publikasi & Status */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              4. Publikasi & Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Publikasi
                </label>
                <select
                  value={formData.status || 'published'}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="published">Published (Terbit langsung)</option>
                  <option value="draft">Draft (Simpan sebagai draf)</option>
                  <option value="archived">Archived (Arsip)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.featured)}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-900 border-slate-800"
                />
                <span>Tampilkan sebagai Pilihan Redaksi (Featured)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.popular)}
                  onChange={(e) => setFormData(prev => ({ ...prev, popular: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 bg-slate-900 border-slate-800"
                />
                <span>Tandai sebagai Aplikasi Populer</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Simpan sebagai Draft
            </button>
            <button
              type="button"
              onClick={() => setShowRejectionPicker(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tolak (Reject)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPublishChecklist(true)}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Validasi & Simpan Aplikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Publish Checklist Modal */}
      {showPublishChecklist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Daftar Periksa Publikasi (Publish Checklist)
              </h3>
              <button onClick={() => setShowPublishChecklist(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {publishChecks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-300">{check.title}</span>
                  {check.pass ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Lolos
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Belum Lengkap
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!allChecksPass && (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                Lengkapi semua kriteria wajib di atas sebelum melakukan publikasi ke katalog publik.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishChecklist(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">
              Pilih Alasan Penolakan Aplikasi
            </h3>
            <p className="text-xs text-slate-400">
              Admin wajib memilih alasan penolakan untuk dicatat dalam audit trail operasional.
            </p>

            <div className="space-y-2">
              {REJECTION_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedRejectionReason === r
                      ? 'border-red-500 bg-red-500/10 text-red-300 font-bold'
                      : 'border-slate-800 hover:bg-slate-800/50 text-slate-300'
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
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowRejectionPicker(false);
                  handleSubmit('archived');
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer"
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
          app={formData as AppData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
