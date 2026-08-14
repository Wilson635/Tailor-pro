// ==========================================
// ÉCRAN KANBAN DES COMMANDES — TailorPro (Module 7)
// ==========================================
// Vue horizontale par étape du cycle de vie.
// Les commandes au format legacy (statuts anglais) sont automatiquement
// regroupées dans la colonne française correspondante.
// ==========================================

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import {
  KANBAN_COLUMNS, STATUT_COMMANDE_LABELS, STATUT_COMMANDE_COLORS,
  STATUT_COMMANDE_ICONS, getKanbanColumn,
} from '@constants/commandeConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Order } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CommandeKanban'>;

const C = {
  purple900: '#1A0033', purple600: '#534AB7', bg: '#F4F3F8',
  surface: '#FFFFFF', border: '#E5E3EE', text: '#0E0B14',
  textSec: '#7A7787', textTer: '#B0ACBA', gold: '#D4AF37',
  error: '#EF4444', errorDark: '#993C1D', errorBg: '#FAECE7', success: '#10B981',
};

const COLUMN_WIDTH = 240;

// ── Carte commande ────────────────────────────────────────────────────
const CommandeCard = ({
                        order,
                        onPress,
                      }: {
  order: Order;
  onPress: () => void;
}) => {
  const statut = order.orderStatus;
  const color  = STATUT_COMMANDE_COLORS[statut] ?? C.textSec;
  const label  = STATUT_COMMANDE_LABELS[statut] ?? statut;

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

  const initials = order.clientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

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
                <Ionicons name="all" size={10} color={C.errorDark} />
                <Text style={styles.overdueBadgeText}>{Math.abs(daysLeft)}j</Text>
              </View>
          )}
        </View>

        {/* Client */}
        <View style={styles.clientRow}>
          <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
          </View>
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
          <Text style={styles.cardPrice}>{formatCurrency(order.totalPrice)}</Text>
          {order.remainingAmount > 0 && (
              <Text style={styles.cardSolde}>
                Reste {formatCurrency(order.remainingAmount)}
              </Text>
          )}
        </View>
      </TouchableOpacity>
  );
};

// ── Colonne Kanban ────────────────────────────────────────────────────
const KanbanColumn = ({
                        colKey,
                        label,
                        orders,
                        color,
                        onPressCard,
                      }: {
  colKey: string;
  label: string;
  orders: Order[];
  color: string;
  onPressCard: (orderId: string) => void;
}) => (
    <View style={[styles.column, { borderTopColor: color }]}>
      {/* Header */}
      <View style={styles.colHeader}>
        <View style={[styles.colBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.colBadgeText, { color }]}>{orders.length}</Text>
        </View>
        <Text style={styles.colTitle}>{label}</Text>
      </View>

      {/* Cards */}
      <FlatList
          data={orders}
          keyExtractor={o => o.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
              <CommandeCard order={item} onPress={() => onPressCard(item.id)} />
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color={C.surface} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Suivi des commandes</Text>
              {totalEnRetard > 0 && (
                  <Text style={styles.retardBadge}>{totalEnRetard} en retard</Text>
              )}
            </View>
            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddOrder', { clientId: undefined })}
            >
              <Ionicons name="add" size={18} color={C.purple900} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statsHeader.enConfection}</Text>
              <Text style={styles.statLabel}>En confection</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statsHeader.essayage}</Text>
              <Text style={styles.statLabel}>Essayage</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGold]}>
              <Text style={[styles.statValue, styles.statValueGold]}>{totalEnRetard}</Text>
              <Text style={styles.statLabel}>En retard</Text>
            </View>
          </View>
        </View>

        {/* Légende statut */}
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.legendScroll}
            contentContainerStyle={styles.legendRow}
        >
          {KANBAN_COLUMNS.map(col => (
              <View key={col.key} style={styles.legendItem}>
                <View style={[styles.legendDot, {
                  backgroundColor: STATUT_COMMANDE_COLORS[col.key] ?? C.textSec,
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
                  color={STATUT_COMMANDE_COLORS[col.key] ?? C.textSec}
                  onPressCard={orderId => navigation.navigate('OrderDetails', { orderId })}
              />
          ))}
        </ScrollView>
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },

  // ── Header sombre ──
  header:   { backgroundColor: C.purple900, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.surface },
  retardBadge: { fontSize: 11, color: '#F0997B', fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2, textAlign: 'center' },
  addBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10 },
  statCardGold: { backgroundColor: 'rgba(212,175,55,0.15)' },
  statValue: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: C.surface },
  statValueGold: { color: C.gold },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  legendScroll: { flexGrow: 0 },
  legendRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 10, flexDirection: 'row' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 0.5, borderColor: C.border },
  legendDot:  { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 12, color: C.textSec, fontFamily: 'PlusJakartaSans_500Medium' },
  legendCount:{ fontSize: 12, color: C.text, fontFamily: 'PlusJakartaSans_700Bold' },

  kanban:   { paddingHorizontal: 12, paddingBottom: 40, paddingTop: 4, gap: 12 },

  column:   { width: COLUMN_WIDTH, backgroundColor: C.surface, borderRadius: 16,
    borderTopWidth: 4, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  colHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  colBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  colBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' },
  colTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: C.text },

  emptyCol:  { alignItems: 'center', paddingVertical: 32 },
  emptyColText: { fontSize: 12, color: C.textTer },

  // ── Carte commande ──
  card:     { margin: 8, padding: 12, backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 3, gap: 8 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 16 },
  cardNumero: { fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.textSec, letterSpacing: 0.4 },

  overdueBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.errorBg,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  overdueBadgeText: { fontSize: 10, color: C.errorDark, fontFamily: 'PlusJakartaSans_600SemiBold' },

  clientRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },
  clientName: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.text },
  clothingText: { fontSize: 11, color: C.textSec, marginTop: 1 },

  progressTrack: { height: 4, backgroundColor: C.bg, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.border },
  cardPrice:  { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: C.text },
  cardSolde:  { fontSize: 11, color: C.errorDark, fontFamily: 'PlusJakartaSans_600SemiBold' },

  textTer: { color: C.textTer },
});