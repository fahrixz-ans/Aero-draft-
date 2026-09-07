import React from 'react';
import { MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';

export default function WhatsAppBanner() {
  const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/placeholder-aero-apk';

  return (
    <div className="my-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6" id="whatsapp-channel-banner">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800/60 text-[10px] font-black uppercase tracking-wider mb-2 text-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Channel Resmi Terverifikasi</span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight mb-1">
            Ikuti Channel WhatsApp Aero
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-xl">
            Dapatkan informasi aplikasi Android terbaru, rilis game eksklusif, pembaruan keamanan SHA-256, dan pengumuman penting langsung di genggaman Anda.
          </p>
        </div>
      </div>

      <a
        href={WHATSAPP_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-[0.98] font-black rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        aria-label="Buka Channel WhatsApp Aero"
      >
        <span>Buka Channel WhatsApp</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
