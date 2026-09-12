import React from 'react';

interface BlogAdvertisementProps {
  className?: string;
  slotId?: string;
}

export default function BlogAdvertisement({ className = '', slotId = 'default' }: BlogAdvertisementProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto my-4 ${className}`}>
      <div className="w-full rounded-2xl bg-slate-100/80 dark:bg-[#1C1C1E]/80 border border-slate-200/60 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
            Iklan
          </span>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            Sponsor Mod Station Blog — Dukung Komunitas Mod Station
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.open('https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k', '_blank')}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shrink-0 cursor-pointer active:scale-95 btn-press-feedback"
        >
          Pelajari Sponsor
        </button>
      </div>
    </div>
  );
}
