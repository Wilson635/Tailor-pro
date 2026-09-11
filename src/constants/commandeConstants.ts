// ==========================================
// CONSTANTES COMMANDES — TailorPro (Module 7)
// ==========================================

// ── Statuts (français + legacy anglais pour rétrocompat) ─────────────

export const STATUT_COMMANDE_LABELS: Record<string, string> = {
  // Français (Module 7)
  creee:          'Créée',
  en_attente:     'En attente',
  en_confection:  'En confection',
  essayage:       'Essayage',
  retouches:      'Retouches',
  terminee:       'Terminée',
  livree:         'Livrée',
  annulee:        'Annulée',
  // Legacy anglais (orders existants)
  pending:        'En attente',
  in_progress:    'En confection',
  completed:      'Terminée',
  delivered:      'Livrée',
  cancelled:      'Annulée',
};

export const STATUT_COMMANDE_COLORS: Record<string, string> = {
  creee:          '#6B7280',
  en_attente:     '#F59E0B',
  en_confection:  '#3B82F6',
  essayage:       '#8B5CF6',
  retouches:      '#F97316',
  terminee:       '#10B981',
  livree:         '#D4AF37',
  annulee:        '#EF4444',
  pending:        '#F59E0B',
  in_progress:    '#3B82F6',
  completed:      '#10B981',
  delivered:      '#D4AF37',
  cancelled:      '#EF4444',
};

export const STATUT_COMMANDE_ICONS: Record<string, string> = {
  creee:          'add-circle-outline',
  en_attente:     'time-outline',
  en_confection:  'cut-outline',
  essayage:       'body-outline',
  retouches:      'create-outline',
  terminee:       'checkmark-circle-outline',
  livree:         'gift-outline',
  annulee:        'close-circle-outline',
  pending:        'time-outline',
  in_progress:    'cut-outline',
  completed:      'checkmark-circle-outline',
  delivered:      'gift-outline',
  cancelled:      'close-circle-outline',
};

// ── Colonnes Kanban (les 7 étapes françaises + colonne annulées) ──────
export const KANBAN_COLUMNS: {
  key: string;
  label: string;
  matchKeys: string[];   // tous les statuts qui tombent dans cette colonne
}[] = [
  { key: 'en_attente',    label: 'En attente',    matchKeys: ['en_attente', 'pending', 'creee'] },
  { key: 'en_confection', label: 'En confection', matchKeys: ['en_confection', 'in_progress'] },
  { key: 'essayage',      label: 'Essayage',      matchKeys: ['essayage'] },
  { key: 'retouches',     label: 'Retouches',     matchKeys: ['retouches'] },
  { key: 'terminee',      label: 'Terminée',      matchKeys: ['terminee', 'completed'] },
  { key: 'livree',        label: 'Livrée',        matchKeys: ['livree', 'delivered'] },
  { key: 'annulee',       label: 'Annulée',       matchKeys: ['annulee', 'cancelled'] },
];

// ── Transitions valides ──────────────────────────────────────────────
// Clé = statut courant ; valeur = statuts atteignables
export const STATUT_TRANSITIONS: Record<string, string[]> = {
  creee:          ['en_attente'],
  en_attente:     ['en_confection', 'creee'],
  en_confection:  ['essayage', 'en_attente'],
  essayage:       ['retouches', 'terminee', 'en_confection'],
  retouches:      ['essayage', 'terminee'],
  terminee:       ['livree', 'retouches'],
  livree:         [],
  annulee:        [],
  // Legacy → on propose les équivalents français
  pending:        ['in_progress', 'en_confection'],
  in_progress:    ['completed', 'essayage'],
  completed:      ['delivered', 'livree'],
  delivered:      [],
  cancelled:      [],
};

export const CANCELLED_ORDER_STATUSES = ['cancelled', 'annulee'] as const;

export const isCancelledOrder = (status?: string | null) =>
  !!status && (CANCELLED_ORDER_STATUSES as readonly string[]).includes(status);

/** Statuts "livraison terminale" qui déclenchent l'alerte solde restant */
export const STATUTS_LIVRAISON = new Set(['livree', 'delivered']);

/** Helper — retourne la colonne Kanban pour un statut donné */
export const getKanbanColumn = (statut: string): string => {
  const col = KANBAN_COLUMNS.find(c => c.matchKeys.includes(statut));
  return col?.key ?? 'en_attente';
};
