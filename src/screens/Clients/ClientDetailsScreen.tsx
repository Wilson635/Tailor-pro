// ==========================================
// ÉCRAN DÉTAILS CLIENT - TailorPro (Redesign)
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatDate, formatPhone } from '@utils/formatters';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  PAYMENT_STATUS_LABELS,
} from '@constants/theme';
import {RootStackParamList} from "@/src/types";
import {MeasurementsScreen} from "@/src/screens";

// ==========================================
// TYPES
// ==========================================

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetails'>;

// ==========================================
// HELPERS
// ==========================================

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ==========================================
// SOUS-COMPOSANTS
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
// ÉCRAN PRINCIPAL
// ==========================================

export const ClientDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;

  const { getClientById, getOrdersByClient } = useAppStore();
  const client = getClientById(clientId);
  const orders = getOrdersByClient(clientId);

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
  const recentOrders = sortedOrders.slice(0, 3);

  const handleCall = () =>
      Linking.openURL(`tel:${client.phone.replace(/\s/g, '')}`);
  const handleWhatsApp = () => {
    const phone = client.phone.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };
  const handleSMS = () =>
      Linking.openURL(`sms:${client.phone.replace(/\s/g, '')}`);
  const handleDirections = () =>
      Linking.openURL(
          `https://maps.google.com/?q=${encodeURIComponent(client.neighborhood)}`
      );

  const orderStatusColor: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    delivered: COLORS.primary,
    cancelled: '#EF4444',
  };

  const orderStatusLabel: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Header violet ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails client</Text>
          <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('AddClient')}
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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(client.fullName)}</Text>
            </View>
            <Text style={styles.heroName}>{client.fullName}</Text>
            {client.isFavorite && (
                <View style={styles.heroBadge}>
                  <Ionicons name="star" size={11} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.heroBadgeText}>Cliente fidèle</Text>
                </View>
            )}
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{formatPhone(client.phone)}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{client.neighborhood}</Text>
              </View>
            </View>
          </View>

          {/* ── Actions rapides ── */}
          <View style={styles.actionsCard}>
            <ActionButton
                icon="call"
                label="Appeler"
                color="#6B21A8"
                bg="#EDE9FE"
                onPress={handleCall}
            />
            <ActionButton
                icon="logo-whatsapp"
                label="WhatsApp"
                color="#065F46"
                bg="#D1FAE5"
                onPress={handleWhatsApp}
            />
            <ActionButton
                icon="chatbubble-outline"
                label="SMS"
                color="#1E40AF"
                bg="#DBEAFE"
                onPress={handleSMS}
            />
            <ActionButton
                icon="map-outline"
                label="Itinéraire"
                color="#92400E"
                bg="#FEF3C7"
                onPress={handleDirections}
            />
          </View>

          <View style={styles.body}>
            {/* ── Stats grid ── */}
            <View style={styles.sectionCard}>
              <View style={styles.statGrid}>
                <StatItem label="Commandes" value={String(totalOrders)} />
                <StatItem
                    label="Total dépensé"
                    value={formatCurrency(totalSpent)}
                />
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

            <MeasurementsScreen clientId={clientId} onBack={() => {}} onEdit={() => {}} onAddNew={() => navigation.navigate('AddMeasurements', {clientId})} />

            {/* ── Commandes récentes ── */}
            {recentOrders.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>Commandes récentes</Text>
                    <TouchableOpacity>
                      <Text style={styles.sectionLink}>Voir toutes</Text>
                    </TouchableOpacity>
                  </View>
                  {recentOrders.map((order, idx) => (
                      <TouchableOpacity
                          key={order.id}
                          style={[
                            styles.orderItem,
                            idx === recentOrders.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          onPress={() => {}}
                          activeOpacity={0.7}
                      >
                        <View
                            style={[
                              styles.orderDot,
                              {
                                backgroundColor:
                                    orderStatusColor[order.orderStatus] ?? COLORS.gray400,
                              },
                            ]}
                        />
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderName} numberOfLines={1}>
                            {order.description}
                          </Text>
                          <Text style={styles.orderMeta}>
                            {formatDate(order.createdAt)} ·{' '}
                            {orderStatusLabel[order.orderStatus] ?? order.orderStatus}
                          </Text>
                        </View>
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
                  value={client.neighborhood}
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

            {/* ── Modèles réalisés (photos) ── */}
            {/* ── Modèles réalisés (photos) ── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Modèles réalisés</Text>

                <TouchableOpacity>
                  <Text style={styles.sectionLink}>Voir tous</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosGrid}
              >
                {[
                  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300',
                  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300',
                  'https://images.unsplash.com/photo-1551803091-e20673f15770?w=300',
                  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300',
                ].map((uri, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.photoThumb}
                        activeOpacity={0.8}
                    >
                      <Image
                          source={{ uri }}
                          style={styles.photoImg}
                          resizeMode="cover"
                      />

                      {i === 3 && (
                          <View style={styles.photoOverlay}>
                            <Text style={styles.photoOverlayText}>+12</Text>
                          </View>
                      )}
                    </TouchableOpacity>
                ))}
              </ScrollView>
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
    fontWeight: FONT_WEIGHTS.semibold,
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
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  heroName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.semibold,
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
    fontWeight: FONT_WEIGHTS.semibold,
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
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
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
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },
  orderMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderAmt: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
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
    fontWeight: FONT_WEIGHTS.medium,
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
    fontWeight: FONT_WEIGHTS.medium,
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
    fontWeight: FONT_WEIGHTS.semibold,
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
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  photoOverlayText: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
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
    fontWeight: FONT_WEIGHTS.medium,
  },
});


// ==========================================
// ÉCRAN DÉTAILS CLIENT - TailorPro
// ==========================================

/****
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Avatar, Badge, Card, IconButton, Button } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDate, formatPhone } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '../../constants/theme';

interface ClientDetailsScreenProps {
  clientId: string;
  onBack?: () => void;
  onEdit?: () => void;
  onMeasurementsPress?: () => void;
  onOrderPress?: (orderId: string) => void;
  onNewOrderPress?: () => void;
}

export const ClientDetailsScreen: React.FC<ClientDetailsScreenProps> = ({
  clientId,
  onBack,
  onEdit,
  onMeasurementsPress,
  onOrderPress,
  onNewOrderPress,
}) => {
  const { getClientById, getOrdersByClient } = useAppStore();
  const client = getClientById(clientId);
  const orders = getOrdersByClient(clientId);

  if (!client) {
    return (
      <View style={styles.container}>
        <Header title="Client" showBack onBackPress={onBack} />
        <View style={styles.errorContainer}>
          <Text>Client non trouvé</Text>
        </View>
      </View>
    );
  }

  // Stats calculées
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.advancePayment, 0);
  const lastOrder = orders.length > 0 
    ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const handleCall = () => {
    Linking.openURL(`tel:${client.phone.replace(/\s/g, '')}`);
  };

  const handleWhatsApp = () => {
    const phone = client.phone.replace(/\s/g, '').replace('+', '');
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  const handleSMS = () => {
    Linking.openURL(`sms:${client.phone.replace(/\s/g, '')}`);
  };

  const handleDirections = () => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(client.neighborhood)}`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Détails du client"
        variant="primary"
        showBack
        onBackPress={onBack}
        rightIcon="create-outline"
        onRightPress={onEdit}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section }
        <View style={styles.profileSection}>
          <Avatar source={client.photo} name={client.fullName} size="xl" />
          
          <Text style={styles.clientName}>{client.fullName}</Text>
          
          {client.isFavorite && (
            <Badge label="Cliente fidèle" variant="success" size="md" />
          )}
          
          <View style={styles.contactInfo}>
            <Ionicons name="call-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.contactText}>{formatPhone(client.phone)}</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.contactText}>{client.neighborhood}</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.gray500} />
            <Text style={styles.contactText}>Depuis {formatDate(client.createdAt)}</Text>
          </View>
        </View>

        {/* Quick Actions }
        <View style={styles.quickActions}>
          <IconButton
            icon="call"
            label="Appeler"
            variant="ghost"
            onPress={handleCall}
          />
          <IconButton
            icon="logo-whatsapp"
            label="WhatsApp"
            variant="ghost"
            onPress={handleWhatsApp}
          />
          <IconButton
            icon="chatbubble"
            label="SMS"
            variant="ghost"
            onPress={handleSMS}
          />
          <IconButton
            icon="navigate"
            label="Itinéraire"
            variant="ghost"
            onPress={handleDirections}
          />
        </View>

        {/* Informations }
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <TouchableOpacity>
              <Text style={styles.seeMoreText}>Voir plus</Text>
            </TouchableOpacity>
          </View>

          <Card>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Commandes</Text>
              <Text style={styles.infoValue}>{totalOrders}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total dépensé</Text>
              <Text style={styles.infoValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dernière commande</Text>
              <Text style={styles.infoValue}>
                {lastOrder ? formatDate(lastOrder.createdAt) : '-'}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statut paiement</Text>
              {lastOrder ? (
                <Badge
                  label={PAYMENT_STATUS_LABELS[lastOrder.paymentStatus]}
                  variant={
                    lastOrder.paymentStatus === 'paid' ? 'success' :
                    lastOrder.paymentStatus === 'partial' ? 'warning' : 'error'
                  }
                />
              ) : (
                <Text style={styles.infoValue}>-</Text>
              )}
            </View>
          </Card>
        </View>

        {/* Photos }
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity>
              <Text style={styles.seeMoreText}>Voir toutes</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosContainer}
          >
            {/* Placeholder photos }
            {[1, 2, 3].map((i) => (
              <TouchableOpacity key={i} style={styles.photoItem}>
                <Image
                  source={{ uri: `https://images.unsplash.com/photo-159577745758${i}-95e059d581b8?w=200` }}
                  style={styles.photo}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* New Order Button }
        <Button
          title="+ Nouvelle commande"
          onPress={onNewOrderPress || (() => {})}
          fullWidth
          style={styles.newOrderButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    marginTop: -SPACING.md,
    paddingTop: SPACING.xl + SPACING.md,
  },
  clientName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  contactText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  
  // Section
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  seeMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  
  // Info Card
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  
  // Photos
  photosContainer: {
    gap: SPACING.sm,
  },
  photoItem: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photo: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray200,
  },
  
  // New Order Button
  newOrderButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
});
*/