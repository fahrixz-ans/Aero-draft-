import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import { SubscriptionPlan, UserRole } from '../types';

interface AdBannerProps {
  subscriptionPlan?: SubscriptionPlan;
  userRole?: UserRole;
  slot?: 'top-banner' | 'feed-inline' | 'sidebar' | 'detail-bottom';
  className?: string;
  onUpgradeClick?: () => void;
}

export default function AdBanner({
  subscriptionPlan = 'free',
  userRole = 'user',
  slot = 'feed-inline',
  className = '',
  onUpgradeClick
}: AdBannerProps) {
  // Never show ads to Premium users, Developers with Premium, or Admins/Owners
  if (subscriptionPlan === 'premium' || userRole === 'admin' || userRole === 'owner') {
    return null;
  }

  return (
    <div className={`w-full my-4 ${className}`} id={`ad-slot-${slot}`}>
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.02] p-4 text-center transition-colors">
        {/* Mandatory Ad Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 bg-slate-200/60 dark:bg-white/5 px-2 py-0.5 rounded">
            IKLAN / ADVERTISEMENT
          </span>
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hilangkan Iklan dengan Premium</span>
            </button>
          )}
        </div>

        {/* Clean Ad Content */}
        <div className="py-2.5 px-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
          <div className="text-left space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Mendukung Ekosistem Aero Catalog
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Iklan ini membantu server Aero menyediakan unduhan APK cepat dan terverifikasi secara gratis.
            </p>
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-amber-500 hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              Langganan Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
