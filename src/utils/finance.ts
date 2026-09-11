// Encaissement = argent réellement reçu (acomptes inclus).
// Le reste à payer n'est jamais du bénéfice.

export const orderEncaisse = (order: {
  totalPrice?: number | null;
  remainingAmount?: number | null;
}): number =>
  Math.max(0, (order.totalPrice ?? 0) - (order.remainingAmount ?? 0));
