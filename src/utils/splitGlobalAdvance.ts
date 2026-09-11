import { isCancelledOrder } from '@constants/commandeConstants';
import type { Order } from '../types';

/** Répartit une avance globale également entre les commandes actives du projet. */
export function splitGlobalAdvance(orders: Order[], amount: number): { id: string; applied: number }[] {
  const open = orders.filter((o) => !isCancelledOrder(o.orderStatus) && (o.remainingAmount ?? 0) > 0);
  const pool = open.length ? open : orders.filter((o) => !isCancelledOrder(o.orderStatus));
  if (!pool.length || amount <= 0) return [];

  const n = pool.length;
  const base = Math.floor(amount / n);
  let extra = amount - base * n;
  const intended = pool.map((o) => {
    const share = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    return { order: o, share };
  });

  const applied = intended.map(({ order, share }) => {
    const take = Math.min(share, Math.max(0, order.remainingAmount ?? 0));
    return { id: order.id, applied: take, leftover: share - take };
  });

  let leftover = applied.reduce((s, a) => s + a.leftover, 0);
  const result = applied.map(({ id, applied: v }) => ({ id, applied: v }));

  for (const row of result) {
    if (leftover <= 0) break;
    const order = pool.find((o) => o.id === row.id);
    if (!order) continue;
    const already = row.applied;
    const room = Math.max(0, (order.remainingAmount ?? 0) - already);
    const extraTake = Math.min(room, leftover);
    row.applied += extraTake;
    leftover -= extraTake;
  }

  return result.filter((r) => r.applied > 0);
}
