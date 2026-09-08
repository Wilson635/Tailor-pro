// ==========================================
// ÉCRAN CATALOGUE - TailorPro
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatCurrencyShort } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '@constants/theme';
import {
  CATALOG_FILTER_CATEGORIES,
  CATALOG_CATEGORY_LABELS,
  CATALOG_CATEGORY_ICONS,
} from '@constants/catalogConstants';
import type { CatalogModel, CatalogCategory } from '../../types';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

// ==========================================
// TYPES
// ==========================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

// CATEGORIES et CATEGORY_ICONS viennent de @constants/catalogConstants

// ==========================================
// SOUS-COMPOSANT : carte modèle (animée)
// ==========================================

const ModelCard = ({
                     item,
                     index,
                     onPress,
                     onFavorite,
                   }: {
  item: CatalogModel;
  index: number;
  onPress: () => void;
  onFavorite: () => void;
}) => {
  // ── Entrée en cascade ──
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterTranslate = useRef(new Animated.Value(18)).current;
  const enterScale = useRef(new Animated.Value(0.92)).current;

  // ── Feedback au toucher ──
  const pressScale = useRef(new Animated.Value(1)).current;

  // ── Rebond du cœur favori ──
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index, 10) * 55;
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 320,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(enterTranslate, {
        toValue: 0,
        duration: 320,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(enterScale, {
        toValue: 1,
        delay,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 8 }).start();
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 30, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();
    onFavorite();
  };

  return (
      <Animated.View
          style={{
            opacity: enterOpacity,
            transform: [
              { translateY: enterTranslate },
              { scale: Animated.multiply(enterScale, pressScale) },
            ],
          }}
      >
        <TouchableOpacity
            style={styles.modelCard}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
          <View style={styles.modelImageContainer}>
            {item.photos.length > 0 ? (
                <Image source={{ uri: item.photos[0] }} style={styles.modelImage} />
            ) : (
                <View style={[styles.modelImage, styles.modelImagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={COLORS.gray300} />
                </View>
            )}

            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavorite}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                    name={item.isFavorite ? 'heart' : 'heart-outline'}
                    size={18}
                    color={item.isFavorite ? '#EF4444' : '#fff'}
                />
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {CATALOG_CATEGORY_LABELS[item.categorie] ?? item.categorie}
              </Text>
            </View>
          </View>

          <View style={styles.modelInfo}>
            <Text style={styles.modelName} numberOfLines={1}>{item.nom}</Text>
            {item.prixIndicatif > 0 && (
                <Text style={styles.modelPrice}>{formatCurrencyShort(item.prixIndicatif)}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
  );
};

// ==========================================
// SOUS-COMPOSANT : chip catégorie (animée)
// ==========================================

const CategoryChip = ({
                        icon,
                        label,
                        active,
                        onPress,
                      }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const iconWrapScale = useRef(new Animated.Value(active ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(iconWrapScale, {
      toValue: active ? 1.06 : 0.94,
      useNativeDriver: true,
      speed: 22,
      bounciness: 9,
    }).start();
  }, [active]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 8 }).start();
  };

  return (
      <TouchableOpacity
          style={styles.catChip}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
      >
        <Animated.View
            style={[
              styles.catIconWrap,
              active && styles.catIconWrapActive,
              { transform: [{ scale: Animated.multiply(scale, iconWrapScale) }] },
            ]}
        >
          <Ionicons name={icon} size={18} color={active ? '#fff' : COLORS.gray500} />
        </Animated.View>
        <Text style={[styles.catLabel, active && styles.catLabelActive]}>{label}</Text>
      </TouchableOpacity>
  );
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const CatalogScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { catalog, toggleCatalogFavorite } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ── Animations d'entrée de l'écran ──
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;

  // ── Animation du champ de recherche (focus) ──
  const searchBorderAnim = useRef(new Animated.Value(0)).current;

  // ── Animation du bouton "+" ──
  const addBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(categoriesAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(searchBorderAnim, {
      toValue: isSearchFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // interpole une couleur, pas de driver natif
    }).start();
  }, [isSearchFocused]);

  const searchBorderColor = searchBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  const handleAddPressIn = () => {
    Animated.spring(addBtnScale, { toValue: 0.88, useNativeDriver: true, speed: 50 }).start();
  };
  const handleAddPressOut = () => {
    Animated.spring(addBtnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
    navigation.navigate('AddCatalogModel');
  };

  const filteredModels = useMemo(() => {
    let result = catalog;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
          (m) =>
              m.nom.toLowerCase().includes(q) ||
              m.description?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter((m) => m.categorie === activeCategory);
    }

    return result;
  }, [catalog, searchQuery, activeCategory]);

  // Sert à forcer un remount (et donc un replay de l'animation d'entrée)
  // des cartes quand le filtre ou la recherche change.
  const filterKey = `${activeCategory}::${searchQuery}`;

  const favoriteCount = useMemo(
      () => catalog.filter((m) => m.isFavorite).length,
      [catalog]
  );

  const handleFavorite = useCallback(
      (modelId: string) => toggleCatalogFavorite(modelId),
      [toggleCatalogFavorite]
  );

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 0],
        }),
      },
    ],
  };
  const searchStyle = {
    opacity: searchAnim,
    transform: [
      {
        translateY: searchAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };
  const categoriesStyle = {
    opacity: categoriesAnim,
    transform: [
      {
        translateY: categoriesAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View>
            <Text style={styles.headerTitle}>Mon Catalogue</Text>
            <Text style={styles.headerSub}>
              {catalog.length} modèle{catalog.length !== 1 ? 's' : ''}
              {favoriteCount > 0 ? ` · ${favoriteCount} favori${favoriteCount !== 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <TouchableOpacity
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
              activeOpacity={1}
          >
            <Animated.View style={[styles.addBtn, { transform: [{ scale: addBtnScale }] }]}>
              <Ionicons name="add" size={22} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Barre de recherche ── */}
        <Animated.View style={[styles.searchContainer, searchStyle, { borderColor: searchBorderColor }]}>
          <Ionicons
              name="search-outline"
              size={16}
              color={isSearchFocused ? COLORS.primary : COLORS.gray400}
              style={styles.searchIcon}
          />
          <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un modèle…"
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
              </TouchableOpacity>
          )}
        </Animated.View>

        {/* ── Filtres catégories ── */}
        <Animated.View style={[styles.categoriesWrapper, categoriesStyle]}>
          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
          >
            {CATALOG_FILTER_CATEGORIES.map((cat) => (
                <CategoryChip
                    key={cat}
                    icon={CATALOG_CATEGORY_ICONS[cat]}
                    label={CATALOG_CATEGORY_LABELS[cat]}
                    active={activeCategory === cat}
                    onPress={() => setActiveCategory(cat)}
                />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Grille modèles ── */}
        <FlatList
            data={filteredModels}
            keyExtractor={(item) => `${item.id}::${filterKey}`}
            renderItem={({ item, index }) => (
                <ModelCard
                    item={item}
                    index={index}
                    onPress={() => navigation.navigate('ModelDetails', { modelId: item.id })}
                    onFavorite={() => handleFavorite(item.id)}
                />
            )}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[
              styles.gridContent,
              filteredModels.length === 0 && styles.gridContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={52} color={COLORS.gray300} />
                <Text style={styles.emptyTitle}>
                  {searchQuery || activeCategory !== 'all'
                      ? 'Aucun modèle trouvé'
                      : 'Catalogue vide'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || activeCategory !== 'all'
                      ? 'Essayez d\'autres filtres'
                      : 'Appuyez sur + pour ajouter votre premier modèle'}
                </Text>
                {!searchQuery && activeCategory === 'all' && (
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('AddCatalogModel')}
                    >
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text style={styles.emptyBtnText}>Ajouter un modèle</Text>
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  headerSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Recherche ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    height: '100%',
  },

  // ── Catégories ──
  categoriesWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  catChip: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  catIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  catLabel: {
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  catLabelActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Grille ──
  gridContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  gridContentEmpty: {
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  // ── Carte modèle ──
  modelCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  modelImageContainer: {
    position: 'relative',
  },
  modelImage: {
    width: '100%',
    height: CARD_WIDTH * 1.3,
    resizeMode: 'cover',
  },
  modelImagePlaceholder: {
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: FONT_WEIGHTS.medium,
  },
  modelInfo: {
    padding: SPACING.md,
  },
  modelName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: 3,
  },
  modelPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },

  // ── Vide ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
  },
  emptyBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#fff',
  },
});