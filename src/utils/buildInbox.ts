import type { Activity, Client, Order, Statistics } from '../types';
import { formatCurrencyShort, formatDate } from '@utils/formatters';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

export type InboxKind = 'order' | 'payment' | 'client' | 'stats' | 'activity';

export type InboxItem = {
  id: string;
  kind: InboxKind;
  title: string;
  body: string;
  timestamp: Date;
  priority: 'high' | 'normal';
  route?: { name: keyof RootStackParamList; params?: object };
};

const DAY = 24 * 60 * 60 * 1000;
const DONE = new Set(['delivered', 'livree', 'cancelled', 'annulee']);
const OPEN = (status: string) => !DONE.has(status);

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

const asDate = (v: Date | string) => new Date(v);

export const buildInbox = ({
  orders,
  clients,
  activities,
  statistics,
}: {
  orders: Order[];
  clients: Client[];
  activities: Activity[];
  statistics: Statistics;
}): InboxItem[] => {
  const items: InboxItem[] = [];
  const today = startOfDay(new Date());

  for (const o of orders) {
    if (!OPEN(o.orderStatus)) continue;
    const due = startOfDay(asDate(o.deliveryDate));
    const label = o.numeroCommande ? `n° ${o.numeroCommande}` : o.clientName;
    const route = { name: 'OrderDetails' as const, params: { orderId: o.id } };

    if (due < today) {
      items.push({
        id: `order-overdue-${o.id}`,
        kind: 'order',
        title: 'Livraison en retard',
        body: `${label} · prévue le ${formatDate(o.deliveryDate)}`,
        timestamp: asDate(o.deliveryDate),
        priority: 'high',
        route,
      });
    } else if (due === today) {
      items.push({
        id: `order-today-${o.id}`,
        kind: 'order',
        title: 'Livraison aujourd’hui',
        body: `${label} · ${o.clientName}`,
        timestamp: asDate(o.deliveryDate),
        priority: 'high',
        route,
      });
    } else if (due <= today + 2 * DAY) {
      items.push({
        id: `order-soon-${o.id}`,
        kind: 'order',
        title: 'Livraison dans 48 h',
        body: `${label} · ${o.clientName}`,
        timestamp: asDate(o.deliveryDate),
        priority: 'normal',
        route,
      });
    }

    if (o.urgencyLevel === 'high') {
      items.push({
        id: `order-urgent-${o.id}`,
        kind: 'order',
        title: 'Commande urgente',
        body: `${label} · à suivre en priorité`,
        timestamp: asDate(o.updatedAt ?? o.createdAt),
        priority: 'high',
        route,
      });
    }
  }

  const unpaid = orders.filter(
    (o) => OPEN(o.orderStatus) && o.paymentStatus !== 'paid' && o.remainingAmount > 0,
  );
  if (unpaid.length > 5) {
    const total = unpaid.reduce((s, o) => s + o.remainingAmount, 0);
    items.push({
      id: 'pay-summary',
      kind: 'payment',
      title: `${unpaid.length} commandes non soldées`,
      body: `${formatCurrencyShort(total)} encore à encaisser`,
      timestamp: new Date(),
      priority: 'high',
      route: { name: 'Payments', params: { clientId: '' } },
    });
  } else {
    for (const o of unpaid) {
      items.push({
        id: `pay-${o.id}`,
        kind: 'payment',
        title: o.paymentStatus === 'partial' ? 'Paiement partiel' : 'Impayé',
        body: `${o.clientName} · reste ${formatCurrencyShort(o.remainingAmount)}`,
        timestamp: asDate(o.updatedAt ?? o.createdAt),
        priority: o.remainingAmount > 0 ? 'high' : 'normal',
        route: { name: 'OrderDetails', params: { orderId: o.id } },
      });
    }
  }

  for (const c of clients) {
    const age = Date.now() - asDate(c.createdAt).getTime();
    if (age < 7 * DAY) {
      items.push({
        id: `client-new-${c.id}`,
        kind: 'client',
        title: 'Nouveau client',
        body: `${c.nom} a été ajouté cette semaine`,
        timestamp: asDate(c.createdAt),
        priority: 'normal',
        route: { name: 'ClientDetails', params: { clientId: c.id } },
      });
    }
  }

  if (statistics.unpaidAmount > 0) {
    items.push({
      id: 'stats-unpaid',
      kind: 'stats',
      title: 'Point encaissements',
      body: `${formatCurrencyShort(statistics.unpaidAmount)} en attente · ${statistics.unpaidInvoices} facture${statistics.unpaidInvoices > 1 ? 's' : ''}`,
      timestamp: new Date(),
      priority: 'normal',
      route: { name: 'Statistics' },
    });
  }
  if (statistics.ordersInProgress > 0) {
    items.push({
      id: 'stats-progress',
      kind: 'stats',
      title: 'Atelier en cours',
      body: `${statistics.ordersInProgress} commande${statistics.ordersInProgress > 1 ? 's' : ''} en confection`,
      timestamp: new Date(),
      priority: 'normal',
      route: { name: 'CommandeKanban' },
    });
  }

  for (const a of activities) {
    items.push({
      id: `act-${a.id}`,
      kind: 'activity',
      title: a.title,
      body: a.subtitle,
      timestamp: asDate(a.timestamp),
      priority: 'normal',
      route: a.orderId
        ? { name: 'OrderDetails', params: { orderId: a.orderId } }
        : a.clientId
          ? { name: 'ClientDetails', params: { clientId: a.clientId } }
          : { name: 'Statistics' },
    });
  }

  const seen = new Set<string>();
  return items
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
};
