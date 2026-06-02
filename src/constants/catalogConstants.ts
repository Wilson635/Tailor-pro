// ==========================================
// CONSTANTES CATALOGUE - TailorPro
// À placer dans : src/constants/catalogConstants.ts
// ==========================================

import type { CatalogCategory } from '../types';

// ──────────────────────────────────────────
// LISTE DES CATÉGORIES (filtre + formulaire)
// TypeScript vérifie que chaque entrée est
// bien un CatalogCategory valide.
// ──────────────────────────────────────────

/** Toutes les catégories incluant "all" (pour les filtres) */
export const CATALOG_FILTER_CATEGORIES: CatalogCategory[] = [
    'all',
    'robes',
    'costumes',
    'chemises',
    'traditionnel',
    'mariage',
    'enfants',
    'casual',
    'luxe',
];

/** Catégories pour un modèle (sans "all") */
export const CATALOG_MODEL_CATEGORIES: Exclude<CatalogCategory, 'all'>[] = [
    'robes',
    'costumes',
    'chemises',
    'traditionnel',
    'mariage',
    'enfants',
    'casual',
    'luxe',
];

// ──────────────────────────────────────────
// LABELS (affichage lisible)
// ──────────────────────────────────────────

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
    all:          'Tous',
    robes:        'Robes',
    costumes:     'Costumes',
    chemises:     'Chemises',
    traditionnel: 'Traditionnel',
    mariage:      'Mariage',
    enfants:      'Enfants',
    casual:       'Casual',
    luxe:         'Luxe',
};

// ──────────────────────────────────────────
// ICÔNES IONICONS PAR CATÉGORIE
// ──────────────────────────────────────────

import type { Ionicons } from '@expo/vector-icons';

export const CATALOG_CATEGORY_ICONS: Record<CatalogCategory, keyof typeof Ionicons.glyphMap> = {
    all:          'grid-outline',
    robes:        'woman-outline',
    costumes:     'shirt-outline',
    chemises:     'shirt-outline',
    traditionnel: 'earth-outline',
    mariage:      'heart-outline',
    enfants:      'happy-outline',
    casual:       'sunny-outline',
    luxe:         'diamond-outline',
};
