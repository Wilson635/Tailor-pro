// ==========================================
// CONSTANTES TISSUS — TailorPro (Module 6)
// ==========================================

export const TYPE_TISSU_LIST = [
  'wax', 'bazin', 'soie', 'coton', 'lin',
  'satin', 'velours', 'dentelle', 'polyester', 'broderie', 'autre',
] as const;

export type TypeTissu = typeof TYPE_TISSU_LIST[number];

export const TYPE_TISSU_LABELS: Record<string, string> = {
  wax:        'Wax',
  bazin:      'Bazin',
  soie:       'Soie',
  coton:      'Coton',
  lin:        'Lin',
  satin:      'Satin',
  velours:    'Velours',
  dentelle:   'Dentelle',
  polyester:  'Polyester',
  broderie:   'Broderie',
  autre:      'Autre',
};

export const TYPE_TISSU_ICONS: Record<string, string> = {
  wax:        'color-palette-outline',
  bazin:      'diamond-outline',
  soie:       'sparkles-outline',
  coton:      'leaf-outline',
  lin:        'flower-outline',
  satin:      'star-outline',
  velours:    'layers-outline',
  dentelle:   'grid-outline',
  polyester:  'cube-outline',
  broderie:   'cut-outline',
  autre:      'ellipsis-horizontal-outline',
};

export const TYPE_TISSU_COLORS: Record<string, string> = {
  wax:        '#F59E0B',
  bazin:      '#D4AF37',
  soie:       '#EC4899',
  coton:      '#10B981',
  lin:        '#84CC16',
  satin:      '#8B5CF6',
  velours:    '#DC2626',
  dentelle:   '#F9A8D4',
  polyester:  '#6B7280',
  broderie:   '#F97316',
  autre:      '#9CA3AF',
};
