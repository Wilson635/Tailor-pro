// ==========================================
// DÉTAILS CLIENT — TailorPro
// ==========================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatDate, formatPhone } from '@utils/formatters';
import { PAYMENT_STATUS_LABELS, CLOTHING_TYPE_LABELS } from '@constants/theme';
import { STATUT_COMMANDE_LABELS, STATUT_COMMANDE_COLORS } from '@constants/commandeConstants';
import {
  TYPE_VETEMENT_LABELS,
  TYPE_VETEMENT_ICONS,
  TYPE_VETEMENT_COLORS,
  MESURES_TEMPLATES,
} from '@constants/mensurationConstants';
import { STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS } from '@constants/realisationConstants';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { Avatar } from '@components/ui';
import { useThemedStyles, type Palette } from '@/src/theme';
import type { FicheMensuration, Realisation } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetails'>;

const MESURE_LABELS: Record<string, string> = Object.values(MESURES_TEMPLATES)
  .flat()
  .reduce((acc, field) => {
    acc[field.key] = field.label;
    return acc;
  }, {} as Record<string, string>);

const mesureEntries = (fiche: FicheMensuration) =>
  Object.entries(fiche.mesures ?? {})
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .slice(0, 6);

const latestFichesByType = (fiches: FicheMensuration[]) => {
  const byType = new Map<string, FicheMensuration>();
  for (const fiche of fiches) {
    const current = byType.get(fiche.typeVetement);
    if (!current) {
      byType.set(fiche.typeVetement, fiche);
      continue;
    }
    if (fiche.isActive && !current.isActive) {
      byType.set(fiche.typeVetement, fiche);
      continue;
    }
    if (fiche.isActive === current.isActive && new Date(fiche.datePrise) > new Date(current.datePrise)) {
      byType.set(fiche.typeVetement, fiche);
    }
  }
  return Array.from(byType.values());
};

const typeLabel = (type: string) =>
  TYPE_VETEMENT_LABELS[type] ?? (type === 'global' ? 'Mesures générales' : type);

export const ClientDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { clientId } = route.params;

  const {
    getClientById,
    getOrdersByClient,
    getMeasurementsByClient,
    loadMeasurements,
    loadFiches,
    loadRealisations,
    fiches,
    realisations,
  } = useAppStore();

  const client = getClientById(clientId);
  const orders = getOrdersByClient(clientId);
  const measurements = getMeasurementsByClient(clientId);
  const clientFiches = fiches[clientId] ?? [];
  const clientReals: Realisation[] = realisations[clientId] ?? [];

  useEffect(() => {
    loadMeasurements(clientId);
    loadFiches(clientId);
    loadRealisations(clientId);
  }, [clientId]);

  const fichePreviews = useMemo(() => latestFichesByType(clientFiches), [clientFiches]);
  const hasFiches = fichePreviews.length > 0;
  const hasLegacyMesures = !!(
    measurements &&
    (measurements.chestCircumference || measurements.waistCircumference || measurements.hipCircumference || measurements.shoulderWidth)
  );

  if (!client) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-outline" size={26} color={P.gold} />
          </View>
          <Text style={styles.errorText}>Client non trouvé</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.errorBack}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.advancePayment, 0);
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const lastOrder = sortedOrders[0] ?? null;
  const isFidele = orders.length > 2;

  const handleCall = () => Linking.openURL(`tel:${client.telephone.replace(/\s/g, '')}`);
  const handleWhatsApp = () => {
    const phone = client.telephone.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };
  const handleSMS = () => Linking.openURL(`sms:${client.telephone.replace(/\s/g, '')}`);
  const handleDirections = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.adresse ?? '')}`);

  const payTone = (status: string) => {
    if (status === 'paid') return { bg: P.successBg, color: P.success };
    if (status === 'partial') return { bg: P.warningBg, color: P.warning };
    return { bg: P.errorBg, color: P.error };
  };

  const actions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    bg: string;
    onPress: () => void;
  }[] = [
    { icon: 'call', label: 'Appeler', color: P.primary, bg: P.primaryBg, onPress: handleCall },
    { icon: 'logo-whatsapp', label: 'WhatsApp', color: P.success, bg: P.successBg, onPress: handleWhatsApp },
    { icon: 'chatbubble-outline', label: 'SMS', color: P.info, bg: P.infoBg, onPress: handleSMS },
    { icon: 'map-outline', label: 'Itinéraire', color: P.warning, bg: P.warningBg, onPress: handleDirections },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>Fiche client</Text>
        </View>
        <TouchableOpacity
          style={styles.goldBtn}
          onPress={() => navigation.navigate('EditClient', { clientId: client.id })}
        >
          <Ionicons name="create-outline" size={18} color={P.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Avatar source={client.photo} name={client.nom} size={84} radius={24} />
          </View>
          <Text style={styles.heroName}>{client.nom}</Text>
          {isFidele && (
            <View style={styles.fideleBadge}>
              <Ionicons name="star" size={11} color={P.gold} />
              <Text style={styles.fideleText}>Cliente fidèle</Text>
            </View>
          )}
          <Text style={styles.heroMeta}>{formatPhone(client.telephone)}</Text>
          {!!client.adresse && (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={12} color={P.sub} />
              <Text style={styles.heroMeta}>{client.adresse}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsCard}>
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.75}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLbl}>Commandes</Text>
            <Text style={styles.statVal}>{totalOrders}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLbl}>Encaissé</Text>
            <Text style={styles.statVal}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLbl}>Dernière</Text>
            <Text style={styles.statVal}>{lastOrder ? formatDate(lastOrder.createdAt) : '—'}</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLbl}>Paiement</Text>
            {lastOrder ? (
              <View style={[styles.pill, { backgroundColor: payTone(lastOrder.paymentStatus).bg }]}>
                <Text style={[styles.pillText, { color: payTone(lastOrder.paymentStatus).color }]}>
                  {PAYMENT_STATUS_LABELS[lastOrder.paymentStatus] ?? lastOrder.paymentStatus}
                </Text>
              </View>
            ) : (
              <Text style={styles.statVal}>—</Text>
            )}
          </View>
        </View>

        {hasFiches ? (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHead}
              onPress={() => navigation.navigate('Measurements', { clientId })}
              activeOpacity={0.75}
            >
              <Text style={styles.sectionTitle}>Mensurations</Text>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
            {fichePreviews.map((fiche, idx) => {
              const preview = mesureEntries(fiche);
              const unit = fiche.unite === 'pouces' ? 'in' : 'cm';
              const col = TYPE_VETEMENT_COLORS[fiche.typeVetement] ?? TYPE_VETEMENT_COLORS.autre;
              return (
                <TouchableOpacity
                  key={fiche.id}
                  style={[styles.ficheBlock, idx === fichePreviews.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate('FicheDetails', { ficheId: fiche.id, clientId })}
                  activeOpacity={0.75}
                >
                  <View style={styles.ficheTypeRow}>
                    <View style={[styles.ficheEmojiWrap, { backgroundColor: col.bg, borderColor: col.border }]}>
                      <Text style={styles.ficheEmoji}>{TYPE_VETEMENT_ICONS[fiche.typeVetement] ?? '📐'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ficheType}>{typeLabel(fiche.typeVetement)}</Text>
                      <Text style={styles.measureDate}>
                        {preview.length} champ{preview.length !== 1 ? 's' : ''} · {formatDate(fiche.datePrise)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={P.muted} />
                  </View>
                  {preview.length > 0 ? (
                    <View style={styles.mesureList}>
                      {preview.map(([key, value]) => (
                        <View key={key} style={styles.mesureRow}>
                          <Text style={styles.mesureRowLabel} numberOfLines={1}>{MESURE_LABELS[key] ?? key.replace(/_/g, ' ')}</Text>
                          <Text style={styles.mesureRowValue}>
                            {value}
                            <Text style={styles.mesureRowUnit}> {unit}</Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.ficheEmptyHint}>Ouvrir pour voir le détail</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : hasLegacyMesures ? (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Measurements', { clientId })}
            activeOpacity={0.75}
          >
            <View style={styles.cardHead}>
              <Text style={styles.sectionTitle}>Mesures</Text>
              <Ionicons name="chevron-forward" size={18} color={P.muted} />
            </View>
            <View style={[styles.mesureList, { paddingLeft: 16, paddingBottom: 14 }]}>
              {!!measurements?.chestCircumference && (
                <View style={styles.mesureRow}>
                  <Text style={styles.mesureRowLabel}>Poitrine</Text>
                  <Text style={styles.mesureRowValue}>{measurements.chestCircumference}<Text style={styles.mesureRowUnit}> cm</Text></Text>
                </View>
              )}
              {!!measurements?.waistCircumference && (
                <View style={styles.mesureRow}>
                  <Text style={styles.mesureRowLabel}>Taille</Text>
                  <Text style={styles.mesureRowValue}>{measurements.waistCircumference}<Text style={styles.mesureRowUnit}> cm</Text></Text>
                </View>
              )}
              {!!measurements?.hipCircumference && (
                <View style={styles.mesureRow}>
                  <Text style={styles.mesureRowLabel}>Hanches</Text>
                  <Text style={styles.mesureRowValue}>{measurements.hipCircumference}<Text style={styles.mesureRowUnit}> cm</Text></Text>
                </View>
              )}
              {!!measurements?.shoulderWidth && (
                <View style={styles.mesureRow}>
                  <Text style={styles.mesureRowLabel}>Épaules</Text>
                  <Text style={styles.mesureRowValue}>{measurements.shoulderWidth}<Text style={styles.mesureRowUnit}> cm</Text></Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyDash}
            onPress={() => navigation.navigate('AddMeasurements', { clientId })}
            activeOpacity={0.8}
          >
            <View style={styles.emptyDashLeft}>
              <View style={styles.emptyIconSm}>
                <Ionicons name="body-outline" size={18} color={P.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyDashTitle}>Aucune mesure</Text>
                <Text style={styles.emptyDashSub}>Enregistrer les mensurations</Text>
              </View>
            </View>
            <View style={styles.goldBtn}>
              <Ionicons name="add" size={18} color={P.gold} />
            </View>
          </TouchableOpacity>
        )}

        {sortedOrders.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.sectionTitle}>Commandes ({sortedOrders.length})</Text>
            </View>
            {sortedOrders.map((order, idx) => (
              <TouchableOpacity
                key={order.id}
                style={[styles.rowItem, idx === sortedOrders.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.orderDot,
                    { backgroundColor: STATUT_COMMANDE_COLORS[order.orderStatus] ?? P.muted },
                  ]}
                />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {order.numeroCommande
                      ? order.numeroCommande
                      : (CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType)}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType}
                    {' · '}
                    {formatDate(order.createdAt)}
                    {' · '}
                    {STATUT_COMMANDE_LABELS[order.orderStatus] ?? order.orderStatus}
                  </Text>
                </View>
                <Text style={styles.rowAmt}>{formatCurrency(order.totalPrice)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.sectionTitle}>Informations</Text>
          </View>
          <View style={styles.rowItem}>
            <View style={styles.infoKey}>
              <Ionicons name="calendar-outline" size={15} color={P.muted} />
              <Text style={styles.infoKeyText}>Membre depuis</Text>
            </View>
            <Text style={styles.infoVal}>{formatDate(client.createdAt)}</Text>
          </View>
          <View style={styles.rowItem}>
            <View style={styles.infoKey}>
              <Ionicons name="location-outline" size={15} color={P.muted} />
              <Text style={styles.infoKeyText}>Quartier</Text>
            </View>
            <Text style={styles.infoVal}>{client.adresse || '—'}</Text>
          </View>
          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={styles.infoKey}>
              <Ionicons name="wallet-outline" size={15} color={P.muted} />
              <Text style={styles.infoKeyText}>Solde restant</Text>
            </View>
            {client.balance > 0 ? (
              <View style={[styles.pill, { backgroundColor: P.warningBg }]}>
                <Text style={[styles.pillText, { color: P.warning }]}>{formatCurrency(client.balance)}</Text>
              </View>
            ) : (
              <View style={[styles.pill, { backgroundColor: P.successBg }]}>
                <Text style={[styles.pillText, { color: P.success }]}>Soldé</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.sectionTitle}>Modèles réalisés ({clientReals.length})</Text>
            {clientReals.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Realisations', { clientId })}>
                <Text style={styles.sectionLink}>Voir tous</Text>
              </TouchableOpacity>
            )}
          </View>
          {clientReals.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyPhotos}
              onPress={() => navigation.navigate('AddRealisation', { clientId })}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={26} color={P.gold} />
              <Text style={styles.emptyPhotosText}>Aucune réalisation pour ce client.</Text>
              <Text style={styles.sectionLink}>Ajouter une réalisation</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosGrid}>
              {clientReals.map((item) => {
                const photo = item.photos[0];
                const statutColor = STATUT_REALISATION_COLORS[item.statut] ?? P.muted;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.photoThumb}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('RealisationDetails', {
                      realisationId: item.id,
                      clientId,
                    })}
                  >
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.photoImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.photoImg, styles.realPlaceholder]}>
                        <Ionicons name="shirt-outline" size={26} color={P.muted} />
                      </View>
                    )}
                    <View style={styles.realCaption}>
                      <Text style={styles.realCaptionTitle} numberOfLines={1}>
                        {item.tissuLabel || 'Réalisation'}
                      </Text>
                      <Text style={[styles.realCaptionStatut, { color: statutColor }]} numberOfLines={1}>
                        {STATUT_REALISATION_LABELS[item.statut] ?? item.statut}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('AddOrder', { clientId })}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={P.gold} />
          <Text style={styles.ctaText}>Nouvelle commande</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  ghostBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
  },
  goldBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim, marginTop: 4,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: { alignItems: 'center' as const, paddingBottom: 18, gap: 6 },
  avatarRing: { borderWidth: 1, borderColor: P.goldRim, borderRadius: 28, padding: 3, backgroundColor: P.bg },
  heroName: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.4, marginTop: 6 },
  fideleBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4,
    backgroundColor: P.goldBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 0.5, borderColor: P.goldRim,
  },
  fideleText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
  heroMeta: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  locRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  actionsCard: {
    flexDirection: 'row' as const, justifyContent: 'space-around' as const,
    backgroundColor: P.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8,
    borderWidth: 0.5, borderColor: P.borderHard, marginBottom: 12,
  },
  actionBtn: { alignItems: 'center' as const, gap: 6, flex: 1 },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  actionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  statGrid: {
    flexDirection: 'row' as const, flexWrap: 'wrap' as const,
    backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
    overflow: 'hidden' as const, marginBottom: 12,
  },
  statCell: {
    width: '50%', padding: 14,
    borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: P.borderHard,
  },
  statLbl: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 4 },
  statVal: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  card: {
    backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
    overflow: 'hidden' as const, marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
    padding: 14, borderBottomWidth: 0.5, borderBottomColor: P.borderHard,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  sectionLink: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  ficheBlock: {
    borderBottomWidth: 0.5, borderBottomColor: P.borderHard,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  ficheTypeRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginBottom: 8 },
  ficheEmojiWrap: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  ficheEmoji: { fontSize: 18 },
  ficheType: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  measureDate: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted, marginTop: 2 },
  mesureList: { paddingLeft: 50, gap: 6 },
  mesureRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12,
  },
  mesureRowLabel: { flex: 1, fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  mesureRowValue: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  mesureRowUnit: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted },
  ficheEmptyHint: { fontSize: 11, color: P.sub, paddingLeft: 50 },
  emptyDash: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
    backgroundColor: P.surface, borderRadius: 18, borderWidth: 0.5, borderColor: P.borderHard,
    borderStyle: 'dashed' as const, padding: 14, marginBottom: 12,
  },
  emptyDashLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flex: 1 },
  emptyIconSm: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  emptyDashTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  emptyDashSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  rowItem: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    padding: 14, borderBottomWidth: 0.5, borderBottomColor: P.borderHard,
  },
  orderDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  rowMeta: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  rowAmt: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, flexShrink: 0 },
  infoKey: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, flex: 1 },
  infoKeyText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  infoVal: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  pillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold' },
  cta: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    backgroundColor: P.bg, borderRadius: 16, marginTop: 4, padding: 16,
    borderWidth: 1, borderColor: P.goldRim,
  },
  ctaText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
  photosGrid: { flexDirection: 'row' as const, gap: 8, padding: 14 },
  photoThumb: {
    width: 100, height: 130, borderRadius: 14, overflow: 'hidden' as const,
    backgroundColor: P.gray100, borderWidth: 0.5, borderColor: P.borderHard,
  },
  photoImg: { width: '100%', height: '100%' },
  realPlaceholder: { alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.gray100 },
  realCaption: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0,
    paddingHorizontal: 8, paddingVertical: 6, backgroundColor: P.overlay,
  },
  realCaptionTitle: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  realCaptionStatut: { fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 1 },
  emptyPhotos: { padding: 24, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8 },
  emptyPhotosText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const },
  errorContainer: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  errorText: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  errorBack: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
});
