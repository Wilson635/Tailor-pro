// ==========================================
// TABLEAU DE BORD CLIENT — TailorPro
// Suivi des confections, mesures, catalogue
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { useProfile } from '@hooks/useProfile';
import { formatCurrency, formatDate } from '@utils/formatters';
import { SPACING } from '@constants/theme';
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

const ORDER_STATUS_STEPS = ['pending', 'in_progress', 'completed', 'delivered'];

const ORDER_STATUS_LABELS: Record<string, string> = {
    pending:     'En attente',
    in_progress: 'En cours de confection',
    completed:   'Prêt à livrer',
    delivered:   'Livré',
    cancelled:   'Annulée',
};

const ORDER_STATUS_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
    pending:     'clock',
    in_progress: 'scissors',
    completed:   'check-circle',
    delivered:   'package',
    cancelled:   'x-circle',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
    pending:     P.warning,
    in_progress: P.info,
    completed:   P.success,
    delivered:   P.gold,
    cancelled:   P.error,
};

const ORDER_STATUS_BG: Record<string, string> = {
    pending:     P.warningBg,
    in_progress: P.infoBg,
    completed:   P.successBg,
    delivered:   P.goldBg,
    cancelled:   P.errorBg,
};

const CLOTHING_LABELS: Record<string, string> = {
    robe_longue:  'Robe longue',  robe_courte: 'Robe courte',
    costume:      'Costume',      chemise:     'Chemise',
    pantalon:     'Pantalon',     boubou:      'Boubou',
    ensemble:     'Ensemble',     robe_mariage:'Robe de mariage',
    tenue_enfant: 'Tenue enfant', autre:       'Autre',
};

const daysUntil = (date: Date) =>
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// ──────────────────────────────────────────
// SOUS-COMPOSANT : barre de progression
// ──────────────────────────────────────────

const ProgressStepper = ({ status }: { status: string }) => {
    const stepIndex = ORDER_STATUS_STEPS.indexOf(status);
    if (stepIndex < 0) return null;

    return (
        <View style={ps.row}>
            {ORDER_STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                    <View style={[ps.dot, i <= stepIndex && ps.dotActive]} />
                    {i < ORDER_STATUS_STEPS.length - 1 && (
                        <View style={[ps.line, i < stepIndex && ps.lineActive]} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

const ps = StyleSheet.create({
    row:       { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.1)' },
    dotActive: { backgroundColor: P.primary },
    line:      { flex: 1, height: 2, backgroundColor: 'rgba(0,0,0,0.08)' },
    lineActive:{ backgroundColor: P.primary },
});

// ──────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────

export const ClientDashboard: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const { profile } = useProfile();
    const { orders, measurements } = useAppStore();

    const myId = profile?.id ?? '';

    const myOrders = useMemo(() =>
            orders.filter(o => o.clientId === myId),
        [orders, myId]
    );

    const activeOrders = useMemo(() =>
            myOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'),
        [myOrders]
    );

    const totalDue = useMemo(() =>
            activeOrders.reduce((sum, o) => sum + (o.remainingAmount ?? 0), 0),
        [activeOrders]
    );

    const nextDelivery = useMemo(() => {
        const pending = activeOrders
            .filter(o => o.orderStatus !== 'cancelled')
            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
        return pending[0] ?? null;
    }, [activeOrders]);

    const hasMeasurements = measurements !== null && Object.values(measurements ?? {}).some(v => v != null);

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
                        <Text style={styles.heroLabel}>MES CONFECTIONS EN COURS</Text>
                        <Text style={styles.heroAmount}>
                            {activeOrders.length} tenue{activeOrders.length !== 1 ? 's' : ''}
                        </Text>
                        {nextDelivery && (
                            <View style={styles.heroDeliveryPill}>
                                <Feather name="calendar" size={11} color={P.gold} />
                                <Text style={styles.heroDeliveryText}>
                                    Prochaine livraison : {
                                    (() => {
                                        const d = daysUntil(new Date(nextDelivery.deliveryDate));
                                        if (d <= 0) return "aujourd'hui";
                                        if (d === 1) return "demain";
                                        return `dans ${d} jours`;
                                    })()
                                }
                                </Text>
                            </View>
                        )}
                    </View>

                    {totalDue > 0 && (
                        <View style={styles.heroDueCard}>
                            <Text style={styles.heroDueLabel}>À régler</Text>
                            <Text style={styles.heroDueValue}>{formatCurrency(totalDue)}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ══ ALERTE PAIEMENT ══ */}
            {totalDue > 0 && (
                <View style={styles.alertBanner}>
                    <View style={styles.alertLeft}>
                        <Feather name="alert-circle" size={16} color={P.error} />
                        <Text style={styles.alertText}>
                            Vous avez {formatCurrency(totalDue)} à régler pour vos commandes en cours.
                        </Text>
                    </View>
                </View>
            )}

            {/* ══ ACCÈS RAPIDE ══ */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Accès rapide</Text>
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate('Measurements', { clientId: myId })}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.infoBg }]}>
                            <Ionicons name="body-outline" size={22} color={P.info} />
                        </View>
                        <Text style={styles.quickLabel}>Mes{'\n'}mesures</Text>
                        {!hasMeasurements && (
                            <View style={styles.quickBadge}>
                                <Text style={styles.quickBadgeText}>!</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
                        <View style={[styles.quickIcon, { backgroundColor: 'rgba(108,62,184,0.10)' }]}>
                            <Feather name="grid" size={22} color={P.primary} />
                        </View>
                        <Text style={styles.quickLabel}>Catalogue{'\n'}inspiration</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
                        <View style={[styles.quickIcon, { backgroundColor: P.successBg }]}>
                            <Feather name="message-circle" size={22} color={P.success} />
                        </View>
                        <Text style={styles.quickLabel}>Mon{'\n'}couturier</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ══ MESURES MANQUANTES ══ */}
            {!hasMeasurements && (
                <TouchableOpacity
                    style={styles.measuresBanner}
                    onPress={() => navigation.navigate('AddMeasurements', { clientId: myId })}
                    activeOpacity={0.85}
                >
                    <View style={styles.measuresBannerLeft}>
                        <View style={styles.measuresBannerIcon}>
                            <Ionicons name="body-outline" size={20} color={P.primary} />
                        </View>
                        <View>
                            <Text style={styles.measuresBannerTitle}>Ajoutez vos mesures</Text>
                            <Text style={styles.measuresBannerSub}>
                                Pour des confections parfaitement ajustées
                            </Text>
                        </View>
                    </View>
                    <Feather name="arrow-right" size={16} color={P.primary} />
                </TouchableOpacity>
            )}

            {/* ══ SUIVI COMMANDES ══ */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Suivi de mes commandes</Text>
                    {myOrders.length > 0 && (
                        <Text style={styles.seeAll}>{myOrders.length} commande{myOrders.length !== 1 ? 's' : ''}</Text>
                    )}
                </View>

                {activeOrders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Feather name="inbox" size={32} color="rgba(108,62,184,0.2)" />
                        <Text style={styles.emptyTitle}>Aucune commande en cours</Text>
                        <Text style={styles.emptySub}>
                            Vos commandes apparaîtront ici dès que votre couturier les créera.
                        </Text>
                    </View>
                ) : (
                    activeOrders.map((order) => {
                        const days        = daysUntil(new Date(order.deliveryDate));
                        const statusColor = ORDER_STATUS_COLOR[order.orderStatus] ?? P.sub;
                        const statusBg    = ORDER_STATUS_BG[order.orderStatus]    ?? P.border;
                        const statusIcon  = ORDER_STATUS_ICONS[order.orderStatus] ?? 'circle';
                        const statusLabel = ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus;

                        return (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderCardTop}>
                                    <View style={[styles.orderIconBox, { backgroundColor: statusBg }]}>
                                        <Feather name={statusIcon} size={18} color={statusColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.orderType} numberOfLines={1}>
                                            {CLOTHING_LABELS[order.clothingType] ?? order.clothingType}
                                        </Text>
                                        <Text style={[styles.orderStatus, { color: statusColor }]} numberOfLines={1}>
                                            {statusLabel}
                                        </Text>
                                    </View>
                                    <View style={[styles.deliveryPill, days <= 3 && { backgroundColor: P.errorBg }]}>
                                        <Feather name="calendar" size={10} color={days <= 3 ? P.error : P.sub} />
                                        <Text style={[styles.deliveryText, days <= 3 && { color: P.error }]}>
                                            {days <= 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `${days}j`}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.progressRow}>
                                    <ProgressStepper status={order.orderStatus} />
                                </View>
                                <Text style={styles.progressLabel}>{statusLabel}</Text>

                                {order.remainingAmount > 0 && (
                                    <View style={styles.orderPayRow}>
                                        <Feather name="credit-card" size={12} color={P.error} />
                                        <Text style={styles.orderPayText}>
                                            Reste à régler : <Text style={{ fontWeight: '700' }}>{formatCurrency(order.remainingAmount)}</Text>
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </View>

            {/* ══ HISTORIQUE LIVRÉES ══ */}
            {myOrders.filter(o => o.orderStatus === 'delivered').length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes confections reçues</Text>
                    <View style={styles.historyCard}>
                        {myOrders
                            .filter(o => o.orderStatus === 'delivered')
                            .slice(0, 3)
                            .map((order, index, arr) => (
                                <View key={order.id}>
                                    <View style={styles.historyRow}>
                                        <View style={[styles.historyDot, { backgroundColor: P.successBg }]}>
                                            <Feather name="package" size={14} color={P.success} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.historyTitle}>
                                                {CLOTHING_LABELS[order.clothingType] ?? order.clothingType}
                                            </Text>
                                            <Text style={styles.historySub}>
                                                Livrée • {formatCurrency(order.totalPrice)}
                                            </Text>
                                        </View>
                                        <View style={[styles.paidBadge, order.remainingAmount > 0 && styles.unpaidBadge]}>
                                            <Text style={[styles.paidText, order.remainingAmount > 0 && { color: P.error }]}>
                                                {order.remainingAmount > 0 ? 'Impayée' : 'Soldée'}
                                            </Text>
                                        </View>
                                    </View>
                                    {index < arr.length - 1 && <View style={styles.historyDivider} />}
                                </View>
                            ))
                        }
                    </View>
                </View>
            )}

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
        borderRadius: 24, padding: SPACING.xl,
        overflow: 'hidden', position: 'relative',
        borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)',
    },
    heroBlob1:    { position: 'absolute', top: -60,  right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(108,62,184,0.35)' },
    heroBlob2:    { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(212,175,55,0.04)' },
    heroGoldLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(212,175,55,0.25)' },

    heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
    heroAmount: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    heroDeliveryPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: P.goldBg,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 99, marginTop: 10,
        alignSelf: 'flex-start',
        borderWidth: 0.5, borderColor: P.goldRim,
    },
    heroDeliveryText: { fontSize: 11, color: P.gold, fontWeight: '600' },
    heroDueCard: {
        backgroundColor: P.errorBg,
        borderRadius: 14, padding: SPACING.md,
        alignItems: 'flex-end',
        borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)',
    },
    heroDueLabel: { fontSize: 10, color: 'rgba(239,68,68,0.7)', fontWeight: '600', marginBottom: 4 },
    heroDueValue: { fontSize: 18, fontWeight: '800', color: P.error },

    // ── Alerte paiement ──
    alertBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: P.errorBg,
        borderRadius: 14, padding: SPACING.md,
        borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)',
    },
    alertLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, flex: 1 },
    alertText: { flex: 1, fontSize: 12, color: P.error, fontWeight: '600', lineHeight: 18 },

    // ── Sections ──
    section:       { gap: SPACING.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle:  { fontSize: 15, fontWeight: '700', color: P.text },
    seeAll:        { fontSize: 12, color: P.sub },

    // ── Accès rapide ──
    quickRow:  { flexDirection: 'row', gap: SPACING.sm },
    quickCard: {
        flex: 1, ...card,
        padding: SPACING.md, gap: SPACING.sm,
        alignItems: 'center',
        position: 'relative',
    },
    quickIcon:      { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    quickLabel:     { fontSize: 11, fontWeight: '600', color: P.text, textAlign: 'center', lineHeight: 16 },
    quickBadge: {
        position: 'absolute', top: 8, right: 8,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: P.error, alignItems: 'center', justifyContent: 'center',
    },
    quickBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

    // ── Mesures ──
    measuresBanner: {
        ...card,
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.md,
        borderColor: 'rgba(108,62,184,0.2)',
        borderStyle: 'dashed',
        gap: SPACING.sm,
    },
    measuresBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
    measuresBannerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(108,62,184,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    measuresBannerTitle: { fontSize: 13, fontWeight: '700', color: P.text },
    measuresBannerSub:   { fontSize: 11, color: P.sub, marginTop: 2 },

    // ── Commandes ──
    orderCard:    { ...card, padding: SPACING.md, gap: SPACING.sm },
    orderCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    orderIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    orderType:    { fontSize: 14, fontWeight: '700', color: P.text },
    orderStatus:  { fontSize: 12, marginTop: 2, fontWeight: '600' },
    deliveryPill: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: P.border,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    },
    deliveryText:  { fontSize: 11, color: P.sub, fontWeight: '600' },
    progressRow:   { flexDirection: 'row', alignItems: 'center' },
    progressLabel: { fontSize: 11, color: P.sub, fontWeight: '500' },
    orderPayRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)',
    },
    orderPayText: { fontSize: 12, color: P.error },

    // ── Historique ──
    historyCard:   { ...card, overflow: 'hidden' },
    historyRow:    { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
    historyDot:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    historyTitle:  { fontSize: 13, fontWeight: '600', color: P.text },
    historySub:    { fontSize: 11, color: P.sub, marginTop: 2 },
    paidBadge:     { backgroundColor: P.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    unpaidBadge:   { backgroundColor: P.errorBg },
    paidText:      { fontSize: 10, fontWeight: '700', color: P.success },
    historyDivider:{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 60 },

    // ── Vide ──
    emptyCard: {
        ...card,
        padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm,
        borderStyle: 'dashed', borderColor: 'rgba(108,62,184,0.15)',
    },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: P.text },
    emptySub:   { fontSize: 12, color: P.sub, textAlign: 'center', lineHeight: 18 },
});
