import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Award, 
  Clock, 
  Compass, 
  ChevronRight, 
  RotateCw,
  Flame,
  Star
} from 'lucide-react';
import { CollectionType } from '../types/smartCollections';
import { AppBadge } from '../../../components/common/AppBadge';

interface SmartCollectionHeaderProps {
  id?: string;
  title: string;
  description?: string;
  type: CollectionType;
  badgeLabel?: string;
  totalItems?: number;
  onViewAll?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SmartCollectionHeader: React.FC<SmartCollectionHeaderProps> = ({
  id = 'smart-collection-header',
  title,
  description,
  type,
  badgeLabel,
  totalItems,
  onViewAll,
  onRefresh,
  isRefreshing = false
}) => {
  const renderIcon = () => {
    switch (type) {
      case 'PERSONALIZED':
        return <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'TRENDING':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'POPULAR':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'EDITORIAL':
        return <Award className="w-5 h-5 text-sky-500" />;
      case 'FRESH':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'CONTEXTUAL':
      default:
        return <Compass className="w-5 h-5 text-purple-500" />;
    }
  };

  const defaultBadgeText = () => {
    if (badgeLabel) return badgeLabel;
    switch (type) {
      case 'PERSONALIZED':
        return 'Personalisasi';
      case 'TRENDING':
        return 'Tren 7 Hari';
      case 'POPULAR':
        return 'Paling Banyak Diunduh';
      case 'EDITORIAL':
        return 'Pilihan Editor';
      case 'FRESH':
        return 'Rilis Baru';
      case 'CONTEXTUAL':
      default:
        return 'Rekomendasi';
    }
  };

  return (
    <div id={id} className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AppBadge
            type="custom"
            label={defaultBadgeText()}
            icon={renderIcon()}
            size="sm"
          />
          {typeof totalItems === 'number' && totalItems > 0 && (
            <span className="text-xs text-gray-400 font-medium">
              {totalItems} Aplikasi
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        {onRefresh && (
          <button
            id={`${id}-btn-refresh`}
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Muat ulang rekomendasi"
            aria-label="Muat ulang rekomendasi"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {onViewAll && (
          <button
            id={`${id}-btn-view-all`}
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 group py-1 px-2 -mr-2 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
          >
            <span>Lihat semua</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};
