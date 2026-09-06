import { AppData } from '../../types';

export type TrendingWindow = '24h' | '7d' | '30d';

export interface TrendingWeights {
  downloadsWeight: number; // default 0.35 (35%)
  viewsWeight: number; // default 0.20 (20%)
  searchInterestWeight: number; // default 0.15 (15%)
  growthRateWeight: number; // default 0.15 (15%)
  saveShareWeight: number; // default 0.10 (10%)
  freshnessWeight: number; // default 0.05 (5%)
}

export const DEFAULT_TRENDING_WEIGHTS: TrendingWeights = {
  downloadsWeight: 0.35,
  viewsWeight: 0.20,
  searchInterestWeight: 0.15,
  growthRateWeight: 0.15,
  saveShareWeight: 0.10,
  freshnessWeight: 0.05
};

export type RankMovement = 
  | { type: 'up'; value: number }
  | { type: 'down'; value: number }
  | { type: 'new' }
  | { type: 'same' };

export interface TrendingAppResult {
  app: AppData;
  score: number;
  rank: number;
  previousRank?: number;
  movement: RankMovement;
  movementLabel: string; // "↑ 12", "↓ 3", "NEW", "—"
  reasons: string[]; // Explainable reasons: why this app is trending
}

export interface NewAndRisingAppResult {
  app: AppData;
  score: number;
  rank: number;
  growthScore: number;
  newnessDays: number;
  reasons: string[];
}
