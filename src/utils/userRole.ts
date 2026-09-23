export type AppRole = 'tailor' | 'client';

export function normalizeAppRole(raw?: string | null): AppRole | null {
  const r = String(raw ?? '').toLowerCase().trim();
  if (r === 'client') return 'client';
  if (r === 'tailor' || r === 'couturier' || r === 'tailleur') return 'tailor';
  return null;
}

/** Métadonnées d’inscription > ligne DB ambiguë. Un compte créé « client » ne doit jamais tomber en atelier vide. */
export function resolveAppRole(dbRole?: string | null, metaRole?: string | null): AppRole {
  const fromMeta = normalizeAppRole(metaRole);
  const fromDb = normalizeAppRole(dbRole);
  if (fromMeta === 'client') return 'client';
  if (fromDb) return fromDb;
  if (fromMeta) return fromMeta;
  return 'tailor';
}
