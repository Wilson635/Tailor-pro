// ==========================================
// COMMANDES — CÔTÉ CLIENT
// Suivi lecture seule (pas de création atelier)
// ==========================================

import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { CLOTHING_TYPE_LABELS } from '@constants/theme';
import {
    STATUT_COMMANDE_LABELS,
    STATUT_COMMANDE_COLORS,
    isDoneOrder,
} from '@constants/commandeConstants';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Palette } from '@/src/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

export const ClientOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { orders, clients, linkedTailors } = useAppStore();

    const linkedIds = useMemo(() => new Set(clients.map(c => c.id)), [clients]);
    const myOrders = useMemo(
        () => orders.filter(o => linkedIds.has(o.clientId)),
        [orders, linkedIds],
    );
    const activeOrders = myOrders.filter((o) => !isDoneOrder(o.orderStatus));
    const pastOrders = myOrders.filter((o) => isDoneOrder(o.orderStatus));
    const primaryTailor = linkedTailors[0] ?? null;

    const contactTailor = () => {
        if (!primaryTailor) return;
        const phone = (primaryTailor.whatsapp ?? primaryTailor.phone ?? '').replace(/\s/g, '');
        if (!phone) return;
        Linking.openURL(`https://wa.me/${phone.replace('+', '')}`);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Espace client</Text>
                    <Text style={styles.headerTitle}>Mes commandes</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {primaryTailor ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mon atelier</Text>
                        <View style={styles.card}>
                            <View style={styles.tailorInfo}>
                                <View style={styles.tailorAvatar}>
                                    <Ionicons name="cut-outline" size={20} color={P.gold} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tailorName}>
                                        {primaryTailor.atelierName ?? primaryTailor.displayName ?? 'Atelier'}
                                    </Text>
                                    {!!primaryTailor.city && (
                                        <Text style={styles.tailorSub}>{primaryTailor.city}</Text>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.connectBtn} onPress={contactTailor}>
                                    <Text style={styles.connectBtnText}>Contacter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.emptyCard}>
                            <Feather name="link" size={24} color={P.gold} />
                            <Text style={styles.emptyText}>
                                Liez votre atelier depuis l’onglet Compte pour synchroniser vos commandes.
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>En confection ({activeOrders.length})</Text>
                    {activeOrders.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="shirt-outline" size={28} color={P.gold} />
                            <Text style={styles.emptyText}>Aucune commande en cours.</Text>
                        </View>
                    ) : (
                        activeOrders.map((order) => {
                            const statusColor = STATUT_COMMANDE_COLORS[order.orderStatus] ?? P.sub;
                            const statusLabel = STATUT_COMMANDE_LABELS[order.orderStatus] ?? order.orderStatus;
                            return (
                                <TouchableOpacity
                                    key={order.id}
                                    style={styles.orderCard}
                                    onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                    activeOpacity={0.82}
                                >
                                    <View style={styles.orderHeader}>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={styles.orderName} numberOfLines={1}>
                                                {CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType}
                                            </Text>
                                            {order.numeroCommande ? (
                                                <Text style={styles.atelierTag}>{order.numeroCommande}</Text>
                                            ) : null}
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}44` }]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.orderFooter}>
                                        <Text style={styles.orderPrice}>{formatCurrencyShort(order.totalPrice)}</Text>
                                        {order.remainingAmount > 0 && (
                                            <Text style={styles.orderRemaining}>
                                                Reste {formatCurrencyShort(order.remainingAmount)}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                {pastOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Historique</Text>
                        {pastOrders.map((order) => (
                            <TouchableOpacity
                                key={order.id}
                                style={[styles.orderCard, styles.pastOrderCard]}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                                activeOpacity={0.82}
                            >
                                <View style={styles.orderHeader}>
                                    <Text style={styles.pastOrderName}>
                                        {CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType}
                                    </Text>
                                    <Ionicons name="checkmark-circle" size={18} color={P.success} />
                                </View>
                                <Text style={styles.orderFooterText}>
                                    Livré · {formatCurrencyShort(order.totalPrice)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const makeStyles = (P: Palette) => ({
    container: { flex: 1, backgroundColor: P.pageBg },
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-end' as const,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
        textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12,
    },
    card: {
        backgroundColor: P.surface, borderRadius: 18, padding: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    tailorInfo: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
    tailorAvatar: {
        width: 42, height: 42, borderRadius: 13, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim,
    },
    tailorName: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    tailorSub: { fontSize: 12, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
    connectBtn: {
        backgroundColor: P.primaryBg, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    connectBtnText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.primary },
    emptyCard: {
        padding: 28, alignItems: 'center' as const, gap: 8, borderRadius: 18,
        borderStyle: 'dashed' as const, borderWidth: 1, borderColor: P.borderHard, backgroundColor: P.surface,
    },
    emptyText: { fontSize: 13, color: P.sub, textAlign: 'center' as const, fontFamily: 'PlusJakartaSans_500Medium' },
    orderCard: {
        padding: 14, marginBottom: 10, borderRadius: 18, backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    pastOrderCard: { opacity: 0.78 },
    orderHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, gap: 8 },
    orderName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    pastOrderName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
    atelierTag: { fontSize: 12, color: P.sub, marginTop: 4, fontFamily: 'PlusJakartaSans_500Medium' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 0.5 },
    statusText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' },
    orderFooter: {
        flexDirection: 'row' as const, justifyContent: 'space-between' as const,
        marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: P.border,
    },
    orderPrice: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    orderRemaining: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.error },
    orderFooterText: { fontSize: 12, color: P.sub, marginTop: 8, fontFamily: 'PlusJakartaSans_500Medium' },
});
