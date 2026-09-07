import React, { useState } from 'react';
import { Star, ShieldCheck, Download } from 'lucide-react';
import { SmartCollectionAppItem } from '../types/smartCollections';

interface SmartCollectionCardProps {
  id?: string;
  item: SmartCollectionAppItem;
  onClick: (item: SmartCollectionAppItem) => void;
  layout?: 'shelf' | 'grid';
}

export const SmartCollectionCard: React.FC<SmartCollectionCardProps> = ({
  id,
  item,
  onClick,
  layout = 'shelf'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardId = id || `smart-col-card-${item.appId}`;

  return (
    <div
      id={cardId}
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
      className={`group relative flex flex-col justify-between p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[44px] ${
        layout === 'shelf'
          ? 'w-[160px] sm:w-[176px] flex-shrink-0'
          : 'w-full'
      }`}
    >
      <div>
        {/* Top: Icon + Badge */}
        <div className="relative mb-2.5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm border border-black/5 dark:border-white/5 relative">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
            <img
              src={imageError ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop&q=80' : item.iconUrl}
              alt={item.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Verified Check Badge */}
          <div 
            className="absolute bottom-0 right-1/2 translate-x-7 translate-y-1 bg-white dark:bg-gray-900 p-0.5 rounded-full shadow"
            title="Terverifikasi Aman oleh Aero Trust Engine"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {item.name}
        </h3>

        {/* Developer */}
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-2">
          {item.developerName}
        </p>
      </div>

      {/* Meta bottom */}
      <div className="pt-2 border-t border-gray-50 dark:border-gray-800/80 flex flex-col gap-1">
        {/* Rating & Downloads */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {(item.rating || 4.5).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 text-[11px] text-gray-400">
            <Download className="w-3 h-3" />
            <span>{item.downloadLabel?.replace(' Unduhan', '') || '10Rb+'}</span>
          </div>
        </div>

        {/* Contextual Reason / Badge */}
        {item.reason && (
          <div className="mt-1">
            <span className="inline-block text-[10px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded truncate max-w-full">
              {item.reason.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
