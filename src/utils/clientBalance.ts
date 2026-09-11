import { isCancelledOrder } from '@constants/commandeConstants';
import type { Order } from '../types';

/** Solde client = somme des restes dus des commandes non annulées. */
export const expectedClientBalance = (orders: Order[], clientId: string): number =>
  orders
    .filter((o) => o.clientId === clientId && !isCancelledOrder(o.orderStatus))
    .reduce((sum, o) => sum + Math.max(0, o.remainingAmount ?? 0), 0);
