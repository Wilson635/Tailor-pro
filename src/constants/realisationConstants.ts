// ==========================================
// CONSTANTES RÉALISATIONS — TailorPro (Module 5)
// ==========================================

import type { StatutRealisation } from '../types';

// ── Statuts ──────────────────────────────────────────────────────────
export const STATUT_REALISATION_LIST: StatutRealisation[] = [
  'en_cours', 'essayage', 'corrections', 'terminee', 'livree',
];

export const STATUT_REALISATION_LABELS: Record<StatutRealisation, string> = {
  en_cours:    'En cours',
  essayage:    'Essayage',
  corrections: 'Corrections',
  terminee:    'Terminée',
  livree:      'Livrée',
};

export const STATUT_REALISATION_ICONS: Record<StatutRealisation, string> = {
  en_cours:    'construct-outline',
  essayage:    'body-outline',
  corrections: 'cut-outline',
  terminee:    'checkmark-circle-outline',
  livree:      'gift-outline',
};

export const STATUT_REALISATION_COLORS: Record<StatutRealisation, string> = {
  en_cours:    '#3B82F6', // bleu
  essayage:    '#8B5CF6', // violet
  corrections: '#F59E0B', // ambre
  terminee:    '#10B981', // vert
  livree:      '#D4AF37', // or
};

// Couleurs rapides proposées dans le formulaire
export const COULEURS_RAPIDES: { label: string; hex: string }[] = [
  { label: 'Blanc',     hex: '#FFFFFF' },
  { label: 'Noir',      hex: '#111111' },
  { label: 'Bleu ciel', hex: '#87CEEB' },
  { label: 'Marine',    hex: '#1B2A6B' },
  { label: 'Rouge',     hex: '#DC2626' },
  { label: 'Bordeaux',  hex: '#7F1D1D' },
  { label: 'Vert',      hex: '#16A34A' },
  { label: 'Jaune or',  hex: '#D4AF37' },
  { label: 'Rose',      hex: '#EC4899' },
  { label: 'Gris',      hex: '#6B7280' },
  { label: 'Beige',     hex: '#E5C9A0' },
  { label: 'Orange',    hex: '#EA580C' },
];

// Progression linéaire (numéro d'étape)
export const STATUT_STEP: Record<StatutRealisation, number> = {
  en_cours:    0,
  essayage:    1,
  corrections: 2,
  terminee:    3,
  livree:      4,
};

// Transitions valides (statut actuel → statuts cibles autorisés)
export const STATUT_TRANSITIONS: Record<StatutRealisation, StatutRealisation[]> = {
  en_cours:    ['essayage', 'terminee'],
  essayage:    ['corrections', 'terminee'],
  corrections: ['en_cours', 'essayage', 'terminee'],
  terminee:    ['livree'],
  livree:      [],
};
