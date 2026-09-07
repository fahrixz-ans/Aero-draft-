import React from 'react';
import { ExternalLink, ShieldCheck, CheckCircle2, FileText, ArrowRight, Code2, Users } from 'lucide-react';

interface DeveloperRegisterViewProps {
  user: any;
  onSignIn?: () => void;
  onBackToHome?: () => void;
}

export default function DeveloperRegisterView({
  user,
  onSignIn,
  onBackToHome
}: DeveloperRegisterViewProps) {
  const GOOGLE_FORM_URL = 'https://forms.google.com';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in" id="developer-register-view">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider mb-3">
          <Code2 className="w-3.5 h-3.5" />
          <span>Program Developer Aero</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Daftar Menjadi Developer Terverifikasi
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Publikasikan dan kelola aplikasi atau game Android resmi Anda di platform katalog Aero setelah melalui proses verifikasi dan moderasi kurator.
        </p>
      </div>

      {/* Step-by-Step Flow Explanation (Section 28) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121722] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 font-black text-xs flex items-center justify-center mb-3">
            1
          </div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white mb-1">
            Isi Formulir Google Form
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Lengkapi data identitas pengembang, portofolio aplikasi, dan tautan resmi pada formulir registrasi.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121722] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-black text-xs flex items-center justify-center mb-3">
            2
          </div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white mb-1">
            Peninjauan & Verifikasi Admin
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Tim Administrator Aero meninjau keabsahan identitas, sertifikat rilis, dan integritas keamanan pengembang.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121722] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-xs flex items-center justify-center mb-3">
            3
          </div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white mb-1">
            Pemberian Akses & DEV ID
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Jika disetujui, admin akan menerbitkan DEV ID resmi dan mengaktifkan fitur publikasi aplikasi di akun Anda.
          </p>
        </div>
      </div>

      {/* Main Action Box */}
      <div className="p-6 sm:p-8 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-[#121722] shadow-sm text-center max-w-2xl mx-auto">
        <FileText className="w-10 h-10 text-blue-600 mx-auto mb-3" />

        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
          Formulir Pengajuan Akun Developer
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
          Klik tombol di bawah untuk membuka formulir Google Form pendaftaran resmi kurasi Developer Aero.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <span>Buka Google Form Pendaftaran</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Pengiriman formulir tidak secara otomatis memberikan status developer sebelum disetujui kurator.</span>
        </div>
      </div>
    </div>
  );
}
