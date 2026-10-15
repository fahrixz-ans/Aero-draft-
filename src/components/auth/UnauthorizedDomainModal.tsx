import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, X, AlertTriangle, Globe } from 'lucide-react';
import config from '../../../firebase-applet-config.json';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
}

export default function UnauthorizedDomainModal({
  isOpen,
  onClose,
  domain
}: UnauthorizedDomainModalProps) {
  const [copied, setCopied] = useState(false);
  const activeDomain = domain || (typeof window !== 'undefined' ? window.location.hostname : 'domain Anda');
  const projectId = config.projectId || 'fantra-6f7f5';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(activeDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      id="unauthorized-domain-modal"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-left animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Domain Belum Diotorisasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Error: auth/unauthorized-domain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Explanation */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Penyebab Masalah:</span>
          </div>
          <p className="leading-relaxed font-medium">
            Firebase Authentication menolak proses login karena domain aktual tempat aplikasi dibuka belum terdaftar di whitelist Authorized Domains proyek Firebase <strong className="font-mono">{projectId}</strong>.
          </p>
        </div>

        {/* Identified Current Domain */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Domain Aktual Website:</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 select-all truncate">
              {activeDomain}
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Domain'}</span>
            </button>
          </div>
        </div>

        {/* Step by Step Fix Instructions */}
        <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-white/10">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Langkah Penyelesaian (Di Firebase Console):
          </h3>
          <ol className="text-xs space-y-2 font-medium text-slate-600 dark:text-slate-300 list-decimal list-inside pl-1">
            <li>
              Buka menu <strong className="text-slate-900 dark:text-white">Authentication &gt; Settings</strong> di Firebase Console.
            </li>
            <li>
              Gulir ke bagian <strong className="text-slate-900 dark:text-white">Authorized domains</strong>.
            </li>
            <li>
              Klik tombol <strong className="text-slate-900 dark:text-white">Add domain</strong> dan masukkan domain di atas.
            </li>
            <li>
              Simpan, lalu segarkan halaman ini dan coba login kembali.
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Buka Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
