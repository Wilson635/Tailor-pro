// ── Module 8 : Constantes Paiements ─────────────────────────────────────
import { Feather } from '@expo/vector-icons';

// ─── Types de paiement ───────────────────────────────────────────────────

export type TypePaiement = 'acompte' | 'paiement_intermediaire' | 'solde_final';

export const TYPE_PAIEMENT_META: Record<
  TypePaiement,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string; bgColor: string }
> = {
  acompte: {
    label:   'Acompte',
    icon:    'arrow-down-circle',
    color:   '#6B21A8',
    bgColor: '#EDE9FE',
  },
  paiement_intermediaire: {
    label:   'Versement intermédiaire',
    icon:    'refresh-cw',
    color:   '#0369A1',
    bgColor: '#E0F2FE',
  },
  solde_final: {
    label:   'Solde final',
    icon:    'check-circle',
    color:   '#059669',
    bgColor: '#D1FAE5',
  },
};

export const TYPES_PAIEMENT: TypePaiement[] = [
  'acompte',
  'paiement_intermediaire',
  'solde_final',
];

// ─── Modes de paiement (réconciliation avec valeurs DB legacy) ────────────

export type ModePaiement = 'cash' | 'mobile_money' | 'bank_transfer' | 'other';

export const MODE_PAIEMENT_META: Record<
  ModePaiement,
  { label: string; icon: keyof typeof Feather.glyphMap }
> = {
  cash:          { label: 'Espèces',      icon: 'dollar-sign'   },
  mobile_money:  { label: 'Mobile Money', icon: 'smartphone'    },
  bank_transfer: { label: 'Virement',     icon: 'credit-card'   },
  other:         { label: 'Autre',        icon: 'more-horizontal'},
};

export const MODES_PAIEMENT: ModePaiement[] = [
  'cash', 'mobile_money', 'bank_transfer', 'other',
];

// ─── Statut paiement (toujours dérivé, jamais saisi) ─────────────────────

export type StatutPaiement = 'payee' | 'partiellement_payee' | 'non_payee';

export const STATUT_PAIEMENT_META: Record<
  StatutPaiement,
  { label: string; icon: keyof typeof Feather.glyphMap; color: string; bgColor: string }
> = {
  payee: {
    label:   'Payée',
    icon:    'check-circle',
    color:   '#059669',
    bgColor: '#D1FAE5',
  },
  partiellement_payee: {
    label:   'Partiel',
    icon:    'clock',
    color:   '#D97706',
    bgColor: '#FEF3C7',
  },
  non_payee: {
    label:   'Non payée',
    icon:    'x-circle',
    color:   '#DC2626',
    bgColor: '#FEE2E2',
  },
};

/**
 * Calcule le statut de paiement à partir des montants.
 * Règle : statut toujours dérivé, jamais saisi.
 */
export function getStatutPaiement(paidAmount: number, totalAmount: number): StatutPaiement {
  if (totalAmount <= 0 || paidAmount <= 0) return 'non_payee';
  if (paidAmount >= totalAmount)            return 'payee';
  return 'partiellement_payee';
}

/**
 * Suggère le type de paiement automatiquement :
 * - Premier paiement (aucun encore enregistré) → acompte
 * - Paiement intermédiaire (reste partiel)     → paiement_intermediaire
 * - Paiement final (solde = restant)            → solde_final
 */
export function suggestTypePaiement(
  totalAmount: number,
  paidAmount: number,
  newAmount: number,
): TypePaiement {
  if (paidAmount === 0) return 'acompte';
  if (paidAmount + newAmount >= totalAmount) return 'solde_final';
  return 'paiement_intermediaire';
}
