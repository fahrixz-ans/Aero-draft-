import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppData } from '../../../types';
import {
  SmartCollection,
  CollectionPlacement
} from '../types/smartCollections';
import {
  generateAllHomeCollections,
  generateSearchContextualCollections,
  generateAppDetailCollections,
  fetchFirestoreSmartCollections,
  GenerateCollectionOptions
} from '../services/smartCollectionsService';

export interface UseSmartCollectionsOptions {
  placement: CollectionPlacement;
  allApps: AppData[];
  user?: any;
  userId?: string | null;
  userInteractions?: {
    downloadedAppIds?: string[];
    viewedAppIds?: string[];
    searchedQueries?: string[];
  };
  searchQuery?: string;
  contextApp?: AppData | null;
  autoRefreshIntervalMs?: number;
}

export function useSmartCollections({
  placement,
  allApps,
  user,
  searchQuery,
  contextApp,
  autoRefreshIntervalMs
}: UseSmartCollectionsOptions) {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customConfigs, setCustomConfigs] = useState<SmartCollection[]>([]);

  // Load custom configurations from Firestore if available
  useEffect(() => {
    let isMounted = true;
    fetchFirestoreSmartCollections().then(data => {
      if (isMounted && data.length > 0) {
        setCustomConfigs(data);
      }
    }).catch(err => {
      console.warn('Could not fetch remote collection configs:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCollections = useCallback(() => {
    if (!allApps || allApps.length === 0) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const options: GenerateCollectionOptions = {
        user,
        searchQuery,
        contextApp
      };

      let result: SmartCollection[] = [];

      if (placement === 'HOME') {
        result = generateAllHomeCollections(allApps, options, customConfigs);
      } else if (placement === 'SEARCH' && searchQuery) {
        result = generateSearchContextualCollections(searchQuery, allApps, options);
      } else if (placement === 'APP_DETAIL' && contextApp) {
        result = generateAppDetailCollections(contextApp, allApps, options);
      }

      setCollections(result);
    } catch (err: any) {
      console.error('Failed to generate smart collections:', err);
      setError(err?.message || 'Gagal memuat kumpulan aplikasi.');
    } finally {
      setIsLoading(false);
    }
  }, [placement, allApps, user, searchQuery, contextApp, customConfigs]);

  // Initial load and dependency triggers
  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  // Optional periodic auto-refresh for freshness
  useEffect(() => {
    if (!autoRefreshIntervalMs || autoRefreshIntervalMs <= 0) return;

    const interval = setInterval(() => {
      refreshCollections();
    }, autoRefreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefreshIntervalMs, refreshCollections]);

  return {
    collections,
    isLoading,
    loading: isLoading,
    error,
    refresh: refreshCollections
  };
}
