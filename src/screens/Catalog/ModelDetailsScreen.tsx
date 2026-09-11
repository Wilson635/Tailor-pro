// ==========================================
// DÉTAIL MODÈLE — TailorPro
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
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort } from '@utils/formatters';
import { nativeDriver } from '@utils/animation';
import { useThemedStyles, type Palette } from '@/src/theme';
import { CATALOG_CATEGORY_LABELS, DIFFICULTE_LABELS } from '@constants/catalogConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ModelDetails'>;

const { width, height } = Dimensions.get('window');
const HERO_H = height * 0.48;

export const ModelDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { modelId } = route.params;
  const {
    getModelById,
    toggleCatalogFavorite,
    toggleCatalogStatut,
    duplicateCatalogModel,
    archiveCatalogModel,
  } = useAppStore();

  const model = getModelById(modelId);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isActing, setIsActing] = useState(false);
  const heart = useRef(new Animated.Value(1)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sheet, {
      toValue: 1,
      duration: 420,
      useNativeDriver: nativeDriver,
    }).start();
  }, [modelId]);

  if (!model) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={36} color={P.sub} />
        <Text style={styles.notFound}>Modèle introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour au catalogue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = model.photos;
  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== photoIndex) setPhotoIndex(i);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ce modèle : ${model.nom}${model.prixIndicatif > 0 ? ` — ${formatCurrencyShort(model.prixIndicatif)}` : ''}`,
        title: model.nom,
      });
    } catch { /* ignore */ }
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heart, { toValue: 1.3, useNativeDriver: nativeDriver, speed: 28, bounciness: 12 }),
      Animated.spring(heart, { toValue: 1, useNativeDriver: nativeDriver, speed: 18 }),
    ]).start();
    toggleCatalogFavorite(model.id);
  };

  const handleDuplicate = async () => {
    setIsActing(true);
    const copy = await duplicateCatalogModel(model.id);
    setIsActing(false);
    if (copy) navigation.replace('ModelDetails', { modelId: copy.id });
  };

  const handleDelete = () => {
    Alert.alert('Retirer ce modèle ?', 'Il disparaîtra du catalogue. L’historique des commandes reste intact.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          setIsActing(true);
          await archiveCatalogModel(model.id);
          setIsActing(false);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onHeroScroll}
            scrollEventThrottle={16}
          >
            {photos.map((uri, i) => (
              <Image key={`${uri}-${i}`} source={{ uri }} style={styles.heroImage} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.heroImage, styles.heroEmpty]}>
            <Ionicons name="shirt-outline" size={48} color={P.gold} />
          </View>
        )}
        <LinearGradient
          colors={['rgba(14,11,20,0.35)', 'transparent', 'rgba(14,11,20,0.55)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={[styles.heroBar, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} onPress={handleFavorite} activeOpacity={0.85}>
            <Animated.View style={{ transform: [{ scale: heart }] }}>
              <Ionicons name={model.isFavorite ? 'heart' : 'heart-outline'} size={18} color={model.isFavorite ? P.gold : '#fff'} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotOn]} />
            ))}
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: sheet,
            transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 108 }}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.titleBlock}>
            <View style={styles.pills}>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>
                  {CATALOG_CATEGORY_LABELS[model.categorie] ?? model.categorie}
                </Text>
              </View>
              <View style={styles.softPill}>
                <Text style={styles.softPillText}>{DIFFICULTE_LABELS[model.difficulte] ?? model.difficulte}</Text>
              </View>
            </View>
            <Text style={styles.name}>{model.nom}</Text>
            <Text style={styles.price}>
              {model.prixIndicatif > 0 ? formatCurrencyShort(model.prixIndicatif) : 'Prix sur devis'}
            </Text>
          </View>

          <View style={styles.stats}>
            {model.tempsMoyenRealisation != null && (
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={16} color={P.gold} />
                <Text style={styles.statVal}>{model.tempsMoyenRealisation} j</Text>
                <Text style={styles.statLbl}>Réalisation</Text>
              </View>
            )}
            <TouchableOpacity style={styles.stat} onPress={() => toggleCatalogStatut(model.id)}>
              <Ionicons name={model.statut === 'public' ? 'globe-outline' : 'lock-closed-outline'} size={16} color={P.gold} />
              <Text style={styles.statVal}>{model.statut === 'public' ? 'Public' : 'Privé'}</Text>
              <Text style={styles.statLbl}>Visibilité</Text>
            </TouchableOpacity>
            <View style={styles.stat}>
              <Ionicons name="images-outline" size={16} color={P.gold} />
              <Text style={styles.statVal}>{photos.length}</Text>
              <Text style={styles.statLbl}>Photos</Text>
            </View>
          </View>

          {model.description ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Description</Text>
              <Text style={styles.body}>{model.description}</Text>
            </View>
          ) : null}

          {model.tissusRecommandes.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Tissus recommandés</Text>
              <View style={styles.chips}>
                {model.tissusRecommandes.map((t, i) => (
                  <View key={i} style={styles.chip}><Text style={styles.chipText}>{t}</Text></View>
                ))}
              </View>
            </View>
          )}

          {model.accessoiresNecessaires.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Accessoires</Text>
              <View style={styles.chips}>
                {model.accessoiresNecessaires.map((a, i) => (
                  <View key={i} style={styles.chip}><Text style={styles.chipText}>{a}</Text></View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('EditCatalogModel', { modelId: model.id })}>
              <Ionicons name="create-outline" size={18} color={P.primary} />
              <Text style={styles.actionText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleDuplicate} disabled={isActing}>
              <Ionicons name="copy-outline" size={18} color={P.primary} />
              <Text style={styles.actionText}>Dupliquer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleDelete} disabled={isActing}>
              <Ionicons name="trash-outline" size={18} color={P.error} />
              <Text style={[styles.actionText, { color: P.error }]}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {isActing ? (
          <ActivityIndicator color={P.gold} />
        ) : (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.88}>
            <Ionicons name="share-outline" size={18} color={P.gold} />
            <Text style={styles.shareText}>Partager ce modèle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  center: { alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10 },
  notFound: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  backLink: { marginTop: 8 },
  backLinkText: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },
  hero: { height: HERO_H, backgroundColor: P.bg },
  heroImage: { width, height: HERO_H },
  heroEmpty: { alignItems: 'center' as const, justifyContent: 'center' as const },
  heroBar: {
    position: 'absolute' as const, top: 0, left: 0, right: 0,
    flexDirection: 'row' as const, justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
  },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(14,11,20,0.42)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.28)',
  },
  dots: {
    position: 'absolute' as const, bottom: 28, left: 0, right: 0,
    flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 16, backgroundColor: '#D4AF37' },
  sheet: {
    flex: 1, marginTop: -22, backgroundColor: P.pageBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center' as const, width: 36, height: 4, borderRadius: 2,
    backgroundColor: P.borderHard, marginBottom: 16,
  },
  titleBlock: { marginBottom: 18 },
  pills: { flexDirection: 'row' as const, gap: 8, marginBottom: 10 },
  goldPill: {
    backgroundColor: P.goldBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 0.5, borderColor: P.goldRim,
  },
  goldPillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold, letterSpacing: 0.3 },
  softPill: {
    backgroundColor: P.primaryBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  softPillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  name: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.5 },
  price: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold, marginTop: 6 },
  stats: {
    flexDirection: 'row' as const, backgroundColor: P.surface, borderRadius: 16,
    borderWidth: 0.5, borderColor: P.borderHard, paddingVertical: 14, marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center' as const, gap: 4 },
  statVal: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  statLbl: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  block: { marginBottom: 20 },
  blockTitle: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
    letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 10,
  },
  body: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text, lineHeight: 22 },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: {
    backgroundColor: P.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  actions: { flexDirection: 'row' as const, gap: 8, marginTop: 4 },
  action: {
    flex: 1, backgroundColor: P.surface, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center' as const, gap: 6, borderWidth: 0.5, borderColor: P.borderHard,
  },
  actionText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  footer: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: P.pageBg, borderTopWidth: 0.5, borderTopColor: P.border,
  },
  shareBtn: {
    height: 52, borderRadius: 16, backgroundColor: P.bg,
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    borderWidth: 1, borderColor: P.goldRim,
  },
  shareText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
