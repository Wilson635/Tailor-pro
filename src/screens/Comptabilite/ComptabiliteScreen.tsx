// ──────────────────────────────────────────────────────────
// ComptabiliteScreen — Module 9
// Vue financière consolidée avec filtrage par période,
// liste débiteurs et export CSV.
// ──────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, TextInput, Share,
    Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';
import { comptabiliteService } from '@services/supabaseService';
import { formatCurrency, formatDate } from '@utils/formatters';
import { TYPE_PAIEMENT_META, TypePaiement } from '@constants/paiementConstants';

// ── Palette ──────────────────────────────────────────────
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
    success:   '#059669',
    successBg: 'rgba(5,150,105,0.10)',
    warning:   '#D97706',
    warningBg: 'rgba(217,119,6,0.10)',
    error:     '#DC2626',
    errorBg:   'rgba(220,38,38,0.10)',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = 'jour' | 'semaine' | 'mois' | 'custom';

interface PaymentRow {
    id:            string;
    orderId:       string;
    clientName?:   string;
    amount:        number;
    type:          string;
    paymentMethod: string;
    paymentDate:   string;
    notes?:        string;
}

interface OrderRow {
    id:              string;
    clientId:        string;
    clientName:      string;
    totalPrice:      number;
    remainingAmount: number;
    paymentStatus:   string;
    orderStatus:     string;
    createdAt:       string;
    numeroCommande?: string;
}

// ── Helpers dates ──────────────────────────────────────────
const startOfDay   = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const startOfWeek  = (d: Date) => {
    const r = new Date(d);
    const day = r.getDay(); // 0=Sun, 1=Mon...
    r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
    r.setHours(0,0,0,0);
    return r;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const parseDateStr = (s: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
};

// ── Composants UI ────────────────────────────────────────
const KpiCard = ({
                     icon, label, value, sub, color, bgColor,
                 }: {
    icon: string; label: string; value: string; sub?: string;
    color: string; bgColor: string;
}) => (
    <View style={[kpiStyles.card, { borderLeftColor: color }]}>
        <View style={[kpiStyles.iconWrap, { backgroundColor: bgColor }]}>
            <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={kpiStyles.value}>{value}</Text>
        <Text style={kpiStyles.label}>{label}</Text>
        {sub ? <Text style={kpiStyles.sub}>{sub}</Text> : null}
    </View>
);

const kpiStyles = StyleSheet.create({
    card: {
        flex: 1, backgroundColor: P.surface, borderRadius: 12, padding: 14,
        borderLeftWidth: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    iconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    value:    { fontSize: 17, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    label:    { fontSize: 11, color: P.sub, marginTop: 2 },
    sub:      { fontSize: 10, color: P.sub, marginTop: 1, fontStyle: 'italic' },
});

// ──────────────────────────────────────────────────────────
// SCREEN
// ──────────────────────────────────────────────────────────
export function ComptabiliteScreen() {
    const navigation = useNavigation<Nav>();
    const { orders: storeOrders, clients } = useAppStore();

    const [allPayments, setAllPayments] = useState<PaymentRow[]>([]);
    const [allOrders,   setAllOrders]   = useState<OrderRow[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);

    // Période
    const [period,      setPeriod]    = useState<Period>('mois');
    const [customFrom,  setCustomFrom] = useState('');
    const [customTo,    setCustomTo]   = useState('');

    // UI
    const [showDebtors, setShowDebtors] = useState(false);
    const [exporting,   setExporting]   = useState(false);

    // ── Chargement ─────────────────────────────────────────
    const load = useCallback(async () => {
        const [paymentsRes, ordersRes] = await Promise.all([
            comptabiliteService.getAllPayments(),
            comptabiliteService.getAllOrders(),
        ]);

        if (paymentsRes.data) {
            setAllPayments((paymentsRes.data as any[]).map(p => ({
                id:            p.id,
                orderId:       p.order_id,
                amount:        Number(p.amount),
                type:          p.type ?? 'acompte',
                paymentMethod: p.payment_method ?? 'cash',
                paymentDate:   p.payment_date,
                notes:         p.notes ?? undefined,
            })));
        }

        if (ordersRes.data) {
            setAllOrders((ordersRes.data as any[]).map(o => ({
                id:              o.id,
                clientId:        o.client_id,
                clientName:      o.client_name ?? '—',
                totalPrice:      Number(o.total_price ?? 0),
                remainingAmount: Number(o.remaining_amount ?? 0),
                paymentStatus:   o.payment_status ?? 'unpaid',
                orderStatus:     o.order_status ?? '',
                createdAt:       o.created_at,
                numeroCommande:  o.numero_commande ?? undefined,
            })));
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = () => { setRefreshing(true); load(); };

    // ── Calcul de la plage de dates ────────────────────────
    const dateRange = useMemo((): { from: Date; to: Date } | null => {
        const now = new Date();
        switch (period) {
            case 'jour':
                return { from: startOfDay(now), to: now };
            case 'semaine':
                return { from: startOfWeek(now), to: now };
            case 'mois':
                return { from: startOfMonth(now), to: now };
            case 'custom': {
                const f = parseDateStr(customFrom);
                const t = parseDateStr(customTo);
                if (!f || !t) return null;
                const to = new Date(t); to.setHours(23,59,59,999);
                return { from: f, to };
            }
        }
    }, [period, customFrom, customTo]);

    // ── Agrégations paiements sur la période ───────────────
    const periodPayments = useMemo(() => {
        if (!dateRange) return [];
        return allPayments.filter(p => {
            const d = new Date(p.paymentDate);
            return d >= dateRange.from && d <= dateRange.to;
        });
    }, [allPayments, dateRange]);

    // ── Agrégations commandes créées sur la période ────────
    const periodOrders = useMemo(() => {
        if (!dateRange) return [];
        return allOrders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= dateRange.from && d <= dateRange.to;
        });
    }, [allOrders, dateRange]);

    // ── KPIs ────────────────────────────────────────────────
    const totalEncaisse   = periodPayments.reduce((s, p) => s + p.amount, 0);
    const nbCommandes     = periodOrders.length;
    const acomptes        = periodPayments.filter(p => p.type === 'acompte');
    const soldesFinals    = periodPayments.filter(p => p.type === 'solde_final');
    const totalAcomptes   = acomptes.reduce((s, p) => s + p.amount, 0);
    const totalSoldes     = soldesFinals.reduce((s, p) => s + p.amount, 0);

    // ── Débiteurs (global, toutes périodes) ────────────────
    const debtors = useMemo(() =>
            allOrders
                .filter(o => o.remainingAmount > 0 && o.paymentStatus !== 'paid')
                .sort((a, b) => b.remainingAmount - a.remainingAmount),
        [allOrders]
    );
    const totalDette = debtors.reduce((s, d) => s + d.remainingAmount, 0);

    // ── Solde en attente sur la période ────────────────────
    const soldesPeriode = periodOrders
        .filter(o => o.remainingAmount > 0)
        .reduce((s, o) => s + o.remainingAmount, 0);

    // ── Export CSV ─────────────────────────────────────────
    const exportCSV = async (type: 'paiements' | 'debiteurs') => {
        setExporting(true);
        try {
            let csv = '';
            if (type === 'paiements') {
                csv = 'Date,Montant (FCFA),Type,Mode,Notes\n';
                periodPayments.forEach(p => {
                    const typeMeta = TYPE_PAIEMENT_META[p.type as TypePaiement];
                    csv += [
                        new Date(p.paymentDate).toLocaleDateString('fr-FR'),
                        p.amount,
                        typeMeta?.label ?? p.type,
                        p.paymentMethod,
                        (p.notes ?? '').replace(/,/g, ';'),
                    ].join(',') + '\n';
                });
            } else {
                csv = 'Client,N° Commande,Montant dû (FCFA),Statut paiement\n';
                debtors.forEach(d => {
                    csv += [
                        d.clientName.replace(/,/g, ' '),
                        d.numeroCommande ?? '—',
                        d.remainingAmount,
                        d.paymentStatus,
                    ].join(',') + '\n';
                });
            }

            const title = type === 'paiements'
                ? `TailorPro_Encaissements_${periodLabel.toLowerCase().replace(/\s/g,'_')}`
                : 'TailorPro_Debiteurs';

            await Share.share({ message: csv, title });
        } catch (e) {
            Alert.alert('Erreur', 'Impossible d\'exporter les données.');
        } finally {
            setExporting(false);
        }
    };

    // ── Label période ──────────────────────────────────────
    const periodLabel = useMemo(() => {
        switch (period) {
            case 'jour':    return "Aujourd'hui";
            case 'semaine': return 'Cette semaine';
            case 'mois':    return 'Ce mois';
            case 'custom':  return `${customFrom} → ${customTo}`;
        }
    }, [period, customFrom, customTo]);

    // ── Ancienneté dette ───────────────────────────────────
    const daysAgo = (iso: string) => {
        const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (d === 0) return "Aujourd'hui";
        if (d === 1) return '1 jour';
        return `${d} jours`;
    };

    // ──────────────────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Comptabilité</Text>
                    <Text style={styles.headerSub}>{periodLabel}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
                    onPress={() => Alert.alert(
                        'Exporter',
                        'Choisir le type d\'export',
                        [
                            { text: 'Encaissements (CSV)', onPress: () => exportCSV('paiements') },
                            { text: 'Débiteurs (CSV)',      onPress: () => exportCSV('debiteurs') },
                            { text: 'Annuler', style: 'cancel' },
                        ]
                    )}
                    disabled={exporting}
                >
                    {exporting
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Feather name="download" size={18} color="#fff" />
                    }
                </TouchableOpacity>
            </View>

            {/* Période tabs */}
            <View style={styles.tabs}>
                {(['jour','semaine','mois','custom'] as Period[]).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.tab, period === p && styles.tabActive]}
                        onPress={() => setPeriod(p)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
                            {p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : p === 'mois' ? 'Mois' : 'Custom'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Champs dates custom */}
            {period === 'custom' && (
                <View style={styles.customDates}>
                    <TextInput
                        style={styles.dateInput}
                        placeholder="AAAA-MM-JJ"
                        placeholderTextColor={P.sub}
                        value={customFrom}
                        onChangeText={setCustomFrom}
                    />
                    <Feather name="arrow-right" size={14} color={P.sub} style={{ marginHorizontal: 8 }} />
                    <TextInput
                        style={styles.dateInput}
                        placeholder="AAAA-MM-JJ"
                        placeholderTextColor={P.sub}
                        value={customTo}
                        onChangeText={setCustomTo}
                    />
                </View>
            )}

            {loading ? (
                <ActivityIndicator color={P.primary} style={{ marginTop: 48 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                        colors={[P.primary]} tintColor={P.primary} />
                    }
                >
                    {/* ── KPIs encaissements ─────────────────── */}
                    <Text style={styles.sectionTitle}>Encaissements — {periodLabel}</Text>
                    <View style={styles.kpiRow}>
                        <KpiCard
                            icon="trending-up"
                            label="Total encaissé"
                            value={formatCurrency(totalEncaisse)}
                            color={P.success}
                            bgColor={P.successBg}
                        />
                        <View style={{ width: 12 }} />
                        <KpiCard
                            icon="shopping-bag"
                            label="Commandes créées"
                            value={String(nbCommandes)}
                            color={P.primary}
                            bgColor="rgba(108,62,184,0.10)"
                        />
                    </View>
                    <View style={[styles.kpiRow, { marginTop: 12 }]}>
                        <KpiCard
                            icon="arrow-down-circle"
                            label="Acomptes"
                            value={formatCurrency(totalAcomptes)}
                            sub={`${acomptes.length} versement${acomptes.length !== 1 ? 's' : ''}`}
                            color={P.gold}
                            bgColor={P.goldBg}
                        />
                        <View style={{ width: 12 }} />
                        <KpiCard
                            icon="check-circle"
                            label="Soldes finaux"
                            value={formatCurrency(totalSoldes)}
                            sub={`${soldesFinals.length} paiement${soldesFinals.length !== 1 ? 's' : ''}`}
                            color={P.success}
                            bgColor={P.successBg}
                        />
                    </View>

                    {/* ── Soldes en attente sur période ──────── */}
                    {soldesPeriode > 0 && (
                        <View style={styles.alertBox}>
                            <Feather name="alert-circle" size={16} color={P.warning} style={{ marginRight: 8 }} />
                            <View>
                                <Text style={styles.alertTitle}>
                                    {formatCurrency(soldesPeriode)} de solde en attente
                                </Text>
                                <Text style={styles.alertSub}>
                                    Sur les commandes créées pendant cette période
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ── Historique paiements ───────────────── */}
                    {periodPayments.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                                Détail ({periodPayments.length} paiements)
                            </Text>
                            <View style={styles.card}>
                                {periodPayments.map((p, i) => {
                                    const typeMeta = TYPE_PAIEMENT_META[p.type as TypePaiement]
                                        ?? TYPE_PAIEMENT_META.acompte;
                                    return (
                                        <View key={p.id}>
                                            <View style={styles.payRow}>
                                                <View style={[styles.payDot, { backgroundColor: typeMeta.bgColor }]}>
                                                    <Feather name={typeMeta.icon} size={12} color={typeMeta.color} />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={[styles.payAmount, { color: typeMeta.color }]}>
                                                        +{formatCurrency(p.amount)}
                                                    </Text>
                                                    <Text style={styles.paySub}>
                                                        {typeMeta.label} · {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                                                    </Text>
                                                </View>
                                            </View>
                                            {i < periodPayments.length - 1 && (
                                                <View style={styles.rowDivider} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {periodPayments.length === 0 && !loading && (
                        <View style={styles.emptyBlock}>
                            <Feather name="inbox" size={28} color={P.sub} />
                            <Text style={styles.emptyText}>Aucun encaissement sur cette période</Text>
                        </View>
                    )}

                    {/* ── Débiteurs ──────────────────────────── */}
                    <TouchableOpacity
                        style={[styles.debtorsHeader, showDebtors && styles.debtorsHeaderOpen]}
                        onPress={() => setShowDebtors(v => !v)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.debtorsHeaderLeft}>
                            <View style={[styles.debtorsBadge, debtors.length > 0 && { backgroundColor: P.errorBg }]}>
                                <Feather
                                    name="users"
                                    size={14}
                                    color={debtors.length > 0 ? P.error : P.sub}
                                />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.debtorsTitle}>
                                    Clients débiteurs
                                    {debtors.length > 0 && (
                                        <Text style={{ color: P.error }}> ({debtors.length})</Text>
                                    )}
                                </Text>
                                <Text style={styles.debtorsSub}>
                                    {debtors.length === 0
                                        ? 'Aucune dette en cours 🎉'
                                        : `Total dû : ${formatCurrency(totalDette)}`
                                    }
                                </Text>
                            </View>
                        </View>
                        <Feather
                            name={showDebtors ? 'chevron-up' : 'chevron-down'}
                            size={16} color={P.sub}
                        />
                    </TouchableOpacity>

                    {showDebtors && debtors.length > 0 && (
                        <View style={styles.card}>
                            {debtors.map((d, i) => (
                                <View key={d.id}>
                                    <View style={styles.debtRow}>
                                        {/* Initiales */}
                                        <View style={styles.debtAvatar}>
                                            <Text style={styles.debtAvatarText}>
                                                {d.clientName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.debtName}>{d.clientName}</Text>
                                            {d.numeroCommande && (
                                                <Text style={styles.debtMeta}>{d.numeroCommande}</Text>
                                            )}
                                            <Text style={styles.debtAge}>
                                                {daysAgo(d.createdAt)}
                                            </Text>
                                        </View>
                                        <Text style={styles.debtAmount}>
                                            {formatCurrency(d.remainingAmount)}
                                        </Text>
                                    </View>
                                    {i < debtors.length - 1 && <View style={styles.rowDivider} />}
                                </View>
                            ))}
                        </View>
                    )}

                    {showDebtors && debtors.length === 0 && (
                        <View style={styles.emptyBlock}>
                            <Feather name="check-circle" size={24} color={P.success} />
                            <Text style={[styles.emptyText, { color: P.success }]}>
                                Tous les clients sont à jour !
                            </Text>
                        </View>
                    )}

                    {/* ── Bouton export rapide ───────────────── */}
                    <View style={styles.exportRow}>
                        <TouchableOpacity
                            style={styles.exportQuickBtn}
                            onPress={() => exportCSV('paiements')}
                            disabled={periodPayments.length === 0 || exporting}
                            activeOpacity={0.8}
                        >
                            <Feather name="file-text" size={14} color={P.primary} style={{ marginRight: 6 }} />
                            <Text style={styles.exportQuickText}>Encaissements CSV</Text>
                        </TouchableOpacity>
                        <View style={{ width: 10 }} />
                        <TouchableOpacity
                            style={styles.exportQuickBtn}
                            onPress={() => exportCSV('debiteurs')}
                            disabled={debtors.length === 0 || exporting}
                            activeOpacity={0.8}
                        >
                            <Feather name="users" size={14} color={P.error} style={{ marginRight: 6 }} />
                            <Text style={[styles.exportQuickText, { color: P.error }]}>Débiteurs CSV</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Dépenses v2 */}
                    <View style={styles.futureBanner}>
                        <Feather name="info" size={13} color={P.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.futureText}>
                            Dépenses & bénéfices nets disponibles dans une prochaine version
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: P.pageBg },

    // Header
    header: {
        backgroundColor: P.bg,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' },
    headerSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },
    exportBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },

    // Tabs
    tabs: {
        flexDirection: 'row', backgroundColor: P.surface,
        borderBottomWidth: 1, borderBottomColor: P.border,
    },
    tab: {
        flex: 1, paddingVertical: 11, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive:     { borderBottomColor: P.primary },
    tabText:       { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
    tabTextActive: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },

    // Custom date
    customDates: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: P.surface, paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: P.border,
    },
    dateInput: {
        flex: 1, borderWidth: 1, borderColor: P.border, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: P.text,
        backgroundColor: P.pageBg,
    },

    // Section titles
    sectionTitle: {
        fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
        letterSpacing: 0.5, textTransform: 'uppercase',
        marginBottom: 10,
    },

    // KPI
    kpiRow: { flexDirection: 'row' },

    // Alert box
    alertBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: P.warningBg, borderRadius: 10,
        padding: 12, marginTop: 12,
        borderWidth: 1, borderColor: 'rgba(217,119,6,0.20)',
    },
    alertTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.warning },
    alertSub:   { fontSize: 11, color: P.warning, marginTop: 2, opacity: 0.8 },

    // Card
    card: {
        backgroundColor: P.surface, borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    rowDivider: { height: 1, backgroundColor: P.border, marginHorizontal: 14 },

    // Payment rows
    payRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    payDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    payAmount: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
    paySub:    { fontSize: 11, color: P.sub, marginTop: 2 },

    // Empty
    emptyBlock: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText:  { color: P.sub, fontSize: 13 },

    // Debtors header
    debtorsHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: P.surface, borderRadius: 12,
        padding: 14, marginTop: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    debtorsHeaderOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    debtorsHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    debtorsBadge: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(108,62,184,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    debtorsTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    debtorsSub:   { fontSize: 11, color: P.sub, marginTop: 2 },

    // Debt rows
    debtRow:   { flexDirection: 'row', alignItems: 'center', padding: 14 },
    debtAvatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: P.errorBg,
        justifyContent: 'center', alignItems: 'center',
    },
    debtAvatarText: { fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.error },
    debtName:   { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    debtMeta:   { fontSize: 11, color: P.sub, marginTop: 1 },
    debtAge:    { fontSize: 10, color: P.sub, marginTop: 1 },
    debtAmount: { fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.error },

    // Export
    exportRow: { flexDirection: 'row', marginTop: 24 },
    exportQuickBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: P.border, borderRadius: 10,
        paddingVertical: 10, backgroundColor: P.surface,
    },
    exportQuickText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },

    // Future banner
    futureBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(108,62,184,0.06)',
        borderRadius: 8, padding: 10, marginTop: 16,
    },
    futureText: { fontSize: 11, color: P.primary, flex: 1 },
});