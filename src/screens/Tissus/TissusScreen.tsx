// ==========================================
// ÉCRAN LISTE DES TISSUS — TailorPro (Module 6)
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  TYPE_TISSU_LIST, TYPE_TISSU_LABELS, TYPE_TISSU_COLORS, TYPE_TISSU_ICONS,
} from '@constants/tissuConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Tissu } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tissus'>;

const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

// ── CARTE TISSU ───────────────────────────────────────────────────────
const TissuCard = ({ item, onPress }: { item: Tissu; onPress: () => void }) => {
  const typeColor = TYPE_TISSU_COLORS[item.typeTissu] ?? C.textSec;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Photo / placeholder */}
      <View style={styles.thumb}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbImg, styles.thumbPlaceholder, { backgroundColor: typeColor + '22' }]}>
            <Ionicons
              name={TYPE_TISSU_ICONS[item.typeTissu] as any ?? 'layers-outline'}
              size={28}
              color={typeColor}
            />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.nomCommercial}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '22' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {TYPE_TISSU_LABELS[item.typeTissu] ?? item.typeTissu}
            </Text>
          </View>
        </View>

        {item.couleur ? <Text style={styles.cardSub}>🎨 {item.couleur}</Text> : null}

        <View style={styles.cardMeta}>
          {item.fournisseur ? (
            <View style={styles.metaItem}>
              <Ionicons name="storefront-outline" size={12} color={C.textSec} />
              <Text style={styles.metaText}>{item.fournisseur}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={12} color={C.textSec} />
            <Text style={styles.metaText}>{item.prixUnitaire.toFixed(0)} F/m</Text>
          </View>
          {item.quantiteUtilisee > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="cut-outline" size={12} color={C.textSec} />
              <Text style={styles.metaText}>{item.quantiteUtilisee} m utilisés</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={C.textTer} />
    </TouchableOpacity>
  );
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const TissusScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { tissus, loadTissus } = useAppStore();

  const [activeType,  setActiveType]  = useState<string>('all');
  const [query,       setQuery]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    await loadTissus();
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const typesWithData = useMemo(
    () => TYPE_TISSU_LIST.filter(t => tissus.some(tx => tx.typeTissu === t)),
    [tissus]
  );

  const filtered = useMemo(() => {
    let base = activeType === 'all' ? tissus : tissus.filter(t => t.typeTissu === activeType);
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(t =>
        t.nomCommercial.toLowerCase().includes(q) ||
        (t.fournisseur ?? '').toLowerCase().includes(q) ||
        t.couleur.toLowerCase().includes(q)
      );
    }
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tissus, activeType, query]);

  const FILTERS = [
    { key: 'all', label: `Tous (${tissus.length})` },
    ...typesWithData.map(t => ({
      key: t,
      label: `${TYPE_TISSU_LABELS[t]} (${tissus.filter(tx => tx.typeTissu === t).length})`,
    })),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes tissus</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddTissu', {})}
        >
          <Ionicons name="add" size={22} color={C.gold} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={C.textTer} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un tissu, fournisseur…"
          placeholderTextColor={C.textTer}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={C.textTer} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres type */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={i => i.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        renderItem={({ item: f }) => {
          const active = activeType === f.key;
          const color  = f.key === 'all' ? C.purple600 : TYPE_TISSU_COLORS[f.key] ?? C.textSec;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && { backgroundColor: color + '22', borderColor: color }]}
              onPress={() => setActiveType(f.key)}
            >
              {f.key !== 'all' && (
                <Ionicons name={TYPE_TISSU_ICONS[f.key] as any} size={12} color={active ? color : C.textSec} />
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
          keyExtractor={t => t.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="layers-outline" size={56} color={C.textTer} />
              <Text style={styles.emptyTitle}>Aucun tissu</Text>
              <Text style={styles.emptySub}>
                {query
                  ? `Aucun résultat pour « ${query} ».`
                  : 'Ajoutez votre premier tissu pour commencer.'}
              </Text>
              {!query && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AddTissu', {})}
                >
                  <Text style={styles.emptyBtnText}>+ Nouveau tissu</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TissuCard
              item={item}
              onPress={() => navigation.navigate('TissuDetails', { tissuId: item.id })}
            />
          )}
        />
      )}

      {/* FAB */}
      {!isLoading && filtered.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('AddTissu', {})}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: C.text },
  addBtn:      { padding: 6, backgroundColor: C.purple900, borderRadius: 10 },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.surface },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.text },

  filtersRow:  { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  filterChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterText:  { fontSize: 13, color: C.textSec, fontWeight: '500' },

  list:        { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  listEmpty:   { flex: 1 },

  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: C.border },
  thumb:       {},
  thumbImg:    { width: 68, height: 68, borderRadius: 12 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody:    { flex: 1, gap: 4 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:     { fontSize: 12, color: C.textSec },
  typeBadge:   { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  typeText:    { fontSize: 11, fontWeight: '600' },
  cardMeta:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:    { fontSize: 11, color: C.textSec },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: C.text },
  emptySub:    { fontSize: 14, color: C.textSec, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn:    { marginTop: 16, backgroundColor: C.purple900, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText:{ fontSize: 15, fontWeight: '700', color: C.gold },

  fab:         { position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.purple900, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.gold },
});
