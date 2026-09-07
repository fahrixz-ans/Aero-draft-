import React from 'react';
import { ExternalLink, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { EventBannerItem } from '../types';

interface EventBannerProps {
  banner?: EventBannerItem;
  onActionClick?: (url: string) => void;
  className?: string;
}

const DEFAULT_BANNER: EventBannerItem = {
  id: 'wa-channel-aero',
  title: 'WhatsApp Channel Aero',
  description: 'Dapatkan informasi pembaruan APK resmi, versi terbaru, dan pengumuman katalog langsung di WhatsApp.',
  buttonText: 'GABUNG CHANNEL',
  destinationUrl: 'https://whatsapp.com/channel/0029Vb715e4L7UVaXoI3aK3k',
  tag: 'RESMI',
  isActive: true,
  createdAt: '2026-09-06'
};

export default function EventBanner({
  banner = DEFAULT_BANNER,
  onActionClick,
  className = ''
}: EventBannerProps) {
  if (!banner || !banner.isActive) return null;

  const handleClick = () => {
    if (onActionClick) {
      onActionClick(banner.destinationUrl);
    } else {
      window.open(banner.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 ${className}`} id="aero-event-banner">
      <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-[#111724] dark:to-blue-950/20 p-4 sm:p-4.5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {banner.title}
                </span>
                {banner.tag && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-black tracking-wider uppercase">
                    {banner.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                {banner.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleClick}
            className="self-stretch sm:self-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap"
            id="event-banner-action-btn"
          >
            <span>{banner.buttonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
