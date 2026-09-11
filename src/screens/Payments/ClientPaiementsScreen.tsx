// ──────────────────────────────────────────────────────────
// ClientPaiementsScreen — Module 8
// Historique de tous les paiements d'un client (toutes commandes)
// ──────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';
import { paymentService } from '@services/supabaseService';
import { formatCurrency, formatDate } from '@utils/formatters';
import {
    TYPE_PAIEMENT_META, MODE_PAIEMENT_META, getStatutPaiement,
    STATUT_PAIEMENT_META, TypePaiement, ModePaiement,
} from '@constants/paiementConstants';

// ── Palette ──────────────────────────────────────────────
const P = {
    bg:      '#16123A',
    pageBg:  '#F5F4FB',
    surface: '#FFFFFF',
    text:    '#1A1033',
    sub:     '#7C6FA8',
    border:  'rgba(108,62,184,0.10)',
    primary: '#6C3EB8',
    gold:    '#D4AF37',
};

type Nav  = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ClientPaiements'>;

interface PaymentRow {
    id:            string;
    orderId:       string;
    numeroCommande?: string;
    amount:        number;
    type:          TypePaiement;
    paymentMethod: ModePaiement;
    paymentDate:   string;
    notes?:        string;
    orderTotal:    number;
}

// ──────────────────────────────────────────────────────────
export function ClientPaiementsScreen() {
    const navigation = useNavigation<Nav>();
    const route      = useRoute<Route>();
    const { clientId } = route.params;

    const { clients, orders } = useAppStore();
    const client = clients.find(c => c.id === clientId);

    const [rows, setRows]           = useState<PaymentRow[]>([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Stats dérivées
    const totalPaye    = rows.reduce((s, r) => s + r.amount, 0);
    const totalCommande = orders
        .filter(o => o.clientId === clientId)
        .reduce((s, o) => s + (o.totalPrice ?? 0), 0);
    const soldeRestant = Math.max(0, totalCommande - totalPaye);

    const load = useCallback(async () => {
        // Récupère les IDs de commandes du client
        const clientOrders = orders.filter(o => o.clientId === clientId);
        if (clientOrders.length === 0) { setRows([]); setLoading(false); return; }

        // Charge les paiements pour chaque commande
        const all: PaymentRow[] = [];
        await Promise.all(clientOrders.map(async order => {
            const { data, error } = await paymentService.getByOrder(order.id);
            if (error || !data) return;
            (data as any[]).forEach(p => {
                all.push({
                    id:            p.id,
                    orderId:       order.id,
                    numeroCommande: (order as any).numeroCommande,
                    amount:        Number(p.amount),
                    type:          (p.type ?? 'acompte') as TypePaiement,
                    paymentMethod: (p.payment_method ?? 'cash') as ModePaiement,
                    paymentDate:   p.payment_date,
                    notes:         p.notes ?? undefined,
                    orderTotal:    order.totalPrice ?? 0,
                });
            });
        }));

        // Trier par date décroissante
        all.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        setRows(all);
        setLoading(false);
        setRefreshing(false);
    }, [clientId, orders]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = () => { setRefreshing(true); load(); };

    // ── Rendu ───────────────────────────────────────────
    const renderItem = ({ item }: { item: PaymentRow }) => {
        const typeMeta = TYPE_PAIEMENT_META[item.type] ?? TYPE_PAIEMENT_META.acompte;
        const modeMeta = MODE_PAIEMENT_META[item.paymentMethod] ?? MODE_PAIEMENT_META.cash;
        return (
            <View style={styles.row}>
                {/* Type badge + icône */}
                <View style={[styles.rowIcon, { backgroundColor: typeMeta.bgColor }]}>
                    <Feather name={typeMeta.icon} size={15} color={typeMeta.color} />
                </View>

                {/* Détails */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.rowHeader}>
                        <Text style={styles.rowAmount}>+{formatCurrency(item.amount)}</Text>
                        <Text style={[styles.rowTypeLabel, { color: typeMeta.color }]}>
                            {typeMeta.label}
                        </Text>
                    </View>
                    {item.numeroCommande && (
                        <Text style={styles.rowSub}>Commande {item.numeroCommande}</Text>
                    )}
                    <View style={styles.rowMeta}>
                        <Feather name={modeMeta.icon} size={11} color={P.sub} style={{ marginRight: 4 }} />
                        <Text style={styles.rowMetaText}>{modeMeta.label}</Text>
                        <Text style={[styles.rowMetaText, { marginLeft: 8 }]}>
                            {formatDate(new Date(item.paymentDate))}
                        </Text>
                    </View>
                    {item.notes ? (
                        <Text style={styles.rowNotes}>{item.notes}</Text>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Historique paiements</Text>
                    <Text style={styles.headerSub}>{client?.nom ?? 'Client'}</Text>
                </View>
            </View>

            {/* Stats globales */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{formatCurrency(totalPaye)}</Text>
                    <Text style={styles.statLabel}>Total encaissé</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxMid]}>
                    <Text style={styles.statValue}>{rows.length}</Text>
                    <Text style={styles.statLabel}>Paiements</Text>
                </View>
                <View style={[styles.statBox, { borderRightWidth: 0 }]}>
                    <Text style={[styles.statValue, soldeRestant > 0 && { color: '#D97706' }]}>
                        {formatCurrency(soldeRestant)}
                    </Text>
                    <Text style={styles.statLabel}>Solde restant</Text>
                </View>
            </View>

            {/* Liste */}
            {loading ? (
                <ActivityIndicator color={P.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={r => r.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                            colors={[P.primary]} tintColor={P.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Feather name="credit-card" size={36} color={P.sub} />
                            <Text style={styles.emptyText}>Aucun paiement enregistré</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

// ── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: P.pageBg },
    header: {
        backgroundColor: P.bg,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: P.surface,
        borderBottomWidth: 1, borderBottomColor: P.border,
    },
    statBox: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderRightWidth: 1, borderRightColor: P.border,
    },
    statBoxMid: { borderRightWidth: 1, borderRightColor: P.border },
    statValue: { fontSize: 15, fontWeight: '700', color: P.text },
    statLabel: { fontSize: 10, color: P.sub, marginTop: 2 },

    row: {
        backgroundColor: P.surface,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    rowIcon: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },
    rowHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowAmount:    { fontSize: 15, fontWeight: '700', color: P.text },
    rowTypeLabel: { fontSize: 11, fontWeight: '600' },
    rowSub:       { fontSize: 11, color: P.sub, marginTop: 2 },
    rowMeta:      { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    rowMetaText:  { fontSize: 11, color: P.sub },
    rowNotes:     { fontSize: 11, color: P.sub, fontStyle: 'italic', marginTop: 4 },

    separator: { height: 8 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: P.sub, fontSize: 14 },
});
