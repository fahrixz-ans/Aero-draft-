import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ArrowUpDown, 
  Sparkles, 
  ShieldCheck, 
  Download,
  Star,
  Layers
} from 'lucide-react';
import BackButton from '../../../components/navigation/BackButton';
import { SmartCollection, SmartCollectionAppItem } from '../types/smartCollections';
import { SmartCollectionCard } from './SmartCollectionCard';

interface CollectionViewAllProps {
  id?: string;
  collection: SmartCollection;
  onClose: () => void;
  onSelectApp: (appIdOrSlug: string, item?: SmartCollectionAppItem) => void;
}

type SortOption = 'relevance' | 'rating' | 'downloads' | 'name';

export const CollectionViewAll: React.FC<CollectionViewAllProps> = ({
  id = 'collection-view-all-modal',
  collection,
  onClose,
  onSelectApp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  const filteredAndSortedItems = useMemo(() => {
    let list = [...collection.items];

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.developerName.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'downloads') {
      list.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Relevance / default position
      list.sort((a, b) => a.position - b.position);
    }

    return list;
  }, [collection.items, searchQuery, sortBy]);

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-all-title"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <BackButton onBack={onClose} className="-ml-2" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {collection.type}
                </span>
                <span className="text-xs text-gray-400">
                  {collection.items.length} Aplikasi Terverifikasi
                </span>
              </div>
              <h2 id="view-all-title" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {collection.title}
              </h2>
              {collection.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {collection.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari dalam koleksi ini..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="relevance">Relevansi Algoritmik</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="downloads">Total Unduhan</option>
              <option value="name">Nama (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredAndSortedItems.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-60" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Tidak ada aplikasi yang cocok dengan pencarian.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Coba ubah kata kunci atau hapus filter pencarian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredAndSortedItems.map((item) => (
                <SmartCollectionCard
                  key={item.appId}
                  item={item}
                  onClick={() => {
                    onClose();
                    onSelectApp(item.slug || item.appId, item);
                  }}
                  layout="grid"
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Menampilkan {filteredAndSortedItems.length} dari {collection.items.length} aplikasi</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Bebas Malware & Quarantined
          </span>
        </div>
      </div>
    </div>
  );
};
