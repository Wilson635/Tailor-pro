// ==========================================
// TABLEAU DE BORD CLIENT — TailorPro
// Suivi des confections, mesures, atelier
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
import { formatCurrencyShort } from '@utils/formatters';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';
import {
    CLIENT_PROGRESS_STEPS,
    STATUT_COMMANDE_LABELS,
    getClientProgressIndex,
    isCancelledOrder,
    isDoneOrder,
} from '@constants/commandeConstants';
import { showAlert } from '@/src/context/DialogContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CLOTHING_LABELS: Record<string, string> = {
    robe_longue:  'Robe longue',  robe_courte: 'Robe courte',
    costume:      'Costume',      chemise:     'Chemise',
    pantalon:     'Pantalon',     boubou:      'Boubou',
    ensemble:     'Ensemble',     robe_mariage:'Robe de mariage',
    tenue_enfant: 'Tenue enfant', autre:       'Autre',
};

const daysUntil = (date: Date) =>
    Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const STEP_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
    en_attente:    'clock',
    en_confection: 'scissors',
    essayage:      'user',
    retouches:     'edit-2',
    terminee:      'check-circle',
    livree:        'package',
    annulee:       'x-circle',
};

const statusColor = (P: Palette): Record<string, string> => ({
    en_attente:    P.warning,
    en_confection: P.info,
    essayage:      P.primary,
    retouches:     P.warning,
    terminee:      P.success,
    livree:        P.gold,
    annulee:       P.error,
});

const statusBg = (P: Palette): Record<string, string> => ({
    en_attente:    P.warningBg,
    en_confection: P.infoBg,
    essayage:      P.primaryBg,
    retouches:     P.warningBg,
    terminee:      P.successBg,
    livree:        P.goldBg,
    annulee:       P.errorBg,
});

const ProgressStepper = ({ status }: { status: string }) => {
    const { colors: P, styles: ps } = useThemedStyles(makeStepperStyles);
    const stepIndex = getClientProgressIndex(status);
    if (stepIndex < 0) return null;

    return (
        <View style={ps.row}>
            {CLIENT_PROGRESS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                    <View style={[ps.dot, i <= stepIndex && { backgroundColor: P.primary }]} />
                    {i < CLIENT_PROGRESS_STEPS.length - 1 && (
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

export const ClientDashboard: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { orders, clients, linkedTailors, fiches } = useAppStore();

    const linkedIds = useMemo(() => new Set(clients.map(c => c.id)), [clients]);
    const primaryClient = clients[0] ?? null;
    const primaryTailor = linkedTailors[0] ?? null;

    const myOrders = useMemo(
        () => orders.filter(o => linkedIds.has(o.clientId)),
        [orders, linkedIds],
    );

    const activeOrders = useMemo(
        () => myOrders.filter(o => !isDoneOrder(o.orderStatus) && !isCancelledOrder(o.orderStatus)),
        [myOrders],
    );

    const deliveredOrders = useMemo(
        () => myOrders.filter(o => isDoneOrder(o.orderStatus)),
        [myOrders],
    );

    const totalDue = useMemo(
        () => activeOrders.reduce((sum, o) => sum + (o.remainingAmount ?? 0), 0),
        [activeOrders],
    );

    const nextDelivery = useMemo(() => {
        const pending = [...activeOrders].sort(
            (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime(),
        );
        return pending[0] ?? null;
    }, [activeOrders]);

    const hasMeasurements = useMemo(() => {
        if (!primaryClient) return false;
        const list = fiches[primaryClient.id] ?? [];
        return list.length > 0;
    }, [fiches, primaryClient]);

    const goToMesures = () => {
        if (!primaryClient) {
            showAlert('Atelier requis', 'Liez d’abord votre atelier depuis l’onglet Compte.');
            return;
        }
        navigation.navigate('Measurements', { clientId: primaryClient.id });
    };

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
            showsVerticalScrollIndicator={false}
        >
            {!primaryClient && !primaryTailor && (
                <View style={styles.linkBanner}>
                    <View style={styles.linkBannerIcon}>
                        <Feather name="link" size={18} color={P.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.linkBannerTitle}>Liez votre atelier</Text>
                        <Text style={styles.linkBannerSub}>
                            Entrez le code d’invitation dans l’onglet Compte pour voir vos commandes.
                        </Text>
                    </View>
                </View>
            )}

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
                                        if (d === 1) return 'demain';
                                        return `dans ${d} jours`;
                                    })()
                                }
                                </Text>
                            </View>
                        )}
                        {primaryTailor && (
                            <Text style={styles.heroAtelier}>
                                {primaryTailor.atelierName ?? primaryTailor.displayName ?? 'Mon atelier'}
                            </Text>
                        )}
                    </View>

                    {totalDue > 0 && (
                        <TouchableOpacity
                            style={styles.heroDueCard}
                            onPress={() => {
                                if (primaryClient) {
                                    navigation.navigate('ClientPaiements', { clientId: primaryClient.id });
                                }
                            }}
                        >
                            <Text style={styles.heroDueLabel}>À régler</Text>
                            <Text style={styles.heroDueValue}>{formatCurrencyShort(totalDue)}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {totalDue > 0 && (
                <TouchableOpacity
                    style={styles.alertBanner}
                    onPress={() => {
                        if (primaryClient) {
                            navigation.navigate('ClientPaiements', { clientId: primaryClient.id });
                        }
                    }}
                    activeOpacity={0.85}
                >
                    <View style={styles.alertLeft}>
                        <Feather name="alert-circle" size={16} color={P.error} />
                        <Text style={styles.alertText}>
                            Vous avez {formatCurrencyShort(totalDue)} à régler — voir l’historique des paiements.
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={P.error} />
                </TouchableOpacity>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Accès rapide</Text>
                <View style={styles.quickRow}>
                    <TouchableOpacity style={styles.quickCard} onPress={goToMesures} activeOpacity={0.8}>
                        <View style={[styles.quickIcon, { backgroundColor: P.infoBg }]}>
                            <Ionicons name="body-outline" size={22} color={P.info} />
                        </View>
                        <Text style={styles.quickLabel}>Mes{'\n'}mesures</Text>
                        {!hasMeasurements && primaryClient && (
                            <View style={styles.quickBadge}>
                                <Text style={styles.quickBadgeText}>!</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => {
                            if (primaryClient) {
                                navigation.navigate('ClientPaiements', { clientId: primaryClient.id });
                            } else {
                                showAlert('Atelier requis', 'Liez d’abord votre atelier depuis l’onglet Compte.');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.primaryBg }]}>
                            <Feather name="credit-card" size={22} color={P.primary} />
                        </View>
                        <Text style={styles.quickLabel}>Mes{'\n'}paiements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => {
                            if (!primaryTailor) {
                                showAlert('Atelier requis', 'Liez d’abord votre atelier depuis l’onglet Compte.');
                                return;
                            }
                            navigation.navigate('ClientRequest', { tailorId: primaryTailor.id, kind: 'devis' });
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.quickIcon, { backgroundColor: P.goldBg }]}>
                            <Feather name="file-text" size={22} color={P.gold} />
                        </View>
                        <Text style={styles.quickLabel}>Devis{'\n'}& RDV</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={styles.measuresBanner}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Decouvrir' })}
                activeOpacity={0.85}
            >
                <View style={styles.measuresBannerLeft}>
                    <View style={[styles.measuresBannerIcon, { backgroundColor: P.goldBg }]}>
                        <Feather name="compass" size={20} color={P.gold} />
                    </View>
                    <View>
                        <Text style={styles.measuresBannerTitle}>Découvrir les modèles</Text>
                        <Text style={styles.measuresBannerSub}>Catalogues publics des ateliers</Text>
                    </View>
                </View>
                <Feather name="arrow-right" size={16} color={P.gold} />
            </TouchableOpacity>

            {!hasMeasurements && primaryClient && (
                <TouchableOpacity style={styles.measuresBanner} onPress={goToMesures} activeOpacity={0.85}>
                    <View style={styles.measuresBannerLeft}>
                        <View style={styles.measuresBannerIcon}>
                            <Ionicons name="body-outline" size={20} color={P.primary} />
                        </View>
                        <View>
                            <Text style={styles.measuresBannerTitle}>Consultez vos mesures</Text>
                            <Text style={styles.measuresBannerSub}>
                                Fiches prises par votre couturier
                            </Text>
                        </View>
                    </View>
                    <Feather name="arrow-right" size={16} color={P.primary} />
                </TouchableOpacity>
            )}

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Suivi de mes commandes</Text>
                    {myOrders.length > 0 && (
                        <Text style={styles.seeAll}>
                            {myOrders.length} commande{myOrders.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                {activeOrders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Feather name="inbox" size={32} color={P.gold} />
                        <Text style={styles.emptyTitle}>Aucune commande en cours</Text>
                        <Text style={styles.emptySub}>
                            {primaryClient
                                ? 'Vos commandes apparaîtront ici dès que votre couturier les créera.'
                                : 'Liez votre atelier pour synchroniser vos confections.'}
                        </Text>
                    </View>
                ) : (
                    activeOrders.map((order) => {
                        const days = daysUntil(new Date(order.deliveryDate));
                        const step = CLIENT_PROGRESS_STEPS[Math.max(0, getClientProgressIndex(order.orderStatus))] ?? 'en_attente';
                        const stColor = statusColor(P)[step] ?? P.sub;
                        const stBg = statusBg(P)[step] ?? P.border;
                        const statusIcon = STEP_ICONS[step] ?? 'circle';
                        const statusLabel = STATUT_COMMANDE_LABELS[order.orderStatus] ?? order.orderStatus;

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderCard}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                activeOpacity={0.82}
                            >
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
                                            Reste à régler :{' '}
                                            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                                                {formatCurrencyShort(order.remainingAmount)}
                                            </Text>
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {deliveredOrders.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes confections reçues</Text>
                    <View style={styles.historyCard}>
                        {deliveredOrders.slice(0, 3).map((order, index, arr) => (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                activeOpacity={0.8}
                            >
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
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const makeStyles = (P: Palette) => ({
    scroll:  { flex: 1, backgroundColor: P.pageBg },
    content: { padding: 20, gap: 16 },

    linkBanner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
        backgroundColor: '#16123A',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: P.goldRim,
    },
    linkBannerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.goldBg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    linkBannerTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
    linkBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },

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
    heroAtelier: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontFamily: 'PlusJakartaSans_500Medium' },
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
        borderWidth: 0.5, borderColor: P.error, gap: 8,
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
