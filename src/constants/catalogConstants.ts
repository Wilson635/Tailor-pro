// ==========================================
// CONSTANTES CATALOGUE - TailorPro
// ==========================================

import type { CatalogCategory } from '../types';
import type { Ionicons } from '@expo/vector-icons';

// ──────────────────────────────────────────
// CATÉGORIES
// ──────────────────────────────────────────

/** Toutes les catégories incluant "all" (filtres de la liste) */
export const CATALOG_FILTER_CATEGORIES: CatalogCategory[] = [
    'all',
    'homme',
    'femme',
    'enfant',
    'robe',
    'costume',
    'chemise',
    'mariage',
    'traditionnel',
    'casual',
    'luxe',
];

/** Catégories disponibles lors de la création d'un modèle (sans "all") */
export const CATALOG_MODEL_CATEGORIES: Exclude<CatalogCategory, 'all'>[] = [
    'homme',
    'femme',
    'enfant',
    'robe',
    'costume',
    'chemise',
    'mariage',
    'traditionnel',
    'casual',
    'luxe',
];

// ──────────────────────────────────────────
// LABELS (affichage lisible)
// ──────────────────────────────────────────

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
    all:          'Tous',
    homme:        'Homme',
    femme:        'Femme',
    enfant:       'Enfant',
    robe:         'Robes',
    costume:      'Costumes',
    chemise:      'Chemises',
    mariage:      'Mariage',
    traditionnel: 'Traditionnel',
    casual:       'Casual',
    luxe:         'Luxe',
};

// ──────────────────────────────────────────
// ICÔNES IONICONS PAR CATÉGORIE
// ──────────────────────────────────────────

export const CATALOG_CATEGORY_ICONS: Record<CatalogCategory, keyof typeof Ionicons.glyphMap> = {
    all:          'grid-outline',
    homme:        'man-outline',
    femme:        'woman-outline',
    enfant:       'happy-outline',
    robe:         'woman-outline',
    costume:      'shirt-outline',
    chemise:      'shirt-outline',
    mariage:      'heart-outline',
    traditionnel: 'earth-outline',
    casual:       'sunny-outline',
    luxe:         'diamond-outline',
};

// ──────────────────────────────────────────
// DIFFICULTÉ
// ──────────────────────────────────────────

export type Difficulte = 'facile' | 'moyen' | 'difficile';

export const DIFFICULTE_LABELS: Record<Difficulte, string> = {
    facile:    'Facile',
    moyen:     'Moyen',
    difficile: 'Difficile',
};

export const DIFFICULTE_COLORS: Record<Difficulte, { bg: string; text: string }> = {
    facile:    { bg: '#D1FAE5', text: '#065F46' },
    moyen:     { bg: '#FEF3C7', text: '#92400E' },
    difficile: { bg: '#FEE2E2', text: '#991B1B' },
};

// ──────────────────────────────────────────
// TISSUS COURANTS (suggestions)
// ──────────────────────────────────────────

export const TISSUS_COMMUNS: string[] = [
    'Wax', 'Bazin', 'Bogolan', 'Kente', 'Pagne',
    'Soie', 'Coton', 'Lin', 'Satin', 'Velours',
    'Dentelle', 'Mousseline', 'Jersey', 'Jacquard',
];

// ──────────────────────────────────────────
// ACCESSOIRES COURANTS (suggestions)
// ──────────────────────────────────────────

export const ACCESSOIRES_COMMUNS: string[] = [
    'Boutons', 'Fermeture éclair', 'Broderie', 'Galon',
    'Doublure', 'Élastique', 'Biais', 'Ceinture',
    'Bretelles', 'Épaulettes', 'Dentelle', 'Fronces',
];
