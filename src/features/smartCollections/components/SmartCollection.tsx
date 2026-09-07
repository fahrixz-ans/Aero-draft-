import React, { useState, useEffect, useRef } from 'react';
import { SmartCollection as SmartCollectionModel, SmartCollectionAppItem } from '../types/smartCollections';
import { SmartCollectionHeader } from './SmartCollectionHeader';
import { SmartCollectionShelf } from './SmartCollectionShelf';
import { CollectionViewAll } from './CollectionViewAll';
import { trackEvent } from '../../../services/analytics/analyticsService';

interface SmartCollectionProps {
  id?: string;
  collection: SmartCollectionModel;
  onSelectApp: (appIdOrSlug: string, item?: SmartCollectionAppItem) => void;
  onViewAll?: (collection: SmartCollectionModel) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SmartCollection: React.FC<SmartCollectionProps> = ({
  id,
  collection,
  onSelectApp,
  onViewAll,
  onRefresh,
  isRefreshing
}) => {
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRecordedImpression = useRef(false);

  const compId = id || `smart-collection-${collection.id}`;

  // Viewport impression observer for analytics (Section 15)
  useEffect(() => {
    if (hasRecordedImpression.current || !collection.items || collection.items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasRecordedImpression.current) {
          hasRecordedImpression.current = true;
          trackEvent('collection_view', {
            source: 'smart_collection',
            surface: collection.placement,
            metadata: {
              collectionId: collection.id,
              collectionType: collection.type,
              placement: collection.placement,
              itemsCount: collection.items.length
            }
          });
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [collection]);

  const handleItemClick = (item: SmartCollectionAppItem) => {
    trackEvent('recommendation_click', {
      appId: item.appId,
      source: 'smart_collection',
      surface: collection.placement,
      position: item.position,
      metadata: {
        collectionId: collection.id,
        collectionType: collection.type,
        position: item.position
      }
    });
  };

  // If no items, do not render an empty broken box
  if (!collection.items || collection.items.length === 0) {
    return null;
  }

  return (
    <section
      id={compId}
      ref={containerRef}
      className="my-6 sm:my-8"
      aria-labelledby={`${compId}-title`}
    >
      <SmartCollectionHeader
        id={`${compId}-header`}
        title={collection.title}
        description={collection.description}
        type={collection.type}
        totalItems={collection.items.length}
        onViewAll={() => {
          trackEvent('recommendation_click', {
            appId: collection.id,
            source: 'smart_collection',
            surface: collection.placement,
            metadata: { action: 'view_all', collectionType: collection.type }
          });
          if (onViewAll) {
            onViewAll(collection);
          } else {
            setIsViewAllOpen(true);
          }
        }}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      <SmartCollectionShelf
        id={`${compId}-shelf`}
        collection={collection}
        onSelectApp={(appIdOrSlug, item) => onSelectApp(appIdOrSlug, item)}
        onItemClick={handleItemClick}
      />

      {isViewAllOpen && (
        <CollectionViewAll
          id={`${compId}-view-all`}
          collection={collection}
          onClose={() => setIsViewAllOpen(false)}
          onSelectApp={(appIdOrSlug, item) => onSelectApp(appIdOrSlug, item)}
        />
      )}
    </section>
  );
};

export const SmartCollectionComponent = SmartCollection;
