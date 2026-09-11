// ==========================================
// COMMANDES — CÔTÉ CLIENT
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { CLOTHING_TYPE_LABELS } from '@constants/theme';
import { STATUT_COMMANDE_LABELS, STATUT_COMMANDE_COLORS } from '@constants/commandeConstants';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProfile } from '@hooks/useProfile';
import { useThemedStyles, type Palette } from '@/src/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const DONE = ['completed', 'delivered', 'terminee', 'livree'];

export const ClientOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { orders } = useAppStore();
    const [searchTailor, setSearchTailor] = useState('');
    const { profile } = useProfile();

    const activeOrders = orders.filter((o) => !DONE.includes(o.orderStatus));
    const pastOrders = orders.filter((o) => DONE.includes(o.orderStatus));

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Mes commandes</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddOrder', { clientId: profile?.id })}
                >
                    <Ionicons name="add" size={18} color={P.gold} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trouver un atelier</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color={P.sub} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Nom, ville, spécialité…"
                            value={searchTailor}
                            onChangeText={setSearchTailor}
                            placeholderTextColor={P.muted}
                        />
                    </View>

                    <View style={styles.card}>
                        <View style={styles.tailorInfo}>
                            <View style={styles.tailorAvatar}>
                                <Ionicons name="cut-outline" size={20} color={P.gold} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.tailorName}>Atelier Haute Couture Pro</Text>
                                <Text style={styles.tailorSub}>À 1.2 km · Costume, robes de mariée</Text>
                            </View>
                            <TouchableOpacity style={styles.connectBtn}>
                                <Text style={styles.connectBtnText}>Contacter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

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
    addBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim, marginBottom: 2,
    },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
        textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
        borderRadius: 14, paddingHorizontal: 14, height: 44, marginBottom: 10,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text },
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
