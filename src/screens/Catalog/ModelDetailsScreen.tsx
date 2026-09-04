// ==========================================
// ÉCRAN DÉTAILS DU MODÈLE - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Badge } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatCurrencyShort } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { CATEGORY_LABELS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface ModelDetailsScreenProps {
  modelId: string;
  onBack?: () => void;
  onAddToCatalog?: () => void;
}

export const ModelDetailsScreen: React.FC<ModelDetailsScreenProps> = ({
  modelId,
  onBack,
  onAddToCatalog,
}) => {
  const insets = useSafeAreaInsets();
  const { catalog, toggleCatalogFavorite } = useAppStore();
  const model = catalog.find(m => m.id === modelId);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!model) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Modèle non trouvé</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ce modèle: ${model.name} - ${formatCurrencyShort(model.price)}`,
        title: model.name,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: model.photos[activePhotoIndex] || 'https://via.placeholder.com/400' }}
          style={styles.mainImage}
        />
        
        {/* Header Overlay */}
        <View style={[styles.headerOverlay, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => toggleCatalogFavorite(model.id)}
          >
            <Ionicons
              name={model.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={model.isFavorite ? COLORS.error : COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thumbnail Gallery */}
      <View style={styles.thumbnailContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailContent}
        >
          {(model.photos.length > 0 ? model.photos : [model.photos[0]]).map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.thumbnail,
                activePhotoIndex === index && styles.thumbnailActive,
              ]}
              onPress={() => setActivePhotoIndex(index)}
            >
              <Image
                source={{ uri: photo || 'https://via.placeholder.com/80' }}
                style={styles.thumbnailImage}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.modelName}>{model.name}</Text>
          <Badge label={CATEGORY_LABELS[model.category]} variant="primary" />
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Prix</Text>
          <Text style={styles.priceValue}>{formatCurrencyShort(model.price)}</Text>
        </View>

        {model.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{model.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>
        
        <Button
          title="Ajouter au catalogue"
          onPress={onAddToCatalog || (() => {})}
          style={styles.addButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  // Image Section
  imageContainer: {
    height: height * 0.45,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Thumbnails
  thumbnailContainer: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  thumbnailContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modelName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.lg,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  priceValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  descriptionSection: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray600,
    lineHeight: 22,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  addButton: {
    flex: 1,
  },
});
