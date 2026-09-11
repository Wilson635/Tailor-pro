// ==========================================
// PAIEMENTS ATELIER — TailorPro
// Encaissements globaux + commandes à solder
// ==========================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { comptabiliteService } from '@services/supabaseService';
import { formatCurrency, formatDate } from '@utils/formatters';
import { MODE_PAIEMENT_META, type ModePaiement } from '@constants/paiementConstants';
import { useThemedStyles, type Palette } from '@/src/theme';
import { Avatar } from '@components/ui';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Order } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Payments'>;
type Tab = 'dues' | 'history';

interface PayRow {
  id: string;
  amount: number;
  method: string;
  type?: string;
  date: string;
  notes?: string;
  orderId?: string;
  clientId?: string;
}

export const PaymentsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const filterClientId = route.params?.clientId || undefined;

  const { orders, clients, getClientById } = useAppStore();
  const [tab, setTab] = useState<Tab>('dues');
  const [rows, setRows] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scopedOrders = useMemo(
    () => filterClientId ? orders.filter(o => o.clientId === filterClientId) : orders,
    [orders, filterClientId],
  );

  const unpaid = useMemo(
    () => scopedOrders
      .filter(o => (o.remainingAmount ?? 0) > 0 && o.orderStatus !== 'cancelled' && o.orderStatus !== 'annulee')
      .sort((a, b) => (b.remainingAmount ?? 0) - (a.remainingAmount ?? 0)),
    [scopedOrders],
  );

  const load = useCallback(async () => {
    const { data } = await comptabiliteService.getAllPayments();
    const mapped: PayRow[] = ((data ?? []) as any[]).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method ?? 'cash',
      type: p.type ?? 'acompte',
      date: p.date ?? p.created_at,
      notes: p.notes ?? undefined,
      orderId: p.order_id,
      clientId: p.client_id,
    })).filter((p) => !filterClientId || p.clientId === filterClientId);
    setRows(mapped);
    setLoading(false);
    setRefreshing(false);
  }, [filterClientId]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalDue = unpaid.reduce((s, o) => s + (o.remainingAmount ?? 0), 0);
  const totalIn = rows.reduce((s, r) => s + r.amount, 0);
  const client = filterClientId ? getClientById(filterClientId) : undefined;

  const openAdd = (order?: Order) => {
    if (order) {
      navigation.navigate('AddPayment', { clientId: order.clientId, orderId: order.id });
      return;
    }
    if (filterClientId) {
      navigation.navigate('AddPayment', { clientId: filterClientId });
      return;
    }
    if (unpaid[0]) {
      navigation.navigate('AddPayment', { clientId: unpaid[0].clientId, orderId: unpaid[0].id });
    }
  };

  const renderDue = ({ item }: { item: Order }) => {
    const c = getClientById(item.clientId);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => openAdd(item)}
      >
        <Avatar source={c?.photo} name={c?.nom ?? item.clientName} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{c?.nom ?? item.clientName}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.numeroCommande ?? 'Commande'} · reste {formatCurrency(item.remainingAmount)}
          </Text>
        </View>
        <View style={styles.payChip}>
          <Text style={styles.payChipText}>Encaisser</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPay = ({ item }: { item: PayRow }) => {
    const order = orders.find(o => o.id === item.orderId);
    const c = item.clientId ? getClientById(item.clientId) : clients.find(cl => cl.id === order?.clientId);
    const mode = MODE_PAIEMENT_META[item.method as ModePaiement];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => navigation.navigate('Recu', {
          amount: item.amount,
          typePaiement: item.type ?? 'acompte',
          modePaiement: item.method,
          date: item.date,
          notes: item.notes,
          clientName: c?.nom ?? order?.clientName ?? 'Client',
          commandeNumero: order?.numeroCommande,
          totalAmount: order?.totalPrice ?? item.amount,
          paidAmount: order ? Math.max(0, (order.totalPrice ?? 0) - (order.remainingAmount ?? 0)) : item.amount,
          remaining: order?.remainingAmount ?? 0,
        })}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={16} color={P.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {c?.nom ?? order?.clientName ?? 'Client'} · {mode?.label ?? item.method}
          </Text>
        </View>
        <Text style={styles.date}>{item.date ? formatDate(new Date(item.date)) : ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle}>Paiements</Text>
          {client ? <Text style={styles.headerSub}>{client.nom}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => openAdd()}
          disabled={unpaid.length === 0 && !filterClientId}
        >
          <Ionicons name="add" size={18} color={P.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLbl}>À encaisser</Text>
          <Text style={[styles.statVal, { color: P.gold }]}>{formatCurrency(totalDue)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLbl}>Encaissé</Text>
          <Text style={styles.statVal}>{formatCurrency(totalIn)}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {([
          { key: 'dues' as Tab, label: `Soldes (${unpaid.length})` },
          { key: 'history' as Tab, label: `Historique (${rows.length})` },
        ]).map((t) => {
          const on = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setTab(t.key)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={P.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tab === 'dues' ? unpaid : rows}
          keyExtractor={(item: any) => item.id}
          renderItem={tab === 'dues' ? renderDue : renderPay as any}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="wallet-outline" size={26} color={P.gold} />
              </View>
              <Text style={styles.emptyTitle}>{tab === 'dues' ? 'Aucun solde ouvert' : 'Aucun paiement'}</Text>
              <Text style={styles.emptySub}>
                {tab === 'dues'
                  ? 'Les commandes avec un reste à payer apparaîtront ici.'
                  : 'Enregistrez un encaissement depuis une commande.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

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
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim, marginTop: 4,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  headerSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 4 },
  stats: { flexDirection: 'row' as const, gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: P.surface, borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  statLbl: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 4 },
  statVal: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  tabs: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: P.surface, borderRadius: 18, padding: 12,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  cardTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  cardSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  date: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  payChip: {
    backgroundColor: P.bg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: P.goldRim,
  },
  payChipText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  empty: { alignItems: 'center' as const, paddingTop: 48, paddingHorizontal: 28 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
});
