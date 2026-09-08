import { getAiFeatureFlags } from './config';

const SYNONYM_MAP: Record<string, string[]> = {
  'video editor': ['video editing', 'pembuat video', 'pangkas video', 'vlog editor'],
  'foto': ['photo', 'fotografi', 'kamera', 'camera', 'filter foto'],
  'pesan': ['chat', 'messaging', 'perpesanan', 'messenger'],
  'game': ['permainan', 'games', 'gaming'],
  'pembayaran': ['finance', 'keuangan', 'e-wallet', 'dompet digital']
};

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

export function expandQueryTerms(query: string): string[] {
  const flags = getAiFeatureFlags();
  if (!flags.AI_DISCOVERY_ENABLED || !flags.AI_QUERY_EXPANSION_ENABLED) {
    return [normalizeQuery(query)];
  }

  const normalized = normalizeQuery(query);
  const expansions: Set<string> = new Set([normalized]);

  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (normalized.includes(key)) {
      synonyms.forEach(syn => expansions.add(syn));
    }
  }

  return Array.from(expansions);
}
