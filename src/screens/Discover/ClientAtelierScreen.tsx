// ==========================================
// FICHE ATELIER (vue client) — TailorPro
// ==========================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { catalogService, mapCatalogModel, clientLinkService } from '@services/supabaseService';
import { formatCurrencyShort } from '@utils/formatters';
import { openTel } from '@utils/atelierContact';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { CatalogModel, PublicAtelier } from '@/src/types';
import { useThemedStyles, type Palette } from '@/src/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientAtelier'>;

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

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
      const local = useAppStore.getState().getAtelierById(tailorId);
      if (!local) {
        const { data } = await clientLinkService.getPublicAtelierById(tailorId);
        if (!cancelled && data) setRemote(data);
      }
      const fromStore = useAppStore.getState().catalog.filter(m => m.couturierId === tailorId);
      if (fromStore.length) {
        if (!cancelled) setModels(fromStore);
      } else {
        const { data } = await catalogService.getPublicByCouturier(tailorId);
        if (!cancelled) setModels((data ?? []).map(mapCatalogModel));
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.title} numberOfLines={1}>{atelier ? label(atelier) : '…'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {loading && !atelier ? (
          <ActivityIndicator color={P.gold} />
        ) : atelier ? (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                {atelier.avatarUrl ? (
                  <Image source={{ uri: atelier.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="cut-outline" size={26} color={P.gold} />
                )}
              </View>
              <Text style={styles.heroName}>{label(atelier)}</Text>
              {!!atelier.city && <Text style={styles.heroSub}>{atelier.city}</Text>}
              {linked && (
                <View style={styles.linkedPill}>
                  <Text style={styles.linkedPillText}>Votre atelier</Text>
                </View>
              )}
            </View>

            {!!atelier.description && (
              <Text style={styles.body}>{atelier.description}</Text>
            )}

            {atelier.specialities && atelier.specialities.length > 0 && (
              <View style={styles.chips}>
                {atelier.specialities.map(s => (
                  <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
                ))}
              </View>
            )}

            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => openTel(atelier.phone ?? atelier.whatsapp)}>
                <Feather name="phone" size={14} color={P.primary} />
                <Text style={styles.contactBtnText}>Appeler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() =>
                  navigation.navigate('ClientRequest', { tailorId, kind: 'devis' })
                }
              >
                <Feather name="file-text" size={14} color={P.gold} />
                <Text style={styles.contactBtnText}>Devis</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() =>
                  navigation.navigate('ClientRequest', { tailorId, kind: 'rdv' })
                }
              >
                <Feather name="calendar" size={14} color={P.success} />
                <Text style={styles.contactBtnText}>RDV</Text>
              </TouchableOpacity>
            </View>

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

            <Text style={styles.sectionTitle}>Catalogue</Text>
            {models.length === 0 ? (
              <Text style={styles.emptySub}>Aucun modèle public pour cet atelier.</Text>
            ) : (
              models.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.modelRow}
                  onPress={() => navigation.navigate('ModelDetails', { modelId: m.id })}
                >
                  {m.photos[0] ? (
                    <Image source={{ uri: m.photos[0] }} style={styles.modelThumb} />
                  ) : (
                    <View style={[styles.modelThumb, styles.modelPh]}>
                      <Ionicons name="shirt-outline" size={16} color={P.gold} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modelName}>{m.nom}</Text>
                    <Text style={styles.modelPrice}>
                      {m.prixIndicatif > 0 ? formatCurrencyShort(m.prixIndicatif) : 'Sur devis'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={P.muted} />
                </TouchableOpacity>
              ))
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
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.surface,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.2, textTransform: 'uppercase' as const,
  },
  title: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  content: { paddingHorizontal: 20, gap: 14 },
  hero: { alignItems: 'center' as const, gap: 8, paddingVertical: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#16123A',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim, overflow: 'hidden' as const,
  },
  avatarImg: { width: 72, height: 72 },
  heroName: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  heroSub: { fontSize: 13, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  linkedPill: {
    backgroundColor: P.goldBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 0.5, borderColor: P.goldRim,
  },
  linkedPillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
  body: { fontSize: 13, color: P.sub, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: { backgroundColor: P.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 0.5, borderColor: P.borderHard },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  contactRow: { flexDirection: 'row' as const, gap: 8 },
  contactBtn: {
    flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  contactBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  card: { backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, padding: 14, gap: 8 },
  cardTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, marginBottom: 4 },
  hourRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  hourDay: { fontSize: 12, color: P.sub, textTransform: 'capitalize' as const, fontFamily: 'PlusJakartaSans_500Medium' },
  hourVal: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  sectionTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, marginTop: 4 },
  modelRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, padding: 10,
  },
  modelThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: P.pageBg },
  modelPh: { alignItems: 'center' as const, justifyContent: 'center' as const },
  modelName: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  modelPrice: { fontSize: 12, color: P.gold, marginTop: 2, fontFamily: 'PlusJakartaSans_600SemiBold' },
  emptyTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  emptySub: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  link: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8 },
});
