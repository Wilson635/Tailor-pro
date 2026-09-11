export type DeviseCode = 'XAF' | 'EUR' | 'USD' | 'GBP' | 'GHS' | 'NGN' | 'KES';

export const DEVISES: {
  value: DeviseCode;
  labelFr: string;
  labelEn: string;
  symbol: string;
  flag: string;
  fractionDigits: number;
}[] = [
  { value: 'XAF', labelFr: 'Franc CFA (FCFA)', labelEn: 'CFA Franc (FCFA)', symbol: 'FCFA', flag: '🇨🇲', fractionDigits: 0 },
  { value: 'EUR', labelFr: 'Euro', labelEn: 'Euro', symbol: '€', flag: '🇪🇺', fractionDigits: 2 },
  { value: 'USD', labelFr: 'Dollar américain', labelEn: 'US Dollar', symbol: '$', flag: '🇺🇸', fractionDigits: 2 },
  { value: 'GBP', labelFr: 'Livre sterling', labelEn: 'Pound sterling', symbol: '£', flag: '🇬🇧', fractionDigits: 2 },
  { value: 'GHS', labelFr: 'Cedi ghanéen', labelEn: 'Ghanaian cedi', symbol: '₵', flag: '🇬🇭', fractionDigits: 2 },
  { value: 'NGN', labelFr: 'Naira nigérian', labelEn: 'Nigerian naira', symbol: '₦', flag: '🇳🇬', fractionDigits: 0 },
  { value: 'KES', labelFr: 'Shilling kényan', labelEn: 'Kenyan shilling', symbol: 'KSh', flag: '🇰🇪', fractionDigits: 0 },
];

export const DEFAULT_DEVISE: DeviseCode = 'XAF';

export const getDeviseMeta = (code: string | null | undefined) =>
  DEVISES.find(d => d.value === code) ?? DEVISES[0];
