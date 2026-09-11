// ==========================================
// LISTE DES RÉALISATIONS — TailorPro
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS, STATUT_REALISATION_LIST, STATUT_STEP } from '@constants/realisationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Realisation, StatutRealisation } from '../../types';
import { useThemedStyles, type Palette } from '@/src/theme';
import { Avatar } from '@components/ui';
import { realisationTitle } from '@screens/Realisations/RealisationForm';
import type { CatalogModel } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Realisations'>;
type FilterKey = StatutRealisation | 'all';

const RealisationCard = ({
  item,
  styles,
  catalog,
  onPress,
}: {
  item: Realisation;
  styles: ReturnType<typeof makeStyles>;
  catalog: CatalogModel[];
  onPress: () => void;
}) => {
  const statutColor = STATUT_REALISATION_COLORS[item.statut];
  const statutLabel = STATUT_REALISATION_LABELS[item.statut];
  const hasPhoto = item.photos.length > 0;
  const title = realisationTitle(item, catalog);
  const sub = [item.tissuLabel, item.couleur].filter(Boolean).filter((s) => s !== title).join(' · ');
  const step = STATUT_STEP[item.statut] ?? 0;
  const total = Math.max(STATUT_REALISATION_LIST.length - 1, 1);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.photoStage}>
        {hasPhoto ? (
          <Image source={{ uri: item.photos[0] }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="shirt-outline" size={28} color="#D4AF37" />
          </View>
        )}
        <View style={[styles.heroPill, { backgroundColor: statutColor }]}>
          <Text style={styles.heroPillText}>{statutLabel}</Text>
        </View>
        {item.photos.length > 1 && (
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>{item.photos.length} photos</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.cardSub} numberOfLines={1}>{sub}</Text> : null}
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${(step / total) * 100}%` }]} />
        </View>
        <View style={styles.cardFootRow}>
          <Text style={styles.dateText}>
            {item.dateCreation ? new Date(item.dateCreation).toLocaleDateString('fr-FR') : ''}
          </Text>
          {item.dateLivraison ? (
            <Text style={styles.dateText}>Livr. {new Date(item.dateLivraison).toLocaleDateString('fr-FR')}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const RealisationsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { clientId } = route.params;

  const { realisations, loadRealisations, getClientById, catalog, loadCatalog } = useAppStore();
  const client = getClientById(clientId);
  const clientReals = realisations[clientId] ?? [];

  const [activeStatut, setActiveStatut] = useState<FilterKey>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    await loadRealisations(clientId);
    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); loadCatalog(); }, [clientId]);

  const filtered = useMemo(() => {
    const base = activeStatut === 'all' ? clientReals : clientReals.filter(r => r.statut === activeStatut);
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clientReals, activeStatut]);

  const countByStatut = useMemo(() => {
    const counts: Record<string, number> = { all: clientReals.length };
    for (const s of STATUT_REALISATION_LIST) counts[s] = clientReals.filter(r => r.statut === s).length;
    return counts;
  }, [clientReals]);

  const inProgress = clientReals.filter(r => r.statut === 'en_cours' || r.statut === 'essayage' || r.statut === 'corrections').length;

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: countByStatut.all },
    ...STATUT_REALISATION_LIST
      .filter(s => countByStatut[s] > 0)
      .map(s => ({ key: s, label: STATUT_REALISATION_LABELS[s], count: countByStatut[s] })),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle}>Réalisations</Text>
          {client ? (
            <View style={styles.clientRow}>
              <Avatar source={client.photo} name={client.nom} size={18} radius={6} />
              <Text style={styles.headerSub} numberOfLines={1}>{client.nom}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddRealisation', { clientId })}
        >
          <Ionicons name="add" size={18} color={P.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => {
          const on = activeStatut === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => setActiveStatut(f.key)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {f.label} · {f.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color={P.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />
          }
          ListHeaderComponent={
            clientReals.length > 0 ? (
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statLbl}>Pièces</Text>
                  <Text style={styles.statVal}>{clientReals.length}</Text>
                  <Text style={styles.statSub}>au total</Text>
                </View>
                <View style={[styles.stat, styles.statGold]}>
                  <Text style={styles.statLbl}>En atelier</Text>
                  <Text style={[styles.statVal, { color: P.gold }]}>{inProgress}</Text>
                  <Text style={styles.statSub}>en cours / essayage</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shirt-outline" size={26} color={P.gold} />
              </View>
              <Text style={styles.emptyTitle}>Aucune réalisation</Text>
              <Text style={styles.emptySub}>
                {activeStatut === 'all'
                  ? 'Créez une pièce pour suivre confection, photos et statuts.'
                  : `Aucune pièce au statut « ${STATUT_REALISATION_LABELS[activeStatut as StatutRealisation]} ».`}
              </Text>
              {activeStatut === 'all' ? (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => navigation.navigate('AddRealisation', { clientId })}
                >
                  <Ionicons name="add" size={16} color={P.gold} />
                  <Text style={styles.emptyCtaText}>Nouvelle réalisation</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <RealisationCard
              item={item}
              styles={styles}
              catalog={catalog}
              onPress={() => navigation.navigate('RealisationDetails', { realisationId: item.id, clientId })}
            />
          )}
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
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  clientRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 6 },
  headerSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, flex: 1 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim, marginTop: 4,
  },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  listEmpty: { flexGrow: 1 },
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
    backgroundColor: P.surface, borderRadius: 20, overflow: 'hidden' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  photoStage: { height: 168, backgroundColor: P.bg, position: 'relative' as const },
  heroImg: { width: '100%' as const, height: '100%' as const },
  heroPlaceholder: {
    height: 168, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: P.bg, borderBottomWidth: 1, borderBottomColor: P.goldRim,
  },
  heroPill: {
    position: 'absolute' as const, left: 12, top: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroPillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  photoCount: {
    position: 'absolute' as const, bottom: 10, right: 10, backgroundColor: 'rgba(22,18,58,0.78)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  photoCountText: { fontSize: 10, color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  cardBody: { padding: 14, gap: 6 },
  cardTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  cardSub: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  track: { height: 3, backgroundColor: P.borderHard, borderRadius: 2, marginTop: 4 },
  trackFill: { height: 3, backgroundColor: P.gold, borderRadius: 2 },
  cardFootRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, marginTop: 2,
  },
  dateText: { fontSize: 11, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  empty: { alignItems: 'center' as const, paddingTop: 48, paddingHorizontal: 28 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
  emptyCta: {
    marginTop: 18, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: P.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: P.goldRim,
  },
  emptyCtaText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
