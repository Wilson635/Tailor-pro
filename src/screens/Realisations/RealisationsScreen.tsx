// ==========================================
// ÉCRAN LISTE DES RÉALISATIONS — TailorPro (Module 5)
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS, STATUT_REALISATION_LIST,
  STATUT_REALISATION_ICONS,
} from '@constants/realisationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Realisation, StatutRealisation } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Realisations'>;

// ── PALETTE ──────────────────────────────────────────────────────────
const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

// ── CARTE RÉALISATION ─────────────────────────────────────────────────
const RealisationCard = ({
  item,
  onPress,
}: {
  item: Realisation;
  onPress: () => void;
}) => {
  const statutColor = STATUT_REALISATION_COLORS[item.statut];
  const statutLabel = STATUT_REALISATION_LABELS[item.statut];
  const hasPhoto = item.photos.length > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
            <Ionicons name="shirt-outline" size={28} color={C.textTer} />
          </View>
        )}
        {item.photos.length > 1 && (
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>+{item.photos.length - 1}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.tissuLabel ?? 'Réalisation'}
          </Text>
          <View style={[styles.statutBadge, { backgroundColor: statutColor + '22' }]}>
            <View style={[styles.statutDot, { backgroundColor: statutColor }]} />
            <Text style={[styles.statutText, { color: statutColor }]}>{statutLabel}</Text>
          </View>
        </View>

        {item.couleur ? (
          <Text style={styles.cardSub} numberOfLines={1}>🎨 {item.couleur}</Text>
        ) : null}

        <View style={styles.cardDates}>
          <Ionicons name="calendar-outline" size={12} color={C.textSec} />
          <Text style={styles.dateText}>
            Livraison :{' '}
            {item.dateLivraison
              ? new Date(item.dateLivraison).toLocaleDateString('fr-FR')
              : '—'}
          </Text>
        </View>

        {item.accessoires.length > 0 && (
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.accessoires.slice(0, 3).join(' · ')}
            {item.accessoires.length > 3 ? ` +${item.accessoires.length - 3}` : ''}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={C.textTer} />
    </TouchableOpacity>
  );
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const RealisationsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;

  const { realisations, loadRealisations, getClientById } = useAppStore();
  const client = getClientById(clientId);
  const clientReals = realisations[clientId] ?? [];

  const [activeStatut, setActiveStatut] = useState<StatutRealisation | 'all'>('all');
  const [isLoading, setIsLoading]       = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    await loadRealisations(clientId);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const filtered = useMemo(() => {
    const base = activeStatut === 'all'
      ? clientReals
      : clientReals.filter(r => r.statut === activeStatut);
    return [...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [clientReals, activeStatut]);

  const countByStatut = useMemo(() => {
    const counts: Record<string, number> = { all: clientReals.length };
    for (const s of STATUT_REALISATION_LIST) counts[s] = clientReals.filter(r => r.statut === s).length;
    return counts;
  }, [clientReals]);

  const FILTERS: { key: StatutRealisation | 'all'; label: string }[] = [
    { key: 'all', label: `Toutes (${countByStatut.all})` },
    ...STATUT_REALISATION_LIST
      .filter(s => countByStatut[s] > 0)
      .map(s => ({ key: s, label: `${STATUT_REALISATION_LABELS[s]} (${countByStatut[s]})` })),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Réalisations</Text>
          {client && <Text style={styles.headerSub}>{client.nom}</Text>}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddRealisation', { clientId })}
        >
          <Ionicons name="add" size={22} color={C.gold} />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={i => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item: f }) => {
          const active = activeStatut === f.key;
          const color  = f.key === 'all' ? C.purple600 : STATUT_REALISATION_COLORS[f.key as StatutRealisation];
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: color + '22', borderColor: color }]}
              onPress={() => setActiveStatut(f.key)}
            >
              {f.key !== 'all' && (
                <Ionicons
                  name={STATUT_REALISATION_ICONS[f.key as StatutRealisation] as any}
                  size={13}
                  color={active ? color : C.textSec}
                />
              )}
              <Text style={[styles.filterText, active && { color }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Liste */}
      {isLoading ? (
        <ActivityIndicator size="large" color={C.purple600} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shirt-outline" size={56} color={C.textTer} />
              <Text style={styles.emptyTitle}>Aucune réalisation</Text>
              <Text style={styles.emptySub}>
                {activeStatut === 'all'
                  ? 'Créez la première réalisation pour ce client.'
                  : `Aucune réalisation au statut « ${STATUT_REALISATION_LABELS[activeStatut as StatutRealisation]} ».`}
              </Text>
              {activeStatut === 'all' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AddRealisation', { clientId })}
                >
                  <Text style={styles.emptyBtnText}>+ Nouvelle réalisation</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <RealisationCard
              item={item}
              onPress={() => navigation.navigate('RealisationDetails', { realisationId: item.id, clientId })}
            />
          )}
        />
      )}

      {/* FAB */}
      {!isLoading && filtered.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('AddRealisation', { clientId })}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:    { padding: 4, marginRight: 8 },
  headerCenter:{ flex: 1 },
  headerTitle:{ fontSize: 20, fontWeight: '700', color: C.text },
  headerSub:  { fontSize: 13, color: C.textSec, marginTop: 1 },
  addBtn:     { padding: 6, backgroundColor: C.purple900, borderRadius: 10, marginLeft: 8 },

  filtersRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterText: { fontSize: 13, color: C.textSec, fontWeight: '500' },

  list:       { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  listEmpty:  { flex: 1 },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: C.border },
  thumb:      { position: 'relative' },
  thumbImg:   { width: 72, height: 72, borderRadius: 12, backgroundColor: C.border },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoCount: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  photoCountText: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  cardBody:   { flex: 1, gap: 4 },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:  { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:    { fontSize: 12, color: C.textSec },
  cardDates:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:   { fontSize: 12, color: C.textSec },

  statutBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 20 },
  statutDot:  { width: 6, height: 6, borderRadius: 3 },
  statutText: { fontSize: 11, fontWeight: '600' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptySub:   { fontSize: 14, color: C.textSec, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn:   { marginTop: 16, backgroundColor: C.purple900, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:{ fontSize: 15, fontWeight: '700', color: C.gold },

  fab:        { position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.purple900, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
