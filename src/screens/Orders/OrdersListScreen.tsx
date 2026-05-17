// ==========================================
// ÉCRAN LISTE DES COMMANDES - TailorPro (Redesign)
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatDate } from '@utils/formatters';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  CLOTHING_TYPE_LABELS,
} from '@constants/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Order } from '../../types';

// ==========================================
// TYPES
// ==========================================

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

type FilterKey = 'all' | 'pending' | 'in_progress' | 'completed';

// ==========================================
// CONSTANTES
// ==========================================

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'Toutes'     },
  { key: 'pending',     label: 'En attente' },
  { key: 'in_progress', label: 'En cours'   },
  { key: 'completed',   label: 'Terminées'  },
];

const AVATAR_PALETTES = [
  { bg: '#EDE9FE', text: '#6B21A8' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
];

// ==========================================
// HELPERS
// ==========================================

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarPalette = (id: string) => {
  const index = parseInt(id, 10) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[isNaN(index) ? 0 : index];
};

const ORDER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#FEF3C7', color: '#92400E' },
  in_progress: { bg: '#DBEAFE', color: '#1E40AF' },
  completed:   { bg: '#D1FAE5', color: '#065F46' },
  delivered:   { bg: '#EDE9FE', color: '#6B21A8' },
  cancelled:   { bg: '#FEE2E2', color: '#991B1B' },
};

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  unpaid:  { bg: '#FEE2E2', color: '#991B1B' },
  partial: { bg: '#FEF3C7', color: '#92400E' },
  paid:    { bg: '#D1FAE5', color: '#065F46' },
};

const URGENCY_DOT: Record<string, string> = {
  low:    '#10B981',
  medium: '#F59E0B',
  high:   '#EF4444',
};

const URGENCY_LABEL: Record<string, string> = {
  low:    'Normal',
  medium: 'Moyen',
  high:   'Urgent',
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const OrdersListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { orders, searchQuery, setSearchQuery } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // Stats
  const inProgressCount = orders.filter((o) => o.orderStatus === 'in_progress').length;
  const unpaidTotal = orders
      .filter((o) => o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.remainingAmount, 0);
  const unpaidCount = orders.filter((o) => o.paymentStatus !== 'paid').length;

  // Filtered list
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
          (o) =>
              o.clientName.toLowerCase().includes(q) ||
              (CLOTHING_TYPE_LABELS[o.clothingType] ?? '').toLowerCase().includes(q)
      );
    }

    if (activeFilter !== 'all') {
      result = result.filter((o) => o.orderStatus === activeFilter);
    }

    return result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, searchQuery, activeFilter]);

  // ==========================================
  // RENDU CARTE COMMANDE
  // ==========================================

  const renderOrderItem = ({ item }: { item: Order }) => {
    const palette = getAvatarPalette(item.clientId);
    const statusStyle = ORDER_STATUS_STYLE[item.orderStatus] ?? ORDER_STATUS_STYLE.pending;
    const payStyle = PAYMENT_STATUS_STYLE[item.paymentStatus] ?? PAYMENT_STATUS_STYLE.unpaid;

    return (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {}}
            activeOpacity={0.7}
        >
          {/* ── Top : avatar + nom + statut ── */}
          <View style={styles.ocTop}>
            <View style={[styles.ocAvatar, { backgroundColor: palette.bg }]}>
              <Text style={[styles.ocAvatarText, { color: palette.text }]}>
                {getInitials(item.clientName)}
              </Text>
            </View>
            <View style={styles.ocInfo}>
              <Text style={styles.ocName}>{item.clientName}</Text>
              <Text style={styles.ocType} numberOfLines={1}>
                {CLOTHING_TYPE_LABELS[item.clothingType] ?? item.clothingType}
                {item.description ? ` · ${item.description}` : ''}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
                {ORDER_STATUS_LABELS[item.orderStatus]}
              </Text>
            </View>
          </View>

          {/* ── Meta : urgence + livraison + montant ── */}
          <View style={styles.ocMeta}>
            <View style={styles.ocMetaItem}>
              <View
                  style={[
                    styles.urgencyDot,
                    { backgroundColor: URGENCY_DOT[item.urgencyLevel] ?? COLORS.gray400 },
                  ]}
              />
              <Text style={styles.ocMetaText}>
                {URGENCY_LABEL[item.urgencyLevel] ?? item.urgencyLevel}
              </Text>
            </View>
            <View style={styles.ocMetaItem}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.gray400} />
              <Text style={styles.ocMetaText}>{formatDate(item.deliveryDate)}</Text>
            </View>
            <View style={styles.ocMetaItem}>
              <Ionicons name="cash-outline" size={13} color={COLORS.gray400} />
              <Text style={styles.ocMetaText}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          </View>

          {/* ── Footer : reste + statut paiement ── */}
          <View style={styles.ocFooter}>
            <View style={styles.ocRemain}>
              <Text style={styles.ocRemainLabel}>Reste : </Text>
              <Text
                  style={[
                    styles.ocRemainVal,
                    item.remainingAmount === 0 && styles.ocRemainPaid,
                  ]}
              >
                {formatCurrency(item.remainingAmount)}
              </Text>
            </View>
            <View style={[styles.payPill, { backgroundColor: payStyle.bg }]}>
              <Text style={[styles.payPillText, { color: payStyle.color }]}>
                {PAYMENT_STATUS_LABELS[item.paymentStatus]}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
    );
  };

  // ==========================================
  // RENDU
  // ==========================================

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── TopBar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarRow}>
            <View style={styles.topBarLeft}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="menu" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.screenTitle}>Commandes</Text>
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="options-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.navigate('AddOrder', {})}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher une commande..."
                placeholderTextColor={COLORS.gray400}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
                </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {FILTERS.map((f) => (
                <TouchableOpacity
                    key={f.key}
                    style={[styles.tab, activeFilter === f.key && styles.tabActive]}
                    onPress={() => setActiveFilter(f.key)}
                >
                  <Text style={[styles.tabText, activeFilter === f.key && styles.tabTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>En cours</Text>
                    <Text style={styles.statVal}>{inProgressCount}</Text>
                    <Text style={styles.statSub}>commandes actives</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Impayés</Text>
                    <Text style={styles.statVal}>
                      {unpaidTotal >= 1000
                          ? `${Math.round(unpaidTotal / 1000)}k`
                          : formatCurrency(unpaidTotal)}
                    </Text>
                    <Text style={[styles.statSub, { color: '#92400E' }]}>
                      {unpaidCount} commande{unpaidCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>
                  {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
                </Text>
              </>
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.gray300} />
                <Text style={styles.emptyText}>Aucune commande trouvée</Text>
              </View>
            }
        />
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── TopBar ──
  topBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  screenTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 40,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: '100%',
  },
  clearBtn: { padding: 4 },

  // ── Tabs ──
  tabsRow: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -0.5,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  statVal: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  statSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },

  // ── List ──
  listContent: {
    paddingBottom: SPACING.xxxl * 2,
  },

  // ── Order Card ──
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    overflow: 'hidden',
  },

  // Top
  ocTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  ocAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ocAvatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  ocInfo: {
    flex: 1,
    minWidth: 0,
  },
  ocName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  ocType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Meta
  ocMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  ocMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ocMetaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  urgencyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Footer
  ocFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  ocRemain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ocRemainLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  ocRemainVal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#991B1B',
  },
  ocRemainPaid: {
    color: '#065F46',
  },
  payPill: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  payPillText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginTop: SPACING.md,
  },
});