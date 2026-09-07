import { AppEntity } from '../../repositories';

export interface ScoredCandidate {
  app: AppEntity;
  score: number;
  badge?: string;
  reason?: string;
}

export class ServerCollectionRanking {
  static rankByPopularity(apps: AppEntity[]): ScoredCandidate[] {
    return apps
      .map(app => {
        const d = app.downloads || 0;
        const r = app.rating || 4.5;
        const score = (d * 0.6) + (r * 10000);
        return {
          app,
          score,
          badge: 'Populer',
          reason: `${d >= 1000000 ? `${(d/1000000).toFixed(1)}Jt+` : `${(d/1000).toFixed(0)}Rb+`} Unduhan`
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  static rankByTrending(apps: AppEntity[]): ScoredCandidate[] {
    return apps
      .map((app, idx) => {
        const baseScore = ((app.downloads || 1000) * 0.4) + ((app.rating || 4.5) * 5000);
        const momentumFactor = 1 + (1 / (idx + 1));
        const score = baseScore * momentumFactor;
        return {
          app,
          score,
          badge: 'Tren Minggu Ini',
          reason: `Momentum tren #${idx + 1}`
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  static rankByFreshness(apps: AppEntity[], isNewReleases: boolean): ScoredCandidate[] {
    return apps
      .map(app => {
        const time = new Date(isNewReleases ? (app.publishedAt || app.createdAt) : app.updatedAt).getTime();
        return {
          app,
          score: isNaN(time) ? 0 : time,
          badge: isNewReleases ? 'Baru Ditambahkan' : 'Baru Diperbarui',
          reason: isNewReleases ? 'Baru rilis di katalog' : `Pembaruan v${app.versionName || '1.0'}`
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
