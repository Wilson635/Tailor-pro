// ==========================================
// UTILITAIRES DE FORMATAGE - TailorPro
// ==========================================

import { getDeviseMeta } from '@constants/currencies';
import { getRuntimePrefs } from '@/src/preferences/runtime';
import { t } from '@/src/i18n';

const numberLocale = () => (getRuntimePrefs().locale === 'en' ? 'en-US' : 'fr-FR');

const dateLocale = () => (getRuntimePrefs().locale === 'en' ? 'en-GB' : 'fr-FR');

export const formatCurrency = (amount: number): string => {
  const { currency } = getRuntimePrefs();
  const meta = getDeviseMeta(currency);
  const loc = numberLocale();
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: meta.value,
      minimumFractionDigits: meta.fractionDigits,
      maximumFractionDigits: meta.fractionDigits,
    }).format(amount);
  } catch {
    const n = new Intl.NumberFormat(loc, {
      minimumFractionDigits: meta.fractionDigits,
      maximumFractionDigits: meta.fractionDigits,
    }).format(amount);
    return `${n} ${meta.symbol}`;
  }
};

export const formatCurrencyShort = (amount: number): string => {
  const { currency } = getRuntimePrefs();
  const meta = getDeviseMeta(currency);
  const abs = Math.abs(amount);
  const loc = numberLocale();
  const suffix = meta.symbol;
  if (abs >= 1_000_000) {
    const n = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${n}M ${suffix}`;
  }
  if (abs >= 10_000) {
    const n = (amount / 1000).toFixed(0);
    return `${n}K ${suffix}`;
  }
  const n = new Intl.NumberFormat(loc, {
    minimumFractionDigits: 0,
    maximumFractionDigits: meta.fractionDigits,
  }).format(amount);
  return `${n} ${suffix}`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(dateLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'short',
  });
};

export const formatLongDate = (date: Date | string = new Date()): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(dateLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  if (phone.includes(' ')) return phone;

  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);

  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
  }

  return phone;
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('relative.now');
  if (diffMins < 60) return t('relative.minutes', { n: diffMins });
  if (diffHours < 24) return t('relative.hours', { n: diffHours });
  if (diffDays < 7) return t('relative.days', { n: diffDays });

  return formatDateShort(d);
};

export const getInitials = (name: string): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatPercentage = (value: number, showSign: boolean = true): string => {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};
