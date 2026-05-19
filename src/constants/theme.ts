// ==========================================
// THÈME - TailorPro
// ==========================================

export const COLORS = {
  // Couleurs principales
  primary: '#6B21A8',        // Violet principal
  primaryLight: '#8B5CF6',   // Violet clair
  primaryDark: '#4C1D95',    // Violet foncé
  
  // Couleurs secondaires
  secondary: '#F3E8FF',      // Violet très clair (fond)
  accent: '#A855F7',         // Violet accent

  
  // Neutres
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // États
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  danger: '#b80c0c',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Fond
  background: '#F9FAFB',
  card: '#FFFFFF',
  
  // Texte
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textMuted: '#b2bbc5',
  
  // Bordures
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  display: 32,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const MEASUREMENT_LABELS: Record<string, string> = {
  chestCircumference: 'Tour de poitrine',
  waistCircumference: 'Tour de taille',
  hipCircumference: 'Tour de hanches',
  backWidth: 'Largeur dos',
  shoulderWidth: 'Longueur épaule',
  sleeveLength: 'Longueur manche',
  armCircumference: 'Tour de bras',
  neckCircumference: 'Tour de cou',
  dressLength: 'Longueur robe',
  bustHeight: 'Hauteur buste',
  thighCircumference: 'Tour de cuisse',
};

export const CLOTHING_TYPE_LABELS: Record<string, string> = {
  robe_longue: 'Robe longue',
  robe_courte: 'Robe courte',
  costume: 'Costume',
  chemise: 'Chemise',
  pantalon: 'Pantalon',
  boubou: 'Boubou',
  ensemble: 'Ensemble',
  robe_mariage: 'Robe de mariage',
  tenue_enfant: 'Tenue enfant',
  autre: 'Autre',
};

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'Toutes',
  robes: 'Robes',
  costumes: 'Costumes',
  chemises: 'Chemises',
  enfants: 'Enfants',
  mariage: 'Mariage',
  traditionnel: 'Traditionnel',
  casual: 'Casual',
  luxe: 'Luxe',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payé',
  partial: 'Paiement partiel',
  paid: 'Payé',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  in_progress: COLORS.info,
  completed: COLORS.success,
  delivered: COLORS.primary,
  cancelled: COLORS.error,
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: COLORS.error,
  partial: COLORS.warning,
  paid: COLORS.success,
};


export const Typography = {
  // Titres
  display: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: 40,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: 36,
  },
  h1: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: 32,
  },
  h2: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    lineHeight: 28,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    lineHeight: 24,
  },

  // Corps de texte
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    lineHeight: 24,
  },
  body: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.text,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Labels & UI
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textLight,
    lineHeight: 14,
  },

  // Boutons
  button: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: 16,
  },

  // Spécial
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    lineHeight: 24,
  },
  badge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: 14,
  },
};
