// ==========================================
// ÉCRAN PRINCIPAL TABLEAU DE BORD
// Design premium dark/gold — TailorPro
// ==========================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { SPACING } from '@constants/theme';
import { useProfile } from '@hooks/useProfile';
import { TailorDashboard } from '@components/dashboard/TailorDashboard';
import { ClientDashboard } from '@components/dashboard/ClientDashboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

// ── Palette locale ──
const P = {
  bg:      '#0E0B14',
  surface: '#1A1528',
  border:  '#2E2845',
  text:    '#FFFFFF',
  sub:     'rgba(255,255,255,0.5)',
  muted:   'rgba(255,255,255,0.25)',
  gold:    '#D4AF37',
  goldBg:  'rgba(212,175,55,0.10)',
  goldRim: 'rgba(212,175,55,0.22)',
  error:   '#EF4444',
  errorBg: 'rgba(239,68,68,0.12)',
  screenBg:'#F7F6FB',
  topbar:  '#FFFFFF',
  topBorder: 'rgba(0,0,0,0.06)',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const logout = useAppStore((s) => s.logout);

  const [menuVisible, setMenuVisible]   = useState(false);
  const [logoutModal, setLogoutModal]   = useState(false);

  // Animation du menu dropdown
  const menuAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 80, friction: 12,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const userRole = profile?.role ?? 'tailor';

  const getInitials = () => {
    if (!profile?.display_name) return '?';
    return profile.display_name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  };

  const handleLogoutTrigger = () => {
    closeMenu();
    setTimeout(() => setLogoutModal(true), 250);
  };

  const confirmLogout = () => {
    setLogoutModal(false);
    logout();
  };

  if (loading) {
    return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={P.gold} />
        </View>
    );
  }

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1], outputRange: [-8, 0],
  });
  const menuOpacity = menuAnim;

  return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={P.topbar} />

        <View style={[styles.container, { paddingTop: insets.top }]}>

          {/* ══════════════════════════════════
                    TOP BAR
                ══════════════════════════════════ */}
          <View style={styles.topbar}>
            {/* Avatar + salutation */}
            <View style={styles.topbarLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
                {/* Anneau gold */}
                <View style={styles.avatarRing} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Bonjour 👋</Text>
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

            {/* Icônes droite */}
            <View style={styles.topbarRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Feather name="bell" size={19} color={P.bg} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDark]} onPress={openMenu}>
                <Feather name="more-vertical" size={19} color={P.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Contenu dynamique ── */}
          {userRole === 'tailor'
              ? <TailorDashboard />
              : <ClientDashboard />
          }
        </View>

        {/* ══════════════════════════════════
                MENU CONTEXTUEL DROPDOWN
            ══════════════════════════════════ */}
        <Modal
            visible={menuVisible}
            transparent
            animationType="none"
            onRequestClose={closeMenu}
        >
          <Pressable style={styles.menuOverlay} onPress={closeMenu}>
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>

          <Animated.View
              style={[
                styles.menuCard,
                {
                  top: insets.top + 64,
                  right: SPACING.lg,
                  opacity: menuOpacity,
                  transform: [{ translateY: menuTranslateY }],
                },
              ]}
              pointerEvents="box-none"
          >
            {/* Profil dans le menu */}
            <View style={styles.menuProfileRow}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{getInitials()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName} numberOfLines={1}>
                  {profile?.display_name ?? 'Utilisateur'}
                </Text>
                <Text style={styles.menuEmail} numberOfLines={1}>
                  {profile?.email ?? ''}
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { closeMenu(); navigation.navigate('Profile'); }}
                activeOpacity={0.7}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: P.goldBg }]}>
                <Feather name="settings" size={15} color={P.gold} />
              </View>
              <Text style={styles.menuItemText}>Paramètres</Text>
              <Feather name="chevron-right" size={15} color="rgba(14,11,20,0.25)" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogoutTrigger}
                activeOpacity={0.7}
            >
              <View style={[styles.menuItemIcon, { backgroundColor: P.errorBg }]}>
                <Feather name="log-out" size={15} color={P.error} />
              </View>
              <Text style={[styles.menuItemText, { color: P.error }]}>Déconnexion</Text>
              <Feather name="chevron-right" size={15} color="rgba(239,68,68,0.3)" />
            </TouchableOpacity>
          </Animated.View>
        </Modal>

        {/* ══════════════════════════════════
                MODAL CONFIRMATION LOGOUT
            ══════════════════════════════════ */}
        <Modal
            visible={logoutModal}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() => setLogoutModal(false)}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>

              {/* Icône */}
              <View style={styles.alertIconBg}>
                <Feather name="log-out" size={28} color={P.error} />
              </View>

              {/* Textes */}
              <Text style={styles.alertTitle}>Déconnexion</Text>
              <Text style={styles.alertBody}>
                Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez ressaisir vos identifiants ou votre biométrie.
              </Text>

              {/* Boutons */}
              <View style={styles.alertBtns}>
                <TouchableOpacity
                    style={styles.alertBtnCancel}
                    onPress={() => setLogoutModal(false)}
                    activeOpacity={0.8}
                >
                  <Text style={styles.alertBtnCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.alertBtnConfirm}
                    onPress={confirmLogout}
                    activeOpacity={0.8}
                >
                  <Feather name="log-out" size={15} color="#fff" />
                  <Text style={styles.alertBtnConfirmText}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.screenBg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: P.bg },

  /* ── Top bar ── */
  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: P.topbar,
    borderBottomWidth: 1, borderBottomColor: P.topBorder,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  topbarLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },

  /* ── Avatar ── */
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: P.bg,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarRing: {
    position: 'absolute', inset: -2,
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: P.gold,
  },
  avatarText:  { fontSize: 14, fontWeight: '700', color: P.gold },
  greeting:    { fontSize: 11, color: 'rgba(14,11,20,0.4)', fontWeight: '500' },
  greetingName:{ fontSize: 15, fontWeight: '700', color: P.bg, marginTop: 1, maxWidth: 180 },
  atelierName: { fontSize: 11, color: 'rgba(14,11,20,0.4)', marginTop: 1, maxWidth: 180 },

  /* ── Icon buttons ── */
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(14,11,20,0.06)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  iconBtnDark: { backgroundColor: P.bg },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: P.error, borderWidth: 1.5, borderColor: P.topbar,
  },

  /* ── Dropdown menu ── */
  menuOverlay: { ...StyleSheet.absoluteFillObject },
  menuCard: {
    position: 'absolute', width: 248,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 12 },
    }),
  },
  menuProfileRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, padding: SPACING.md,
  },
  menuAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center',
  },
  menuAvatarText: { fontSize: 13, fontWeight: '700', color: P.gold },
  menuName:  { fontSize: 13, fontWeight: '700', color: P.bg },
  menuEmail: { fontSize: 11, color: 'rgba(14,11,20,0.4)', marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 13, gap: 10,
  },
  menuItemIcon: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  menuItemText: { flex: 1, fontSize: 13, fontWeight: '600', color: P.bg },

  /* ── Alert modal ── */
  alertOverlay: {
    flex: 1, backgroundColor: 'rgba(14,11,20,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: SPACING.xl,
  },
  alertCard: {
    backgroundColor: '#FFFFFF', width: '100%', maxWidth: 320,
    borderRadius: 24, padding: SPACING.xl, alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 32 },
      android: { elevation: 20 },
    }),
  },
  alertIconBg: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: P.errorBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  alertTitle: {
    fontSize: 18, fontWeight: '800', color: P.bg,
    marginBottom: SPACING.xs,
  },
  alertBody: {
    fontSize: 13, color: 'rgba(14,11,20,0.5)',
    textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl,
  },
  alertBtns: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  alertBtnCancel: {
    flex: 1, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(14,11,20,0.06)',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  alertBtnCancelText: { fontSize: 14, fontWeight: '600', color: 'rgba(14,11,20,0.6)' },
  alertBtnConfirm: {
    flex: 1, height: 46, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: P.error,
  },
  alertBtnConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});