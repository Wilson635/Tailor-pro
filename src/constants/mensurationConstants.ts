// ==========================================
// CONSTANTES MENSURATIONS — TailorPro
// ==========================================

import type { TypeVetement } from '../types';

// ── Labels types de vêtement ────────────────────────────────────
export const TYPE_VETEMENT_LABELS: Record<TypeVetement, string> = {
  robe:     'Robe',
  costume:  'Costume',
  chemise:  'Chemise',
  pantalon: 'Pantalon',
  boubou:   'Boubou',
  autre:    'Autre',
};

export const TYPE_VETEMENT_ICONS: Record<TypeVetement, string> = {
  robe:     '👗',
  costume:  '🤵',
  chemise:  '👔',
  pantalon: '👖',
  boubou:   '🧥',
  autre:    '✂️',
};

export const TYPE_VETEMENT_LIST: TypeVetement[] = [
  'robe', 'costume', 'chemise', 'pantalon', 'boubou', 'autre',
];

// ── Champs de mesure par catégorie ──────────────────────────────

export interface MesureField {
  key: string;
  label: string;
  icon?: string;
  required?: boolean;
}

export const MESURES_TEMPLATES: Record<TypeVetement, MesureField[]> = {
  robe: [
    { key: 'tour_poitrine',  label: 'Tour de poitrine',  required: true },
    { key: 'tour_taille',    label: 'Tour de taille',    required: true },
    { key: 'tour_hanches',   label: 'Tour de hanches',   required: true },
    { key: 'longueur_robe',  label: 'Longueur robe',     required: true },
    { key: 'longueur_manche',label: 'Longueur manche' },
    { key: 'tour_bras',      label: 'Tour de bras' },
    { key: 'hauteur_buste',  label: 'Hauteur buste' },
    { key: 'largeur_epaule', label: 'Largeur épaule' },
    { key: 'tour_cou',       label: 'Tour de cou' },
  ],
  costume: [
    { key: 'tour_poitrine',     label: 'Tour de poitrine',     required: true },
    { key: 'tour_taille',       label: 'Tour de taille',       required: true },
    { key: 'longueur_veste',    label: 'Longueur veste',       required: true },
    { key: 'longueur_manche',   label: 'Longueur manche',      required: true },
    { key: 'tour_bras',         label: 'Tour de bras' },
    { key: 'largeur_epaule',    label: 'Largeur épaule' },
    { key: 'longueur_pantalon', label: 'Longueur pantalon' },
    { key: 'tour_cuisse',       label: 'Tour de cuisse' },
    { key: 'entrejambe',        label: 'Entrejambe' },
    { key: 'tour_cou',          label: 'Tour de cou' },
  ],
  chemise: [
    { key: 'tour_poitrine',  label: 'Tour de poitrine',  required: true },
    { key: 'tour_cou',       label: 'Tour de cou',       required: true },
    { key: 'longueur_manche',label: 'Longueur manche',   required: true },
    { key: 'longueur_dos',   label: 'Longueur dos',      required: true },
    { key: 'tour_bras',      label: 'Tour de bras' },
    { key: 'largeur_epaule', label: 'Largeur épaule' },
    { key: 'tour_taille',    label: 'Tour de taille' },
  ],
  pantalon: [
    { key: 'tour_taille',    label: 'Tour de taille',    required: true },
    { key: 'tour_hanches',   label: 'Tour de hanches',   required: true },
    { key: 'longueur_pantalon', label: 'Longueur pantalon', required: true },
    { key: 'entrejambe',     label: 'Entrejambe',        required: true },
    { key: 'tour_cuisse',    label: 'Tour de cuisse' },
    { key: 'tour_genou',     label: 'Tour de genou' },
    { key: 'tour_cheville',  label: 'Tour de cheville' },
  ],
  boubou: [
    { key: 'tour_poitrine',  label: 'Tour de poitrine',  required: true },
    { key: 'tour_taille',    label: 'Tour de taille',    required: true },
    { key: 'tour_hanches',   label: 'Tour de hanches',   required: true },
    { key: 'longueur_boubou',label: 'Longueur boubou',   required: true },
    { key: 'largeur_epaule', label: 'Largeur épaule' },
    { key: 'longueur_manche',label: 'Longueur manche' },
    { key: 'tour_cou',       label: 'Tour de cou' },
  ],
  autre: [
    { key: 'tour_poitrine',  label: 'Tour de poitrine' },
    { key: 'tour_taille',    label: 'Tour de taille' },
    { key: 'tour_hanches',   label: 'Tour de hanches' },
    { key: 'longueur',       label: 'Longueur' },
    { key: 'largeur_epaule', label: 'Largeur épaule' },
  ],
};

// ── Couleurs par type de vêtement ───────────────────────────────
export const TYPE_VETEMENT_COLORS: Record<TypeVetement, { bg: string; text: string; border: string }> = {
  robe:     { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8' },
  costume:  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  chemise:  { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  pantalon: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  boubou:   { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  autre:    { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
};

// ── Unités de mesure ────────────────────────────────────────────
export const UNITE_LABELS: Record<'cm' | 'pouces', string> = {
  cm:     'Centimètres (cm)',
  pouces: 'Pouces (in)',
};

// ── Taux de conversion ──────────────────────────────────────────
export const CM_TO_INCH = 0.393701;
export const INCH_TO_CM = 2.54;
