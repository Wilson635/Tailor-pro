// ==========================================
// CATALOGUE — TailorPro
// Grille éditoriale, charte indigo · violet · or
// ==========================================

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { nativeDriver } from '@utils/animation';
import { useThemedStyles, type Palette } from '@/src/theme';
import {
  CATALOG_FILTER_CATEGORIES,
  CATALOG_CATEGORY_LABELS,
  CATALOG_CATEGORY_ICONS,
} from '@constants/catalogConstants';
import type { CatalogModel } from '../../types';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const GUTTER = 20;
const GAP = 12;
const CARD_W = (width - GUTTER * 2 - GAP) / 2;
const CARD_H = CARD_W * 1.42;

const ModelCard = ({
  item,
  index,
  colors,
  styles,
  onPress,
  onFavorite,
}: {
  item: CatalogModel;
  index: number;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
  onFavorite: () => void;
}) => {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const heart = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index, 8) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { scale: press },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.spring(press, { toValue: 0.97, useNativeDriver: nativeDriver, speed: 40 }).start()}
        onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: nativeDriver, friction: 6 }).start()}
      >
        <View style={styles.card}>
          {item.photos[0] ? (
            <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Ionicons name="shirt-outline" size={28} color={colors.gold} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(14,11,20,0.15)', 'rgba(14,11,20,0.88)']}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => {
              Animated.sequence([
                Animated.spring(heart, { toValue: 1.28, useNativeDriver: nativeDriver, speed: 28, bounciness: 12 }),
                Animated.spring(heart, { toValue: 1, useNativeDriver: nativeDriver, speed: 18 }),
              ]).start();
              onFavorite();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: heart }] }}>
              <Ionicons
                name={item.isFavorite ? 'heart' : 'heart-outline'}
                size={15}
                color={item.isFavorite ? colors.gold : '#fff'}
              />
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.cardMeta}>
            <View style={styles.cardPills}>
              <View style={styles.catPill}>
                <Text style={styles.catPillText}>
                  {CATALOG_CATEGORY_LABELS[item.categorie] ?? item.categorie}
                </Text>
              </View>
              {item.statut === 'public' ? (
                <View style={styles.catPill}>
                  <Ionicons name="globe-outline" size={10} color={colors.gold} />
                </View>
              ) : null}
            </View>
            <Text style={styles.cardName} numberOfLines={1}>{item.nom}</Text>
            <Text style={styles.cardPrice}>
              {item.prixIndicatif > 0 ? formatCurrencyShort(item.prixIndicatif) : 'Sur devis'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CatalogScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, styles } = useThemedStyles(makeStyles);
  const navigation = useNavigation<NavigationProp>();
  const { catalog, toggleCatalogFavorite } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const favoriteCount = useMemo(() => catalog.filter((m) => m.isFavorite).length, [catalog]);

  const filteredModels = useMemo(() => {
    let result = catalog;
    if (favOnly) result = result.filter((m) => m.isFavorite);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.nom.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q),
      );
    }
    if (activeCategory !== 'all') {
      result = result.filter((m) => m.categorie === activeCategory);
    }
    return result;
  }, [catalog, searchQuery, activeCategory, favOnly]);

  const handleFavorite = useCallback(
    (modelId: string) => toggleCatalogFavorite(modelId),
    [toggleCatalogFavorite],
  );

  const filterKey = `${activeCategory}::${searchQuery}::${favOnly}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle}>Catalogue</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{catalog.length}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddCatalogModel')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={colors.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocus]}>
        <Ionicons name="search-outline" size={16} color={searchFocused ? colors.primary : colors.sub} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un modèle…"
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.sub} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chipsRow}
      >
        <TouchableOpacity
          onPress={() => setFavOnly((v) => !v)}
          style={[styles.filterChip, favOnly && styles.filterChipOn]}
          activeOpacity={0.8}
        >
          <Ionicons name={favOnly ? 'heart' : 'heart-outline'} size={13} color={favOnly ? colors.gold : colors.sub} />
          <Text style={[styles.filterChipText, favOnly && styles.filterChipTextOn]}>
            Favoris{favoriteCount > 0 ? ` ${favoriteCount}` : ''}
          </Text>
        </TouchableOpacity>
        {CATALOG_FILTER_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.filterChip, active && styles.filterChipOn]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={CATALOG_CATEGORY_ICONS[cat]}
                size={13}
                color={active ? colors.gold : colors.sub}
              />
              <Text style={[styles.filterChipText, active && styles.filterChipTextOn]}>
                {CATALOG_CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredModels}
        keyExtractor={(item) => `${item.id}::${filterKey}`}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.grid,
          filteredModels.length === 0 && styles.gridEmpty,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ModelCard
            item={item}
            index={index}
            colors={colors}
            styles={styles}
            onPress={() => navigation.navigate('ModelDetails', { modelId: item.id })}
            onFavorite={() => handleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="images-outline" size={28} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery || activeCategory !== 'all' || favOnly
                ? 'Aucun modèle'
                : 'Votre vitrine est vide'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery || activeCategory !== 'all' || favOnly
                ? 'Essayez un autre filtre ou une autre recherche.'
                : 'Ajoutez vos créations pour les proposer à vos clients.'}
            </Text>
            {!searchQuery && activeCategory === 'all' && !favOnly && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddCatalogModel')}
              >
                <Ionicons name="add" size={16} color={colors.gold} />
                <Text style={styles.emptyBtnText}>Nouveau modèle</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: P.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: P.text,
    letterSpacing: -0.6,
  },
  headerRight: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 2 },
  countPill: {
    minWidth: 32, height: 32, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  countText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  searchWrap: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    marginHorizontal: GUTTER, marginBottom: 12,
    backgroundColor: P.surface, borderRadius: 14, height: 44,
    paddingHorizontal: 14, borderWidth: 0.5, borderColor: P.borderHard,
  },
  searchWrapFocus: { borderColor: P.primary },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text, height: '100%' as const,
  },
  chipsRow: { paddingHorizontal: GUTTER, paddingBottom: 14, gap: 8 },
  filterChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  filterChipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  filterChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  filterChipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  grid: { paddingHorizontal: GUTTER },
  gridEmpty: { flexGrow: 1 },
  gridRow: { gap: GAP, marginBottom: GAP },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 18, overflow: 'hidden' as const,
    backgroundColor: P.bg, borderWidth: 0.5, borderColor: P.goldRim,
  },
  cardImage: { width: '100%' as const, height: '100%' as const },
  cardPlaceholder: { alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.bg },
  favBtn: {
    position: 'absolute' as const, top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(14,11,20,0.45)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.35)',
  },
  cardMeta: { position: 'absolute' as const, left: 10, right: 10, bottom: 12 },
  cardPills: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 6 },
  catPill: {
    backgroundColor: 'rgba(212,175,55,0.18)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.35)',
  },
  catPillText: { fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#D4AF37', letterSpacing: 0.3 },
  cardName: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  cardPrice: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#D4AF37', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 36, paddingTop: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim, marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, textAlign: 'center' as const },
  emptySub: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub,
    textAlign: 'center' as const, marginTop: 8, lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    marginTop: 20, backgroundColor: P.bg, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: P.goldRim,
  },
  emptyBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
