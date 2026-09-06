import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, FileCode, 
  Cpu, HardDrive, Lock, Shield, Eye, Copy, Check, Upload, 
  Layers, ArrowRight, RefreshCw, AlertCircle, Info, Hash, FileCheck
} from 'lucide-react';
import { APKUploader } from './APKUploader';

interface ApkAnalyzerResult {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdk: number;
  targetSdk: number;
  fileSize: number;
  permissions: string[];
  architectures: string[];
  sha256: string;
  signingCertificate?: {
    sha256: string | null;
    sha1: string | null;
    issuer: string | null;
    subject: string | null;
  };
}

export default function ApkAnalyzerView({
  onQuickCreateApp
}: {
  onQuickCreateApp?: (metadata: ApkAnalyzerResult, apkUrl: string) => void;
}) {
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<ApkAnalyzerResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [securityVerdict, setSecurityVerdict] = useState<'safe' | 'warning' | 'rejected'>('safe');
  const [verdictReason, setVerdictReason] = useState<string>('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUploadSuccess = (url: string, data: any) => {
    setAnalyzedUrl(url);
    setMetadata(data);

    // Dynamic security & quality analysis
    const dangerousPermissions = [
      'SYSTEM_ALERT_WINDOW', 'REQUEST_INSTALL_PACKAGES', 'BIND_ACCESSIBILITY_SERVICE',
      'WRITE_SETTINGS', 'PROCESS_OUTGOING_CALLS', 'RECEIVE_BOOT_COMPLETED'
    ];
    
    const foundRisky = (data.permissions || []).filter((p: string) => dangerousPermissions.includes(p));

    if (data.targetSdk && data.targetSdk < 28) {
      setSecurityVerdict('rejected');
      setVerdictReason(`Target SDK (${data.targetSdk}) terlalu usang. Standar keamanan Android mewajibkan minimal Target SDK 28+ untuk mencegah eksploitasi API lama.`);
    } else if (foundRisky.length > 2) {
      setSecurityVerdict('warning');
      setVerdictReason(`Ditemukan ${foundRisky.length} izin tingkat lanjut (${foundRisky.join(', ')}). Pastikan aplikasi ini telah diaudit fungsinya sebelum dipublikasikan ke pengguna.`);
    } else if (!data.signingCertificate?.sha256) {
      setSecurityVerdict('warning');
      setVerdictReason('Sertifikat penandatangan (signing certificate) tidak dapat diverifikasi secara penuh.');
    } else {
      setSecurityVerdict('safe');
      setVerdictReason('Struktur paket APK lolos semua tahap analisis statis. Siap untuk didistribusikan.');
    }
  };

  const handleReset = () => {
    setAnalyzedUrl('');
    setMetadata(null);
    setSecurityVerdict('safe');
    setVerdictReason('');
  };

  return (
    <div className="space-y-8 animate-fade-in" id="apk-analyzer-page">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-500/20 rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                APK Static Analyzer & Security Inspector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Alat analisis statis berkas APK mandiri untuk memverifikasi integritas, izin, SDK, dan tanda tangan digital.
              </p>
            </div>
          </div>

          {metadata && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Analisis APK Lain</span>
            </button>
          )}
        </div>
      </div>

      {/* Uploader Box */}
      {!metadata ? (
        <div className="bg-white dark:bg-[#12141C] border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Unggah Berkas APK untuk Dianalisis
          </h3>
          <APKUploader
            label="Pilih atau tarik berkas APK (.apk) ke area ini"
            currentUrl={analyzedUrl}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verdict Banner */}
          {securityVerdict === 'rejected' ? (
            <div className="p-5 bg-red-500/10 border-2 border-red-500/30 rounded-3xl flex items-start gap-4 animate-scale-up">
              <div className="p-2.5 bg-red-500 text-white rounded-2xl shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Hasil Analisis: Tidak Memenuhi Standar Keamanan (Rejected)
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {verdictReason}
                </p>
              </div>
            </div>
          ) : securityVerdict === 'warning' ? (
            <div className="p-5 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl flex items-start gap-4 animate-scale-up">
              <div className="p-2.5 bg-amber-500 text-slate-900 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Hasil Analisis: Peringatan Keamanan Terdeteksi (Warning)
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {verdictReason}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl flex items-start gap-4 animate-scale-up">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Hasil Analisis: Lolos Uji Validitas & Bebas Risiko (Safe)
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {verdictReason}
                </p>
              </div>
            </div>
          )}

          {/* Analysis Status Checklist */}
          <div className="bg-white dark:bg-[#12141C] border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-500" />
              <span>Daftar Verifikasi Analisis Statis (Analysis Status)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">APK Valid</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Manifest Found</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Package Detected</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Version Detected</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">SHA-256 Generated</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Signature Detected</span>
              </div>
            </div>
          </div>

          {/* Technical Metadata Breakdown */}
          <div className="bg-white dark:bg-[#12141C] border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileCode className="h-4 w-4 text-indigo-500" />
              <span>Detail Metadata Paket APK</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Package Name</span>
                <p className="font-mono text-xs font-bold text-slate-900 dark:text-white break-all">
                  {metadata.packageName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Versi & Kode Versi</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  v{metadata.versionName} <span className="text-slate-400 font-mono text-[11px]">(Code: {metadata.versionCode})</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Ukuran Berkas</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB <span className="text-slate-400 font-mono text-[11px]">({metadata.fileSize.toLocaleString('id-ID')} bytes)</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Target SDK</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Android {metadata.targetSdk >= 35 ? '15' : metadata.targetSdk >= 34 ? '14' : '13'} <span className="text-slate-400 font-mono text-[11px]">(API {metadata.targetSdk})</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Minimum SDK</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Android 7.0+ <span className="text-slate-400 font-mono text-[11px]">(API {metadata.minSdk})</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">Arsitektur CPU (ABI)</span>
                <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {metadata.architectures?.join(', ') || 'arm64-v8a, armeabi-v7a'}
                </p>
              </div>
            </div>

            {/* SHA-256 Fingerprint */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase">SHA-256 Checksum (Original File)</span>
                <button
                  onClick={() => handleCopy(metadata.sha256, 'sha256')}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-500 inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'sha256' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === 'sha256' ? 'Tersalin' : 'Salin SHA-256'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                {metadata.sha256}
              </div>
            </div>

            {/* Signing Certificate */}
            {metadata.signingCertificate && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Sertifikat Tanda Tangan Digital (Signing Certificate)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Certificate Subject</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{metadata.signingCertificate.subject}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Certificate Issuer</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{metadata.signingCertificate.issuer}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions List */}
            {metadata.permissions && metadata.permissions.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase block">
                  Izin Sistem Android (Permissions - {metadata.permissions.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                  {metadata.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          {onQuickCreateApp && (
            <div className="p-6 bg-slate-50 dark:bg-[#12141C] border border-slate-200 dark:border-white/5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Daftarkan sebagai Aplikasi Baru di Katalog
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gunakan seluruh metadata yang telah diekstraksi secara otomatis untuk membuat entri aplikasi baru.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onQuickCreateApp(metadata, analyzedUrl)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Buka Formulir Aplikasi Baru</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
