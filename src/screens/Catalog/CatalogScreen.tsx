// ==========================================
// ÉCRAN CATALOGUE - TailorPro
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar, Badge } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { CATEGORY_LABELS } from '../../constants/theme';
import type { CatalogModel, CatalogCategory } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

interface CatalogScreenProps {
  onModelPress?: (modelId: string) => void;
  onAddPress?: () => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  onModelPress,
  onAddPress,
}) => {
  const insets = useSafeAreaInsets();
  const { catalog, searchQuery, setSearchQuery, selectedCatalogCategory, setCatalogCategory, toggleCatalogFavorite } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories: CatalogCategory[] = ['all', 'robes', 'costumes', 'chemises', 'enfants'];

  const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    all: 'grid-outline',
    robes: 'woman-outline',
    costumes: 'shirt-outline',
    chemises: 'shirt-outline',
    enfants: 'happy-outline',
    mariage: 'heart-outline',
    traditionnel: 'earth-outline',
    casual: 'sunny-outline',
    luxe: 'diamond-outline',
  };

  const filteredModels = useMemo(() => {
    let result = catalog;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((model) => model.category === activeCategory);
    }

    return result;
  }, [catalog, searchQuery, activeCategory]);

  const renderModelItem = ({ item }: { item: CatalogModel }) => (
    <TouchableOpacity
      style={styles.modelCard}
      onPress={() => onModelPress?.(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.modelImageContainer}>
        <Image
          source={{ uri: item.photos[0] || 'https://via.placeholder.com/200' }}
          style={styles.modelImage}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleCatalogFavorite(item.id)}
        >
          <Ionicons
            name={item.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isFavorite ? COLORS.error : COLORS.white}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.modelInfo}>
        <Text style={styles.modelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.modelPrice}>{formatCurrency(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catalogue</Text>
        <TouchableOpacity onPress={onAddPress}>
          <Ionicons name="search" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                activeCategory === category && styles.categoryTabActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  activeCategory === category && styles.categoryIconActive,
                ]}
              >
                <Ionicons
                  name={categoryIcons[category] || 'grid-outline'}
                  size={20}
                  color={activeCategory === category ? COLORS.white : COLORS.gray500}
                />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  activeCategory === category && styles.categoryLabelActive,
                ]}
              >
                {CATEGORY_LABELS[category]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Models Grid */}
      <FlatList
        data={filteredModels}
        keyExtractor={(item) => item.id}
        renderItem={renderModelItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyText}>Aucun modèle trouvé</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  
  // Categories
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingBottom: SPACING.md,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  categoryTabActive: {},
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryIconActive: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Grid
  gridContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  
  // Model Card
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
  favoriteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelInfo: {
    padding: SPACING.md,
  },
  modelName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  modelPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  
  // Empty
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
