// ==========================================
// LISTE DES COMMANDES — TailorPro
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort, formatDate } from '@utils/formatters';
import { CLOTHING_TYPE_LABELS } from '@constants/theme';
import {
  STATUT_COMMANDE_LABELS,
  STATUT_COMMANDE_COLORS,
  isCancelledOrder,
} from '@constants/commandeConstants';
import { Avatar } from '@components/ui';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Order } from '../../types';
import { useThemedStyles, type Palette } from '@/src/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;
type FilterKey = 'all' | 'pending' | 'in_progress' | 'completed';

const FILTERS: { key: FilterKey; label: string; match: string[] | null }[] = [
  { key: 'all', label: 'Toutes', match: null },
  { key: 'pending', label: 'En attente', match: ['pending', 'en_attente', 'creee'] },
  { key: 'in_progress', label: 'En cours', match: ['in_progress', 'en_confection', 'essayage', 'retouches'] },
  { key: 'completed', label: 'Terminées', match: ['completed', 'terminee', 'delivered', 'livree'] },
];

const PAY_META: Record<string, { label: string; color: string }> = {
  unpaid: { label: 'Impayée', color: '#EF4444' },
  partial: { label: 'Partiel', color: '#D97706' },
  paid: { label: 'Soldée', color: '#16A34A' },
};

const URGENCY: Record<string, { label: string; color: string }> = {
  low: { label: 'Normal', color: '#16A34A' },
  medium: { label: 'Moyen', color: '#D97706' },
  high: { label: 'Urgent', color: '#EF4444' },
};

const IN_PROGRESS = ['in_progress', 'en_confection', 'essayage', 'retouches'];

export const OrdersListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { orders, searchQuery, setSearchQuery, getClientById } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchFocused, setSearchFocused] = useState(false);

  const inProgressCount = orders.filter((o) => IN_PROGRESS.includes(o.orderStatus)).length;
  const unpaidTotal = orders
    .filter((o) => !isCancelledOrder(o.orderStatus) && o.paymentStatus !== 'paid')
    .reduce((sum, o) => sum + o.remainingAmount, 0);
  const unpaidCount = orders.filter((o) => !isCancelledOrder(o.orderStatus) && o.paymentStatus !== 'paid').length;

  const filteredOrders = useMemo(() => {
    const match = FILTERS.find((f) => f.key === activeFilter)?.match;
    let result = [...orders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.clientName.toLowerCase().includes(q) ||
          (CLOTHING_TYPE_LABELS[o.clothingType] ?? '').toLowerCase().includes(q) ||
          (o.numeroCommande ?? '').toLowerCase().includes(q),
      );
    }
    if (match) result = result.filter((o) => match.includes(o.orderStatus));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, activeFilter]);

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = STATUT_COMMANDE_COLORS[item.orderStatus] ?? P.sub;
    const statusLabel = STATUT_COMMANDE_LABELS[item.orderStatus] ?? item.orderStatus;
    const pay = PAY_META[item.paymentStatus] ?? PAY_META.unpaid;
    const urg = URGENCY[item.urgencyLevel] ?? URGENCY.low;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.82}
      >
        <View style={styles.cardTop}>
          <Avatar source={getClientById(item.clientId)?.photo} name={item.clientName} size={42} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
            <Text style={styles.garment} numberOfLines={1}>
              {CLOTHING_TYPE_LABELS[item.clothingType] ?? item.clothingType}
              {item.numeroCommande ? ` · ${item.numeroCommande}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}44` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={[styles.urgDot, { backgroundColor: urg.color }]} />
            <Text style={styles.metaText}>{urg.label}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={P.sub} />
            <Text style={styles.metaText}>{formatDate(item.deliveryDate)}</Text>
          </View>
          <Text style={styles.price}>{formatCurrencyShort(item.totalPrice)}</Text>
        </View>

        <View style={styles.cardFoot}>
          <Text style={styles.remainLabel}>
            Reste{' '}
            <Text style={[styles.remainVal, item.remainingAmount === 0 && { color: P.success }]}>
              {formatCurrencyShort(item.remainingAmount)}
            </Text>
          </Text>
          <Text style={[styles.payLabel, { color: pay.color }]}>{pay.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.title}>Commandes</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('CommandeKanban')}>
            <Ionicons name="grid-outline" size={18} color={P.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddOrder', { clientId: undefined })}
          >
            <Ionicons name="add" size={20} color={P.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.search, searchFocused && styles.searchOn]}>
        <Ionicons name="search-outline" size={16} color={searchFocused ? P.primary : P.sub} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Client, modèle, n° commande…"
          placeholderTextColor={P.muted}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={P.sub} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => {
          const on = activeFilter === f.key;
          return (
            <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 96 }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLbl}>En cours</Text>
              <Text style={styles.statVal}>{inProgressCount}</Text>
              <Text style={styles.statSub}>pièces actives</Text>
            </View>
            <View style={[styles.stat, styles.statGold]}>
              <Text style={styles.statLbl}>À encaisser</Text>
              <Text style={[styles.statVal, { color: P.gold }]}>{formatCurrencyShort(unpaidTotal)}</Text>
              <Text style={styles.statSub}>{unpaidCount} commande{unpaidCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={26} color={P.gold} />
            </View>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySub}>Créez une pièce pour suivre confection et paiements.</Text>
          </View>
        }
      />
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
  title: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  headerActions: { flexDirection: 'row' as const, gap: 8, marginBottom: 2 },
  ghostBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  search: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    marginHorizontal: 20, marginBottom: 12, height: 44, paddingHorizontal: 14,
    backgroundColor: P.surface, borderRadius: 14, borderWidth: 0.5, borderColor: P.borderHard,
  },
  searchOn: { borderColor: P.primary },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  list: { paddingHorizontal: 20 },
  stats: { flexDirection: 'row' as const, gap: 10, marginBottom: 14 },
  stat: {
    flex: 1, backgroundColor: P.surface, borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  statGold: { borderColor: P.goldRim, backgroundColor: P.goldBg },
  statLbl: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 4 },
  statVal: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  statSub: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  card: {
    backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard, overflow: 'hidden' as const,
  },
  cardTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, padding: 14, paddingBottom: 10 },
  avatar: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
  clientName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  garment: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  statusPill: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 0.5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' },
  metaRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  metaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
  metaText: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  urgDot: { width: 7, height: 7, borderRadius: 4 },
  price: { marginLeft: 'auto' as const, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  cardFoot: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: P.pageBg,
    borderTopWidth: 0.5, borderTopColor: P.border,
  },
  remainLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  remainVal: { fontFamily: 'PlusJakartaSans_700Bold', color: P.error },
  payLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },
  empty: { alignItems: 'center' as const, paddingTop: 48, paddingHorizontal: 28 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
});
