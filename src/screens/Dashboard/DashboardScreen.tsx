// ==========================================
// ÉCRAN PRINCIPAL TABLEAU DE BORD - ROUTER INTERNAL
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { useProfile } from '@hooks/useProfile';

// Importation des composants spécifiques par rôle
import { TailorDashboard } from '@components/dashboard/TailorDashboard';
import { ClientDashboard } from '@components/dashboard/ClientDashboard';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const logout = useAppStore((s) => s.logout);

  const [menuVisible, setMenuVisible] = useState(false);

  // Extraction du rôle de la table (valeur par défaut 'tailor' si indéfini)
  const userRole = profile?.role ?? 'tailor';

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

  if (loading) {
    return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
  }

  return (
      <>
        <View style={[styles.container, { paddingTop: insets.top }]}>

          {/* ── Top bar commune à tous les profils ── */}
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View>
                <Text style={styles.greetingSub}>Bonjour 👋</Text>
                <Text style={styles.greetingName} numberOfLines={1}>
                  {profile?.display_name ?? 'Utilisateur'}
                </Text>
                {/* On n'affiche l'atelier que si l'utilisateur est un couturier */}
                {userRole === 'tailor' && profile?.atelier_name ? (
                    <Text style={styles.atelierName} numberOfLines={1}>
                      {profile.atelier_name}
                    </Text>
                ) : null}
              </View>
            </View>

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

          {/* ── Condition de rendu selon le rôle extrait du profil ── */}
          {userRole === 'tailor' ? (
              <TailorDashboard />
          ) : (
              <ClientDashboard />
          )}

        </View>

        {/* ── Menu Modal commun (logout / paramètres) ── */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
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