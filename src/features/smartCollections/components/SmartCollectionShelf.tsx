import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SmartCollection, SmartCollectionAppItem } from '../types/smartCollections';
import { SmartCollectionCard } from './SmartCollectionCard';

interface SmartCollectionShelfProps {
  id?: string;
  collection: SmartCollection;
  onSelectApp: (appIdOrSlug: string, item?: SmartCollectionAppItem) => void;
  onItemClick?: (item: SmartCollectionAppItem) => void;
}

export const SmartCollectionShelf: React.FC<SmartCollectionShelfProps> = ({
  id,
  collection,
  onSelectApp,
  onItemClick
}) => {
  const shelfId = id || `shelf-${collection.id}`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check overflow and scroll boundaries
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, collection.items]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleCardClick = (item: SmartCollectionAppItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    onSelectApp(item.slug || item.appId, item);
  };

  return (
    <div id={shelfId} className="relative group/shelf">
      {/* Left Navigation Arrow (Desktop Only) */}
      {canScrollLeft && (
        <button
          id={`${shelfId}-btn-left`}
          onClick={() => handleScroll('left')}
          aria-label="Gulir ke kiri"
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 shadow-md border border-gray-200/80 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {collection.items.map((item, idx) => (
          <div key={item.appId || idx} className="snap-start">
            <SmartCollectionCard
              id={`${shelfId}-item-${item.appId}`}
              item={item}
              onClick={handleCardClick}
              layout="shelf"
            />
          </div>
        ))}
      </div>

      {/* Right Navigation Arrow (Desktop Only) */}
      {canScrollRight && (
        <button
          id={`${shelfId}-btn-right`}
          onClick={() => handleScroll('right')}
          aria-label="Gulir ke kanan"
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 shadow-md border border-gray-200/80 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
