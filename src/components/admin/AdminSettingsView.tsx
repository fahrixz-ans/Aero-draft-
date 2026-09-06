import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, CheckCircle2, AlertCircle, 
  Sliders, Shield, HardDrive, Download, Search, Globe, Flame
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { fetchSystemSettings, saveSystemSettings, DEFAULT_SETTINGS } from '../../services/admin/settingsService';
import { logAdminAction } from '../../services/admin/auditLogService';

export default function AdminSettingsView() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Failed loading system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Compute trending weight total
  const trendingSum = 
    (Number(settings.trending.weights.downloads) || 0) +
    (Number(settings.trending.weights.views) || 0) +
    (Number(settings.trending.weights.searches) || 0) +
    (Number(settings.trending.weights.growth) || 0) +
    (Number(settings.trending.weights.saves) || 0) +
    (Number(settings.trending.weights.freshness) || 0);

  const isTrendingWeightValid = Math.abs(trendingSum - 100) < 0.1;

  const handleSave = async () => {
    if (!isTrendingWeightValid) {
      setMessage({
        text: `Total bobot algoritma trending harus tepat 100% (saat ini total: ${trendingSum}%).`,
        type: 'error'
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const result = await saveSystemSettings(settings);
      if (result.success) {
        setMessage({ text: 'Pengaturan sistem berhasil disimpan.', type: 'success' });
        await logAdminAction({
          action: 'admin_setting_changed',
          entityType: 'system',
          entityId: 'global_config',
          entityName: 'System Global Settings'
        });
      } else {
        setMessage({ text: result.error || 'Gagal menyimpan pengaturan.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: 'Terjadi kesalahan saat menyimpan pengaturan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Pengaturan Sistem & Konfigurasi Global (System Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola bobot algoritma trending, limitasi unduhan, mesin pencarian, ambang moderasi, dan batas penyimpanan.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Seluruh Pengaturan</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Memuat konfigurasi sistem...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Trending Algorithm Weights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Bobot Algoritma Trending & Peringkat (Wajib Total 100%)
                </h3>
                <p className="text-xs text-slate-500">
                  Formula penghitungan tren: Download, Page Views, Frekuensi Pencarian, Pertumbuhan, Simpan, dan Kesegaran Rilis.
                </p>
              </div>

              <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                isTrendingWeightValid
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
              }`}>
                Total Bobot: {trendingSum}% {isTrendingWeightValid ? '(Valid)' : '(Tidak Valid)'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Downloads ({settings.trending.weights.downloads}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.downloads}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, downloads: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Page Views ({settings.trending.weights.views}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.views}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, views: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pencarian ({settings.trending.weights.searches}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.searches}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, searches: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pertumbuhan ({settings.trending.weights.growth}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.growth}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, growth: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disimpan ({settings.trending.weights.saves}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.saves}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, saves: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kesegaran ({settings.trending.weights.freshness}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.trending.weights.freshness}
                  onChange={(e) => setSettings({
                    ...settings,
                    trending: {
                      ...settings.trending,
                      weights: { ...settings.trending.weights, freshness: Number(e.target.value) }
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Download & Rate Limiting Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              Pengaturan Unduhan & Pembatasan Laju (Rate Limiting)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Unduhan per Menit per IP
                </label>
                <input
                  type="number"
                  value={settings.downloads.rateLimitPerMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    downloads: { ...settings.downloads, rateLimitPerMinute: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.downloads.directDownloadEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      downloads: { ...settings.downloads, directDownloadEnabled: e.target.checked }
                    })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold">Izinkan Unduhan Langsung (Direct Aero Download)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.downloads.resumableRangeEnabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      downloads: { ...settings.downloads, resumableRangeEnabled: e.target.checked }
                    })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold">Dukungan HTTP Range Header (Resumable Download)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Storage & Moderation Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Storage Limits */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-500" />
                Batas Ukuran Penyimpanan
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Maksimum Ukuran APK (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.maxApkSizeMB}
                    onChange={(e) => setSettings({
                      ...settings,
                      storage: { ...settings.storage, maxApkSizeMB: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Maksimum Ukuran Gambar (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.storage.maxImageSizeMB}
                    onChange={(e) => setSettings({
                      ...settings,
                      storage: { ...settings.storage, maxImageSizeMB: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Moderation Thresholds */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Ambang Batas Moderasi
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ambang Auto-Flag Laporan (Jumlah Laporan Pengguna)
                  </label>
                  <input
                    type="number"
                    value={settings.moderation.autoFlagThreshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      moderation: { ...settings.moderation, autoFlagThreshold: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.moderation.requireRejectionReason}
                      onChange={(e) => setSettings({
                        ...settings,
                        moderation: { ...settings.moderation, requireRejectionReason: e.target.checked }
                      })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold">Wajibkan Alasan Saat Menolak Aplikasi</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
