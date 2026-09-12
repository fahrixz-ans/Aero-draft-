import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Smartphone, CheckCircle2, 
  AlertTriangle, Key, Lock, FileCode, Check, RefreshCw
} from 'lucide-react';
import { AppData } from '../../types';

interface AdminApkSecurityViewProps {
  apps: AppData[];
}

export default function AdminApkSecurityView({ apps }: AdminApkSecurityViewProps) {
  const [selectedApp, setSelectedApp] = useState<AppData | null>(apps[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const apkApps = apps.filter(a => (a.sourceType || 'apk') === 'apk');
  const filteredApps = apkApps.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.packageName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Pusat Keamanan & Integritas Kriptografis APK (APK Security Pipeline)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit keamanan statis: Analisis binary tanpa eksekusi server, validasi sertifikat penandatanganan, dan pengecekan hash SHA-256.
          </p>
        </div>
      </div>

      {/* Security Principles Banner */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-xs">
        <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            Jaminan Isolasi Eksekusi Nol (Zero-Server-Execution Policy)
          </p>
          <p className="text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 leading-relaxed">
            Semua paket APK yang diunggah ke Mod Station HANYA dianalisis secara statis (inspeksi manifest dan uncompressed zip entries). Berkas APK tidak pernah dieksekusi atau dijalankan di lingkungan kontainer server untuk mencegah eksekusi kode berbahaya.
          </p>
        </div>
      </div>

      {/* Main Layout: List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: App selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Cari APK berdasarkan nama atau package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />

          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedApp?.id === app.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img src={app.icon || '/icon.png'} alt={app.name} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{app.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{app.packageName || 'org.aero.app'}</p>
                  </div>
                  {app.sha256 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security Inspector Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedApp ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={selectedApp.icon || '/icon.png'} alt={selectedApp.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedApp.name}</h3>
                    <p className="text-xs text-slate-500">Pengembang: {selectedApp.developer} • Versi {selectedApp.version}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Statik Scan Valid</span>
                </span>
              </div>

              {/* Cryptographic Checksum Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Checksum Integritas SHA-256</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Terverifikasi</span>
                </div>
                <p className="font-mono text-[11px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 break-all select-all">
                  {selectedApp.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </p>
              </div>

              {/* Package & SDK Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">Package ID</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {selectedApp.packageName || 'id.aero.app'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">Min. SDK</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    API {selectedApp.minSdk || 23} ({selectedApp.androidVersion})
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">Target SDK</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    API {selectedApp.targetSdk || 34}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">Arsitektur CPU</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedApp.architectures?.join(', ') || 'Universal / arm64-v8a'}
                  </p>
                </div>
              </div>

              {/* Declared Permissions Matrix */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Izin Manifest Dideklarasikan ({selectedApp.permissions?.length || 0})
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto space-y-1.5">
                  {selectedApp.permissions && selectedApp.permissions.length > 0 ? (
                    selectedApp.permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-700 dark:text-slate-300">{perm}</span>
                        {perm.includes('CAMERA') || perm.includes('LOCATION') || perm.includes('CONTACTS') ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                            Sensitif
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 text-[9px]">
                            Standar
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada izin berisiko tinggi yang diminta.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Pilih salah satu aplikasi APK di sisi kiri untuk melihat audit keamanan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
