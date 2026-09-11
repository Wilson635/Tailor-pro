// ==========================================
// ÉCRAN DÉTAILS CLIENT - TailorPro (Redesign)
// ==========================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  PAYMENT_STATUS_LABELS,
  CLOTHING_TYPE_LABELS,
} from '@constants/theme';
import {
  STATUT_COMMANDE_LABELS,
  STATUT_COMMANDE_COLORS,
} from '@constants/commandeConstants';
import {
  TYPE_VETEMENT_LABELS,
  TYPE_VETEMENT_ICONS,
  TYPE_VETEMENT_COLORS,
  MESURES_TEMPLATES,
} from '@constants/mensurationConstants';
import {
  STATUT_REALISATION_LABELS,
  STATUT_REALISATION_COLORS,
} from '@constants/realisationConstants';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { Avatar } from '@components/ui';
import type { FicheMensuration, Realisation } from '../../types';

// ==========================================
// TYPES
// ==========================================

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetails'>;

// ==========================================
// HELPERS
// ==========================================

const ActionButton = ({
                        icon,
                        label,
                        color,
                        bg,
                        onPress,
                      }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const StatItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      {typeof value === 'string' ? (
          <Text style={styles.statVal}>{value}</Text>
      ) : (
          value
      )}
    </View>
);

const InfoRow = ({
                   icon,
                   label,
                   value,
                 }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: React.ReactNode;
}) => (
    <View style={styles.infoRow}>
      <View style={styles.infoKey}>
        <Ionicons name={icon} size={15} color={COLORS.gray400} />
        <Text style={styles.infoKeyText}>{label}</Text>
      </View>
      {typeof value === 'string' ? (
          <Text style={styles.infoVal}>{value}</Text>
      ) : (
          value
      )}
    </View>
);

const PaymentPill = ({ status }: { status: string }) => {
  const config =
      status === 'paid'
          ? { bg: '#D1FAE5', color: '#065F46' }
          : status === 'partial'
              ? { bg: '#FEF3C7', color: '#92400E' }
              : { bg: '#FEE2E2', color: '#991B1B' };

  return (
      <View style={[styles.pill, { backgroundColor: config.bg }]}>
        <Text style={[styles.pillText, { color: config.color }]}>
          {PAYMENT_STATUS_LABELS[status] ?? status}
        </Text>
      </View>
  );
};

// ==========================================
// BLOC MESURES (compact résumé cliquable)
// ==========================================

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

const MeasurementRow = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) => (
  <View style={styles.mesureRow}>
    <Text style={styles.mesureRowLabel} numberOfLines={1}>{label}</Text>
    <Text style={styles.mesureRowValue}>
      {value}
      <Text style={styles.mesureRowUnit}> {unit}</Text>
    </Text>
  </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const ClientDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
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
            <Ionicons name="person-outline" size={48} color={COLORS.gray300} />
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
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const lastOrder = sortedOrders[0] ?? null;

  const handleCall = () =>
      Linking.openURL(`tel:${client.telephone.replace(/\s/g, '')}`);
  const handleWhatsApp = () => {
    const phone = client.telephone.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };
  const handleSMS = () =>
      Linking.openURL(`sms:${client.telephone.replace(/\s/g, '')}`);
  const handleDirections = () =>
      Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.adresse ?? '')}`
      );

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails client</Text>
          <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('EditClient', { clientId: client.id })}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <Avatar source={client.photo} name={client.nom} size={80} radius={24} />
            <Text style={styles.heroName}>{client.nom}</Text>
            {client.isFavorite && (
                <View style={styles.heroBadge}>
                  <Ionicons name="star" size={11} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.heroBadgeText}>Cliente fidèle</Text>
                </View>
            )}
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{formatPhone(client.telephone)}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{client.adresse}</Text>
              </View>
            </View>
          </View>

          {/* ── Actions rapides ── */}
          <View style={styles.actionsCard}>
            <ActionButton icon="call"            label="Appeler"    color="#6B21A8" bg="#EDE9FE" onPress={handleCall}       />
            <ActionButton icon="logo-whatsapp"   label="WhatsApp"   color="#065F46" bg="#D1FAE5" onPress={handleWhatsApp}   />
            <ActionButton icon="chatbubble-outline" label="SMS"      color="#1E40AF" bg="#DBEAFE" onPress={handleSMS}        />
            <ActionButton icon="map-outline"     label="Itinéraire" color="#92400E" bg="#FEF3C7" onPress={handleDirections} />
          </View>

          <View style={styles.body}>
            {/* ── Stats grid ── */}
            <View style={styles.sectionCard}>
              <View style={styles.statGrid}>
                <StatItem label="Commandes" value={String(totalOrders)} />
                <StatItem label="Total dépensé" value={formatCurrency(totalSpent)} />
                <StatItem
                    label="Dernière commande"
                    value={lastOrder ? formatDate(lastOrder.createdAt) : '-'}
                />
                <StatItem
                    label="Statut paiement"
                    value={
                      lastOrder ? (
                          <PaymentPill status={lastOrder.paymentStatus} />
                      ) : (
                          <Text style={styles.statVal}>-</Text>
                      )
                    }
                />
              </View>
            </View>

            {/* ── BLOC MESURES ── */}
            {hasFiches ? (
                <View style={styles.measureCard}>
                  <TouchableOpacity
                      style={styles.measureCardHead}
                      onPress={() => navigation.navigate('Measurements', { clientId })}
                      activeOpacity={0.75}
                  >
                    <View style={styles.measureCardTitle}>
                      <View style={styles.measureIconBadge}>
                        <Ionicons name="body-outline" size={16} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sectionTitle}>Mensurations</Text>
                    </View>
                    <Text style={styles.sectionLink}>Voir tout</Text>
                  </TouchableOpacity>
                  {fichePreviews.map((fiche, idx) => {
                    const preview = mesureEntries(fiche);
                    const unit = fiche.unite === 'pouces' ? 'in' : 'cm';
                    const col = TYPE_VETEMENT_COLORS[fiche.typeVetement] ?? TYPE_VETEMENT_COLORS.autre;
                    return (
                      <TouchableOpacity
                          key={fiche.id}
                          style={[
                            styles.ficheBlock,
                            idx === fichePreviews.length - 1 && { borderBottomWidth: 0 },
                          ]}
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
                          <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
                        </View>
                        {preview.length > 0 ? (
                          <View style={styles.mesureList}>
                            {preview.map(([key, value]) => (
                              <MeasurementRow
                                  key={key}
                                  label={MESURE_LABELS[key] ?? key.replace(/_/g, ' ')}
                                  value={value}
                                  unit={unit}
                              />
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
                    style={styles.measureCard}
                    onPress={() => navigation.navigate('Measurements', { clientId })}
                    activeOpacity={0.75}
                >
                  <View style={styles.measureCardHead}>
                    <View style={styles.measureCardTitle}>
                      <View style={styles.measureIconBadge}>
                        <Ionicons name="body-outline" size={16} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sectionTitle}>Mesures</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
                  </View>
                  <View style={styles.mesureList}>
                    {!!measurements?.chestCircumference && (
                      <MeasurementRow label="Poitrine" value={measurements.chestCircumference} unit="cm" />
                    )}
                    {!!measurements?.waistCircumference && (
                      <MeasurementRow label="Taille" value={measurements.waistCircumference} unit="cm" />
                    )}
                    {!!measurements?.hipCircumference && (
                      <MeasurementRow label="Hanches" value={measurements.hipCircumference} unit="cm" />
                    )}
                    {!!measurements?.shoulderWidth && (
                      <MeasurementRow label="Épaules" value={measurements.shoulderWidth} unit="cm" />
                    )}
                  </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.measureEmptyCard}
                    onPress={() => navigation.navigate('AddMeasurements', { clientId })}
                    activeOpacity={0.8}
                >
                  <View style={styles.measureEmptyLeft}>
                    <View style={[styles.measureIconBadge, styles.measureIconBadgeEmpty]}>
                      <Ionicons name="body-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.measureEmptyTitle}>Aucune mesure enregistrée</Text>
                      <Text style={styles.measureEmptySubtitle}>
                        Appuyez pour enregistrer les mensurations
                      </Text>
                    </View>
                  </View>
                  <View style={styles.measureAddBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
            )}

            {/* ── Commandes ── */}
            {sortedOrders.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>
                      Commandes ({sortedOrders.length})
                    </Text>
                  </View>
                  {sortedOrders.map((order, idx) => (
                      <TouchableOpacity
                          key={order.id}
                          style={[
                            styles.orderItem,
                            idx === sortedOrders.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                          activeOpacity={0.7}
                      >
                        <View
                            style={[
                              styles.orderDot,
                              {
                                backgroundColor:
                                    STATUT_COMMANDE_COLORS[order.orderStatus] ?? COLORS.gray400,
                              },
                            ]}
                        />
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderName} numberOfLines={1}>
                            {order.numeroCommande
                              ? order.numeroCommande
                              : (CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType)}
                          </Text>
                          <Text style={styles.orderMeta}>
                            {CLOTHING_TYPE_LABELS[order.clothingType] ?? order.clothingType}
                            {' · '}
                            {formatDate(order.createdAt)}
                            {' · '}
                            {STATUT_COMMANDE_LABELS[order.orderStatus] ?? order.orderStatus}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
                        <Text style={styles.orderAmt}>
                          {formatCurrency(order.totalPrice)}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </View>
            )}

            {/* ── Informations ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Informations</Text>
              </View>
              <InfoRow
                  icon="calendar-outline"
                  label="Membre depuis"
                  value={formatDate(client.createdAt)}
              />
              <InfoRow
                  icon="location-outline"
                  label="Quartier"
                  value={client.adresse}
              />
              <InfoRow
                  icon="wallet-outline"
                  label="Solde restant"
                  value={
                    client.balance > 0 ? (
                        <View style={[styles.pill, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[styles.pillText, { color: '#92400E' }]}>
                            {formatCurrency(client.balance)}
                          </Text>
                        </View>
                    ) : (
                        <View style={[styles.pill, { backgroundColor: '#D1FAE5' }]}>
                          <Text style={[styles.pillText, { color: '#065F46' }]}>Soldé</Text>
                        </View>
                    )
                  }
              />
            </View>

            {/* ── Modèles réalisés ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>
                  Modèles réalisés ({clientReals.length})
                </Text>
                {clientReals.length > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('Realisations', { clientId })}>
                      <Text style={styles.sectionLink}>Voir tous</Text>
                    </TouchableOpacity>
                )}
              </View>

              {clientReals.length === 0 ? (
                  <TouchableOpacity
                      style={styles.emptyPhotosContainer}
                      onPress={() => navigation.navigate('AddRealisation', { clientId })}
                      activeOpacity={0.8}
                  >
                    <Ionicons name="images-outline" size={28} color={COLORS.gray300} />
                    <Text style={styles.emptyPhotosText}>
                      Aucune réalisation enregistrée pour ce client.
                    </Text>
                    <Text style={styles.sectionLink}>Ajouter une réalisation</Text>
                  </TouchableOpacity>
              ) : (
                  <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosGrid}
                  >
                    {clientReals.map((item) => {
                      const photo = item.photos[0];
                      const statutColor = STATUT_REALISATION_COLORS[item.statut] ?? COLORS.gray400;
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
                              <Ionicons name="shirt-outline" size={26} color={COLORS.gray400} />
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
          </View>

          {/* ── CTA Nouvelle commande ── */}
          <TouchableOpacity
              style={styles.cta}
              onPress={() => navigation.navigate('AddOrder', { clientId })}
              activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.ctaText}>Nouvelle commande</Text>
          </TouchableOpacity>
        </ScrollView>
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
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#fff',
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxxl },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 32,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.primary,
  },
  heroName: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#fff',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroBadgeText: {
    fontSize: 11,
    color: '#fff',
  },
  heroMeta: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: 4,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Actions ──
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginTop: -20,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // ── Body ──
  body: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },
  sectionLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  // ── Stat Grid ──
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    padding: SPACING.md,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statVal: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },

  // ── Bloc mesures (client avec mesures) ──
  measureCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  measureCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  measureCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  measureIconBadge: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureIconBadgeEmpty: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
  },
  measureDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray400,
    marginTop: 2,
  },
  ficheBlock: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  ficheTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  ficheEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ficheEmoji: { fontSize: 18 },
  ficheType: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: COLORS.text,
  },
  mesureList: {
    paddingLeft: 50,
    gap: 6,
  },
  mesureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mesureRowLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: COLORS.textSecondary,
  },
  mesureRowValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: COLORS.text,
  },
  mesureRowUnit: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: COLORS.gray400,
  },
  ficheEmptyHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingLeft: 50,
  },

  // ── Bloc mesures (client sans mesures) ──
  measureEmptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  measureEmptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  measureEmptyTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: COLORS.text,
  },
  measureEmptySubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  measureAddBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Orders ──
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  orderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: COLORS.text,
  },
  orderMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderAmt: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
    flexShrink: 0,
  },

  // ── Info Rows ──
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  infoKey: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoKeyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: COLORS.text,
  },

  // ── Pill ──
  pill: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // ── CTA ──
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  ctaText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#fff',
  },

  // ── Photos grid ──
  photosGrid: {
    flexDirection: 'row',
    gap: 8,
    padding: SPACING.md,
  },
  photoThumb: {
    width: 100,
    height: 130,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  realPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },
  realCaption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(22,18,58,0.72)',
  },
  realCaptionTitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#fff',
  },
  realCaptionStatut: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  emptyPhotosContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  emptyPhotosText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    textAlign: 'center',
  },

  // ── Error ──
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorBack: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});