// ==========================================
// ÉCRAN PRINCIPAL TABLEAU DE BORD — TailorPro
// Design épuré, moderne, adapté couturier
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
import { nativeDriver } from '@utils/animation';
import { useThemedStyles, type Palette } from '@/src/theme';
import { usePreferences } from '@/src/context/PreferencesContext';
import { t } from '@/src/i18n';
import { formatLongDate } from '@utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return t('greet.morning');
  if (h < 18) return t('greet.afternoon');
  return t('greet.evening');
};

// ──────────────────────────────────────────
// COMPOSANT
// ──────────────────────────────────────────

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const logout = useAppStore((s) => s.logout);
  const { colors: P, styles, isDark } = useThemedStyles(makeDashStyles);
  usePreferences();

  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const menuAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnim, {
      toValue: 1, useNativeDriver: nativeDriver, tension: 80, friction: 12,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0, duration: 160, useNativeDriver: nativeDriver,
    }).start(() => setMenuVisible(false));
  };

  const getInitials = () => {
    if (!profile?.display_name) return '?';
    return profile.display_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleLogoutTrigger = () => {
    closeMenu();
    setTimeout(() => setLogoutModal(true), 220);
  };

  if (loading) {
    return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={P.primary} />
        </View>
    );
  }

  const userRole = profile?.role ?? 'tailor';
  const menuTranslateY = menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  return (
      <>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={P.topBg} />

        <View style={[styles.container, { paddingTop: insets.top }]}>

          {/* ══════════════════════════════
            TOP BAR
        ══════════════════════════════ */}
          <View style={styles.topbar}>

            {/* Forme décorative en fond (pas d'ombre, juste une teinte) */}
            <View style={styles.topbarDecor} pointerEvents="none" />

            {/* Ligne 1 : date + salutation | actions */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topDate}>{formatLongDate()}</Text>
                <Text style={styles.greeting}>
                  {getGreeting()}, <Text style={styles.greetingName}>{profile?.display_name?.split(' ')[0] ?? 'là'} 👋</Text>
                </Text>
              </View>
              <View style={styles.topActions}>
                <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="bell" size={17} color={P.text} />
                  <View style={styles.notifDot} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarBtn} onPress={openMenu}>
                  <Text style={styles.avatarBtnText}>{getInitials()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ligne 2 : badges */}
            <View style={styles.greetRow}>
              {userRole === 'tailor' && profile?.atelier_name ? (
                  <View style={styles.atelierPill}>
                    <Feather name="home" size={12} color={P.primary} />
                    <Text style={styles.atelierName}>{profile.atelier_name}</Text>
                  </View>
              ) : (
                  <Text style={styles.greetingSub}>
                    {userRole === 'tailor' ? 'Votre atelier vous attend' : 'Suivez vos confections'}
                  </Text>
              )}

              {/* Badge rôle */}
              <View style={[styles.rolePill, userRole === 'tailor' && styles.rolePillTailor]}>
                <Feather
                    name={userRole === 'tailor' ? 'scissors' : 'user'}
                    size={10}
                    color={userRole === 'tailor' ? P.gold : P.primary}
                />
                <Text style={[styles.rolePillText, userRole === 'tailor' && styles.rolePillTextTailor]}>
                  {userRole === 'tailor' ? 'Couturier' : 'Client'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Contenu dynamique ── */}
          {userRole === 'tailor' ? <TailorDashboard /> : <ClientDashboard />}
        </View>

        {/* ══════════════════════════════
          MENU DROPDOWN PROFIL
      ══════════════════════════════ */}
        <Modal visible={menuVisible} transparent animationType="none" onRequestClose={closeMenu}>
          <Pressable style={styles.menuOverlay} onPress={closeMenu}>
            <BlurView intensity={8} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>

          <Animated.View
              style={[
                styles.menuCard,
                {
                  top: insets.top + 70,
                  right: SPACING.lg,
                  opacity: menuAnim,
                  transform: [{ translateY: menuTranslateY }],
                },
              ]}
              pointerEvents="box-none"
          >
            {/* En-tête profil */}
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{getInitials()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName} numberOfLines={1}>{profile?.display_name ?? 'Utilisateur'}</Text>
                <Text style={styles.menuEmail} numberOfLines={1}>{profile?.email ?? ''}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Profile'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.goldBg }]}>
                <Feather name="user" size={14} color={P.gold} />
              </View>
              <Text style={styles.menuRowText}>Mon profil</Text>
              <Feather name="chevron-right" size={14} color="rgba(0,0,0,0.2)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Statistics'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: 'rgba(108,62,184,0.10)' }]}>
                <Feather name="bar-chart-2" size={14} color={P.primary} />
              </View>
              <Text style={styles.menuRowText}>Statistiques</Text>
              <Feather name="chevron-right" size={14} color="rgba(0,0,0,0.2)" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} onPress={handleLogoutTrigger} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.errorBg }]}>
                <Feather name="log-out" size={14} color={P.error} />
              </View>
              <Text style={[styles.menuRowText, { color: P.error }]}>Déconnexion</Text>
              <Feather name="chevron-right" size={14} color="rgba(239,68,68,0.25)" />
            </TouchableOpacity>
          </Animated.View>
        </Modal>

        {/* ══════════════════════════════
          MODAL CONFIRMATION LOGOUT
      ══════════════════════════════ */}
        <Modal visible={logoutModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setLogoutModal(false)}>
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={styles.alertIconWrap}>
                <Feather name="log-out" size={26} color={P.error} />
              </View>
              <Text style={styles.alertTitle}>Se déconnecter ?</Text>
              <Text style={styles.alertBody}>
                Vous devrez vous reconnecter pour accéder à votre espace.
              </Text>
              <View style={styles.alertBtns}>
                <TouchableOpacity style={styles.alertCancel} onPress={() => setLogoutModal(false)} activeOpacity={0.8}>
                  <Text style={styles.alertCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.alertConfirm} onPress={() => { setLogoutModal(false); logout(); }} activeOpacity={0.8}>
                  <Feather name="log-out" size={14} color="#fff" />
                  <Text style={styles.alertConfirmText}>Déconnexion</Text>
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

const makeDashStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: P.pageBg },

  // ── Top bar ──
  topbar: {
    backgroundColor: P.topBg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  topbarDecor: {
    position: 'absolute',
    top: 0,
    left: -40,
    right: -40,
    height: 64,
    backgroundColor: P.primaryBg,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    opacity: 0.6,
  },

  // Ligne 1 : date + salutation + icônes
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  topDate: {
    fontSize: 11,
    color: P.sub,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'capitalize',
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: P.pageBg,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: P.error,
    borderWidth: 1.5, borderColor: P.topBg,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: P.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: P.gold,
  },
  avatarBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },

  // Ligne 2 : badges
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    /*justifyContent: 'space-between',*/
    gap: 5,
  },
  greeting: {
    fontSize: 19,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: P.sub,
    marginTop: 2,
  },
  greetingName: {
    fontSize: 19,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: P.text,
  },
  greetingSub: {
    fontSize: 12,
    color: P.sub,
  },
  atelierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108,62,184,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  atelierName: {
    fontSize: 12,
    color: P.primary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(108,62,184,0.08)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1, borderColor: 'rgba(108,62,184,0.15)',
  },
  rolePillTailor: {
    backgroundColor: P.goldBg,
    borderColor: P.goldRim,
  },
  rolePillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  rolePillTextTailor: { color: P.gold },

  // ── Menu dropdown ──
  menuOverlay: { ...StyleSheet.absoluteFillObject },
  menuCard: {
    position: 'absolute',
    width: 256,
    backgroundColor: P.surface,
    borderRadius: 20,
    borderWidth: 1, borderColor: P.border,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 14 },
    }),
  },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, padding: SPACING.md,
  },
  menuAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: P.gold,
  },
  menuAvatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
  menuName:  { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  menuEmail: { fontSize: 11, color: P.sub, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 14, gap: 10,
  },
  menuRowIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  menuRowText: { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },

  // ── Modal logout ──
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22,18,58,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: SPACING.xl,
  },
  alertCard: {
    backgroundColor: P.surface,
    width: '100%', maxWidth: 320,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40 },
      android: { elevation: 24 },
    }),
  },
  alertIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: P.errorBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  alertTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, marginBottom: 6 },
  alertBody: { fontSize: 13, color: P.sub, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  alertBtns: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  alertCancel: {
    flex: 1, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.pageBg,
    borderWidth: 1, borderColor: P.border,
  },
  alertCancelText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  alertConfirm: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: P.error,
  },
  alertConfirmText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});