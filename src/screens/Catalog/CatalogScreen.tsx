// ==========================================
// ÉCRAN CATALOGUE - TailorPro
// ==========================================

import React, { useState, useMemo, useCallback } from 'react';
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
// SOUS-COMPOSANT : carte modèle
// ==========================================

const ModelCard = ({
                     item,
                     onPress,
                     onFavorite,
                   }: {
  item: CatalogModel;
  onPress: () => void;
  onFavorite: () => void;
}) => (
    <TouchableOpacity style={styles.modelCard} onPress={onPress} activeOpacity={0.85}>
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
            onPress={onFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={item.isFavorite ? '#EF4444' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {CATALOG_CATEGORY_LABELS[item.category] ?? item.category}
          </Text>
        </View>
      </View>

      <View style={styles.modelInfo}>
        <Text style={styles.modelName} numberOfLines={1}>{item.name}</Text>
        {item.price > 0 && (
            <Text style={styles.modelPrice}>{formatCurrencyShort(item.price)}</Text>
        )}
      </View>
    </TouchableOpacity>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const CatalogScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { catalog, toggleCatalogFavorite } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredModels = useMemo(() => {
    let result = catalog;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
          (m) =>
              m.name.toLowerCase().includes(q) ||
              m.description?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter((m) => m.category === activeCategory);
    }

    return result;
  }, [catalog, searchQuery, activeCategory]);

  const favoriteCount = useMemo(
      () => catalog.filter((m) => m.isFavorite).length,
      [catalog]
  );

  const handleFavorite = useCallback(
      (modelId: string) => toggleCatalogFavorite(modelId),
      [toggleCatalogFavorite]
  );

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mon Catalogue</Text>
            <Text style={styles.headerSub}>
              {catalog.length} modèle{catalog.length !== 1 ? 's' : ''}
              {favoriteCount > 0 ? ` · ${favoriteCount} favori${favoriteCount !== 1 ? 's' : ''}` : ''}
            </Text>
          </View>
          <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddCatalogModel')}
              activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Barre de recherche ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={styles.searchIcon} />
          <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un modèle…"
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
              </TouchableOpacity>
          )}
        </View>

        {/* ── Filtres catégories ── */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
          >
            {CATALOG_FILTER_CATEGORIES.map((cat) => (
                <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.7}
                >
                  <View style={[styles.catIconWrap, activeCategory === cat && styles.catIconWrapActive]}>
                    <Ionicons
                        name={CATALOG_CATEGORY_ICONS[cat]}
                        size={18}
                        color={activeCategory === cat ? '#fff' : COLORS.gray500}
                    />
                  </View>
                  <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>
                    {CATALOG_CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Grille modèles ── */}
        <FlatList
            data={filteredModels}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <ModelCard
                    item={item}
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
    borderWidth: 0.5,
    borderColor: COLORS.border,
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
  catChipActive: {},
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
