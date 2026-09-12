import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, Zap, Info, Smartphone, Package, Code, Tag, Clock, Save, Hash, Play, Key, Check, ShieldAlert } from 'lucide-react';
import { AppData } from '../../types';
import { developerToSlug } from '../../utils/developerUtils';
import { categoryToSlug } from '../../utils/categoryUtils';
import { useLanguage } from '../../context/LanguageContext';

interface AppDetailFullViewProps {
  app: AppData | null | undefined;
  onBack: () => void;
}

export default function AppDetailFullView({ app, onBack }: AppDetailFullViewProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'detail' | 'whatsnew' | 'description'>('detail');
  const [copiedSha256, setCopiedSha256] = useState(false);
  const [copiedSha1, setCopiedSha1] = useState(false);

  // Safety Skeleton Loading State
  if (!app) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse p-4" id="app-detail-full-loading">
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="w-48 h-6 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="w-20 h-5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-20 h-5 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="w-20 h-5 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const googlePlayUrl = (app as any).googlePlayUrl || 
    (app.officialUrl?.includes('play.google.com') ? app.officialUrl : null) || 
    (app.officialDownloadUrl?.includes('play.google.com') ? app.officialDownloadUrl : null);

  const handleDevClick = () => {
    const slug = developerToSlug(app.developerName || app.developer);
    window.location.hash = `/apps/developer/${slug}`;
  };

  const handleCategoryClick = () => {
    if (!app.category) return;
    const catSlug = categoryToSlug(app.category);
    window.location.hash = `/apps/category/${catSlug}`;
  };

  const copyToClipboard = (text: string, type: 'sha256' | 'sha1') => {
    navigator.clipboard.writeText(text);
    if (type === 'sha256') {
      setCopiedSha256(true);
      setTimeout(() => setCopiedSha256(false), 2000);
    } else {
      setCopiedSha1(true);
      setTimeout(() => setCopiedSha1(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="app-detail-full-view">
      {/* Header: ← [Icon aplikasi] | Nama aplikasi */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={t('app.backToDetails', 'Kembali ke detail aplikasi')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img
          src={app.iconUrl || app.icon}
          alt={app.name}
          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-xs"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
          {app.name}
        </h1>
      </div>

      {/* TABS: Detail | Apa yang baru | Deskripsi */}
      <div className="flex border-b border-slate-200 dark:border-white/10 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'detail', label: t('app.detailSpecs', 'Detail Spesifikasi') },
          { id: 'whatsnew', label: t('app.releaseNotes', 'Catatan Rilis') },
          { id: 'description', label: t('app.description', 'Deskripsi Lengkap') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-extrabold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap select-none ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'detail' && (
          <div className="space-y-6">
            {/* TENTANG APLIKASI INI */}
            <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {t('app.aboutTitle', 'Tentang Aplikasi Ini')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                {app.description || t('app.descriptionEmpty', 'Deskripsi lengkap aplikasi belum tersedia.')}
              </p>
            </section>

            {/* INFO LENGKAP */}
            <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {t('app.rating', 'Klasifikasi Konten')}
              </h2>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Rating {app.contentRating || '3+'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {t('app.ratingDescription', 'Tingkat kedewasaan konten. Aman untuk diunduh dan digunakan sesuai klasifikasi.')}
                  </p>
                </div>
              </div>
            </section>

            {/* INFO APLIKASI */}
            <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {t('app.techInfo', 'Informasi Teknis Aplikasi')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Aplikasi */}
                <div className="flex gap-3">
                  <Smartphone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.appInfo', 'Aplikasi')}</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{app.name}</p>
                  </div>
                </div>

                {/* Nama paket */}
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.packageName', 'Nama paket')}</p>
                    <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{app.packageName || 'com.modstation.app'}</p>
                  </div>
                </div>

                {/* Developer */}
                <div className="flex gap-3">
                  <Code className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.developer', 'Developer')}</p>
                    <button
                      onClick={handleDevClick}
                      className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                    >
                      {app.developerName || app.developer}
                    </button>
                  </div>
                </div>

                {/* Versi */}
                <div className="flex gap-3">
                  <Hash className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.currentVersion', 'Versi Saat Ini')}</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{app.version || '1.0'}</p>
                  </div>
                </div>

                {/* OS Wajib */}
                <div className="flex gap-3">
                  <Smartphone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.minOs', 'OS Minimum')}</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Android {app.androidVersion || '6.0+'} {language === 'id' ? 'dan yang lebih baru' : 'and newer'}
                    </p>
                  </div>
                </div>

                {/* Di rilis pada */}
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.updatedAt', 'Terakhir Diperbarui')}</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {new Date(app.updatedAt || Date.now()).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Kategori */}
                <div className="flex gap-3">
                  <Tag className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.category', 'Kategori')}</p>
                    <button
                      onClick={handleCategoryClick}
                      className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                    >
                      {app.category}
                    </button>
                  </div>
                </div>

                {/* Ukuran */}
                <div className="flex gap-3">
                  <Save className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.size', 'Ukuran Berkas')}</p>
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{app.size || '35 MB'}</p>
                  </div>
                </div>

                {/* Target SDK */}
                {app.targetSdk && (
                  <div className="flex gap-3">
                    <Code className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.targetSdk', 'Target SDK')}</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Android {app.targetSdk} (API {app.targetSdk})</p>
                    </div>
                  </div>
                )}

                {/* Minimum SDK */}
                {app.minSdk && (
                  <div className="flex gap-3">
                    <Code className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('app.minSdk', 'Minimum SDK')}</p>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Android {app.minSdk} (API {app.minSdk})</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* INFO MOD */}
            {app.modFeatures && (
              <section className="p-6 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5 fill-current" />
                  <h2 className="text-base font-black uppercase tracking-wider">
                    {t('app.modFeatures', 'Fitur Modifikasi (Mod)')}
                  </h2>
                </div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 whitespace-pre-line leading-relaxed">
                  {app.modFeatures}
                </p>
              </section>
            )}

            {/* INTEGRITAS BERKAS & SERTIFIKAT TANDA TANGAN (SHA-256) */}
            {(app.signingCertificate?.sha256 || (app as any).sha256) && (
              <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-500" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {t('app.signingCert', 'Sertifikat Tanda Tangan & Keamanan')}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t('app.signingCertDesc', 'Semua berkas APK yang diunggah di Aero melewati pemeriksaan tanda tangan kriptografis untuk memastikan berkas aman, tidak dimanipulasi, dan berasal dari pengembang resmi.')}
                </p>

                <div className="space-y-3 font-mono text-xs">
                  {/* SHA-256 Checksum */}
                  {(app.signingCertificate?.sha256 || (app as any).sha256) && (
                    <div className="p-3 bg-slate-50 dark:bg-black/35 rounded-xl border border-slate-150 dark:border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('app.sha256', 'SHA-256 Tanda Tangan')}</span>
                        <button
                          onClick={() => copyToClipboard(app.signingCertificate?.sha256 || (app as any).sha256, 'sha256')}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                        >
                          {copiedSha256 ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">{t('app.copied', 'Disalin!')}</span>
                            </>
                          ) : (
                            <span>{t('app.copyHash', 'Salin Hash')}</span>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 break-all font-bold">
                        {app.signingCertificate?.sha256 || (app as any).sha256}
                      </p>
                    </div>
                  )}

                  {/* SHA-1 Checksum */}
                  {(app.signingCertificate?.sha1 || (app as any).sha1) && (
                    <div className="p-3 bg-slate-50 dark:bg-black/35 rounded-xl border border-slate-150 dark:border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('app.sha1', 'SHA-1 Tanda Tangan')}</span>
                        <button
                          onClick={() => copyToClipboard(app.signingCertificate?.sha1 || (app as any).sha1, 'sha1')}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
                        >
                          {copiedSha1 ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">{t('app.copied', 'Disalin!')}</span>
                            </>
                          ) : (
                            <span>{t('app.copyHash', 'Salin Hash')}</span>
                          )}
                        </button>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 break-all font-bold">
                        {app.signingCertificate?.sha1 || (app as any).sha1}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* PERIZINAN APLIKASI (APP PERMISSIONS) */}
            {app.permissions && app.permissions.length > 0 && (
              <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {t('app.permissions', 'Perizinan Aplikasi (Permissions)')}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {t('app.permissionsDesc', 'Aplikasi ini dapat meminta akses ke fitur-fitur perangkat Android berikut setelah Anda menyetujuinya saat instalasi:')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {app.permissions.map((perm, idx) => {
                    const cleanPerm = perm.replace('android.permission.', '');
                    return (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl flex items-start gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono break-all">{cleanPerm}</p>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">{t('app.permissionSystem', 'Izin tingkat sistem operasi Android')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* GOOGLE PLAY SECTION: Only shown if real link exists */}
            {googlePlayUrl && (
              <section className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Play className="w-6 h-6 fill-emerald-600 dark:fill-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{t('app.originalOnPlay', 'Dapatkan app resmi')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.originalOnPlayDesc', 'Unduh versi original langsung dari pengembang resmi')}</p>
                  </div>
                </div>
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Get it on Google Play</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </section>
            )}
          </div>
        )}

        {activeTab === 'whatsnew' && (
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" /> {t('app.whatsNew', 'Catatan Rilis')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t('app.updatedAt', 'Terakhir Diperbarui')}: {new Date(app.updatedAt || Date.now()).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium text-sm bg-slate-50 dark:bg-black/20 p-5 rounded-xl border border-slate-100 dark:border-white/5 font-sans">
              {app.whatsNew || t('app.whatsNewEmpty', 'Tidak ada catatan pembaruan khusus untuk rilis versi ini.')}
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="p-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {t('app.description', 'Deskripsi Lengkap')}
            </h2>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium text-sm">
              {app.description || t('app.descriptionEmpty', 'Deskripsi lengkap aplikasi belum tersedia.')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
