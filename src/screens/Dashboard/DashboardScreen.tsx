// ==========================================
// ÉCRAN TABLEAU DE BORD - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatRelativeTime } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { useProfile } from '@hooks/useProfile';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { statistics, activities } = useAppStore();
  const { profile, loading } = useProfile();
  const logout = useAppStore((s) => s.logout);

  const [menuVisible, setMenuVisible] = useState(false);

  // ── Logout ──
  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert(
        'Déconnexion',
        'Voulez-vous vraiment vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: () => logout(),
          },
        ]
    );
  };

  // ── Activity helpers ──
  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'new_order':        return 'bag-outline';
      case 'payment_received': return 'wallet-outline';
      case 'order_completed':  return 'checkmark-circle-outline';
      case 'new_client':       return 'person-add-outline';
      default:                 return 'ellipse-outline';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'new_order':        return COLORS.info;
      case 'payment_received': return COLORS.success;
      case 'order_completed':  return COLORS.primary;
      case 'new_client':       return COLORS.warning;
      default:                 return COLORS.gray500;
    }
  };

  const getActivityBg = (type: string): string => {
    switch (type) {
      case 'new_order':        return COLORS.infoLight;
      case 'payment_received': return COLORS.successLight;
      case 'order_completed':  return COLORS.secondary;
      case 'new_client':       return COLORS.warningLight;
      default:                 return COLORS.gray100;
    }
  };

  // ── Avatar initiales ──
  const getInitials = () => {
    if (!profile?.display_name) return '?';
    return profile.display_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  };

  return (
      <>
        <View style={[styles.container, { paddingTop: insets.top }]}>

          {/* ── Top bar ── */}
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              {/* Avatar avec initiales */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View>
                <Text style={styles.greetingSub}>Bonjour 👋</Text>
                <Text style={styles.greetingName} numberOfLines={1}>
                  {loading ? '...' : (profile?.display_name ?? 'Utilisateur')}
                </Text>
                {profile?.atelier_name ? (
                    <Text style={styles.atelierName} numberOfLines={1}>
                      {profile.atelier_name}
                    </Text>
                ) : null}
              </View>
            </View>

            {/* Boutons droite */}
            <View style={styles.topbarRight}>
              {/* Notif */}
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
                <View style={styles.notifDot} />
              </TouchableOpacity>

              {/* Menu */}
              <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setMenuVisible(true)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
              showsVerticalScrollIndicator={false}
          >

            {/* ── Hero Revenue Card ── */}
            <View style={styles.heroCard}>
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />

              <TouchableOpacity style={styles.heroPeriod}>
                <Text style={styles.heroPeriodText}>Ce mois</Text>
                <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>

              <Text style={styles.heroLabel}>Revenus du mois</Text>
              <Text style={styles.heroAmount}>
                {formatCurrency(statistics.monthlyRevenue)}
              </Text>

              <View style={styles.heroTrend}>
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={11} color="#6EE7B7" />
                  <Text style={styles.trendPillText}>+{statistics.revenueGrowth}%</Text>
                </View>
                <Text style={styles.heroSub}>vs mois dernier</Text>
              </View>
            </View>

            {/* ── Stats Grid ── */}
            <View style={styles.statsGrid}>

              <View style={[styles.statCard, styles.statCardAccent]}>
                <View style={[styles.statCardIcon, styles.statCardIconAccent]}>
                  <Ionicons name="people-outline" size={15} color={COLORS.primary} />
                </View>
                <Text style={styles.statLabel}>Clients</Text>
                <Text style={[styles.statValue, styles.statValueAccent]}>
                  {statistics.totalClients}
                </Text>
                <Text style={[styles.statSub, styles.statSubOk]}>+3 ce mois</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardIcon}>
                  <Ionicons name="time-outline" size={15} color={COLORS.gray500} />
                </View>
                <Text style={styles.statLabel}>En cours</Text>
                <Text style={styles.statValue}>{statistics.ordersInProgress}</Text>
                <Text style={[styles.statSub, styles.statSubNeutral]}>commandes</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardIcon}>
                  <Ionicons name="checkmark-outline" size={15} color={COLORS.gray500} />
                </View>
                <Text style={styles.statLabel}>Terminées</Text>
                <Text style={styles.statValue}>{statistics.completedOrders}</Text>
                <Text style={[styles.statSub, styles.statSubOk]}>ce mois</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardIcon}>
                  <Ionicons name="alert-circle-outline" size={15} color={COLORS.gray500} />
                </View>
                <Text style={styles.statLabel}>Impayées</Text>
                <Text style={styles.statValue}>{statistics.unpaidInvoices}</Text>
                <Text style={[styles.statSub, styles.statSubErr]}>
                  {formatCurrency(statistics.unpaidAmount)}
                </Text>
              </View>

            </View>

            {/* ── Quick Actions ── */}
            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn}>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.quickLabel}>Commande</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn}>
                <Ionicons name="person-add-outline" size={22} color={COLORS.primary} />
                <Text style={styles.quickLabel}>Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn}>
                <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
                <Text style={styles.quickLabel}>Facture</Text>
              </TouchableOpacity>
            </View>

            {/* ── Recent Activities ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activités récentes</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              <Card padding="none" style={styles.activitiesCard}>
                {activities.slice(0, 4).map((activity, index) => (
                    <View key={activity.id}>
                      <TouchableOpacity style={styles.activityItem}>
                        <View
                            style={[
                              styles.activityIconContainer,
                              { backgroundColor: getActivityBg(activity.type) },
                            ]}
                        >
                          <Ionicons
                              name={getActivityIcon(activity.type)}
                              size={18}
                              color={getActivityColor(activity.type)}
                          />
                        </View>

                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                        </View>

                        <View style={styles.activityRight}>
                          <Text style={styles.activityTime}>
                            {formatRelativeTime(activity.timestamp)}
                          </Text>
                          {activity.amount && (
                              <Text style={styles.activityAmount}>
                                +{formatCurrency(activity.amount)}
                              </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {index < Math.min(activities.length, 4) - 1 && (
                          <View style={styles.activityDivider} />
                      )}
                    </View>
                ))}
              </Card>
            </View>

          </ScrollView>
        </View>

        {/* ── Menu Modal (logout) ── */}
        <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setMenuVisible(false)}
          >
            <View style={[styles.menuCard, { top: insets.top + 60, right: SPACING.lg }]}>

              {/* Infos profil en tête de menu */}
              <View style={styles.menuProfile}>
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>{getInitials()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuProfileName} numberOfLines={1}>
                    {profile?.display_name ?? 'Utilisateur'}
                  </Text>
                  <Text style={styles.menuProfileEmail} numberOfLines={1}>
                    {profile?.email ?? ''}
                  </Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              {/* Paramètres */}
              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.menuItemText}>Paramètres</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Déconnexion */}
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={[styles.menuItemText, styles.menuItemLogout]}>
                  Déconnexion
                </Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </Modal>
      </>
  );
};

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Top bar ──
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  greetingSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  greetingName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: 1,
    maxWidth: 180,
  },
  atelierName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
    maxWidth: 180,
  },
  iconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },

  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroPeriod: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  heroPeriodText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FONT_WEIGHTS.medium,
  },
  heroLabel: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FONT_WEIGHTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  heroAmount: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  heroTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  trendPillText: {
    fontSize: FONT_SIZES.xs,
    color: '#6EE7B7',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  heroSub: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.35)',
  },

  // ── Stats Grid ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  statCardAccent: {
    backgroundColor: COLORS.secondary,
    borderColor: 'rgba(107,33,168,0.15)',
  },
  statCardIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardIconAccent: {
    backgroundColor: 'rgba(107,33,168,0.12)',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    lineHeight: 32,
  },
  statValueAccent: {
    color: COLORS.primary,
  },
  statSub: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs / 2,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statSubOk:      { color: COLORS.success },
  statSubErr:     { color: COLORS.error, fontWeight: FONT_WEIGHTS.semibold },
  statSubNeutral: { color: COLORS.textSecondary },

  // ── Quick Actions ──
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ── Section ──
  section: {
    marginBottom: SPACING.lg,
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
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // ── Activities ──
  activitiesCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },
  activitySubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  activityRight: { alignItems: 'flex-end' },
  activityTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  activityAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.success,
    marginTop: SPACING.xs / 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 68,
  },

  // ── Menu Modal ──
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuCard: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  menuProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  menuProfileName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  menuProfileEmail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  menuItemLogout: {
    color: COLORS.error,
  },
});