// ==========================================
// CHARTE GRAPHIQUE — TailorPro
// Violet atelier · indigo · or
// ==========================================

export type ThemeScheme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type Palette = {
  bg: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  primaryMid: string;
  secondary: string;
  accent: string;
  pageBg: string;
  surface: string;
  topBg: string;
  card: string;
  background: string;
  text: string;
  sub: string;
  muted: string;
  textSecondary: string;
  textLight: string;
  textMuted: string;
  border: string;
  borderHard: string;
  borderLight: string;
  gold: string;
  goldBg: string;
  goldRim: string;
  success: string;
  successBg: string;
  successLight: string;
  warning: string;
  warningBg: string;
  warningLight: string;
  error: string;
  errorBg: string;
  errorLight: string;
  danger: string;
  info: string;
  infoBg: string;
  infoLight: string;
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  navBg: string;
  navBorder: string;
  overlay: string;
};

export const lightPalette: Palette = {
  bg: '#16123A',
  primary: '#6C3EB8',
  primaryLight: '#8B5CF6',
  primaryDark: '#4C1D95',
  primaryBg: 'rgba(108,62,184,0.08)',
  primaryMid: 'rgba(108,62,184,0.15)',
  secondary: '#F3E8FF',
  accent: '#A855F7',
  pageBg: '#F5F4FB',
  surface: '#FFFFFF',
  topBg: '#FFFFFF',
  card: '#FFFFFF',
  background: '#F5F4FB',
  text: '#1A1033',
  sub: '#7C6FA8',
  muted: 'rgba(124,111,168,0.55)',
  textSecondary: '#7C6FA8',
  textLight: '#9CA3AF',
  textMuted: '#b2bbc5',
  border: 'rgba(108,62,184,0.10)',
  borderHard: 'rgba(108,62,184,0.18)',
  borderLight: '#F3F4F6',
  gold: '#D4AF37',
  goldBg: 'rgba(212,175,55,0.10)',
  goldRim: 'rgba(212,175,55,0.28)',
  success: '#16A34A',
  successBg: 'rgba(22,163,74,0.10)',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningBg: 'rgba(217,119,6,0.10)',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorBg: 'rgba(239,68,68,0.10)',
  errorLight: '#FEE2E2',
  danger: '#b80c0c',
  info: '#2563EB',
  infoBg: 'rgba(37,99,235,0.10)',
  infoLight: '#DBEAFE',
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
  navBg: '#FFFFFF',
  navBorder: 'rgba(0,0,0,0.07)',
  overlay: 'rgba(22,18,58,0.45)',
};

export const darkPalette: Palette = {
  bg: '#0E0B14',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#6C3EB8',
  primaryBg: 'rgba(139,92,246,0.16)',
  primaryMid: 'rgba(139,92,246,0.24)',
  secondary: '#2A2150',
  accent: '#C4B5FD',
  pageBg: '#0E0B14',
  surface: '#1A1528',
  topBg: '#16123A',
  card: '#1A1528',
  background: '#0E0B14',
  text: '#F5F4FB',
  sub: '#A89BC8',
  muted: 'rgba(168,155,200,0.55)',
  textSecondary: '#A89BC8',
  textLight: '#8A8594',
  textMuted: '#6B6580',
  border: 'rgba(212,175,55,0.14)',
  borderHard: 'rgba(139,92,246,0.28)',
  borderLight: '#2E2845',
  gold: '#D4AF37',
  goldBg: 'rgba(212,175,55,0.14)',
  goldRim: 'rgba(212,175,55,0.32)',
  success: '#4ADE80',
  successBg: 'rgba(74,222,128,0.12)',
  successLight: 'rgba(74,222,128,0.18)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.12)',
  warningLight: 'rgba(251,191,36,0.16)',
  error: '#F87171',
  errorBg: 'rgba(248,113,113,0.12)',
  errorLight: 'rgba(248,113,113,0.16)',
  danger: '#F87171',
  info: '#60A5FA',
  infoBg: 'rgba(96,165,250,0.12)',
  infoLight: 'rgba(96,165,250,0.16)',
  white: '#1A1528',
  black: '#000000',
  gray50: '#16123A',
  gray100: '#1F1A33',
  gray200: '#2E2845',
  gray300: '#3D3658',
  gray400: '#8A8594',
  gray500: '#A89BC8',
  gray600: '#C4B5FD',
  gray700: '#E5E0F5',
  gray800: '#F5F4FB',
  gray900: '#FFFFFF',
  navBg: '#16123A',
  navBorder: 'rgba(212,175,55,0.12)',
  overlay: 'rgba(8,6,14,0.72)',
};

export const getPalette = (theme: ResolvedTheme): Palette =>
  theme === 'dark' ? darkPalette : lightPalette;
