import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface AdSenseBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export default function AdSenseBanner({ slotId = 'aero-ads-default', format = 'auto', className = '' }: AdSenseBannerProps) {
  // Google AdSense configuration placeholder
  const isEnabled = Boolean((import.meta as any).env?.VITE_ADSENSE_ENABLED === 'true');

  if (!isEnabled) {
    return (
      <div className={`border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/[0.02] text-center ${className}`} id="adsense-placeholder">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          <Info className="w-3.5 h-3.5" />
          <span>Sponsored Advertisement (Google AdSense)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ruang Iklan Sponsor Terkonfigurasi (Placeholder)
        </p>
      </div>
    );
  }

  return (
    <div className={`my-4 overflow-hidden rounded-xl bg-white dark:bg-[#121722] border border-slate-200 dark:border-white/10 p-4 text-center ${className}`} id="adsense-active">
      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Iklan</div>
      {/* Real AdSense Ins tag placeholder */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={(import.meta as any).env?.VITE_ADSENSE_CLIENT || 'ca-pub-XXXXXXXXXXXXXXXX'}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
