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
import { useInbox } from '@/src/hooks/useInbox';

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

  const { unreadCount } = useInbox();
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
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>Atelier</Text>
                <Text style={styles.greetingName} numberOfLines={1}>
                  {getGreeting()}, {profile?.display_name?.split(' ')[0] ?? 'là'}
                </Text>
                <Text style={styles.topDate}>{formatLongDate()}</Text>
              </View>
              <View style={styles.topActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <Feather name="bell" size={17} color={P.text} />
                  {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarBtn} onPress={openMenu}>
                  <Text style={styles.avatarBtnText}>{getInitials()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.greetRow}>
              {userRole === 'tailor' && profile?.atelier_name ? (
                  <View style={styles.atelierPill}>
                    <Feather name="home" size={12} color={P.gold} />
                    <Text style={styles.atelierName}>{profile.atelier_name}</Text>
                  </View>
              ) : (
                  <Text style={styles.greetingSub}>
                    {userRole === 'tailor' ? 'Votre atelier vous attend' : 'Suivez vos confections'}
                  </Text>
              )}
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
            <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Notifications'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.goldBg }]}>
                <Feather name="bell" size={14} color={P.gold} />
              </View>
              <Text style={styles.menuRowText}>Notifications</Text>
              <Feather name="chevron-right" size={14} color={P.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Profile'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.goldBg }]}>
                <Feather name="user" size={14} color={P.gold} />
              </View>
              <Text style={styles.menuRowText}>Mon profil</Text>
              <Feather name="chevron-right" size={14} color={P.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Settings'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.primaryBg }]}>
                <Feather name="settings" size={14} color={P.primary} />
              </View>
              <Text style={styles.menuRowText}>Apparence & langue</Text>
              <Feather name="chevron-right" size={14} color={P.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow} onPress={() => { closeMenu(); navigation.navigate('Statistics'); }} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.primaryBg }]}>
                <Feather name="bar-chart-2" size={14} color={P.primary} />
              </View>
              <Text style={styles.menuRowText}>Statistiques</Text>
              <Feather name="chevron-right" size={14} color={P.muted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuRow} onPress={handleLogoutTrigger} activeOpacity={0.7}>
              <View style={[styles.menuRowIcon, { backgroundColor: P.errorBg }]}>
                <Feather name="log-out" size={14} color={P.error} />
              </View>
              <Text style={[styles.menuRowText, { color: P.error }]}>Déconnexion</Text>
              <Feather name="chevron-right" size={14} color={P.error} />
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
    backgroundColor: P.pageBg,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: P.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  topDate: {
    fontSize: 12,
    color: P.sub,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'capitalize' as const,
    marginTop: 2,
  },
  topActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 4 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
    position: 'relative' as const,
  },
  notifDot: {
    position: 'absolute' as const, top: 8, right: 8,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: P.error,
    borderWidth: 1.5, borderColor: P.pageBg,
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.bg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  avatarBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },

  greetRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  greetingName: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: P.text,
    letterSpacing: -0.6,
  },
  greetingSub: {
    fontSize: 12,
    color: P.sub,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  atelierPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: P.goldBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: P.goldRim,
  },
  atelierName: {
    fontSize: 12,
    color: P.gold,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  rolePill: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4,
    backgroundColor: P.surface,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  rolePillTailor: {
    backgroundColor: P.bg,
    borderColor: P.goldRim,
  },
  rolePillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  rolePillTextTailor: { color: '#fff' },

  // ── Menu dropdown ──
  menuOverlay: { ...StyleSheet.absoluteFillObject },
  menuCard: {
    position: 'absolute',
    width: 256,
    backgroundColor: P.surface,
    borderRadius: 18,
    borderWidth: 0.5, borderColor: P.borderHard,
    overflow: 'hidden' as const,
  },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, padding: SPACING.md,
  },
  menuAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: P.goldRim,
  },
  menuAvatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
  menuName:  { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  menuEmail: { fontSize: 11, color: P.sub, marginTop: 1 },
  menuDivider: { height: 0.5, backgroundColor: P.borderHard },
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
    backgroundColor: P.overlay,
    justifyContent: 'center', alignItems: 'center',
    padding: SPACING.xl,
  },
  alertCard: {
    backgroundColor: P.surface,
    width: '100%', maxWidth: 320,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 0.5, borderColor: P.borderHard,
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
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  alertCancelText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  alertConfirm: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: P.error,
  },
  alertConfirmText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});