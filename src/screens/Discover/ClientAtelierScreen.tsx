// ==========================================
// FICHE ATELIER — page entreprise (vue client)
// ==========================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { catalogService, mapCatalogModel, clientLinkService } from '@services/supabaseService';
import { formatCurrencyShort } from '@utils/formatters';
import { confectionRequestMessage, openTel, openWhatsApp } from '@utils/atelierContact';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { CatalogModel, PublicAtelier } from '@/src/types';
import { useThemedStyles, type Palette } from '@/src/theme';
import { AtelierIcon } from '@/src/components/ui';
import { CATALOG_CATEGORY_LABELS } from '@constants/catalogConstants';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientAtelier'>;

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const { width } = Dimensions.get('window');
const GUTTER = 20;
const GAP = 12;
const CARD_W = (width - GUTTER * 2 - GAP) / 2;
const COVER_H = 200;
const DEFAULT_COVER = require('../../../assets/images/atelier-cover-default.png');

const label = (a: PublicAtelier) => a.atelierName || a.displayName || 'Atelier';

export const ClientAtelierScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tailorId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const getAtelierById = useAppStore(s => s.getAtelierById);
  const linkedTailors = useAppStore(s => s.linkedTailors);
  const catalog = useAppStore(s => s.catalog);

  const [remote, setRemote] = useState<PublicAtelier | null>(null);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [loading, setLoading] = useState(true);

  const atelier = remote ?? getAtelierById(tailorId) ?? null;
  const linked = linkedTailors.some(t => t.id === tailorId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await clientLinkService.getPublicAtelierById(tailorId);
      if (!cancelled && data) setRemote(data);

      const fromStore = useAppStore.getState().catalog.filter(m => m.couturierId === tailorId);
      if (fromStore.length) {
        if (!cancelled) setModels(fromStore);
      } else {
        const { data: rows } = await catalogService.getPublicByCouturier(tailorId);
        if (!cancelled) setModels((rows ?? []).map(mapCatalogModel));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tailorId, catalog]);

  const hours = useMemo(() => {
    const h = atelier?.horaires;
    if (!h) return [];
    return JOURS.filter(j => h[j]).map(j => ({ jour: j, val: h[j] }));
  }, [atelier]);

  const coverUri = atelier?.coverUrl || null;
  const featured = models[0] ?? null;
  const rest = models.slice(1);
  const socials = atelier?.reseauxSociaux;
  const socialLinks = [
    socials?.instagram ? { key: 'instagram', icon: 'instagram' as const, url: socials.instagram } : null,
    socials?.facebook ? { key: 'facebook', icon: 'facebook' as const, url: socials.facebook } : null,
    socials?.tiktok ? { key: 'tiktok', icon: 'music' as const, url: socials.tiktok } : null,
  ].filter(Boolean) as { key: string; icon: 'instagram' | 'facebook' | 'music'; url: string }[];

  const openSocial = (raw: string) => {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^@/, '')}`;
    Linking.openURL(url);
  };

  if (!atelier && !loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Atelier introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <Feather name="arrow-left" size={18} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View style={styles.coverWrap}>
          <Image
            source={coverUri ? { uri: coverUri } : DEFAULT_COVER}
            style={styles.coverImg}
          />
          <LinearGradient
            colors={['rgba(14,11,20,0.08)', 'rgba(14,11,20,0.42)']}
            style={styles.coverShade}
          />
        </View>

        {loading && !atelier ? (
          <ActivityIndicator color={P.gold} style={{ marginTop: 48 }} />
        ) : atelier ? (
          <>
            <View style={styles.identity}>
              <View style={styles.avatarRing}>
                {atelier.avatarUrl ? (
                  <Image source={{ uri: atelier.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AtelierIcon size={32} color={P.gold} />
                  </View>
                )}
              </View>

              <View style={styles.nameBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.heroName} numberOfLines={2}>{label(atelier)}</Text>
                  {linked ? (
                    <View style={styles.linkedPill}>
                      <Text style={styles.linkedPillText}>Lié</Text>
                    </View>
                  ) : null}
                </View>
                {!!atelier.displayName && atelier.atelierName && atelier.displayName !== atelier.atelierName ? (
                  <Text style={styles.heroBy}>{atelier.displayName}</Text>
                ) : null}
                {(atelier.city || atelier.adresse) ? (
                  <View style={styles.metaRow}>
                    <Feather name="map-pin" size={12} color={P.sub} />
                    <Text style={styles.heroMeta} numberOfLines={1}>
                      {[atelier.city, atelier.adresse].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {!!atelier.description && (
              <Text style={styles.bio}>{atelier.description}</Text>
            )}

            {atelier.specialities && atelier.specialities.length > 0 && (
              <View style={styles.chips}>
                {atelier.specialities.map(s => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              {atelier.whatsapp ? (
                <TouchableOpacity
                  style={styles.ctaPrimary}
                  onPress={() =>
                    openWhatsApp(
                      atelier.whatsapp,
                      confectionRequestMessage({ atelierName: label(atelier) }),
                    )
                  }
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#16123A" />
                  <Text style={styles.ctaPrimaryText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.ctaPrimary}
                  onPress={() => openTel(atelier.phone)}
                >
                  <Feather name="phone" size={15} color="#16123A" />
                  <Text style={styles.ctaPrimaryText}>Appeler</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.ctaGhost}
                onPress={() => navigation.navigate('ClientRequest', { tailorId, kind: 'devis' })}
              >
                <Feather name="file-text" size={14} color={P.text} />
                <Text style={styles.ctaGhostText}>Devis</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaGhost}
                onPress={() => navigation.navigate('ClientRequest', { tailorId, kind: 'rdv' })}
              >
                <Feather name="calendar" size={14} color={P.text} />
                <Text style={styles.ctaGhostText}>RDV</Text>
              </TouchableOpacity>
            </View>

            {atelier.whatsapp && atelier.phone ? (
              <TouchableOpacity style={styles.callLink} onPress={() => openTel(atelier.phone)}>
                <Feather name="phone" size={13} color={P.primary} />
                <Text style={styles.callLinkText}>Appeler {atelier.phone}</Text>
              </TouchableOpacity>
            ) : null}

            {socialLinks.length > 0 && (
              <View style={styles.socialRow}>
                {socialLinks.map(s => (
                  <TouchableOpacity key={s.key} style={styles.socialBtn} onPress={() => openSocial(s.url)}>
                    <Feather name={s.icon} size={15} color={P.gold} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {hours.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Horaires</Text>
                {hours.map(h => (
                  <View key={h.jour} style={styles.hourRow}>
                    <Text style={styles.hourDay}>{h.jour}</Text>
                    <Text style={styles.hourVal}>{h.val}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionKicker}>Collection</Text>
                <Text style={styles.sectionTitle}>Catalogue</Text>
              </View>
              <Text style={styles.sectionCount}>
                {models.length} modèle{models.length > 1 ? 's' : ''}
              </Text>
            </View>
            {models.length === 0 ? (
              <View style={styles.emptyCatalog}>
                <Ionicons name="shirt-outline" size={26} color={P.gold} />
                <Text style={styles.emptyTitle}>Catalogue à venir</Text>
                <Text style={styles.emptySub}>
                  Les modèles publics de cet atelier apparaîtront ici.
                </Text>
              </View>
            ) : (
              <View style={styles.catalogWrap}>
                {featured ? (
                  <TouchableOpacity
                    style={styles.featured}
                    onPress={() => navigation.navigate('ModelDetails', { modelId: featured.id })}
                    activeOpacity={0.9}
                  >
                    {featured.photos[0] ? (
                      <Image source={{ uri: featured.photos[0] }} style={styles.featuredImg} />
                    ) : (
                      <View style={[styles.featuredImg, styles.modelPh]}>
                        <Ionicons name="shirt-outline" size={28} color={P.gold} />
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(14,11,20,0.82)']}
                      style={styles.featuredShade}
                    />
                    <View style={styles.featuredBody}>
                      <Text style={styles.featuredCat}>
                        {CATALOG_CATEGORY_LABELS[featured.categorie] ?? featured.categorie}
                      </Text>
                      <Text style={styles.featuredName} numberOfLines={1}>{featured.nom}</Text>
                      <Text style={styles.featuredPrice}>
                        {featured.prixIndicatif > 0 ? formatCurrencyShort(featured.prixIndicatif) : 'Sur devis'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {rest.length > 0 ? (
                  <View style={styles.grid}>
                    {rest.map(m => (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.modelCard}
                        onPress={() => navigation.navigate('ModelDetails', { modelId: m.id })}
                        activeOpacity={0.88}
                      >
                        {m.photos[0] ? (
                          <Image source={{ uri: m.photos[0] }} style={styles.modelImg} />
                        ) : (
                          <View style={[styles.modelImg, styles.modelPh]}>
                            <Ionicons name="shirt-outline" size={18} color={P.gold} />
                          </View>
                        )}
                        <LinearGradient
                          colors={['transparent', 'rgba(14,11,20,0.72)']}
                          style={styles.modelShade}
                        />
                        <View style={styles.pricePill}>
                          <Text style={styles.pricePillText}>
                            {m.prixIndicatif > 0 ? formatCurrencyShort(m.prixIndicatif) : 'Devis'}
                          </Text>
                        </View>
                        <View style={styles.modelBody}>
                          <Text style={styles.modelCat} numberOfLines={1}>
                            {CATALOG_CATEGORY_LABELS[m.categorie] ?? m.categorie}
                          </Text>
                          <Text style={styles.modelName} numberOfLines={1}>{m.nom}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  center: { alignItems: 'center' as const, justifyContent: 'center' as const, gap: 10 },
  backBtn: {
    position: 'absolute' as const, left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(14,11,20,0.45)',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  coverWrap: { height: COVER_H, backgroundColor: '#16123A' },
  coverImg: { width: '100%' as const, height: COVER_H, resizeMode: 'cover' as const },
  coverShade: { ...({ position: 'absolute', left: 0, right: 0, bottom: 0, height: COVER_H } as const) },
  identity: {
    paddingHorizontal: GUTTER,
    marginTop: -42,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 14,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 28,
    borderWidth: 3, borderColor: P.pageBg,
    backgroundColor: P.surface,
    overflow: 'hidden' as const,
  },
  avatarImg: { width: 92, height: 92, resizeMode: 'cover' as const },
  avatarFallback: {
    flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#16123A',
  },
  nameBlock: { flex: 1, paddingBottom: 4, gap: 4 },
  nameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  heroName: {
    flex: 1, fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.4,
  },
  linkedPill: {
    backgroundColor: P.goldBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    borderWidth: 0.5, borderColor: P.goldRim,
  },
  linkedPillText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
  heroBy: { fontSize: 13, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
  heroMeta: { flex: 1, fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  bio: {
    marginTop: 14, paddingHorizontal: GUTTER,
    fontSize: 14, color: P.sub, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium',
  },
  chips: {
    flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8,
    paddingHorizontal: GUTTER, marginTop: 12,
  },
  chip: {
    backgroundColor: P.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  actions: {
    flexDirection: 'row' as const, gap: 8, paddingHorizontal: GUTTER, marginTop: 18,
  },
  ctaPrimary: {
    flex: 1.2, height: 48, borderRadius: 14, backgroundColor: P.gold,
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 7,
  },
  ctaPrimaryText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#16123A' },
  ctaGhost: {
    flex: 1, height: 48, borderRadius: 14, backgroundColor: P.surface,
    borderWidth: 0.5, borderColor: P.borderHard,
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6,
  },
  ctaGhostText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  callLink: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: GUTTER, marginTop: 10,
  },
  callLinkText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  socialRow: {
    flexDirection: 'row' as const, gap: 8, paddingHorizontal: GUTTER, marginTop: 14,
  },
  socialBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    borderWidth: 0.5, borderColor: P.goldRim,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  card: {
    marginHorizontal: GUTTER, marginTop: 18,
    backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, padding: 14, gap: 8,
  },
  cardTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, marginBottom: 4 },
  hourRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  hourDay: { fontSize: 12, color: P.sub, textTransform: 'capitalize' as const, fontFamily: 'PlusJakartaSans_500Medium' },
  hourVal: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  sectionHead: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-end' as const,
    paddingHorizontal: GUTTER, marginTop: 26, marginBottom: 14,
  },
  sectionKicker: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold,
    letterSpacing: 1.6, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  sectionTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.3 },
  sectionCount: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 2 },
  catalogWrap: { paddingHorizontal: GUTTER, gap: 12 },
  featured: {
    height: 220, borderRadius: 22, overflow: 'hidden' as const, backgroundColor: P.surface,
  },
  featuredImg: { width: '100%' as const, height: 220, resizeMode: 'cover' as const },
  featuredShade: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: 140 },
  featuredBody: { position: 'absolute' as const, left: 16, right: 16, bottom: 16 },
  featuredCat: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 4,
  },
  featuredName: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff', letterSpacing: -0.3 },
  featuredPrice: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.86)', marginTop: 4 },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: GAP },
  modelCard: {
    width: CARD_W, height: CARD_W * 1.28, borderRadius: 18, overflow: 'hidden' as const, backgroundColor: P.surface,
  },
  modelImg: { width: CARD_W, height: '100%' as const, resizeMode: 'cover' as const },
  modelShade: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: 88 },
  modelPh: { alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.surface },
  pricePill: {
    position: 'absolute' as const, top: 10, right: 10,
    backgroundColor: 'rgba(14,11,20,0.62)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.45)',
  },
  pricePillText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
  modelBody: { position: 'absolute' as const, left: 10, right: 10, bottom: 10 },
  modelCat: {
    fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  modelName: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  emptyCatalog: {
    marginHorizontal: GUTTER, backgroundColor: P.surface, borderRadius: 18,
    borderWidth: 0.5, borderColor: P.borderHard, borderStyle: 'dashed' as const,
    padding: 22, alignItems: 'center' as const, gap: 8,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, textAlign: 'center' as const },
  emptySub: {
    fontSize: 13, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', textAlign: 'center' as const, lineHeight: 19,
  },
  link: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8 },
});
