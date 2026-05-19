// ==========================================
// ÉCRAN PRINCIPAL TABLEAU DE BORD - MODAL PREMIUM
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { useProfile } from '@hooks/useProfile';

// Importation des composants spécifiques par rôle
import { TailorDashboard } from '@components/dashboard/TailorDashboard';
import { ClientDashboard } from '@components/dashboard/ClientDashboard';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const logout = useAppStore((s) => s.logout);

  // États pour la gestion des Modals
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Extraction du rôle de la table (valeur par défaut 'tailor' si indéfini)
  const userRole = profile?.role ?? 'tailor';

  // Déclencheur du nouveau processus de déconnexion
  const handleLogoutTrigger = () => {
    setMenuVisible(false);
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
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
        <StatusBar barStyle="dark-content" />
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

          {/* ── Rendu dynamique par rôle ── */}
          {userRole === 'tailor' ? (
              <TailorDashboard />
          ) : (
              <ClientDashboard />
          )}

        </View>

        {/* ── 1. Menu Contextuel Dropdown Dropdown ── */}
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

              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('Profile');
                  }}
              >
                <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.menuItemText}>Paramètres</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={handleLogoutTrigger}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={[styles.menuItemText, styles.menuItemLogout]}>
                  Déconnexion
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── 2. MODAL DE CONFIRMATION DE LOGOUT DESIGNER ── */}
        <Modal
            visible={logoutModalVisible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalAlertOverlay}>
            <View style={styles.modalAlertCard}>

              {/* Icône d'avertissement stylisée */}
              <View style={styles.modalAlertIconBg}>
                <Ionicons name="log-out" size={32} color={COLORS.error} />
              </View>

              {/* Textes de l'alerte */}
              <Text style={styles.modalAlertTitle}>Déconnexion</Text>
              <Text style={styles.modalAlertSubtitle}>
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez ressaisir vos identifiants ou votre biométrie.
              </Text>

              {/* Grille d'actions */}
              <View style={styles.modalAlertButtons}>
                <TouchableOpacity
                    style={[styles.modalAlertBtn, styles.modalAlertBtnCancel]}
                    onPress={() => setLogoutModalVisible(false)}
                    activeOpacity={0.8}
                >
                  <Text style={styles.modalAlertTextCancel}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.modalAlertBtn, styles.modalAlertBtnConfirm]}
                    onPress={confirmLogout}
                    activeOpacity={0.8}
                >
                  <Text style={styles.modalAlertTextConfirm}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.15)',
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

  // ── styles du nouveau modal de confirmation custom ──
  modalAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 11, 20, 0.5)', // Ombre douce foncée assortie au thème
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalAlertCard: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 320,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
  },
  modalAlertIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Rouge léger transparent
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalAlertTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalAlertSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  modalAlertButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalAlertBtn: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalAlertBtnCancel: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.border,
  },
  modalAlertBtnConfirm: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  modalAlertTextCancel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  modalAlertTextConfirm: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
});