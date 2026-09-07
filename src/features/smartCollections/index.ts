// Barrel export for Smart Collections feature (Stage 9.9)

export type {
  SmartCollection,
  SmartCollectionAppItem,
  CollectionType,
  CollectionPlacement,
  CollectionSource,
  CollectionState,
  SmartCollectionType,
  SmartCollectionState,
  SmartCollectionDiversityRules,
  CollectionGenerationResult
} from './types/smartCollections';

export {
  ALLOWED_COLLECTION_TRANSITIONS,
  canTransitionCollectionState
} from './types/smartCollections';

export * from './utils/collectionEligibility';
export * from './utils/collectionDeduplication';
export * from './utils/collectionDiversity';
export * from './utils/collectionFallback';
export * from './services/smartCollectionsService';
export * from './hooks/useSmartCollections';
export * from './hooks/useCollection';
export { SmartCollectionComponent } from './components/SmartCollection';
export * from './components/SmartCollectionHeader';
export * from './components/SmartCollectionShelf';
export * from './components/SmartCollectionCard';
export * from './components/CollectionViewAll';
