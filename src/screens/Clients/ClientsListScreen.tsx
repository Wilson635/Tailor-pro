// ==========================================
// ÉCRAN LISTE DES CLIENTS - TailorPro (Redesign)
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
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatPhone } from '../../utils/formatters';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  SHADOWS,
} from '../../constants/theme';
import type {Client, RootStackParamList} from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// ==========================================
// TYPES
// ==========================================

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

type FilterType = 'all' | 'recent' | 'favorite';

// ==========================================
// CONSTANTES
// ==========================================

const AVATAR_PALETTES = [
  { bg: '#EDE9FE', text: '#6B21A8' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FFE4E6', text: '#9F1239' },
  { bg: '#ECFDF5', text: '#064E3B' },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'recent', label: 'Récents' },
  { key: 'favorite', label: 'Fidèles' },
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

const isNewClient = (createdAt: Date): boolean => {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
};

// ==========================================
// SOUS-COMPOSANTS
// ==========================================

const ClientAvatar = ({ client }: { client: Client }) => {
  const palette = getAvatarPalette(client.id);
  return (
      <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
        <Text style={[styles.avatarText, { color: palette.text }]}>
          {getInitials(client.fullName)}
        </Text>
      </View>
  );
};

const StatCard = ({
                    label,
                    value,
                    sub,
                    subColor,
                  }: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statSub, subColor ? { color: subColor } : {}]}>{sub}</Text>
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const ClientsListScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { clients, searchQuery, setSearchQuery } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Stats
  const totalClients = clients.length;
  const clientsWithBalance = clients.filter((c) => c.balance > 0);
  const totalUnpaid = clientsWithBalance.reduce((s, c) => s + c.balance, 0);

  // Filtered list
  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
          (c) =>
              c.fullName.toLowerCase().includes(q) ||
              c.phone.includes(q) ||
              c.neighborhood.toLowerCase().includes(q)
      );
    }

    switch (activeFilter) {
      case 'recent':
        result.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case 'favorite':
        result = result.filter((c) => c.isFavorite);
        break;
    }

    return result;
  }, [clients, searchQuery, activeFilter]);

  // ==========================================
  // RENDU CLIENT
  // ==========================================

  const renderClientItem = ({ item }: { item: Client }) => {
    const isNew = isNewClient(item.createdAt);

    return (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
            activeOpacity={0.7}
        >
          <ClientAvatar client={item} />

          <View style={styles.clientInfo}>
            <View style={styles.clientNameRow}>
              <Text style={styles.clientName} numberOfLines={1}>
                {item.fullName}
              </Text>
              {item.isFavorite && (
                  <View style={styles.badgeFidele}>
                    <Text style={styles.badgeFideleText}>Fidèle</Text>
                  </View>
              )}
              {isNew && !item.isFavorite && (
                  <View style={styles.badgeNew}>
                    <Text style={styles.badgeNewText}>Nouveau</Text>
                  </View>
              )}
            </View>

            <Text style={styles.clientPhone}>{formatPhone(item.phone)}</Text>

            <View style={styles.clientLocRow}>
              <Ionicons name="location-outline" size={11} color={COLORS.gray400} />
              <Text style={styles.clientLoc} numberOfLines={1}>
                {item.neighborhood}
              </Text>
            </View>
          </View>

          <View style={styles.clientRight}>
            {item.balance > 0 ? (
                <View style={styles.balanceWarn}>
                  <Text style={styles.balanceWarnText}>
                    {formatCurrency(item.balance)}
                  </Text>
                </View>
            ) : (
                <View style={styles.balanceOk}>
                  <Text style={styles.balanceOkText}>Soldé</Text>
                </View>
            )}
            <Feather name="chevron-right" size={16} color={COLORS.gray300} />
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
              <Text style={styles.screenTitle}>Clients</Text>
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="options-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.navigate('AddClient')}
              >
                <Ionicons name="add" size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons
                name="search-outline"
                size={16}
                color={COLORS.gray400}
                style={styles.searchIcon}
            />
            <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un client..."
                placeholderTextColor={COLORS.gray400}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
                </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {FILTERS.map((f) => (
                <TouchableOpacity
                    key={f.key}
                    style={[styles.tab, activeFilter === f.key && styles.tabActive]}
                    onPress={() => setActiveFilter(f.key)}
                >
                  <Text
                      style={[
                        styles.tabText,
                        activeFilter === f.key && styles.tabTextActive,
                      ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
            data={filteredClients}
            keyExtractor={(item) => item.id}
            renderItem={renderClientItem}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Stats */}
                <View style={styles.statsRow}>
                  <StatCard
                      label="Total clients"
                      value={String(totalClients)}
                      sub="↑ +3 ce mois"
                      subColor={COLORS.primary}
                  />
                  <StatCard
                      label="Soldes en attente"
                      value={formatCurrency(totalUnpaid)}
                      sub={`${clientsWithBalance.length} clients`}
                      subColor={COLORS.warning}
                  />
                </View>

                <Text style={styles.sectionLabel}>
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </Text>
              </>
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.gray300} />
                <Text style={styles.emptyText}>Aucun client trouvé</Text>
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={styles.emptyAction}>Effacer la recherche</Text>
                    </TouchableOpacity>
                )}
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
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },

  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
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
    fontWeight: FONT_WEIGHTS.regular,
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
    marginBottom: 4,
  },
  statValue: {
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

  // ── Client Card ──
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },

  // ── Avatar ──
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // ── Client Info ──
  clientInfo: {
    flex: 1,
    minWidth: 0,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    flexShrink: 1,
  },
  clientPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  clientLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  clientLoc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray400,
    flexShrink: 1,
  },

  // ── Badges ──
  badgeFidele: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  badgeFideleText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: FONT_WEIGHTS.medium,
  },
  badgeNew: {
    backgroundColor: '#EDE9FE',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  badgeNewText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Client Right ──
  clientRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  balanceWarn: {
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  balanceWarnText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: FONT_WEIGHTS.medium,
  },
  balanceOk: {
    backgroundColor: '#D1FAE5',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  balanceOkText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginTop: SPACING.md,
  },
  emptyAction: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});