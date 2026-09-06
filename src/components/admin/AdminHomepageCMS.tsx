import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, Save, ArrowUp, ArrowDown, Eye, EyeOff, 
  Sparkles, CheckCircle2, RefreshCw, Layers, Grid
} from 'lucide-react';
import { HomepageCMSConfig } from '../../types';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logAdminAction } from '../../services/admin/auditLogService';

const DEFAULT_HOMEPAGE_CONFIG: HomepageCMSConfig = {
  hero: {
    title: 'Pusat Distribusi & Penemuan Aplikasi Android Modern',
    subtitle: 'Unduh paket APK langsung dengan integritas kriptografis SHA-256 dan verifikasi website resmi pengembang.',
    searchPlaceholder: 'Cari aplikasi, utilitas, produktivitas, atau pengembang...',
    showBanner: true
  },
  sections: [
    { id: 'sec_trending', title: 'Sedang Trending & Populer', type: 'trending', enabled: true, sortOrder: 1, itemLimit: 8 },
    { id: 'sec_new_releases', title: 'Rilis Terbaru', type: 'new_releases', enabled: true, sortOrder: 2, itemLimit: 8 },
    { id: 'sec_editors_picks', title: 'Pilihan Redaksi (Editor’s Choice)', type: 'editor_picks', enabled: true, sortOrder: 3, itemLimit: 6 },
    { id: 'sec_collections', title: 'Koleksi Aplikasi Kurasi', type: 'collections', enabled: true, sortOrder: 4, itemLimit: 4 },
    { id: 'sec_recently_updated', title: 'Baru Saja Diperbarui', type: 'recently_updated', enabled: true, sortOrder: 5, itemLimit: 8 },
    { id: 'sec_categories', title: 'Jelajahi Kategori', type: 'categories', enabled: true, sortOrder: 6, itemLimit: 12 }
  ]
};

export default function AdminHomepageCMS() {
  const [config, setConfig] = useState<HomepageCMSConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'homepage_cms'));
      if (snap.exists()) {
        setConfig({ ...DEFAULT_HOMEPAGE_CONFIG, ...(snap.data() as HomepageCMSConfig) });
      }
    } catch (err) {
      console.warn('Failed loading homepage config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'homepage_cms'), config);
      await logAdminAction({
        action: 'admin_setting_changed',
        entityType: 'system',
        entityId: 'homepage_cms',
        entityName: 'Homepage Layout CMS'
      });
      setMessage({ text: 'Tata letak beranda berhasil disimpan.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Gagal menyimpan tata letak beranda.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...config.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // update sortOrder
    const updated = list.map((sec, i) => ({ ...sec, sortOrder: i + 1 }));
    setConfig({ ...config, sections: updated });
  };

  const toggleSection = (index: number) => {
    const list = [...config.sections];
    list[index].enabled = !list[index].enabled;
    setConfig({ ...config, sections: list });
  };

  const updateItemLimit = (index: number, limit: number) => {
    const list = [...config.sections];
    list[index].itemLimit = Math.max(2, Math.min(24, limit));
    setConfig({ ...config, sections: list });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-500" />
            Manajemen Konten Beranda (Homepage CMS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur teks Hero header, visibilitas section, urutan tampilan, dan batas item katalog di halaman utama.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Perubahan Beranda</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Memuat konfigurasi CMS...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Section Config */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Konfigurasi Hero Banner Utama
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Utama (Hero Title)
                </label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subjudul (Hero Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={config.hero.subtitle}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Petunjuk Pencarian (Search Placeholder)
                </label>
                <input
                  type="text"
                  value={config.hero.searchPlaceholder}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, searchPlaceholder: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section Ordering & Visibility */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-500" />
              Struktur & Urutan Bagian (Sections Layout)
            </h3>
            <p className="text-xs text-slate-500">
              Ubah urutan tampilan bagian beranda dengan tombol panah atau aktifkan/nonaktifkan bagian sesuai kebutuhan operasional.
            </p>

            <div className="space-y-2.5">
              {config.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border text-xs gap-3 transition-all ${
                    section.enabled
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center text-[10px] text-slate-700 dark:text-slate-300">
                      #{idx + 1}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = [...config.sections];
                          updated[idx].title = e.target.value;
                          setConfig({ ...config, sections: updated });
                        }}
                        className="font-bold text-xs bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none text-slate-900 dark:text-white"
                      />
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">Tipe: {section.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Batas:</span>
                      <input
                        type="number"
                        min={2}
                        max={24}
                        value={section.itemLimit}
                        onChange={(e) => updateItemLimit(idx, Number(e.target.value))}
                        className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, 'up')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === config.sections.length - 1}
                        onClick={() => moveSection(idx, 'down')}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSection(idx)}
                      className={`px-3 py-1.5 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                        section.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{section.enabled ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
