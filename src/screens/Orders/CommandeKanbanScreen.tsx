// ==========================================
// ÉCRAN KANBAN DES COMMANDES — TailorPro (Module 7)
// ==========================================
// Vue horizontale par étape du cycle de vie.
// Les commandes au format legacy (statuts anglais) sont automatiquement
// regroupées dans la colonne française correspondante.
// ==========================================

import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import {
  KANBAN_COLUMNS, STATUT_COMMANDE_COLORS,
} from '@constants/commandeConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Order } from '../../types';

import { useThemedStyles, type Palette } from '@/src/theme';
import { Avatar } from '@components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'CommandeKanban'>;
type KanbanStyles = ReturnType<typeof makeKanbanStyles>;

const COLUMN_WIDTH = 232;

// ── Carte commande ────────────────────────────────────────────────────
const CommandeCard = ({
                        order,
                        onPress,
                        styles,
                      }: {
  order: Order;
  onPress: () => void;
  styles: KanbanStyles;
}) => {
  const client = useAppStore((s) => s.getClientById(order.clientId));
  const statut = order.orderStatus;
  const color  = STATUT_COMMANDE_COLORS[statut] ?? '#7C6FA8';

  const overdue = order.deliveryDate < new Date() &&
      !['terminee', 'livree', 'delivered', 'completed'].includes(statut);

  // Progression estimée entre la création et la livraison
  const progress = useMemo(() => {
    const created = order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
    const delivery = order.deliveryDate instanceof Date ? order.deliveryDate.getTime() : new Date(order.deliveryDate).getTime();
    const now = Date.now();
    if (['terminee', 'livree', 'delivered', 'completed'].includes(statut)) return 1;
    if (!Number.isFinite(created) || !Number.isFinite(delivery) || delivery <= created) return 0;
    return Math.min(1, Math.max(0.04, (now - created) / (delivery - created)));
  }, [order.createdAt, order.deliveryDate, statut]);

  const daysLeft = useMemo(() => {
    const delivery = order.deliveryDate instanceof Date ? order.deliveryDate : new Date(order.deliveryDate);
    return Math.ceil((delivery.getTime() - Date.now()) / 86400000);
  }, [order.deliveryDate]);

  return (
      <TouchableOpacity
          style={[styles.card, { borderLeftColor: color }]}
          onPress={onPress}
          activeOpacity={0.85}
      >
        {/* Numéro commande + badge retard */}
        <View style={styles.cardTop}>
          {(order as any).numeroCommande ? (
              <Text style={styles.cardNumero}>{(order as any).numeroCommande}</Text>
          ) : <View />}
          {overdue && (
              <View style={styles.overdueBadge}>
                <Ionicons name="warning" size={10} color="#993C1D" />
                <Text style={styles.overdueBadgeText}>{Math.abs(daysLeft)}j</Text>
              </View>
          )}
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <Avatar source={client?.photo} name={order.clientName} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>{order.clientName}</Text>
            <Text style={styles.clothingText} numberOfLines={1}>
              {order.clothingType?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Barre de progression vers la livraison */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>

        {/* Prix / solde */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>{formatCurrencyShort(order.totalPrice)}</Text>
          {order.remainingAmount > 0 && (
              <Text style={styles.cardSolde}>
                Reste {formatCurrencyShort(order.remainingAmount)}
              </Text>
          )}
        </View>
      </TouchableOpacity>
  );
};

// ── Colonne Kanban ────────────────────────────────────────────────────
const KanbanColumn = ({
                        label,
                        orders,
                        color,
                        onPressCard,
                        styles,
                      }: {
  colKey: string;
  label: string;
  orders: Order[];
  color: string;
  onPressCard: (orderId: string) => void;
  styles: KanbanStyles;
}) => (
    <View style={[styles.column, { borderTopColor: color }]}>
      <View style={styles.colHeader}>
        <View style={[styles.colBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.colBadgeText, { color }]}>{orders.length}</Text>
        </View>
        <Text style={styles.colTitle}>{label}</Text>
      </View>

      <FlatList
          data={orders}
          keyExtractor={o => o.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
              <CommandeCard styles={styles} order={item} onPress={() => onPressCard(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCol}>
              <Text style={styles.emptyColText}>Aucune commande</Text>
            </View>
          }
      />
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const CommandeKanbanScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeKanbanStyles);
  const { orders, loadOrders } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Grouper les commandes par colonne Kanban
  const columnData = useMemo(() => {
    const activeOrders = orders.filter(o =>
        !['annulee', 'cancelled'].includes(o.orderStatus) ||
        KANBAN_COLUMNS.some((c, i) => i === KANBAN_COLUMNS.length - 1 && c.matchKeys.includes(o.orderStatus))
    );
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      orders: activeOrders.filter(o => col.matchKeys.includes(o.orderStatus)),
    }));
  }, [orders]);

  const totalEnRetard = useMemo(() => orders.filter(o => {
    const overdue = o.deliveryDate instanceof Date
        ? o.deliveryDate < new Date()
        : new Date(o.deliveryDate) < new Date();
    return overdue && !['terminee', 'livree', 'delivered', 'completed', 'annulee', 'cancelled'].includes(o.orderStatus);
  }).length, [orders]);

  // Stats du header
  const statsHeader = useMemo(() => {
    const enConfection = columnData.find(c => c.key === 'en_confection')?.orders.length
        ?? columnData[0]?.orders.length ?? 0;
    const essayage = columnData.find(c => c.key === 'essayage')?.orders.length ?? 0;
    return { enConfection, essayage };
  }, [columnData]);

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color={P.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Atelier</Text>
              <Text style={styles.headerTitle}>Suivi</Text>
            </View>
            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddOrder', { clientId: undefined })}
            >
              <Ionicons name="add" size={18} color={P.gold} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statsHeader.enConfection}</Text>
              <Text style={styles.statLabel}>Confection</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statsHeader.essayage}</Text>
              <Text style={styles.statLabel}>Essayage</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGold]}>
              <Text style={[styles.statValue, styles.statValueGold]}>{totalEnRetard}</Text>
              <Text style={styles.statLabel}>Retard</Text>
            </View>
          </View>
        </View>

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.legendScroll}
            contentContainerStyle={styles.legendRow}
        >
          {KANBAN_COLUMNS.map(col => (
              <View key={col.key} style={styles.legendItem}>
                <View style={[styles.legendDot, {
                  backgroundColor: STATUT_COMMANDE_COLORS[col.key] ?? P.sub,
                }]} />
                <Text style={styles.legendText}>{col.label}</Text>
                <Text style={styles.legendCount}>
                  {columnData.find(c => c.key === col.key)?.orders.length ?? 0}
                </Text>
              </View>
          ))}
        </ScrollView>

        {/* Kanban horizontal */}
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.kanban}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
          {columnData.map(col => (
              <KanbanColumn
                  key={col.key}
                  colKey={col.key}
                  label={col.label}
                  orders={col.orders}
                  color={STATUT_COMMANDE_COLORS[col.key] ?? '#7C6FA8'}
                  onPressCard={orderId => navigation.navigate('OrderDetails', { orderId })}
                  styles={styles}
              />
          ))}
        </ScrollView>
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================
function makeKanbanStyles(P: Palette) {
  return {
  root: { flex: 1, backgroundColor: P.pageBg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTopRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  statsRow: { flexDirection: 'row' as const, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: P.surface, borderRadius: 16, padding: 12,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  statCardGold: { borderColor: P.goldRim, backgroundColor: P.goldBg },
  statValue: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  statValueGold: { color: P.gold },
  statLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  legendScroll: { flexGrow: 0 },
  legendRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, flexDirection: 'row' as const },
  legendItem: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
    backgroundColor: P.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  legendCount: { fontSize: 12, color: P.text, fontFamily: 'PlusJakartaSans_700Bold' },
  kanban: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8, gap: 12 },
  column: {
    width: COLUMN_WIDTH, backgroundColor: P.surface, borderRadius: 18,
    borderTopWidth: 3, borderWidth: 0.5, borderColor: P.borderHard, overflow: 'hidden' as const,
  },
  colHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, padding: 12,
    borderBottomWidth: 0.5, borderBottomColor: P.border,
  },
  colBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  colBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' },
  colTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  emptyCol: { alignItems: 'center' as const, paddingVertical: 32 },
  emptyColText: { fontSize: 12, color: P.muted },
  card: {
    margin: 8, padding: 12, backgroundColor: P.pageBg, borderRadius: 14,
    borderWidth: 0.5, borderColor: P.borderHard, borderLeftWidth: 3, gap: 8,
  },
  cardTop: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 16,
  },
  cardNumero: { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, letterSpacing: 0.4 },
  overdueBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, backgroundColor: P.errorBg,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  overdueBadgeText: { fontSize: 10, color: '#993C1D', fontFamily: 'PlusJakartaSans_600SemiBold' },
  clientRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
  avatarText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },
  clientName: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  clothingText: { fontSize: 11, color: P.sub, marginTop: 1 },
  progressTrack: { height: 4, backgroundColor: P.surface, borderRadius: 2, overflow: 'hidden' as const },
  progressFill: { height: '100%' as const, borderRadius: 2 },
  cardFooter: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
    paddingTop: 8, borderTopWidth: 0.5, borderTopColor: P.border,
  },
  cardPrice: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  cardSolde: { fontSize: 11, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold' },
  };
}