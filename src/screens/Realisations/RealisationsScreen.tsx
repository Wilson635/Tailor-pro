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
import { RC } from '@screens/Realisations/RealisationForm';

type Props = NativeStackScreenProps<RootStackParamList, 'Realisations'>;

// ── CARTE RÉALISATION ─────────────────────────────────────────────────
const RealisationCard = ({ item, onPress }: { item: Realisation; onPress: () => void }) => {
  const statutColor = STATUT_REALISATION_COLORS[item.statut];
  const statutLabel = STATUT_REALISATION_LABELS[item.statut];
  const hasPhoto = item.photos.length > 0;

  return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.thumb}>
          {hasPhoto ? (
              <Image source={{ uri: item.photos[0] }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
              <View style={[styles.thumbImg, styles.thumbPlaceholder]}>
                <Ionicons name="shirt-outline" size={26} color={RC.textTer} />
              </View>
          )}
          {item.photos.length > 1 && (
              <View style={styles.photoCount}>
                <Text style={styles.photoCountText}>+{item.photos.length - 1}</Text>
              </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.tissuLabel ?? 'Réalisation'}</Text>
          {item.couleur ? <Text style={styles.cardSub} numberOfLines={1}>{item.couleur}</Text> : null}

          <View style={styles.cardFootRow}>
            <View style={styles.statutRow}>
              <View style={[styles.statutDot, { backgroundColor: statutColor }]} />
              <Text style={[styles.statutText, { color: statutColor }]}>{statutLabel}</Text>
            </View>
            {item.dateLivraison && (
                <Text style={styles.dateText}>
                  Livraison {new Date(item.dateLivraison).toLocaleDateString('fr-FR')}
                </Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={RC.textTer} />
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    await loadRealisations(clientId);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const filtered = useMemo(() => {
    const base = activeStatut === 'all' ? clientReals : clientReals.filter(r => r.statut === activeStatut);
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clientReals, activeStatut]);

  const countByStatut = useMemo(() => {
    const counts: Record<string, number> = { all: clientReals.length };
    for (const s of STATUT_REALISATION_LIST) counts[s] = clientReals.filter(r => r.statut === s).length;
    return counts;
  }, [clientReals]);

  const FILTERS: { key: StatutRealisation | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: countByStatut.all },
    ...STATUT_REALISATION_LIST
        .filter(s => countByStatut[s] > 0)
        .map(s => ({ key: s, label: STATUT_REALISATION_LABELS[s], count: countByStatut[s] })),
  ];

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={RC.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Réalisations</Text>
            {client && <Text style={styles.headerSub}>{client.nom}</Text>}
          </View>
          <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddRealisation', { clientId })}
          >
            <Ionicons name="add" size={22} color={RC.gold} />
          </TouchableOpacity>
        </View>

        {/* Filtres — onglets soulignés plutôt que pastilles colorées */}
        <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={i => i.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            renderItem={({ item: f }) => {
              const active = activeStatut === f.key;
              const color = f.key === 'all' ? RC.plum : STATUT_REALISATION_COLORS[f.key as StatutRealisation];
              return (
                  <TouchableOpacity style={styles.filterTab} onPress={() => setActiveStatut(f.key)}>
                    {f.key !== 'all' && (
                        <Ionicons
                            name={STATUT_REALISATION_ICONS[f.key as StatutRealisation] as any}
                            size={12}
                            color={active ? color : RC.textTer}
                        />
                    )}
                    <Text style={[styles.filterText, active && { color, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                      {f.label} · {f.count}
                    </Text>
                    <View style={[styles.filterUnderline, active && { backgroundColor: color }]} />
                  </TouchableOpacity>
              );
            }}
        />

        {/* Liste */}
        {isLoading ? (
            <ActivityIndicator size="large" color={RC.plum} style={{ marginTop: 60 }} />
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
                    <Ionicons name="shirt-outline" size={52} color={RC.textTer} />
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
                          <Text style={styles.emptyBtnText}>Nouvelle réalisation</Text>
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
              <Ionicons name="add" size={26} color={RC.gold} />
            </TouchableOpacity>
        )}
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RC.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: RC.hairline,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 19, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text },
  headerSub: { fontSize: 12.5, color: RC.textSec, marginTop: 1, fontFamily: 'PlusJakartaSans_500Medium' },
  addBtn: { padding: 7, backgroundColor: RC.ink, borderRadius: 12, marginLeft: 8 },

  filtersRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 20 },
  filterTab: { alignItems: 'center', gap: 6, flexDirection: 'row' },
  filterText: { fontSize: 13, color: RC.textSec, fontFamily: 'PlusJakartaSans_600SemiBold' },
  filterUnderline: {
    position: 'absolute', bottom: -8, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: 'transparent',
  },

  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 10, paddingTop: 6 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: RC.linen,
    borderRadius: 18, padding: 12, gap: 12,
  },
  thumb: { position: 'relative' },
  thumbImg: { width: 68, height: 68, borderRadius: 14, backgroundColor: RC.hairline },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoCount: {
    position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(29,16,51,0.75)',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  photoCountText: { fontSize: 10, color: '#FFF', fontFamily: 'PlusJakartaSans_700Bold' },

  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text },
  cardSub: { fontSize: 12.5, color: RC.textSec, fontFamily: 'PlusJakartaSans_500Medium' },
  cardFootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },

  statutRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statutDot: { width: 6, height: 6, borderRadius: 3 },
  statutText: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold' },
  dateText: { fontSize: 11, color: RC.textTer, fontFamily: 'PlusJakartaSans_500Medium' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text },
  emptySub: { fontSize: 13.5, color: RC.textSec, textAlign: 'center', paddingHorizontal: 32, fontFamily: 'PlusJakartaSans_500Medium' },
  emptyBtn: { marginTop: 16, backgroundColor: RC.ink, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24 },
  emptyBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: RC.gold },

  fab: {
    position: 'absolute', right: 20, width: 54, height: 54, borderRadius: 27,
    backgroundColor: RC.ink, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
});