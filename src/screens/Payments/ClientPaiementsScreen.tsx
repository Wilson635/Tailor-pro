// ==========================================
// HISTORIQUE PAIEMENTS — vue client
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';
import { paymentService } from '@services/supabaseService';
import { formatCurrency, formatDate } from '@utils/formatters';
import {
    TYPE_PAIEMENT_META, MODE_PAIEMENT_META,
    TypePaiement, ModePaiement,
} from '@constants/paiementConstants';
import { useThemedStyles, type Palette } from '@/src/theme';
import { isCancelledOrder } from '@constants/commandeConstants';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ClientPaiements'>;

interface PaymentRow {
    id: string;
    orderId: string;
    numeroCommande?: string;
    amount: number;
    type: TypePaiement;
    paymentMethod: ModePaiement;
    paymentDate: string;
    notes?: string;
    orderTotal: number;
    tailorId?: string;
}

export function ClientPaiementsScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const insets = useSafeAreaInsets();
    const { clientId } = route.params;
    const { colors: P, styles } = useThemedStyles(makeStyles);

    const { clients, orders, getAtelierById, linkedTailors } = useAppStore();
    const client = clients.find(c => c.id === clientId);

    const [rows, setRows] = useState<PaymentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const totalPaye = rows.reduce((s, r) => s + r.amount, 0);
    const totalCommande = orders
        .filter(o => o.clientId === clientId && !isCancelledOrder(o.orderStatus))
        .reduce((s, o) => s + (o.totalPrice ?? 0), 0);
    const soldeRestant = Math.max(0, totalCommande - totalPaye);

    const load = useCallback(async () => {
        const clientOrders = orders.filter(o => o.clientId === clientId);
        if (clientOrders.length === 0) {
            setRows([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const all: PaymentRow[] = [];
        await Promise.all(clientOrders.map(async order => {
            const { data, error } = await paymentService.getByOrder(order.id);
            if (error || !data) return;
            (data as any[]).forEach(p => {
                all.push({
                    id: p.id,
                    orderId: order.id,
                    numeroCommande: order.numeroCommande,
                    amount: Number(p.amount),
                    type: (p.type ?? 'acompte') as TypePaiement,
                    paymentMethod: (p.method ?? p.payment_method ?? 'cash') as ModePaiement,
                    paymentDate: p.date ?? p.payment_date,
                    notes: p.notes ?? undefined,
                    orderTotal: order.totalPrice ?? 0,
                    tailorId: order.couturierId,
                });
            });
        }));

        all.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        setRows(all);
        setLoading(false);
        setRefreshing(false);
    }, [clientId, orders]);

    useEffect(() => { load(); }, [load]);

    const atelierLabel = (tailorId?: string) => {
        const a = (tailorId && getAtelierById(tailorId)) || linkedTailors[0];
        return a?.atelierName || a?.displayName || null;
    };

    const renderItem = ({ item }: { item: PaymentRow }) => {
        const typeMeta = TYPE_PAIEMENT_META[item.type] ?? TYPE_PAIEMENT_META.acompte;
        const modeMeta = MODE_PAIEMENT_META[item.paymentMethod] ?? MODE_PAIEMENT_META.cash;
        const atelier = atelierLabel(item.tailorId);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => {
                    const order = orders.find(o => o.id === item.orderId);
                    const paid = Math.max(0, (order?.totalPrice ?? item.orderTotal) - (order?.remainingAmount ?? 0));
                    navigation.navigate('Recu', {
                        amount: item.amount,
                        typePaiement: item.type,
                        modePaiement: item.paymentMethod,
                        date: item.paymentDate,
                        notes: item.notes,
                        clientName: client?.nom ?? 'Client',
                        commandeNumero: item.numeroCommande,
                        totalAmount: item.orderTotal,
                        paidAmount: paid,
                        remaining: order?.remainingAmount ?? Math.max(0, item.orderTotal - paid),
                        tailorId: item.tailorId ?? order?.couturierId,
                        orderId: item.orderId,
                    });
                }}
            >
                <View style={styles.iconWrap}>
                    <Feather name={typeMeta.icon} size={16} color={P.gold} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardAmount}>+{formatCurrency(item.amount)}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                        {typeMeta.label}
                        {item.numeroCommande ? ` · ${item.numeroCommande}` : ''}
                    </Text>
                    {atelier ? (
                        <Text style={styles.cardAtelier} numberOfLines={1}>{atelier}</Text>
                    ) : null}
                    <View style={styles.metaRow}>
                        <Feather name={modeMeta.icon} size={11} color={P.muted} />
                        <Text style={styles.metaText}>{modeMeta.label}</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.metaText}>
                            {item.paymentDate ? formatDate(new Date(item.paymentDate)) : ''}
                        </Text>
                    </View>
                </View>
                <Feather name="chevron-right" size={16} color={P.muted} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Paiements</Text>
                    <Text style={styles.headerTitle}>Historique</Text>
                    {client ? <Text style={styles.headerSub}>{client.nom}</Text> : null}
                </View>
            </View>

            <View style={styles.stats}>
                <View style={styles.stat}>
                    <Text style={styles.statLbl}>Encaissé</Text>
                    <Text style={[styles.statVal, { color: P.gold }]}>{formatCurrency(totalPaye)}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLbl}>Mouvements</Text>
                    <Text style={styles.statVal}>{rows.length}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLbl}>Reste dû</Text>
                    <Text style={[styles.statVal, soldeRestant > 0 && { color: P.warning }]}>
                        {formatCurrency(soldeRestant)}
                    </Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color={P.gold} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={r => r.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(); }}
                            tintColor={P.gold}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIcon}>
                                <Feather name="credit-card" size={24} color={P.gold} />
                            </View>
                            <Text style={styles.emptyTitle}>Aucun paiement</Text>
                            <Text style={styles.emptySub}>
                                Les encaissements de vos confections apparaîtront ici.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const makeStyles = (P: Palette) => ({
    root: { flex: 1, backgroundColor: P.pageBg },
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    headerSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 4 },
    stats: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, marginBottom: 14 },
    stat: {
        flex: 1, backgroundColor: P.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8,
        borderWidth: 0.5, borderColor: P.borderHard, alignItems: 'center' as const,
    },
    statLbl: { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 4 },
    statVal: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, textAlign: 'center' as const },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
        backgroundColor: P.surface, borderRadius: 18, padding: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    iconWrap: {
        width: 42, height: 42, borderRadius: 14, backgroundColor: P.goldBg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 0.5, borderColor: P.goldRim,
    },
    cardAmount: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    cardSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
    cardAtelier: {
        fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 0.4, textTransform: 'uppercase' as const, marginTop: 4,
    },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 6 },
    metaText: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted },
    metaDot: { fontSize: 11, color: P.muted },
    empty: { alignItems: 'center' as const, paddingTop: 56, paddingHorizontal: 28 },
    emptyIcon: {
        width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
        alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
    },
    emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    emptySub: {
        fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub,
        textAlign: 'center' as const, marginTop: 6, lineHeight: 20,
    },
});
