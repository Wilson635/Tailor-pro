// ==========================================
// ÉCRAN DÉTAILS DU MODÈLE - TailorPro
// ==========================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { CATALOG_CATEGORY_LABELS } from '@constants/catalogConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ModelDetails'>;

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

const DIFFICULTE_META: Record<string, { label: string; color: string; bg: string }> = {
  facile:    { label: 'Facile',    color: '#16A34A', bg: '#F0FDF4' },
  moyen:     { label: 'Moyen',     color: '#D97706', bg: '#FFFBEB' },
  difficile: { label: 'Difficile', color: '#DC2626', bg: '#FEF2F2' },
};

// ==========================================
// SOUS-COMPOSANT : puce (tissu / accessoire)
// ==========================================

const Chip = ({ label }: { label: string }) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const ModelDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { modelId } = route.params;

  const {
    getModelById,
    toggleCatalogFavorite,
    toggleCatalogStatut,
    duplicateCatalogModel,
    archiveCatalogModel,
  } = useAppStore();

  const model = getModelById(modelId);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isActing, setIsActing] = useState(false);

  // ── Animations ──
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const backBtnScale = useRef(new Animated.Value(1)).current;
  const editScale = useRef(new Animated.Value(1)).current;
  const duplicateScale = useRef(new Animated.Value(1)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;
  const shareScale = useRef(new Animated.Value(1)).current;

  const pressIn = (val: Animated.Value) =>
      Animated.spring(val, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const pressOut = (val: Animated.Value) =>
      Animated.spring(val, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 8 }).start();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [modelId]);

  if (!model) {
    return (
        <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.gray300} />
          <Text style={styles.notFoundText}>Modèle introuvable</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const photos = model.photos.length > 0 ? model.photos : [];
  const difficulte = DIFFICULTE_META[model.difficulte] ?? DIFFICULTE_META.moyen;

  // ── Partager ──
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ce modèle: ${model.nom} - ${formatCurrencyShort(model.prixIndicatif)}`,
        title: model.nom,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // ── Favori (avec petit rebond) ──
  const handleToggleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 30, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
    ]).start();
    toggleCatalogFavorite(model.id);
  };

  // ── Dupliquer ──
  const handleDuplicate = async () => {
    setIsActing(true);
    const copy = await duplicateCatalogModel(model.id);
    setIsActing(false);
    if (copy) {
      navigation.replace('ModelDetails', { modelId: copy.id });
    }
  };

  // ── Supprimer (archiver) ──
  const handleDelete = () => {
    Alert.alert(
        'Supprimer ce modèle ?',
        'Il sera retiré de votre catalogue. Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              setIsActing(true);
              await archiveCatalogModel(model.id);
              setIsActing(false);
              navigation.goBack();
            },
          },
        ]
    );
  };

  // ── Header overlay qui apparaît au scroll ──
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 140, HERO_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Parallax / zoom de l'image héro ──
  const heroScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.35, 1],
    extrapolateRight: 'clamp',
  });
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT * 0.3],
    extrapolate: 'clamp',
  });

  return (
      <View style={styles.container}>
        {/* ── Header flottant animé (apparaît au scroll) ── */}
        <Animated.View
            style={[
              styles.floatingHeader,
              { paddingTop: insets.top + 6, opacity: headerBgOpacity },
            ]}
            pointerEvents="none"
        >
          <View style={styles.floatingHeaderBg} />
        </Animated.View>

        <View style={[styles.headerButtonsRow, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              onPressIn={() => pressIn(backBtnScale)}
              onPressOut={() => pressOut(backBtnScale)}
              activeOpacity={1}
          >
            <Animated.View style={[styles.headerButton, { transform: [{ scale: backBtnScale }] }]}>
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.Text
              style={[styles.floatingTitle, { opacity: headerBgOpacity }]}
              numberOfLines={1}
          >
            {model.nom}
          </Animated.Text>

          <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                  name={model.isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={model.isFavorite ? COLORS.error : COLORS.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
            )}
        >
          {/* ── Image héro avec effet parallax ── */}
          <View style={styles.heroContainer}>
            {photos.length > 0 ? (
                <Animated.Image
                    source={{ uri: photos[activePhotoIndex] }}
                    style={[
                      styles.heroImage,
                      { transform: [{ scale: heroScale }, { translateY: heroTranslate }] },
                    ]}
                />
            ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                  <Ionicons name="image-outline" size={48} color={COLORS.gray300} />
                  <Text style={styles.heroPlaceholderText}>Aucune photo</Text>
                </View>
            )}

            {/* Dots indicateurs */}
            {photos.length > 1 && (
                <View style={styles.dotsRow}>
                  {photos.map((_, i) => (
                      <View key={i} style={[styles.dot, i === activePhotoIndex && styles.dotActive]} />
                  ))}
                </View>
            )}
          </View>

          {/* Miniatures */}
          {photos.length > 1 && (
              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailContent}
              >
                {photos.map((photo, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.thumbnail, activePhotoIndex === index && styles.thumbnailActive]}
                        onPress={() => setActivePhotoIndex(index)}
                        activeOpacity={0.85}
                    >
                      <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                ))}
              </ScrollView>
          )}

          {/* ── Contenu animé (fade + slide) ── */}
          <Animated.View
              style={[
                styles.contentContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
          >
            <View style={styles.titleRow}>
              <Text style={styles.modelName}>{model.nom}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {CATALOG_CATEGORY_LABELS[model.categorie] ?? model.categorie}
                </Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix indicatif</Text>
              <Text style={styles.priceValue}>
                {model.prixIndicatif > 0 ? formatCurrencyShort(model.prixIndicatif) : '—'}
              </Text>
            </View>

            {/* ── Badges info rapide ── */}
            <View style={styles.metaRow}>
              <View style={[styles.metaBadge, { backgroundColor: difficulte.bg }]}>
                <Ionicons name="speedometer-outline" size={14} color={difficulte.color} />
                <Text style={[styles.metaBadgeText, { color: difficulte.color }]}>{difficulte.label}</Text>
              </View>

              {model.tempsMoyenRealisation != null && (
                  <View style={styles.metaBadge}>
                    <Ionicons name="time-outline" size={14} color={COLORS.gray500} />
                    <Text style={styles.metaBadgeText}>
                      {model.tempsMoyenRealisation} jour{model.tempsMoyenRealisation > 1 ? 's' : ''}
                    </Text>
                  </View>
              )}

              <TouchableOpacity
                  style={styles.metaBadge}
                  onPress={() => toggleCatalogStatut(model.id)}
                  activeOpacity={0.7}
              >
                <Ionicons
                    name={model.statut === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                    size={14}
                    color={COLORS.gray500}
                />
                <Text style={styles.metaBadgeText}>
                  {model.statut === 'public' ? 'Public' : 'Privé'}
                </Text>
              </TouchableOpacity>
            </View>

            {model.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{model.description}</Text>
                </View>
            )}

            {model.tissusRecommandes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tissus recommandés</Text>
                  <View style={styles.chipsRow}>
                    {model.tissusRecommandes.map((t, i) => <Chip key={i} label={t} />)}
                  </View>
                </View>
            )}

            {model.accessoiresNecessaires.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Accessoires nécessaires</Text>
                  <View style={styles.chipsRow}>
                    {model.accessoiresNecessaires.map((a, i) => <Chip key={i} label={a} />)}
                  </View>
                </View>
            )}

            {/* ── Actions secondaires ── */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                  onPress={() => navigation.navigate('EditCatalogModel', { modelId: model.id })}
                  onPressIn={() => pressIn(editScale)}
                  onPressOut={() => pressOut(editScale)}
                  activeOpacity={1}
                  style={{ flex: 1 }}
              >
                <Animated.View style={[styles.actionCard, { transform: [{ scale: editScale }] }]}>
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionCardLabel}>Modifier</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={handleDuplicate}
                  onPressIn={() => pressIn(duplicateScale)}
                  onPressOut={() => pressOut(duplicateScale)}
                  activeOpacity={1}
                  disabled={isActing}
                  style={{ flex: 1 }}
              >
                <Animated.View style={[styles.actionCard, { transform: [{ scale: duplicateScale }] }]}>
                  <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionCardLabel}>Dupliquer</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={handleDelete}
                  onPressIn={() => pressIn(deleteScale)}
                  onPressOut={() => pressOut(deleteScale)}
                  activeOpacity={1}
                  disabled={isActing}
                  style={{ flex: 1 }}
              >
                <Animated.View style={[styles.actionCard, styles.actionCardDanger, { transform: [{ scale: deleteScale }] }]}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  <Text style={[styles.actionCardLabel, { color: COLORS.error }]}>Supprimer</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </Animated.View>
        </Animated.ScrollView>

        {/* ── Footer ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          {isActing ? (
              <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
          ) : (
              <TouchableOpacity
                  onPress={handleShare}
                  onPressIn={() => pressIn(shareScale)}
                  onPressOut={() => pressOut(shareScale)}
                  activeOpacity={1}
                  style={{ flex: 1 }}
              >
                <Animated.View style={[styles.shareButton, { transform: [{ scale: shareScale }] }]}>
                  <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.shareButtonText}>Partager ce modèle</Text>
                </Animated.View>
              </TouchableOpacity>
          )}
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 15, color: COLORS.gray500, marginTop: 8 },

  // ── Header flottant ──
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
    height: 90,
  },
  floatingHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
  },
  headerButtonsRow: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  floatingTitle: {
    flex: 1, textAlign: 'center', fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, marginHorizontal: SPACING.sm,
  },
  headerButton: {
    width: 40, height: 40, borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // ── Héro / photos ──
  heroContainer: { height: HERO_HEIGHT, overflow: 'hidden', backgroundColor: COLORS.gray100 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroPlaceholderText: { fontSize: FONT_SIZES.sm, color: COLORS.gray400 },
  dotsRow: {
    position: 'absolute', bottom: SPACING.md, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },

  thumbnailContent: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm,
  },
  thumbnail: {
    width: 56, height: 56, borderRadius: BORDER_RADIUS.md, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: COLORS.primary },
  thumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // ── Contenu ──
  content: { flex: 1 },
  contentContainer: { padding: SPACING.lg },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: SPACING.md, gap: SPACING.sm,
  },
  modelName: {
    fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, flex: 1,
  },
  categoryBadge: {
    backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary },

  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: COLORS.gray100, marginBottom: SPACING.md,
  },
  priceLabel: { fontSize: FONT_SIZES.sm, color: COLORS.gray500 },
  priceValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },

  // ── Meta badges ──
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  metaBadgeText: { fontSize: 12, fontWeight: FONT_WEIGHTS.medium, color: COLORS.gray600 },

  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, marginBottom: SPACING.sm,
  },
  description: { fontSize: FONT_SIZES.md, color: COLORS.gray600, lineHeight: 22 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { fontSize: 12.5, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },

  // ── Actions ──
  actionsGrid: { flexDirection: 'row', gap: 10, marginTop: SPACING.sm },
  actionCard: {
    flex: 1, backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14, alignItems: 'center', gap: 6,
  },
  actionCardDanger: { backgroundColor: '#FFF5F5' },
  actionCardLabel: { fontSize: 12, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },

  // ── Footer ──
  footer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.gray100, backgroundColor: COLORS.white,
  },
  shareButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  shareButtonText: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold },
});