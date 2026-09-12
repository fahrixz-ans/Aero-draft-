import React from 'react';
import { Star, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { AppItem, mapAppToAppItem } from '../../types/intelligence';
import { AppData } from '../../types';

interface AppRecommendationCardProps {
  id?: string;
  app: AppItem | AppData;
  onSelectApp: (slug: string) => void;
  reason?: string;
  confidenceScore?: number;
}

export const AppRecommendationCard: React.FC<AppRecommendationCardProps> = ({
  id,
  app,
  onSelectApp,
  reason,
  confidenceScore
}) => {
  const item: AppItem = 'primaryCategory' in app ? (app as AppItem) : mapAppToAppItem(app as AppData);
  const elementId = id || `app-recommendation-${item.id}`;

  const formatDownloads = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} jt+`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)} rb+`;
    return `${num}`;
  };

  return (
    <div
      id={elementId}
      onClick={() => onSelectApp(item.slug)}
      className="group flex flex-col p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-sm transition-all cursor-pointer w-40 sm:w-44 shrink-0"
    >
      {/* App Icon */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 p-0.5 mb-2.5">
        <img
          src={item.iconUrl || '/favicon.svg'}
          alt={item.name}
          className="w-full h-full object-cover rounded-[10px]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/favicon.svg';
          }}
        />
        {item.securityStatus === 'VERIFIED' && (
          <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
            <ShieldCheck className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Meta */}
      <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {item.name}
      </h4>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
        {item.developerName}
      </p>

      {/* Rating & Downloads */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
        <span className="flex items-center gap-0.5 font-medium text-gray-700 dark:text-gray-300">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          {item.rating?.toFixed(1) || '4.5'}
        </span>
        <span>•</span>
        <span>{formatDownloads(item.totalDownloads)}</span>
      </div>

      {/* Reason / Confidence Badge */}
      {reason && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0b0f19] border border-slate-900/80 dark:border-white/80 px-2 py-0.5 rounded-lg shadow-xs truncate max-w-full">
            <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-500 fill-amber-500/20" />
            <span className="truncate">{reason}</span>
          </span>
        </div>
      )}
    </div>
  );
};
