import React, { useState, useEffect } from 'react';
import { Upload, ShieldCheck, Clock, CheckCircle2, AlertTriangle, FileText, Code2, Plus } from 'lucide-react';
import BackButton from '../navigation/BackButton';

interface DeveloperDashboardProps {
  user: any;
  onBackToHome: () => void;
}

export default function DeveloperDashboard({ user, onBackToHome }: DeveloperDashboardProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [appName, setAppName] = useState('');
  const [slug, setSlug] = useState('');
  const [packageName, setPackageName] = useState('');
  const [category, setCategory] = useState('Alat & Utilitas');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const email = user?.email || 'developer@aeroapk.com';
      const res = await fetch(`/api/developer/submissions?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch developer submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !slug) {
      setError('Nama dan slug aplikasi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('name', appName);
      formData.append('slug', slug);
      formData.append('packageName', packageName || `com.developer.${slug.replace(/[^a-z0-9]/g, '')}`);
      formData.append('category', category);
      formData.append('shortDescription', shortDescription);
      formData.append('description', description);
      formData.append('developerEmail', user?.email || 'developer@aeroapk.com');
      if (apkFile) {
        formData.append('apk', apkFile);
      }

      const res = await fetch('/api/developer/submissions', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();

      if (json.success) {
        setSuccessMsg(json.message || 'Aplikasi berhasil diunggah dan masuk ke antrean verifikasi.');
        setShowUploadModal(false);
        setAppName('');
        setSlug('');
        setPackageName('');
        setShortDescription('');
        setDescription('');
        setApkFile(null);
        fetchSubmissions();
      } else {
        setError(json.error?.message || 'Gagal mengunggah aplikasi.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in" id="developer-dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <BackButton onBack={onBackToHome} label="Kembali ke Beranda" showText={true} className="mb-3" />
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/assets/mod-station-logo.svg"
              alt="Mod Station"
              className="w-10 h-10 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5" />
              <span>Portal Developer Mod Station</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Pengembang & Riwayat Rilis
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Kelola pengajuan aplikasi, unggah versi APK baru, dan pantau status verifikasi kepemilikan serta keamanan (VirusTotal).
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Aplikasi Baru</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Aplikasi Saya ({submissions.length})
          </h3>
          <span className="text-xs font-bold text-slate-500">Kebijakan: AERO_HOSTED_APK (Eksternal dilarang)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Memuat data pengembang...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum ada aplikasi yang diunggah.</p>
            <p className="text-[11px] text-slate-500 mt-1">Klik tombol &ldquo;Unggah Aplikasi Baru&rdquo; untuk memulai pengajuan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{sub.appName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                      v{sub.versionName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{sub.packageName}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Ownership: {sub.ownershipStatus}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Security: {sub.securityStatus}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Review: {sub.reviewStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-400 font-mono">SHA256: {sub.sha256?.substring(0, 12)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              Unggah APK & Pengajuan Aplikasi Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Sistem akan secara otomatis mengekstrak metadata, memvalidasi SHA-256, dan melakukan pemindaian keamanan VirusTotal.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Aplikasi *</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  placeholder="Contoh: My Awesome App"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="Contoh: my-awesome-app"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Package Name (Opsional, otomatis dari APK)</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={e => setPackageName(e.target.value)}
                  placeholder="Contoh: com.example.app"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Alat & Utilitas">Alat & Utilitas</option>
                  <option value="Sosial & Komunikasi">Sosial & Komunikasi</option>
                  <option value="Produktivitas">Produktivitas</option>
                  <option value="Game & Hiburan">Game & Hiburan</option>
                  <option value="Fotografi & Video">Fotografi & Video</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Berkas APK (*.apk) *</label>
                <input
                  type="file"
                  accept=".apk"
                  onChange={e => setApkFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="Ringkasan singkat fungsi aplikasi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {submitting ? 'Memproses...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
