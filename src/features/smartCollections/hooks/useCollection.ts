import { useState, useEffect, useCallback } from 'react';
import { SmartCollection, SmartCollectionAppItem } from '../types/smartCollections';
import { trackEvent } from '../../../services/analytics/analyticsService';

export function useCollection(collection: SmartCollection) {
  const [items, setItems] = useState<SmartCollectionAppItem[]>(collection.items);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    setItems(collection.items);
  }, [collection]);

  const recordImpression = useCallback(() => {
    trackEvent('collection_view', {
      source: 'smart_collection',
      surface: collection.placement,
      metadata: {
        collectionId: collection.id,
        collectionTitle: collection.title,
        collectionType: collection.type,
        itemCount: items.length
      }
    });
  }, [collection, items]);

  const recordItemClick = useCallback((item: SmartCollectionAppItem) => {
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
  }, [collection]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    items,
    isDismissed,
    recordImpression,
    recordItemClick,
    dismiss
  };
}
