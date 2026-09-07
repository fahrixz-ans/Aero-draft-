import React, { useState } from 'react';
import { X, ShieldCheck, Check, Plus, Minus, ArrowRight, FileText, Smartphone } from 'lucide-react';
import { AppVersion } from '../types';

interface VersionComparisonModalProps {
  versions: AppVersion[];
  appName: string;
  onClose: () => void;
}

export default function VersionComparisonModal({
  versions,
  appName,
  onClose
}: VersionComparisonModalProps) {
  const [versionIdA, setVersionIdA] = useState<string>(versions[1]?.id || versions[0]?.id || '');
  const [versionIdB, setVersionIdB] = useState<string>(versions[0]?.id || '');

  const verA = versions.find(v => v.id === versionIdA);
  const verB = versions.find(v => v.id === versionIdB);

  const permsA = new Set(verA?.permissions || []);
  const permsB = new Set(verB?.permissions || []);

  const addedPermissions = [...permsB].filter(p => !permsA.has(p));
  const removedPermissions = [...permsA].filter(p => !permsB.has(p));
  const unchangedPermissions = [...permsB].filter(p => permsA.has(p));

  const sizeDiffBytes = (verB?.fileSize || 0) - (verA?.fileSize || 0);
  const sizeDiffFormatted = `${sizeDiffBytes >= 0 ? '+' : ''}${Math.round(sizeDiffBytes / (1024 * 1024))} MB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Perbandingan Versi: {appName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bandingkan metadata teknis, izin sistem (permission diff), dan ukuran APK antar rilis.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-400">Versi Pembanding (A)</label>
            <select
              value={versionIdA}
              onChange={(e) => setVersionIdA(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>v{v.versionName} (Code: {v.versionCode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-400">Versi Utama / Target (B)</label>
            <select
              value={versionIdB}
              onChange={(e) => setVersionIdB(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>v{v.versionName} (Code: {v.versionCode})</option>
              ))}
            </select>
          </div>
        </div>

        {verA && verB && (
          <div className="space-y-6">
            {/* Summary comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-black uppercase">
                    <th className="py-2.5 px-3 text-left">Parameter</th>
                    <th className="py-2.5 px-3 text-left">v{verA.versionName}</th>
                    <th className="py-2.5 px-3 text-left">v{verB.versionName}</th>
                    <th className="py-2.5 px-3 text-left">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Version Code</td>
                    <td className="py-3 px-3 font-mono">{verA.versionCode}</td>
                    <td className="py-3 px-3 font-mono">{verB.versionCode}</td>
                    <td className="py-3 px-3 font-mono text-blue-600 font-bold">
                      {verB.versionCode - verA.versionCode >= 0 ? `+${verB.versionCode - verA.versionCode}` : verB.versionCode - verA.versionCode}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Ukuran APK (Size)</td>
                    <td className="py-3 px-3">{Math.round((verA.fileSize || 0) / (1024 * 1024))} MB</td>
                    <td className="py-3 px-3">{Math.round((verB.fileSize || 0) / (1024 * 1024))} MB</td>
                    <td className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400">{sizeDiffFormatted}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Min SDK / Target SDK</td>
                    <td className="py-3 px-3">Android {verA.minSdk} / {verA.targetSdk}</td>
                    <td className="py-3 px-3">Android {verB.minSdk} / {verB.targetSdk}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {verA.targetSdk === verB.targetSdk ? 'Sama' : 'Berubah'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Status Keamanan</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-md text-[10px] font-bold">
                        {verA.securityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-md text-[10px] font-bold">
                        {verB.securityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Permission Diff */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Perbedaan Izin Sistem (Permission Diff)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Izin Ditambahkan ({addedPermissions.length})</span>
                  </div>
                  {addedPermissions.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Tidak ada izin baru ditambahkan.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {addedPermissions.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-mono font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-2">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Minus className="w-4 h-4" />
                    <span>Izin Dihapus ({removedPermissions.length})</span>
                  </div>
                  {removedPermissions.length === 0 ? (
                    <p className="text-[11px] text-slate-500">Tidak ada izin yang dihapus.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {removedPermissions.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-mono font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Changelog Diff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Changelog v{verA.versionName}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{verA.changelog || 'Tidak ada catatan rilis.'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Changelog v{verB.versionName}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{verB.changelog || 'Tidak ada catatan rilis.'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup Perbandingan
          </button>
        </div>
      </div>
    </div>
  );
}
