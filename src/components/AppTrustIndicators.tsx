import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Cpu, FileCheck } from 'lucide-react';

interface AppTrustIndicatorsProps {
  app: any;
}

export default function AppTrustIndicators({ app }: AppTrustIndicatorsProps) {
  return (
    <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 my-4" id="app-trust-indicators">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            Status Keamanan & Verifikasi AERO
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Diuji dan diverifikasi secara otomatis oleh sistem integritas backend.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#121722] border border-slate-200/60 dark:border-white/5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Verified APK</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#121722] border border-slate-200/60 dark:border-white/5">
          <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">APK Valid</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#121722] border border-slate-200/60 dark:border-white/5">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Signature Verified</span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#121722] border border-slate-200/60 dark:border-white/5">
          <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Security Checked</span>
        </div>
      </div>
    </div>
  );
}
