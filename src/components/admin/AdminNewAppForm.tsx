import React, { useState } from 'react';
import { 
  Smartphone, ShieldCheck, AlertTriangle, CheckCircle2, 
  X, FileText, Layers, Hash, Code, Save, RefreshCw, 
  Sparkles, Check, AlertCircle, Eye, HelpCircle, Link as LinkIcon, Image as ImageIcon, Trash2
} from 'lucide-react';
import BackButton from '../navigation/BackButton';
import { AppData, AppStatus, PublishMode } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CATEGORIES } from '../../data/appsData';
import { validateAppUrl } from '../../services/validationService';
import { logAdminAction } from '../../services/admin/auditLogService';

interface AdminNewAppFormProps {
  onBack: () => void;
  onSuccess: (newApp: AppData) => void;
}

export default function AdminNewAppForm({ onBack, onSuccess }: AdminNewAppFormProps) {
  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    developer: '',
    category: CATEGORIES[0] || 'Utilitas',
    version: '1.0.0',
    size: '25.0 MB',
    apkDownloadUrl: '',
    officialPageUrl: '',
    iconUrl: '',
    screenshots: ['', '', '', '', ''], // 5 screenshot slots (1 required, 4 optional)
    description: '',
    status: 'published' as AppStatus,
    featured: false,
    popular: false
  });

  // URL Validation states
  const [urlValidationStatus, setUrlValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'unverified'>('idle');
  const [urlValidationMsg, setUrlValidationMsg] = useState('');

  // Icon preview state
  const [iconLoadError, setIconLoadError] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);

  // Screenshot image load error states
  const [screenshotLoadErrors, setScreenshotLoadErrors] = useState<boolean[]>([false, false, false, false, false]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Generate slug from title
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Load Demo Data requested by prompt
  const loadDemoData = () => {
    setFormData({
      name: 'Demo Messenger',
      slug: 'demo-messenger',
      developer: 'Example Studio',
      category: 'Komunikasi',
      version: '1.0.0',
      size: '24.5 MB',
      apkDownloadUrl: 'https://example.com/downloads/demo-messenger.apk',
      officialPageUrl: 'https://example.com/apps/demo-messenger',
      iconUrl: 'https://example.com/images/demo-messenger.png',
      screenshots: [
        'https://example.com/images/screen-1.jpg',
        'https://example.com/images/screen-2.jpg',
        '',
        '',
        ''
      ],
      description: 'Deskripsi aplikasi demo.',
      status: 'draft',
      featured: false,
      popular: false
    });
    setUrlValidationStatus('valid');
    setUrlValidationMsg('URL Demo terverifikasi.');
  };

  // Validate APK URL using validationService
  const handleValidateApkUrl = async () => {
    const url = formData.apkDownloadUrl.trim();
    if (!url) {
      setUrlValidationStatus('invalid');
      setUrlValidationMsg('URL Download APK wajib diisi.');
      return;
    }

    setUrlValidationStatus('checking');
    setUrlValidationMsg('Memeriksa URL...');

    const res = await validateAppUrl(url, 'apk');
    setUrlValidationStatus(res.status);
    setUrlValidationMsg(res.message);
  };

  const handleScreenshotChange = (index: number, val: string) => {
    const updated = [...formData.screenshots];
    updated[index] = val;
    setFormData(prev => ({ ...prev, screenshots: updated }));
    const errs = [...screenshotLoadErrors];
    errs[index] = false;
    setScreenshotLoadErrors(errs);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Nama aplikasi wajib diisi.');
    if (!formData.slug.trim()) errors.push('Slug URL aplikasi wajib diisi.');
    if (!formData.developer.trim()) errors.push('Nama pengembang (developer) wajib diisi.');
    if (!formData.apkDownloadUrl.trim()) errors.push('URL Download APK Resmi wajib diisi.');
    if (!formData.iconUrl.trim()) errors.push('URL Ikon Aplikasi wajib diisi.');
    if (!formData.screenshots[0]?.trim()) errors.push('URL Screenshot 1 (utama) wajib diisi.');
    if (!formData.description.trim() || formData.description.length < 10) {
      errors.push('Deskripsi lengkap aplikasi wajib diisi minimal 10 karakter.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, targetStatus?: AppStatus) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const appId = formData.slug || `app_${Date.now()}`;
      const now = new Date().toISOString();
      const finalStatus = targetStatus || formData.status;

      // Filter out empty screenshot URLs
      const cleanedScreenshots = formData.screenshots.filter(s => s && s.trim().length > 0);

      const newAppPayload: AppData = {
        id: appId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        developer: formData.developer.trim(),
        developerName: formData.developer.trim(),
        category: formData.category,
        description: formData.description.trim(),
        icon: formData.iconUrl.trim(),
        iconUrl: formData.iconUrl.trim(),
        screenshots: cleanedScreenshots,
        version: formData.version.trim(),
        versionName: formData.version.trim(),
        versionCode: 1,
        size: formData.size.trim() || '25.0 MB',
        androidVersion: 'Android 8.0+',
        minSdk: 26,
        targetSdk: 34,
        rating: 4.8,
        downloads: 120,
        releaseDate: now,
        updatedAt: now,
        sourceType: 'apk',
        downloadUrl: formData.apkDownloadUrl.trim(),
        officialDownloadUrl: formData.apkDownloadUrl.trim(),
        officialUrl: formData.officialPageUrl.trim() || formData.apkDownloadUrl.trim(),
        apkFileUrl: formData.apkDownloadUrl.trim(),
        featured: formData.featured,
        popular: formData.popular,
        status: finalStatus,
        publishMode: 'immediate' as PublishMode,
        verifiedSource: true,
        healthStatus: 'healthy'
      };

      // Save to Firestore 'applications' collection
      await setDoc(doc(db, 'applications', appId), newAppPayload);

      // Log admin audit action
      await logAdminAction({
        action: 'app_created',
        entityType: 'application',
        entityId: appId,
        entityName: newAppPayload.name,
        metadata: {
          slug: newAppPayload.slug,
          version: newAppPayload.version,
          category: newAppPayload.category,
          status: newAppPayload.status,
          apkDownloadUrl: newAppPayload.downloadUrl
        }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        onSuccess(newAppPayload);
      }, 700);

    } catch (err) {
      console.error('Error saving application to Firestore:', err);
      setValidationErrors(['Terjadi kendala saat menyimpan ke database Firestore. Silakan periksa koneksi Anda.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16 text-slate-100">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <BackButton onBack={onBack} label="Kembali ke Katalog" showText={true} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDemoData}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Muat Data Demo</span>
          </button>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-extrabold">
            Owner Console
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Tambah Aplikasi Baru
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Daftarkan aplikasi melalui tautan resmi, tanpa unggah file.
            </p>
          </div>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl space-y-1.5 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>Formulir Belum Lengkap atau Tidak Valid:</span>
          </div>
          <ul className="text-xs text-red-300 list-disc list-inside space-y-0.5 pl-1 font-medium">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4" />
          <span>Aplikasi berhasil divalidasi dan disimpan ke Firestore! Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        
        {/* SECTION 1: Tautan APK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-base font-black text-white">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <LinkIcon className="h-4 w-4" />
            </div>
            <span>1. Tautan APK</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              URL Download APK Resmi <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  value={formData.apkDownloadUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, apkDownloadUrl: e.target.value }))}
                  placeholder="https://domain-resmi.com/aplikasi.apk"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleValidateApkUrl}
                disabled={urlValidationStatus === 'checking'}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {urlValidationStatus === 'checking' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Validasi URL</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Gunakan tautan unduhan langsung berakhiran .apk jika tersedia.
            </p>

            {urlValidationStatus !== 'idle' && (
              <div className={`flex items-center gap-2 text-xs font-bold mt-2 px-3 py-2 rounded-lg ${
                urlValidationStatus === 'valid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                urlValidationStatus === 'invalid' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {urlValidationStatus === 'valid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {urlValidationStatus === 'invalid' && <AlertCircle className="h-3.5 w-3.5" />}
                {urlValidationStatus === 'checking' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {urlValidationStatus === 'valid' ? 'Siap untuk melanjutkan' :
                   urlValidationStatus === 'invalid' ? 'URL tidak valid atau format salah' :
                   urlValidationStatus === 'checking' ? 'Memeriksa URL...' : 'URL belum diperiksa'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              URL Halaman Resmi Aplikasi (opsional)
            </label>
            <input
              type="url"
              value={formData.officialPageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, officialPageUrl: e.target.value }))}
              placeholder="https://domain-resmi.com/aplikasi"
              className="w-full px-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Hanya daftarkan tautan yang resmi dan tepercaya.</span>
          </div>
        </div>

        {/* SECTION 2: Identitas Aplikasi */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-base font-black text-white">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
              <FileText className="h-4 w-4" />
            </div>
            <span>2. Identitas Aplikasi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nama Aplikasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: WhatsApp Messenger"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Slug URL (ID unik) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="whatsapp-messenger"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Pengembang / Developer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={formData.developer}
                  onChange={(e) => setFormData(prev => ({ ...prev, developer: e.target.value }))}
                  placeholder="Nama perusahaan resmi"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Kategori Aplikasi
              </label>
              <div className="relative">
                <Layers className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Versi Rilis
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
                className="w-full px-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Ukuran Berkas (opsional)
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                placeholder="25.0 MB"
                className="w-full px-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Gambar & Preview berbasis URL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-base font-black text-white">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <ImageIcon className="h-4 w-4" />
            </div>
            <span>3. Gambar & Preview berbasis URL</span>
          </div>

          {/* Icon URL Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300">
              URL Ikon Aplikasi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="url"
                value={formData.iconUrl}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, iconUrl: e.target.value }));
                  setIconLoadError(false);
                }}
                placeholder="https://domain.com/icon.png"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>

            {/* Dedicated Icon Preview Container Below Input */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative">
                {formData.iconUrl && !iconLoadError ? (
                  <img 
                    src={formData.iconUrl} 
                    alt="Icon preview" 
                    className="w-full h-full object-contain p-1"
                    onError={() => setIconLoadError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Pratinjau Ikon Aplikasi</p>
                {formData.iconUrl ? (
                  iconLoadError ? (
                    <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>Gagal memuat gambar dari URL. Periksa kembali tautan gambar Anda.</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-400 font-medium truncate mt-1">
                      Menampilkan gambar dari: {formData.iconUrl}
                    </p>
                  )
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Masukkan URL gambar ikon di atas untuk melihat pratinjau langsung secara real-time.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Screenshots URL Inputs (1 required, 4 optional) */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-slate-300">
              URL Screenshot / Preview <span className="text-red-500">*</span>
            </label>

            {formData.screenshots.map((scrUrl, idx) => (
              <div key={idx} className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="url"
                      value={scrUrl}
                      onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                      placeholder={`URL Screenshot #${idx + 1} ${idx === 0 ? '(Wajib)' : '(Opsional)'}`}
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
                      required={idx === 0}
                    />
                  </div>

                  {idx > 0 && scrUrl && (
                    <button
                      type="button"
                      onClick={() => handleScreenshotChange(idx, '')}
                      className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer shrink-0"
                      title="Hapus screenshot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Dedicated Screenshot Preview Container Below Input */}
                <div className="w-full h-40 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
                  {scrUrl && !screenshotLoadErrors[idx] ? (
                    <img 
                      src={scrUrl} 
                      alt={`Screenshot ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      onError={() => {
                        const errs = [...screenshotLoadErrors];
                        errs[idx] = true;
                        setScreenshotLoadErrors(errs);
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 text-center">
                      {scrUrl && screenshotLoadErrors[idx] ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-400" />
                          <span className="text-[11px] font-medium text-red-400">Gagal memuat gambar screenshot #{idx + 1}. Periksa tautan URL.</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-slate-600" />
                          <span className="text-[11px] text-slate-500 font-medium">Pratinjau Screenshot #{idx + 1} (Belum diisi)</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-bold text-white shadow">
                    Slot #{idx + 1} {idx === 0 && '*'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Deskripsi & Publikasi */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-base font-black text-white">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <FileText className="h-4 w-4" />
            </div>
            <span>4. Deskripsi & Publikasi</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Deskripsi Lengkap Aplikasi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              maxLength={2000}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Jelaskan secara singkat tentang aplikasi ini, fitur utama, dan kelebihannya..."
              className="w-full p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              required
            />
            <div className="text-right text-[10px] font-mono text-slate-500">
              {formData.description.length}/2000
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Status Publikasi
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="draft" className="bg-slate-900">Draft (Simpan sebagai draf)</option>
              <option value="published" className="bg-slate-900">Published (Terbit langsung)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Tampilkan sebagai Pilihan Redaksi</span>
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => setFormData(prev => ({ ...prev, popular: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Tandai sebagai Populer</span>
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={submitting}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            <span>Simpan sebagai Draft</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menyimpan ke Firestore...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Validasi & Simpan Aplikasi</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
