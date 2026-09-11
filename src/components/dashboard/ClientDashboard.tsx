// ==========================================
// TABLEAU DE BORD CLIENT — TailorPro
// Suivi des confections, mesures, catalogue
// Sans ombres
// ==========================================

import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { useProfile } from '@hooks/useProfile';
import { formatCurrencyShort } from '@utils/formatters';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

const statusColor = (P: Palette): Record<string, string> => ({
    pending:     P.warning,
    in_progress: P.info,
    completed:   P.success,
    delivered:   P.gold,
    cancelled:   P.error,
});

const statusBg = (P: Palette): Record<string, string> => ({
    pending:     P.warningBg,
    in_progress: P.infoBg,
    completed:   P.successBg,
    delivered:   P.goldBg,
    cancelled:   P.errorBg,
});

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
    const { colors: P, styles: ps } = useThemedStyles(makeStepperStyles);
    const stepIndex = ORDER_STATUS_STEPS.indexOf(status);
    if (stepIndex < 0) return null;

    return (
        <View style={ps.row}>
            {ORDER_STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                    <View style={[ps.dot, i <= stepIndex && { backgroundColor: P.primary }]} />
                    {i < ORDER_STATUS_STEPS.length - 1 && (
                        <View style={[ps.line, i < stepIndex && { backgroundColor: P.primary }]} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

const makeStepperStyles = (P: Palette) => ({
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.borderHard },
    line: { flex: 1, height: 2, backgroundColor: P.borderHard },
});

// ──────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────

export const ClientDashboard: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const { colors: P, styles } = useThemedStyles(makeStyles);
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
                            <Text style={styles.heroDueValue}>{formatCurrencyShort(totalDue)}</Text>
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
                            Vous avez {formatCurrencyShort(totalDue)} à régler pour vos commandes en cours.
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
                        <View style={[styles.quickIcon, { backgroundColor: P.primaryBg }]}>
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
                        <Feather name="inbox" size={32} color={P.gold} />
                        <Text style={styles.emptyTitle}>Aucune commande en cours</Text>
                        <Text style={styles.emptySub}>
                            Vos commandes apparaîtront ici dès que votre couturier les créera.
                        </Text>
                    </View>
                ) : (
                    activeOrders.map((order) => {
                        const days        = daysUntil(new Date(order.deliveryDate));
                        const stColor = statusColor(P)[order.orderStatus] ?? P.sub;
                        const stBg    = statusBg(P)[order.orderStatus]    ?? P.border;
                        const statusIcon  = ORDER_STATUS_ICONS[order.orderStatus] ?? 'circle';
                        const statusLabel = ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus;

                        return (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderCardTop}>
                                    <View style={[styles.orderIconBox, { backgroundColor: stBg }]}>
                                        <Feather name={statusIcon} size={18} color={stColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.orderType} numberOfLines={1}>
                                            {CLOTHING_LABELS[order.clothingType] ?? order.clothingType}
                                        </Text>
                                        <Text style={[styles.orderStatus, { color: stColor }]} numberOfLines={1}>
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
                                            Reste à régler : <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{formatCurrencyShort(order.remainingAmount)}</Text>
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
                                                Livrée • {formatCurrencyShort(order.totalPrice)}
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

const makeStyles = (P: Palette) => ({
    scroll:  { flex: 1, backgroundColor: P.pageBg },
    content: { padding: 20, gap: 16 },

    heroCard: {
        backgroundColor: '#16123A',
        borderRadius: 24, padding: 20,
        overflow: 'hidden' as const, position: 'relative' as const,
        borderWidth: 1, borderColor: P.goldRim,
    },
    heroBlob1:    { position: 'absolute' as const, top: -60,  right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(108,62,184,0.35)' },
    heroBlob2:    { position: 'absolute' as const, bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80,  backgroundColor: 'rgba(212,175,55,0.04)' },
    heroGoldLine: { position: 'absolute' as const, top: 0, left: 24, right: 24, height: 1, backgroundColor: P.goldRim },

    heroTop:    { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const },
    heroLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1.5, marginBottom: 6 },
    heroAmount: { fontSize: 34, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff', letterSpacing: -0.5 },
    heroDeliveryPill: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
        backgroundColor: P.goldBg,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, marginTop: 10,
        alignSelf: 'flex-start' as const,
        borderWidth: 0.5, borderColor: P.goldRim,
    },
    heroDeliveryText: { fontSize: 11, color: P.gold, fontFamily: 'PlusJakartaSans_600SemiBold' },
    heroDueCard: {
        backgroundColor: P.errorBg,
        borderRadius: 14, padding: 12,
        alignItems: 'flex-end' as const,
        borderWidth: 0.5, borderColor: P.error,
    },
    heroDueLabel: { fontSize: 10, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 },
    heroDueValue: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.error },

    alertBanner: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        backgroundColor: P.errorBg,
        borderRadius: 16, padding: 14,
        borderWidth: 0.5, borderColor: P.error,
    },
    alertLeft: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8, flex: 1 },
    alertText: { flex: 1, fontSize: 12, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold', lineHeight: 18 },

    section:       { gap: 12 },
    sectionHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    sectionTitle:  { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    seeAll:        { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },

    quickRow:  { flexDirection: 'row' as const, gap: 8 },
    quickCard: {
        flex: 1, backgroundColor: P.surface, borderRadius: 18,
        borderWidth: 0.5, borderColor: P.borderHard,
        padding: 14, gap: 8,
        alignItems: 'center' as const,
        position: 'relative' as const,
    },
    quickIcon:      { width: 44, height: 44, borderRadius: 13, alignItems: 'center' as const, justifyContent: 'center' as const },
    quickLabel:     { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text, textAlign: 'center' as const, lineHeight: 16 },
    quickBadge: {
        position: 'absolute' as const, top: 8, right: 8,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: P.error, alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    quickBadgeText: { fontSize: 9, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff' },

    measuresBanner: {
        backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
        flexDirection: 'row' as const, alignItems: 'center' as const,
        padding: 14, borderStyle: 'dashed' as const, gap: 8,
    },
    measuresBannerLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, flex: 1 },
    measuresBannerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.primaryBg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    measuresBannerTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    measuresBannerSub:   { fontSize: 11, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },

    orderCard:    {
        backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
        padding: 14, gap: 8,
    },
    orderCardTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
    orderIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center' as const, justifyContent: 'center' as const },
    orderType:    { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    orderStatus:  { fontSize: 12, marginTop: 2, fontFamily: 'PlusJakartaSans_600SemiBold' },
    deliveryPill: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3,
        backgroundColor: P.pageBg,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    deliveryText:  { fontSize: 11, color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    progressRow:   { flexDirection: 'row' as const, alignItems: 'center' as const },
    progressLabel: { fontSize: 11, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
    orderPayRow: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
        paddingTop: 8, borderTopWidth: 0.5, borderTopColor: P.borderHard,
    },
    orderPayText: { fontSize: 12, color: P.error },

    historyCard:   {
        backgroundColor: P.surface, borderRadius: 18, overflow: 'hidden' as const,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    historyRow:    { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 14, gap: 10 },
    historyDot:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
    historyTitle:  { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    historySub:    { fontSize: 11, color: P.sub, marginTop: 2 },
    paidBadge:     { backgroundColor: P.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    unpaidBadge:   { backgroundColor: P.errorBg },
    paidText:      { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.success },
    historyDivider:{ height: 0.5, backgroundColor: P.borderHard, marginLeft: 60 },

    emptyCard: {
        backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
        padding: 20, alignItems: 'center' as const, gap: 8,
        borderStyle: 'dashed' as const,
    },
    emptyTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    emptySub:   { fontSize: 12, color: P.sub, textAlign: 'center' as const, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' },
});
