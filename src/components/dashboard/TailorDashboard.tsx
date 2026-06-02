// ==========================================
// COMPOSANT TABLEAU DE BORD - COUTURIER
// Design premium dark/gold — TailorPro
// ==========================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatRelativeTime } from '@utils/formatters';
import { SPACING, BORDER_RADIUS } from '@constants/theme';

// ── Palette locale (identique à AppNavigator) ──
const P = {
    bg:      '#0E0B14',
    surface: '#1A1528',
    border:  '#2E2845',
    text:    '#FFFFFF',
    sub:     'rgba(255,255,255,0.5)',
    muted:   'rgba(255,255,255,0.25)',
    gold:    '#D4AF37',
    goldBg:  'rgba(212,175,55,0.10)',
    goldRim: 'rgba(212,175,55,0.22)',
    success: '#4ADE80',
    successBg: 'rgba(74,222,128,0.12)',
    error:   '#EF4444',
    errorBg: 'rgba(239,68,68,0.12)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.12)',
    info:    '#60A5FA',
    infoBg:  'rgba(96,165,250,0.12)',
    screenBg: '#F7F6FB',
};

// ── Helpers activité ──
type ActivityType = 'new_order' | 'payment_received' | 'order_completed' | 'new_client' | string;

const activityConfig = (type: ActivityType) => {
    switch (type) {
        case 'new_order':        return { icon: 'shopping-bag' as const, color: P.info,    bg: P.infoBg };
        case 'payment_received': return { icon: 'credit-card'  as const, color: P.success, bg: P.successBg };
        case 'order_completed':  return { icon: 'check-circle' as const, color: P.gold,    bg: P.goldBg };
        case 'new_client':       return { icon: 'user-plus'    as const, color: P.warning, bg: P.warningBg };
        default:                 return { icon: 'circle'        as const, color: P.muted,   bg: 'rgba(255,255,255,0.06)' };
    }
};

export const TailorDashboard: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { statistics, activities } = useAppStore();

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
        >

            {/* ══════════════════════════════════
                HERO — Revenus du mois
            ══════════════════════════════════ */}
            <View style={styles.heroCard}>
                {/* Cercles décoratifs */}
                <View style={styles.heroBlob1} />
                <View style={styles.heroBlob2} />
                <View style={styles.heroGoldLine} />

                {/* Sélecteur période */}
                <TouchableOpacity style={styles.heroPeriodPill}>
                    <Text style={styles.heroPeriodText}>Ce mois</Text>
                    <Feather name="chevron-down" size={12} color={P.gold} />
                </TouchableOpacity>

                <Text style={styles.heroLabel}>Revenus du mois</Text>
                <Text style={styles.heroAmount}>
                    {formatCurrency(statistics.monthlyRevenue)}
                </Text>

                {/* Tendance */}
                <View style={styles.heroTrendRow}>
                    <View style={styles.trendPill}>
                        <Feather name="trending-up" size={11} color={P.success} />
                        <Text style={styles.trendPillText}>+{statistics.revenueGrowth}%</Text>
                    </View>
                    <Text style={styles.heroSub}>vs mois dernier</Text>
                </View>
            </View>

            {/* ══════════════════════════════════
                GRILLE DE STATS (2×2)
            ══════════════════════════════════ */}
            <View style={styles.statsGrid}>

                {/* Clients */}
                <View style={[styles.statCard, styles.statCardGold]}>
                    <View style={[styles.statIconBox, { backgroundColor: P.goldBg }]}>
                        <Feather name="users" size={14} color={P.gold} />
                    </View>
                    <Text style={styles.statLabel}>Clients</Text>
                    <Text style={[styles.statValue, { color: P.gold }]}>
                        {statistics.totalClients}
                    </Text>
                    <Text style={[styles.statSub, { color: P.success }]}>+3 ce mois</Text>
                </View>

                {/* En cours */}
                <View style={styles.statCard}>
                    <View style={[styles.statIconBox, { backgroundColor: P.infoBg }]}>
                        <Feather name="clock" size={14} color={P.info} />
                    </View>
                    <Text style={styles.statLabel}>En cours</Text>
                    <Text style={styles.statValue}>{statistics.ordersInProgress}</Text>
                    <Text style={[styles.statSub, { color: P.sub }]}>commandes</Text>
                </View>

                {/* Terminées */}
                <View style={styles.statCard}>
                    <View style={[styles.statIconBox, { backgroundColor: P.successBg }]}>
                        <Feather name="check-circle" size={14} color={P.success} />
                    </View>
                    <Text style={styles.statLabel}>Terminées</Text>
                    <Text style={styles.statValue}>{statistics.completedOrders}</Text>
                    <Text style={[styles.statSub, { color: P.success }]}>ce mois</Text>
                </View>

                {/* Impayées */}
                <View style={styles.statCard}>
                    <View style={[styles.statIconBox, { backgroundColor: P.errorBg }]}>
                        <Feather name="alert-circle" size={14} color={P.error} />
                    </View>
                    <Text style={styles.statLabel}>Impayées</Text>
                    <Text style={styles.statValue}>{statistics.unpaidInvoices}</Text>
                    <Text style={[styles.statSub, { color: P.error }]}>
                        {formatCurrency(statistics.unpaidAmount)}
                    </Text>
                </View>

            </View>

            {/* ══════════════════════════════════
                ACTIONS RAPIDES
            ══════════════════════════════════ */}
            <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
                    <View style={styles.quickIconBox}>
                        <Feather name="plus-circle" size={20} color={P.gold} />
                    </View>
                    <Text style={styles.quickLabel}>Commande</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
                    <View style={styles.quickIconBox}>
                        <Feather name="user-plus" size={20} color={P.gold} />
                    </View>
                    <Text style={styles.quickLabel}>Client</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
                    <View style={styles.quickIconBox}>
                        <Feather name="file-text" size={20} color={P.gold} />
                    </View>
                    <Text style={styles.quickLabel}>Facture</Text>
                </TouchableOpacity>
            </View>

            {/* ══════════════════════════════════
                ACTIVITÉS RÉCENTES
            ══════════════════════════════════ */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Activités récentes</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>Voir tout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.activitiesCard}>
                    {activities.slice(0, 4).map((activity, index) => {
                        const cfg = activityConfig(activity.type);
                        return (
                            <View key={activity.id}>
                                <TouchableOpacity style={styles.activityRow} activeOpacity={0.7}>
                                    <View style={[styles.activityIconBox, { backgroundColor: cfg.bg }]}>
                                        <Feather name={cfg.icon} size={17} color={cfg.color} />
                                    </View>
                                    <View style={styles.activityBody}>
                                        <Text style={styles.activityTitle}>{activity.title}</Text>
                                        <Text style={styles.activitySub}>{activity.subtitle}</Text>
                                    </View>
                                    <View style={styles.activityRight}>
                                        <Text style={styles.activityTime}>
                                            {formatRelativeTime(activity.timestamp)}
                                        </Text>
                                        {activity.amount ? (
                                            <Text style={styles.activityAmount}>
                                                +{formatCurrency(activity.amount)}
                                            </Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                                {index < Math.min(activities.length, 4) - 1 && (
                                    <View style={styles.activityDivider} />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

        </ScrollView>
    );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: P.screenBg },
    content: { padding: SPACING.lg, gap: SPACING.lg },

    /* ── Hero ── */
    heroCard: {
        backgroundColor: P.bg,
        borderRadius: 24,
        padding: SPACING.xl,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: P.border,
        ...Platform.select({
            ios:     { shadowColor: P.bg, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20 },
            android: { elevation: 10 },
        }),
    },
    heroBlob1: {
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(212,175,55,0.06)',
    },
    heroBlob2: {
        position: 'absolute', bottom: -60, left: -30,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(46,0,87,0.5)',
    },
    heroGoldLine: {
        position: 'absolute', top: 0, left: 24, right: 24,
        height: 1, backgroundColor: P.goldRim,
    },
    heroPeriodPill: {
        position: 'absolute', top: SPACING.xl, right: SPACING.xl,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: P.goldBg,
        borderWidth: 1, borderColor: P.goldRim,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 99,
    },
    heroPeriodText: { fontSize: 11, color: P.gold, fontWeight: '600' },
    heroLabel: {
        fontSize: 11, color: P.sub, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 1.5,
        marginBottom: 6, marginTop: 4,
    },
    heroAmount: {
        fontSize: 36, fontWeight: '800', color: P.text,
        letterSpacing: -0.5,
    },
    heroTrendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    trendPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: P.successBg,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    },
    trendPillText: { fontSize: 11, color: P.success, fontWeight: '700' },
    heroSub: { fontSize: 11, color: P.muted },

    /* ── Stats grid ── */
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    statCard: {
        width: '47.5%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: SPACING.md + 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    statCardGold: {
        backgroundColor: P.bg,
        borderColor: P.goldRim,
        ...Platform.select({
            ios:     { shadowColor: P.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    statIconBox: {
        width: 30, height: 30, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: SPACING.sm, alignSelf: 'flex-end',
    },
    statLabel: { fontSize: 10, color: 'rgba(14,11,20,0.45)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { fontSize: 28, fontWeight: '800', color: P.bg, lineHeight: 34, marginTop: 2 },
    statSub:   { fontSize: 11, fontWeight: '600', marginTop: 3 },

    /* ── Quick actions ── */
    quickRow: { flexDirection: 'row', gap: SPACING.sm },
    quickBtn: {
        flex: 1, alignItems: 'center', gap: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 16, paddingVertical: SPACING.md + 2,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    quickIconBox: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.goldBg,
        alignItems: 'center', justifyContent: 'center',
    },
    quickLabel: { fontSize: 11, color: 'rgba(14,11,20,0.5)', fontWeight: '600' },

    /* ── Section ── */
    section: { gap: SPACING.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle:  { fontSize: 15, fontWeight: '700', color: P.bg },
    seeAll:        { fontSize: 13, color: P.gold, fontWeight: '600' },

    /* ── Activities ── */
    activitiesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    activityRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.lg, gap: SPACING.md,
    },
    activityIconBox: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    activityBody:  { flex: 1 },
    activityTitle: { fontSize: 13, fontWeight: '600', color: P.bg },
    activitySub:   { fontSize: 11, color: 'rgba(14,11,20,0.45)', marginTop: 2 },
    activityRight: { alignItems: 'flex-end' },
    activityTime:  { fontSize: 11, color: 'rgba(14,11,20,0.35)' },
    activityAmount:{ fontSize: 13, fontWeight: '700', color: '#16A34A', marginTop: 2 },
    activityDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 68 },
});