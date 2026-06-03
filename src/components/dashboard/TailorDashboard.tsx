// ==========================================
// TABLEAU DE BORD COUTURIER — TailorPro
// Design complet, données métier couturier
// Sans ombres
// ==========================================

import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatRelativeTime } from '@utils/formatters';
import { SPACING, BORDER_RADIUS } from '@constants/theme';
import {RootStackParamList} from "@/src/navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
    pending:     'En attente',
    in_progress: 'En cours',
    completed:   'Terminée',
    delivered:   'Livrée',
    cancelled:   'Annulée',
};

const orderStatusColor: Record<string, string> = {
    pending:     P.warning,
    in_progress: P.info,
    completed:   P.success,
    delivered:   P.gold,
    cancelled:   P.error,
};

const orderStatusBg: Record<string, string> = {
    pending:     P.warningBg,
    in_progress: P.infoBg,
    completed:   P.successBg,
    delivered:   P.goldBg,
    cancelled:   P.errorBg,
};

const daysUntil = (date: Date) =>
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ──────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────

export const TailorDashboard: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const { statistics, activities, orders, clients } = useAppStore();

    const urgentOrders = useMemo(() =>
            orders
                .filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled')
                .filter(o => daysUntil(new Date(o.deliveryDate)) <= 5)
                .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                .slice(0, 4),
        [orders]
    );

    const activeOrders = useMemo(() =>
            orders
                .filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled')
                .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                .slice(0, 5),
        [orders]
    );

    const hasAlert = urgentOrders.length > 0 || statistics.unpaidInvoices > 0;

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
                            {formatCurrency(statistics.monthlyRevenue)}
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
                            {formatCurrency(statistics.netProfit)}
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

            {/* ══ ALERTE ══ */}
            {hasAlert && (
                <View style={styles.alertBanner}>
                    <View style={styles.alertBannerLeft}>
                        <Feather name="alert-triangle" size={16} color={P.warning} />
                        <View>
                            {statistics.unpaidInvoices > 0 && (
                                <Text style={styles.alertBannerText}>
                                    {statistics.unpaidInvoices} impayé{statistics.unpaidInvoices > 1 ? 's' : ''} — {formatCurrency(statistics.unpaidAmount)}
                                </Text>
                            )}
                            {urgentOrders.length > 0 && (
                                <Text style={styles.alertBannerText}>
                                    {urgentOrders.length} livraison{urgentOrders.length > 1 ? 's' : ''} urgente{urgentOrders.length > 1 ? 's' : ''} cette semaine
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.alertBannerBtn}>
                        <Text style={styles.alertBannerBtnText}>Voir</Text>
                        <Feather name="arrow-right" size={12} color={P.warning} />
                    </TouchableOpacity>
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
                        onPress={() => navigation.navigate('AddCatalogModel')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: 'rgba(108,62,184,0.10)' }]}>
                            <Feather name="image" size={22} color={P.primary} />
                        </View>
                        <Text style={styles.quickLabel}>Ajouter au{'\n'}catalogue</Text>
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
            {activeOrders.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Prochaines livraisons</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>Toutes les commandes</Text>
                        </TouchableOpacity>
                    </View>

                    {activeOrders.map((order) => {
                        const days = daysUntil(new Date(order.deliveryDate));
                        const isUrgent = days <= 3;
                        const statusColor = orderStatusColor[order.orderStatus] ?? P.sub;
                        const statusBg    = orderStatusBg[order.orderStatus]   ?? P.border;

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={[styles.orderCard, isUrgent && styles.orderCardUrgent]}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                activeOpacity={0.8}
                            >
                                {isUrgent && (
                                    <View style={styles.urgentBadge}>
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
                                        <Text style={styles.orderType}   numberOfLines={1}>{order.clothingType}</Text>
                                    </View>

                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {orderStatusLabel[order.orderStatus] ?? order.orderStatus}
                                            </Text>
                                        </View>
                                        <Text style={[styles.orderDays, isUrgent && { color: P.error }]}>
                                            {days <= 0 ? "Aujourd'hui !" : days === 1 ? 'Demain' : `Dans ${days}j`}
                                        </Text>
                                    </View>
                                </View>

                                {order.remainingAmount > 0 && (
                                    <View style={styles.orderPayRow}>
                                        <Feather name="alert-circle" size={11} color={P.error} />
                                        <Text style={styles.orderPayText}>
                                            Reste : {formatCurrency(order.remainingAmount)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* ══ ACTIVITÉS ══ */}
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
                                                <Text style={styles.actAmount}>+{formatCurrency(activity.amount)}</Text>
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
// STYLES — Aucune ombre, borderWidth 0.5
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
        backgroundColor: P.bg,
        borderRadius: 24,
        padding: SPACING.xl,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 0.5,
        borderColor: 'rgba(212,175,55,0.2)',
    },
    heroBlob1:    { position: 'absolute', top: -70,  right: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(108,62,184,0.3)' },
    heroBlob2:    { position: 'absolute', bottom: -60, left: -40, width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(212,175,55,0.05)' },
    heroGoldLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(212,175,55,0.25)' },

    heroTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
    heroLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
    heroAmount:   { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    heroTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    trendPill:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: P.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    trendText:    { fontSize: 11, color: P.success, fontWeight: '700' },
    heroSub:      { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

    heroNetCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, padding: SPACING.md,
        alignItems: 'flex-end',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
    },
    heroNetLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 4 },
    heroNetValue: { fontSize: 18, fontWeight: '800', color: P.gold },

    heroStatsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14, paddingVertical: 12,
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
    },
    heroMiniStat:    { flex: 1, alignItems: 'center', gap: 3 },
    heroStatDivider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
    heroMiniValue:   { fontSize: 20, fontWeight: '800', color: '#fff' },
    heroMiniLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },

    // ── Alerte ──
    alertBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: P.warningBg,
        borderRadius: 14, padding: SPACING.md,
        borderWidth: 0.5, borderColor: 'rgba(217,119,6,0.25)',
        gap: SPACING.sm,
    },
    alertBannerLeft:    { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, flex: 1 },
    alertBannerText:    { fontSize: 12, color: P.warning, fontWeight: '600', lineHeight: 18 },
    alertBannerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
    alertBannerBtnText: { fontSize: 12, color: P.warning, fontWeight: '700' },

    // ── Sections ──
    section:       { gap: SPACING.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle:  { fontSize: 15, fontWeight: '700', color: P.text },
    seeAll:        { fontSize: 12, color: P.primary, fontWeight: '600' },

    // ── Actions rapides ──
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    quickCard: {
        width: '47.5%',
        ...card,
        padding: SPACING.md + 2,
        gap: SPACING.sm,
    },
    quickIcon: {
        width: 44, height: 44, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
    },
    quickLabel: { fontSize: 12, fontWeight: '600', color: P.text, lineHeight: 17 },

    // ── Commandes ──
    orderCard: {
        ...card,
        padding: SPACING.md,
        gap: SPACING.xs,
        overflow: 'hidden',
    },
    orderCardUrgent: {
        borderColor: 'rgba(239,68,68,0.3)',
        borderWidth: 1,
    },
    urgentBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: P.error,
        alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 99, marginBottom: SPACING.xs,
    },
    urgentBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
    orderCardRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    orderAvatar: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.bg,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    orderAvatarText: { fontSize: 13, fontWeight: '800', color: P.gold },
    orderClient:     { fontSize: 13, fontWeight: '700', color: P.text },
    orderType:       { fontSize: 11, color: P.sub, marginTop: 1 },
    statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    statusText:      { fontSize: 10, fontWeight: '700' },
    orderDays:       { fontSize: 11, color: P.sub, fontWeight: '600' },
    orderPayRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingTop: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)',
    },
    orderPayText: { fontSize: 11, color: P.error, fontWeight: '600' },

    // ── Activités ──
    activitiesCard: { ...card, overflow: 'hidden' },
    actRow:    { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
    actIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actBody:   { flex: 1 },
    actTitle:  { fontSize: 13, fontWeight: '600', color: P.text },
    actSub:    { fontSize: 11, color: P.sub, marginTop: 2 },
    actRight:  { alignItems: 'flex-end', gap: 3 },
    actTime:   { fontSize: 10, color: 'rgba(124,111,168,0.6)' },
    actAmount: { fontSize: 12, fontWeight: '700', color: P.success },
    actDivider:{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 60 },

    // ── Vide ──
    emptyCard: {
        ...card,
        padding: SPACING.xl,
        alignItems: 'center',
        gap: SPACING.sm,
        borderStyle: 'dashed',
    },
    emptyText: { fontSize: 13, color: P.sub, textAlign: 'center' },
});
