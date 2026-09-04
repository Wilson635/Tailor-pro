// ==========================================
// TABLEAU DE BORD COUTURIER — TailorPro (Module 1 complet)
// Filtrage période · Livraisons du jour · Retards · KPIs
// Encaissements · Soldes · Dernières réalisations · Alertes
// ==========================================

import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatCurrencyShort, formatRelativeTime } from '@utils/formatters';
import { SPACING } from '@constants/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = 'jour' | 'semaine' | 'mois';

const { width: W } = Dimensions.get('window');
const THUMB_SIZE   = (W - SPACING.lg * 2 - SPACING.sm * 3) / 4;

// ──────────────────────────────────────────
// PALETTE
// ──────────────────────────────────────────
const P = {
    bg:        '#16123A',
    primary:   '#6C3EB8',
    pageBg:    '#F5F4FB',
    surface:   '#FFFFFF',
    text:      '#1A1033',
    sub:       '#7C6FA8',
    border:    'rgba(108,62,184,0.10)',
    gold:      '#D4AF37',
    goldBg:    'rgba(212,175,55,0.10)',
    goldRim:   'rgba(212,175,55,0.28)',
    success:   '#16A34A',
    successBg: 'rgba(22,163,74,0.10)',
    error:     '#EF4444',
    errorBg:   'rgba(239,68,68,0.10)',
    warning:   '#D97706',
    warningBg: 'rgba(217,119,6,0.10)',
    info:      '#2563EB',
    infoBg:    'rgba(37,99,235,0.10)',
};

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
type ActivityType = 'new_order' | 'payment_received' | 'order_completed' | 'new_client' | string;

const activityMeta = (type: ActivityType) => {
    switch (type) {
        case 'new_order':        return { icon: 'shopping-bag' as const, color: P.info,    bg: P.infoBg,    label: 'Commande' };
        case 'payment_received': return { icon: 'credit-card'  as const, color: P.success, bg: P.successBg, label: 'Paiement' };
        case 'order_completed':  return { icon: 'check-circle' as const, color: P.gold,    bg: P.goldBg,    label: 'Terminée' };
        case 'new_client':       return { icon: 'user-plus'    as const, color: P.warning, bg: P.warningBg, label: 'Nouveau client' };
        default:                 return { icon: 'circle'        as const, color: P.sub,     bg: P.border,    label: '' };
    }
};

const orderStatusLabel: Record<string, string> = {
    pending:      'En attente',
    in_progress:  'En cours',
    completed:    'Terminée',
    delivered:    'Livrée',
    cancelled:    'Annulée',
    creee:        'Créée',
    en_attente:   'En attente',
    en_confection:'En confection',
    essayage:     'Essayage',
    retouches:    'Retouches',
    terminee:     'Terminée',
    livree:       'Livrée',
    annulee:      'Annulée',
};

const orderStatusColor: Record<string, string> = {
    pending: P.warning, in_progress: P.info, completed: P.success,
    delivered: P.gold, cancelled: P.error, creee: P.info,
    en_attente: P.warning, en_confection: P.info, essayage: P.primary,
    retouches: P.warning, terminee: P.success, livree: P.gold, annulee: P.error,
};
const orderStatusBg: Record<string, string> = {
    pending: P.warningBg, in_progress: P.infoBg, completed: P.successBg,
    delivered: P.goldBg, cancelled: P.errorBg, creee: P.infoBg,
    en_attente: P.warningBg, en_confection: P.infoBg, essayage: 'rgba(108,62,184,0.12)',
    retouches: P.warningBg, terminee: P.successBg, livree: P.goldBg, annulee: P.errorBg,
};

const INACTIVE_STATUSES = ['livree', 'delivered', 'annulee', 'cancelled'];

const floorDate = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };

const daysUntil = (date: Date) =>
    Math.ceil((floorDate(date).getTime() - floorDate(new Date()).getTime()) / (1000 * 60 * 60 * 24));

const startOfWeek = (d: Date) => {
    const r = new Date(d);
    const day = r.getDay();
    r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
    r.setHours(0, 0, 0, 0);
    return r;
};

// ──────────────────────────────────────────
// SOUS-COMPOSANTS
// ──────────────────────────────────────────

/** Carte KPI 2-colonnes */
const KpiCard = ({
                     icon, label, value, sub, color, bg, onPress,
                 }: {
    icon: string; label: string; value: string;
    sub?: string; color: string; bg: string;
    onPress?: () => void;
}) => (
    <TouchableOpacity
        style={[styles.kpiCard, { borderLeftColor: color }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
    >
        <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
            <Feather name={icon as any} size={14} color={color} />
        </View>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
        {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </TouchableOpacity>
);

/** Pill livraisons / retards */
const StatPill = ({
                      icon, count, label, color, bg, borderColor, onPress,
                  }: {
    icon: string; count: number; label: string;
    color: string; bg: string; borderColor: string;
    onPress: () => void;
}) => (
    <TouchableOpacity style={[styles.pill, { backgroundColor: bg, borderColor }]} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.pillIconWrap, { backgroundColor: color + '20' }]}>
            <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={[styles.pillCount, { color }]}>{count}</Text>
        <Text style={styles.pillLabel}>{label}</Text>
    </TouchableOpacity>
);

// ──────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────
export const TailorDashboard: React.FC = () => {
    const insets     = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const { statistics, activities, orders, clients, realisations } = useAppStore();

    const [period, setPeriod] = useState<Period>('mois');

    // ── Dates de référence ──────────────────
    const today = useMemo(() => floorDate(new Date()), []);

    const periodStart = useMemo(() => {
        if (period === 'jour')    return today;
        if (period === 'semaine') return startOfWeek(today);
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }, [period, today]);

    const periodLabel = period === 'jour' ? "aujourd'hui" : period === 'semaine' ? 'cette semaine' : 'ce mois';

    // ── Livraisons du jour ──────────────────
    const livraisonsJour = useMemo(() =>
            orders.filter(o => {
                if (INACTIVE_STATUSES.includes(o.orderStatus)) return false;
                return floorDate(new Date(o.deliveryDate)).getTime() === today.getTime();
            }),
        [orders, today]
    );

    // ── Commandes en retard ─────────────────
    const commandesEnRetard = useMemo(() =>
            orders.filter(o => {
                if (INACTIVE_STATUSES.includes(o.orderStatus)) return false;
                return floorDate(new Date(o.deliveryDate)) < today;
            }),
        [orders, today]
    );

    // ── Commandes de la période ─────────────
    const periodOrders = useMemo(() =>
            orders.filter(o => floorDate(new Date(o.createdAt)) >= periodStart),
        [orders, periodStart]
    );

    // ── KPIs financiers ─────────────────────
    const caPeriode = useMemo(() =>
            periodOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0),
        [periodOrders]
    );

    const encaissePeriode = useMemo(() =>
            periodOrders.reduce((s, o) => s + Math.max((o.totalPrice ?? 0) - (o.remainingAmount ?? 0), 0), 0),
        [periodOrders]
    );

    const soldesAPercevoir = useMemo(() =>
            orders
                .filter(o => !INACTIVE_STATUSES.includes(o.orderStatus))
                .reduce((s, o) => s + (o.remainingAmount ?? 0), 0),
        [orders]
    );

    // ── Impayés > 30 jours ──────────────────
    const impayes30j = useMemo(() => {
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - 30);
        return orders.filter(o =>
            (o.remainingAmount ?? 0) > 0 &&
            new Date(o.createdAt) < cutoff &&
            !INACTIVE_STATUSES.includes(o.orderStatus)
        );
    }, [orders, today]);

    // ── Prochaines livraisons ───────────────
    const prochainesLivraisons = useMemo(() =>
            orders
                .filter(o => !INACTIVE_STATUSES.includes(o.orderStatus))
                .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                .slice(0, 6),
        [orders]
    );

    // ── Dernières réalisations avec photos ──
    const dernieresRealisations = useMemo(() => {
        const all = Object.entries(realisations).flatMap(([clientId, reals]) =>
            reals.map(r => ({ ...r, clientId }))
        );
        return all
            .filter(r => r.photos && r.photos.length > 0)
            .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
            .slice(0, 8);
    }, [realisations]);

    // ── Alertes ─────────────────────────────
    const hasRetard   = commandesEnRetard.length > 0;
    const hasImpayes  = impayes30j.length > 0;
    const hasUrgent   = prochainesLivraisons.some(o => daysUntil(new Date(o.deliveryDate)) <= 3 && daysUntil(new Date(o.deliveryDate)) >= 0);
    const hasAlert    = hasRetard || hasImpayes || hasUrgent || statistics.unpaidInvoices > 0;

    // ──────────────────────────────────────────
    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* ══ HERO ══ */}
            <View style={styles.heroCard}>
                <View style={styles.heroBlob1} />
                <View style={styles.heroBlob2} />
                <View style={styles.heroGoldLine} />

                <View style={styles.heroTop}>
                    <View>
                        <Text style={styles.heroLabel}>REVENUS CE MOIS</Text>
                        <Text style={styles.heroAmount}>
                            {formatCurrencyShort(statistics.monthlyRevenue)}
                        </Text>
                        <View style={styles.heroTrendRow}>
                            <View style={styles.trendPill}>
                                <Feather name="trending-up" size={10} color={P.success} />
                                <Text style={styles.trendText}>+{statistics.revenueGrowth}%</Text>
                            </View>
                            <Text style={styles.heroSub}>vs mois dernier</Text>
                        </View>
                    </View>

                    <View style={styles.heroNetCard}>
                        <Text style={styles.heroNetLabel}>Bénéfice net</Text>
                        <Text style={styles.heroNetValue}>
                            {formatCurrencyShort(statistics.netProfit)}
                        </Text>
                    </View>
                </View>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroMiniStat}>
                        <Feather name="clock" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.heroMiniValue}>{statistics.ordersInProgress}</Text>
                        <Text style={styles.heroMiniLabel}>en cours</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroMiniStat}>
                        <Feather name="check-circle" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.heroMiniValue}>{statistics.completedOrders}</Text>
                        <Text style={styles.heroMiniLabel}>terminées</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroMiniStat}>
                        <Feather name="users" size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.heroMiniValue}>{statistics.totalClients}</Text>
                        <Text style={styles.heroMiniLabel}>clients</Text>
                    </View>
                </View>
            </View>

            {/* ══ FILTRE PÉRIODE ══ */}
            <View style={styles.periodRow}>
                {(['jour', 'semaine', 'mois'] as Period[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodTab, period === p && styles.periodTabActive]}
                        onPress={() => setPeriod(p)}
                        activeOpacity={0.75}
                    >
                        <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                            {p === 'jour' ? "Auj." : p === 'semaine' ? 'Semaine' : 'Ce mois'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ══ KPIs PÉRIODE ══ */}
            <View style={styles.section}>
                <View style={styles.kpiRow}>
                    <KpiCard
                        icon="trending-up"
                        label="Chiffre d'affaires"
                        value={formatCurrencyShort(caPeriode)}
                        sub={periodLabel}
                        color={P.success}
                        bg={P.successBg}
                    />
                    <KpiCard
                        icon="credit-card"
                        label="Encaissements"
                        value={formatCurrencyShort(encaissePeriode)}
                        sub={periodLabel}
                        color={P.primary}
                        bg="rgba(108,62,184,0.10)"
                    />
                </View>
                <View style={[styles.kpiRow, { marginTop: 10 }]}>
                    <KpiCard
                        icon="alert-circle"
                        label="Soldes à percevoir"
                        value={formatCurrencyShort(soldesAPercevoir)}
                        sub="toutes commandes"
                        color={soldesAPercevoir > 0 ? P.warning : P.success}
                        bg={soldesAPercevoir > 0 ? P.warningBg : P.successBg}
                    />
                    <KpiCard
                        icon="package"
                        label="Commandes créées"
                        value={String(periodOrders.length)}
                        sub={periodLabel}
                        color={P.gold}
                        bg={P.goldBg}
                    />
                </View>
            </View>

            {/* ══ LIVRAISONS DU JOUR / EN RETARD ══ */}
            <View style={styles.pillRow}>
                <StatPill
                    icon="truck"
                    count={livraisonsJour.length}
                    label={'Livraisons\naujourd\'hui'}
                    color={livraisonsJour.length > 0 ? P.success : P.sub}
                    bg={livraisonsJour.length > 0 ? P.successBg : 'rgba(124,111,168,0.06)'}
                    borderColor={livraisonsJour.length > 0 ? 'rgba(22,163,74,0.25)' : P.border}
                    onPress={() => navigation.navigate('CommandeKanban')}
                />
                <StatPill
                    icon="alert-triangle"
                    count={commandesEnRetard.length}
                    label={'En retard'}
                    color={commandesEnRetard.length > 0 ? P.error : P.sub}
                    bg={commandesEnRetard.length > 0 ? P.errorBg : 'rgba(124,111,168,0.06)'}
                    borderColor={commandesEnRetard.length > 0 ? 'rgba(239,68,68,0.25)' : P.border}
                    onPress={() => navigation.navigate('CommandeKanban')}
                />
                <StatPill
                    icon="users"
                    count={clients.length}
                    label={'Clients'}
                    color={P.primary}
                    bg="rgba(108,62,184,0.08)"
                    borderColor={P.border}
                    onPress={() => navigation.navigate('AddClient')}
                />
            </View>

            {/* ══ ALERTES ══ */}
            {hasAlert && (
                <View style={styles.alertsBlock}>
                    {hasRetard && (
                        <TouchableOpacity
                            style={[styles.alertRow, { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: P.errorBg }]}
                            onPress={() => navigation.navigate('CommandeKanban')}
                            activeOpacity={0.8}
                        >
                            <Feather name="alert-triangle" size={15} color={P.error} />
                            <Text style={[styles.alertRowText, { color: P.error }]}>
                                {commandesEnRetard.length} commande{commandesEnRetard.length > 1 ? 's' : ''} en retard de livraison
                            </Text>
                            <Feather name="chevron-right" size={14} color={P.error} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                    {hasImpayes && (
                        <TouchableOpacity
                            style={[styles.alertRow, { borderColor: 'rgba(217,119,6,0.25)', backgroundColor: P.warningBg }]}
                            onPress={() => navigation.navigate('Comptabilite')}
                            activeOpacity={0.8}
                        >
                            <Feather name="clock" size={15} color={P.warning} />
                            <Text style={[styles.alertRowText, { color: P.warning }]}>
                                {impayes30j.length} solde{impayes30j.length > 1 ? 's' : ''} impayé{impayes30j.length > 1 ? 's' : ''} depuis + de 30 jours
                            </Text>
                            <Feather name="chevron-right" size={14} color={P.warning} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                    {statistics.unpaidInvoices > 0 && !hasRetard && !hasImpayes && (
                        <TouchableOpacity
                            style={[styles.alertRow, { borderColor: 'rgba(217,119,6,0.25)', backgroundColor: P.warningBg }]}
                            onPress={() => navigation.navigate('Comptabilite')}
                            activeOpacity={0.8}
                        >
                            <Feather name="alert-circle" size={15} color={P.warning} />
                            <Text style={[styles.alertRowText, { color: P.warning }]}>
                                {statistics.unpaidInvoices} facture{statistics.unpaidInvoices > 1 ? 's' : ''} impayée{statistics.unpaidInvoices > 1 ? 's' : ''} — {formatCurrencyShort(statistics.unpaidAmount)}
                            </Text>
                            <Feather name="chevron-right" size={14} color={P.warning} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}
                    {hasUrgent && (
                        <View style={[styles.alertRow, { borderColor: 'rgba(37,99,235,0.20)', backgroundColor: P.infoBg }]}>
                            <Feather name="zap" size={15} color={P.info} />
                            <Text style={[styles.alertRowText, { color: P.info }]}>
                                Livraisons urgentes dans moins de 3 jours
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ══ ACTIONS RAPIDES ══ */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.quickGrid}>
                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate('AddOrder', { clientId: undefined })}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.goldBg }]}>
                            <Feather name="plus-circle" size={22} color={P.gold} />
                        </View>
                        <Text style={styles.quickLabel}>Nouvelle{'\n'}commande</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate('AddClient')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.infoBg }]}>
                            <Feather name="user-plus" size={22} color={P.info} />
                        </View>
                        <Text style={styles.quickLabel}>Nouveau{'\n'}client</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate('CommandeKanban')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: 'rgba(108,62,184,0.10)' }]}>
                            <Feather name="trello" size={22} color={P.primary} />
                        </View>
                        <Text style={styles.quickLabel}>Kanban{'\n'}commandes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate('Statistics')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.successBg }]}>
                            <Feather name="bar-chart-2" size={22} color={P.success} />
                        </View>
                        <Text style={styles.quickLabel}>Voir les{'\n'}statistiques</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ══ PROCHAINES LIVRAISONS ══ */}
            {prochainesLivraisons.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Prochaines livraisons</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('CommandeKanban')}>
                            <Text style={styles.seeAll}>Kanban →</Text>
                        </TouchableOpacity>
                    </View>

                    {prochainesLivraisons.map((order) => {
                        const days        = daysUntil(new Date(order.deliveryDate));
                        const isRetard    = days < 0;
                        const isToday     = days === 0;
                        const isUrgent    = days >= 0 && days <= 3;
                        const statusColor = orderStatusColor[order.orderStatus] ?? P.sub;
                        const statusBg    = orderStatusBg[order.orderStatus]   ?? P.border;
                        const accentColor = isRetard ? P.error : isToday ? P.success : isUrgent ? P.warning : P.sub;

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={[
                                    styles.orderCard,
                                    isRetard && styles.orderCardRetard,
                                    isUrgent && !isRetard && styles.orderCardUrgent,
                                ]}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                activeOpacity={0.8}
                            >
                                {isRetard && (
                                    <View style={[styles.urgentBadge, { backgroundColor: P.error }]}>
                                        <Feather name="alert-triangle" size={10} color="#fff" />
                                        <Text style={styles.urgentBadgeText}>En retard</Text>
                                    </View>
                                )}
                                {isToday && !isRetard && (
                                    <View style={[styles.urgentBadge, { backgroundColor: P.success }]}>
                                        <Feather name="truck" size={10} color="#fff" />
                                        <Text style={styles.urgentBadgeText}>Aujourd'hui !</Text>
                                    </View>
                                )}
                                {isUrgent && !isRetard && !isToday && (
                                    <View style={[styles.urgentBadge, { backgroundColor: P.warning }]}>
                                        <Feather name="zap" size={10} color="#fff" />
                                        <Text style={styles.urgentBadgeText}>Urgent</Text>
                                    </View>
                                )}

                                <View style={styles.orderCardRow}>
                                    <View style={styles.orderAvatar}>
                                        <Text style={styles.orderAvatarText}>
                                            {order.clientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.orderClient} numberOfLines={1}>{order.clientName}</Text>
                                        <Text style={styles.orderType} numberOfLines={1}>
                                            {order.numeroCommande ?? order.clothingType}
                                        </Text>
                                    </View>

                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {orderStatusLabel[order.orderStatus] ?? order.orderStatus}
                                            </Text>
                                        </View>
                                        <Text style={[styles.orderDays, { color: accentColor }]}>
                                            {isRetard
                                                ? `${Math.abs(days)}j de retard`
                                                : isToday
                                                    ? "Aujourd'hui"
                                                    : days === 1 ? 'Demain' : `Dans ${days}j`
                                            }
                                        </Text>
                                    </View>
                                </View>

                                {order.remainingAmount > 0 && (
                                    <View style={styles.orderPayRow}>
                                        <Feather name="alert-circle" size={11} color={P.error} />
                                        <Text style={styles.orderPayText}>
                                            Reste : {formatCurrencyShort(order.remainingAmount)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* ══ DERNIÈRES RÉALISATIONS ══ */}
            {dernieresRealisations.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Dernières réalisations</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Galerie')}>
                            <Text style={styles.seeAll}>Galerie →</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.thumbGrid}>
                        {dernieresRealisations.map((real, i) => (
                            <TouchableOpacity
                                key={`${real.id}_${i}`}
                                style={styles.thumbItem}
                                onPress={() => navigation.navigate('RealisationDetails', {
                                    realisationId: real.id,
                                    clientId:      real.clientId,
                                })}
                                activeOpacity={0.85}
                            >
                                <Image
                                    source={{ uri: real.photos[0] }}
                                    style={styles.thumbImg}
                                    resizeMode="cover"
                                />
                                {real.photos.length > 1 && (
                                    <View style={styles.thumbCount}>
                                        <Text style={styles.thumbCountText}>+{real.photos.length - 1}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* ══ ACTIVITÉS RÉCENTES ══ */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Activités récentes</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>Voir tout</Text>
                    </TouchableOpacity>
                </View>

                {activities.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Feather name="activity" size={28} color="rgba(108,62,184,0.2)" />
                        <Text style={styles.emptyText}>Aucune activité récente</Text>
                    </View>
                ) : (
                    <View style={styles.activitiesCard}>
                        {activities.slice(0, 5).map((activity, index) => {
                            const meta = activityMeta(activity.type);
                            return (
                                <View key={activity.id}>
                                    <TouchableOpacity style={styles.actRow} activeOpacity={0.7}>
                                        <View style={[styles.actIcon, { backgroundColor: meta.bg }]}>
                                            <Feather name={meta.icon} size={16} color={meta.color} />
                                        </View>
                                        <View style={styles.actBody}>
                                            <Text style={styles.actTitle} numberOfLines={1}>{activity.title}</Text>
                                            <Text style={styles.actSub}   numberOfLines={1}>{activity.subtitle}</Text>
                                        </View>
                                        <View style={styles.actRight}>
                                            <Text style={styles.actTime}>{formatRelativeTime(activity.timestamp)}</Text>
                                            {activity.amount ? (
                                                <Text style={styles.actAmount}>+{formatCurrencyShort(activity.amount)}</Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                    {index < Math.min(activities.length, 5) - 1 && (
                                        <View style={styles.actDivider} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

        </ScrollView>
    );
};

// ==========================================
// STYLES
// ==========================================
const card = {
    backgroundColor: P.surface,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(108,62,184,0.12)',
} as const;

const styles = StyleSheet.create({
    scroll:  { flex: 1, backgroundColor: P.pageBg },
    content: { padding: SPACING.lg, gap: SPACING.lg },

    // ── Hero ──
    heroCard: {
        backgroundColor: P.bg, borderRadius: 24,
        padding: SPACING.xl, overflow: 'hidden', position: 'relative',
        borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)',
    },
    heroBlob1:    { position: 'absolute', top: -70,   right: -70,  width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(108,62,184,0.3)' },
    heroBlob2:    { position: 'absolute', bottom: -60, left: -40,  width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(212,175,55,0.05)' },
    heroGoldLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(212,175,55,0.25)' },

    heroTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
    heroLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1.5, marginBottom: 6 },
    heroAmount:   { fontSize: 34, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff', letterSpacing: -0.5 },
    heroTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    trendPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: P.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    trendText:    { fontSize: 11, color: P.success, fontFamily: 'PlusJakartaSans_700Bold' },
    heroSub:      { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
    heroNetCard:  { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: SPACING.md, alignItems: 'flex-end', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
    heroNetLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 },
    heroNetValue: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
    heroStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)' },
    heroMiniStat:    { flex: 1, alignItems: 'center', gap: 3 },
    heroStatDivider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
    heroMiniValue:   { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff' },
    heroMiniLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'PlusJakartaSans_500Medium' },

    // ── Période ──
    periodRow: { flexDirection: 'row', gap: 8 },
    periodTab: {
        flex: 1, paddingVertical: 9, borderRadius: 22,
        alignItems: 'center', borderWidth: 1, borderColor: P.border,
        backgroundColor: P.surface,
    },
    periodTabActive:     { backgroundColor: P.primary, borderColor: P.primary },
    periodTabText:       { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
    periodTabTextActive: { color: '#fff' },

    // ── KPIs ──
    section:  { gap: SPACING.md },
    kpiRow:   { flexDirection: 'row', gap: 10 },
    kpiCard: {
        flex: 1, backgroundColor: P.surface, borderRadius: 14,
        padding: 14, borderLeftWidth: 3,
        borderWidth: 0.5, borderColor: 'rgba(108,62,184,0.08)',
    },
    kpiIcon:  { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    kpiValue: { fontSize: 15, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    kpiLabel: { fontSize: 10, color: P.sub, marginTop: 2 },
    kpiSub:   { fontSize: 9, color: P.sub, marginTop: 1, fontStyle: 'italic' },

    // ── Pills ──
    pillRow: { flexDirection: 'row', gap: 10 },
    pill: {
        flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
        borderWidth: 1,
    },
    pillIconWrap: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    pillCount:    { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    pillLabel:    { fontSize: 10, color: P.sub, textAlign: 'center', lineHeight: 14 },

    // ── Alertes ──
    alertsBlock: { gap: 8 },
    alertRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
        borderWidth: 1,
    },
    alertRowText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 },

    // ── Section header ──
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle:  { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    seeAll:        { fontSize: 12, color: P.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },

    // ── Quick actions ──
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    quickCard: { width: '47.5%', ...card, padding: SPACING.md + 2, gap: SPACING.sm },
    quickIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    quickLabel:{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text, lineHeight: 17 },

    // ── Commandes ──
    orderCard: { ...card, padding: SPACING.md, gap: SPACING.xs, overflow: 'hidden' },
    orderCardUrgent: { borderColor: 'rgba(217,119,6,0.30)', borderWidth: 1 },
    orderCardRetard: { borderColor: 'rgba(239,68,68,0.35)', borderWidth: 1 },
    urgentBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 99, marginBottom: SPACING.xs,
    },
    urgentBadgeText: { fontSize: 10, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
    orderCardRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    orderAvatar: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    orderAvatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
    orderClient:     { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    orderType:       { fontSize: 11, color: P.sub, marginTop: 1 },
    statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    statusText:      { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' },
    orderDays:       { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' },
    orderPayRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)',
    },
    orderPayText: { fontSize: 11, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold' },

    // ── Dernières réalisations ──
    thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    thumbItem: {
        width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 10,
        overflow: 'hidden', backgroundColor: P.border,
    },
    thumbImg:       { width: '100%', height: '100%' },
    thumbCount: {
        position: 'absolute', bottom: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
        paddingHorizontal: 5, paddingVertical: 2,
    },
    thumbCountText: { fontSize: 9, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

    // ── Activités ──
    activitiesCard: { ...card, overflow: 'hidden' },
    actRow:    { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
    actIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actBody:   { flex: 1 },
    actTitle:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    actSub:    { fontSize: 11, color: P.sub, marginTop: 2 },
    actRight:  { alignItems: 'flex-end', gap: 3 },
    actTime:   { fontSize: 10, color: 'rgba(124,111,168,0.6)' },
    actAmount: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.success },
    actDivider:{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 60 },

    // ── Vide ──
    emptyCard: { ...card, padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, borderStyle: 'dashed' },
    emptyText: { fontSize: 13, color: P.sub, textAlign: 'center' },
});