// ==========================================
// DÉCOUVRIR — TailorPro (P3)
// Ateliers publics + modèles du catalogue
// ==========================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { CATALOG_CATEGORY_LABELS, CATALOG_FILTER_CATEGORIES } from '@constants/catalogConstants';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';
import { AtelierIcon } from '@/src/components/ui';
import type { PublicAtelier } from '@/src/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const GUTTER = 20;
const GAP = 12;
const CARD_W = (width - GUTTER * 2 - GAP) / 2;

const atelierLabel = (a?: PublicAtelier | null, fallback?: string | null) =>
  a?.atelierName || a?.displayName || fallback || 'Atelier';

export const ClientDiscoverScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { catalog, publicAteliers, linkedTailors, loadCatalog, loadPublicAteliers } = useAppStore();

  const [search, setSearch] = useState('');
  const [atelierId, setAtelierId] = useState<string | 'all'>('all');
  const [category, setCategory] = useState('all');

  useFocusEffect(
    useCallback(() => {
      loadCatalog().then(() => loadPublicAteliers());
    }, [loadCatalog, loadPublicAteliers]),
  );

  const ateliers = useMemo(() => {
    const byId = new Map<string, PublicAtelier>();
    linkedTailors.forEach(t => byId.set(t.id, t));
    publicAteliers.forEach(t => {
      if (!byId.has(t.id)) byId.set(t.id, t);
    });
    catalog.forEach(m => {
      if (!m.couturierId || byId.has(m.couturierId)) return;
      byId.set(m.couturierId, {
        id: m.couturierId,
        displayName: m.atelierName ?? null,
        atelierName: m.atelierName ?? null,
        phone: null,
        whatsapp: null,
        city: null,
        avatarUrl: null,
        coverUrl: null,
        description: null,
        specialities: null,
        horaires: null,
        adresse: null,
        reseauxSociaux: null,
      });
    });
    return [...byId.values()];
  }, [linkedTailors, publicAteliers, catalog]);

  const linkedIds = useMemo(() => new Set(linkedTailors.map(t => t.id)), [linkedTailors]);

  const atelierFor = (id: string) => ateliers.find(a => a.id === id);

  const modelAtelierName = (m: typeof catalog[number]) =>
    atelierLabel(atelierFor(m.couturierId), m.atelierName);

  const models = useMemo(() => {
    let list = catalog.filter(m => m.statut === 'public' || linkedIds.has(m.couturierId));
    if (atelierId !== 'all') list = list.filter(m => m.couturierId === atelierId);
    if (category !== 'all') list = list.filter(m => m.categorie === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => {
        const atelierNom = modelAtelierName(m).toLowerCase();
        return (
          m.nom.toLowerCase().includes(q) ||
          atelierNom.includes(q) ||
          (m.description ?? '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [catalog, atelierId, category, search, linkedIds, ateliers]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Espace client</Text>
          <Text style={styles.title}>Découvrir</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={P.sub} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un modèle…"
            placeholderTextColor={P.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <Text style={styles.sectionTitle}>Ateliers</Text>
        {ateliers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="map-pin" size={22} color={P.gold} />
            <Text style={styles.emptyTitle}>Aucun atelier public pour le moment</Text>
            <Text style={styles.emptySub}>
              Liez votre couturier avec un code d’invitation, ou revenez quand des ateliers publient leur catalogue.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.atelierRow}>
            <TouchableOpacity
              style={[styles.atelierChip, atelierId === 'all' && styles.atelierChipOn]}
              onPress={() => setAtelierId('all')}
            >
              <Text style={[styles.atelierChipText, atelierId === 'all' && styles.atelierChipTextOn]}>Tous</Text>
            </TouchableOpacity>
            {ateliers.map(a => {
              const on = atelierId === a.id;
              const linked = linkedIds.has(a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.atelierChip, on && styles.atelierChipOn]}
                  onPress={() => setAtelierId(a.id)}
                  onLongPress={() => navigation.navigate('ClientAtelier', { tailorId: a.id })}
                >
                  <Text style={[styles.atelierChipText, on && styles.atelierChipTextOn]} numberOfLines={1}>
                    {atelierLabel(a)}
                  </Text>
                  {linked ? <View style={styles.linkedDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {atelierId !== 'all' && atelierFor(atelierId) && (
          <TouchableOpacity
            style={styles.atelierBanner}
            onPress={() => navigation.navigate('ClientAtelier', { tailorId: atelierId })}
            activeOpacity={0.85}
          >
            <View style={styles.atelierAvatar}>
              <AtelierIcon size={18} color={P.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.atelierBannerTitle}>
                {atelierLabel(atelierFor(atelierId)!)}
              </Text>
              <Text style={styles.atelierBannerSub}>Voir la fiche et contacter</Text>
            </View>
            <Feather name="chevron-right" size={16} color={P.muted} />
          </TouchableOpacity>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATALOG_FILTER_CATEGORIES.map(cat => {
            const on = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, on && styles.catChipOn]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, on && styles.catChipTextOn]}>
                  {CATALOG_CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Modèles</Text>
          <Text style={styles.seeAll}>{models.length}</Text>
        </View>

        {models.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="shirt-outline" size={28} color={P.gold} />
            <Text style={styles.emptyTitle}>Aucun modèle à afficher</Text>
            <Text style={styles.emptySub}>
              Les modèles marqués publics dans les catalogues atelier apparaissent ici.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {models.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('ModelDetails', { modelId: item.id })}
                  activeOpacity={0.88}
                >
                  {item.photos[0] ? (
                    <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.cardPlaceholder]}>
                      <Ionicons name="shirt-outline" size={22} color={P.gold} />
                    </View>
                  )}
                  <Text style={styles.cardAtelier} numberOfLines={1}>
                    {modelAtelierName(item)}
                  </Text>
                  <Text style={styles.cardName} numberOfLines={1}>{item.nom}</Text>
                  <Text style={styles.cardPrice}>
                    {item.prixIndicatif > 0 ? formatCurrencyShort(item.prixIndicatif) : 'Sur devis'}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: { paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 8 },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const,
  },
  title: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.4 },
  content: { paddingHorizontal: GUTTER, gap: 14 },
  searchWrap: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    backgroundColor: P.surface, borderRadius: 14, borderWidth: 0.5, borderColor: P.borderHard,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
  sectionTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  sectionHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  seeAll: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  atelierRow: { gap: 8, paddingRight: 8 },
  atelierChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard, maxWidth: 180,
  },
  atelierChipOn: { backgroundColor: '#16123A', borderColor: P.goldRim },
  atelierChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  atelierChipTextOn: { color: P.gold },
  linkedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.gold },
  atelierBanner: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, padding: 12,
  },
  atelierAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.goldBg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  atelierBannerTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  atelierBannerSub: { fontSize: 11, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
  catRow: { gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  catChipOn: { backgroundColor: P.goldBg, borderColor: P.goldRim },
  catChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  catChipTextOn: { color: P.gold },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: GAP },
  card: { width: CARD_W, gap: 4 },
  cardImage: { width: CARD_W, height: CARD_W * 1.15, borderRadius: 16, backgroundColor: P.surface, resizeMode: 'cover' as const, marginBottom: 4 },
  cardPlaceholder: { alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 0.5, borderColor: P.borderHard },
  cardAtelier: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted,
    letterSpacing: 0.4, textTransform: 'uppercase' as const,
  },
  cardName: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  cardPrice: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold, marginTop: 1 },
  emptyCard: {
    backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
    padding: 18, alignItems: 'center' as const, gap: 8, borderStyle: 'dashed' as const,
  },
  emptyTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, textAlign: 'center' as const },
  emptySub: { fontSize: 12, color: P.sub, textAlign: 'center' as const, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' },
});
