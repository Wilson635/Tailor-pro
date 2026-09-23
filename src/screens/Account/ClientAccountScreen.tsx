// ==========================================
// COMPTE CLIENT — TailorPro
// Lien atelier, mesures, paiements, réglages
// ==========================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { useProfile } from '@hooks/useProfile';
import { formatCurrencyShort, formatPhone } from '@utils/formatters';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';
import { AtelierIcon } from '@/src/components/ui';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import { isCancelledOrder } from '@constants/commandeConstants';
import {
  confectionRequestMessage,
  openTel,
  openWhatsApp,
  atelierPhone as pickAtelierPhone,
  atelierWhatsApp as pickAtelierWhatsApp,
} from '@utils/atelierContact';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ClientAccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { profile } = useProfile();
    const {
        clients,
        linkedTailors,
        orders,
        fiches,
        clientRequests,
        linkAtelierByInvite,
        logout,
        loadLinkedClients,
        getAtelierById,
    } = useAppStore();

  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadLinkedClients();
    }, [loadLinkedClients]),
  );

  const primaryClient = clients[0] ?? null;
  const primaryTailor = (linkedTailors[0]
    ? (getAtelierById(linkedTailors[0].id) ?? linkedTailors[0])
    : (primaryClient ? getAtelierById(primaryClient.couturierId) : undefined))
    ?? null;
  const callNumber = pickAtelierPhone(primaryTailor);
  const waNumber = pickAtelierWhatsApp(primaryTailor);

  const ficheCount = useMemo(
    () => (primaryClient ? (fiches[primaryClient.id] ?? []).length : 0),
    [fiches, primaryClient],
  );

  const totalDue = useMemo(
    () =>
      orders
        .filter(o => !isCancelledOrder(o.orderStatus))
        .reduce((sum, o) => sum + Math.max(0, o.remainingAmount ?? 0), 0),
    [orders],
  );

  const handleLink = async () => {
    if (!inviteCode.trim()) {
      showAlert('Code requis', 'Demandez le code d’invitation à votre couturier.');
      return;
    }
    setLinking(true);
    try {
      const result = await linkAtelierByInvite(inviteCode);
      if (!result.ok) {
        showAlert('Échec', result.error ?? 'Impossible de lier cet atelier.');
        return;
      }
      setInviteCode('');
      showSuccess('Atelier lié', 'Vos commandes et mesures sont maintenant synchronisées.');
    } finally {
      setLinking(false);
    }
  };

  const openWhatsAppContact = (phone?: string | null) =>
    openWhatsApp(phone, confectionRequestMessage({ atelierName: primaryTailor?.atelierName ?? primaryTailor?.displayName }));

  const openTelContact = (phone?: string | null) => openTel(phone);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Espace client</Text>
          <Text style={styles.title}>Mon compte</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {(profile?.display_name ?? '?').split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.display_name ?? 'Client'}</Text>
            <Text style={styles.profileSub}>{profile?.email ?? ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconChip}
            onPress={() => navigation.navigate('Profile')}
          >
            <Feather name="edit-2" size={14} color={P.gold} />
          </TouchableOpacity>
        </View>

        {/* Atelier lié */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon atelier</Text>
          {primaryTailor ? (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.tailorRow}
                onPress={() => navigation.navigate('ClientAtelier', { tailorId: primaryTailor.id })}
                activeOpacity={0.85}
              >
                <View style={styles.tailorAvatar}>
                  <AtelierIcon size={20} color={P.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tailorName}>
                    {primaryTailor.atelierName ?? primaryTailor.displayName ?? 'Atelier'}
                  </Text>
                  {(!!primaryTailor.city || !!callNumber) && (
                    <Text style={styles.tailorSub}>
                      {[primaryTailor.city, callNumber ? formatPhone(callNumber) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                  {linkedTailors.length > 1 && (
                    <Text style={styles.tailorSub}>
                      +{linkedTailors.length - 1} autre{linkedTailors.length > 2 ? 's' : ''} atelier
                      {linkedTailors.length > 2 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color={P.muted} />
              </TouchableOpacity>
              <View style={styles.contactRow}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => openTelContact(callNumber)}
                >
                  <Feather name="phone" size={14} color={P.primary} />
                  <Text style={styles.contactBtnText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => openWhatsAppContact(waNumber)}
                >
                  <Feather name="message-circle" size={14} color={P.success} />
                  <Text style={styles.contactBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Aucun atelier lié</Text>
              <Text style={styles.emptySub}>
                Saisissez le code fourni par votre couturier pour synchroniser commandes et mesures.
              </Text>
              <TextInput
                style={styles.inviteInput}
                placeholder="Code d’invitation"
                placeholderTextColor={P.muted}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
                maxLength={12}
              />
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={handleLink}
                disabled={linking}
                activeOpacity={0.85}
              >
                {linking ? (
                  <ActivityIndicator color={P.gold} />
                ) : (
                  <>
                    <Feather name="link" size={15} color={P.gold} />
                    <Text style={styles.linkBtnText}>Lier mon atelier</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {primaryTailor && (
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.emptySub}>Lier un autre atelier</Text>
              <TextInput
                style={styles.inviteInput}
                placeholder="Nouveau code"
                placeholderTextColor={P.muted}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
                maxLength={12}
              />
              <TouchableOpacity
                style={styles.linkBtnSecondary}
                onPress={handleLink}
                disabled={linking}
                activeOpacity={0.85}
              >
                <Text style={styles.linkBtnSecondaryText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {primaryTailor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demandes</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('ClientRequest', { tailorId: primaryTailor.id, kind: 'devis' })}
            >
              <View style={[styles.menuIcon, { backgroundColor: P.goldBg }]}>
                <Feather name="file-text" size={16} color={P.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Demander un devis ou un RDV</Text>
                <Text style={styles.menuSub}>
                  {clientRequests.filter(r => r.status === 'pending').length
                    ? `${clientRequests.filter(r => r.status === 'pending').length} en attente`
                    : 'Envoyez une demande à votre atelier'}
                </Text>
              </View>
              <Feather name="chevron-right" size={14} color={P.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Raccourcis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raccourcis</Text>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              if (!primaryClient) {
                showAlert('Atelier requis', 'Liez d’abord votre atelier pour voir vos mesures.');
                return;
              }
              navigation.navigate('Measurements', { clientId: primaryClient.id });
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: P.infoBg }]}>
              <Ionicons name="body-outline" size={16} color={P.info} />
            </View>
            <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Mes mesures</Text>
            <Text style={styles.menuSub}>
              {ficheCount > 0
                ? `${ficheCount} fiche${ficheCount > 1 ? 's' : ''} atelier`
                : 'Fiches prises par votre couturier'}
            </Text>
            </View>
            <Feather name="chevron-right" size={14} color={P.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              if (!primaryClient) {
                showAlert('Atelier requis', 'Liez d’abord votre atelier pour voir vos paiements.');
                return;
              }
              navigation.navigate('ClientPaiements', { clientId: primaryClient.id });
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: P.errorBg }]}>
              <Feather name="credit-card" size={16} color={P.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Mes paiements</Text>
              {totalDue > 0 && (
                <Text style={styles.menuHint}>Reste à régler : {formatCurrencyShort(totalDue)}</Text>
              )}
            </View>
            <Feather name="chevron-right" size={14} color={P.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={[styles.menuIcon, { backgroundColor: P.goldBg }]}>
              <Feather name="bell" size={16} color={P.gold} />
            </View>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Feather name="chevron-right" size={14} color={P.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.menuIcon, { backgroundColor: P.primaryBg }]}>
              <Feather name="settings" size={16} color={P.primary} />
            </View>
            <Text style={styles.menuLabel}>Apparence & langue</Text>
            <Feather name="chevron-right" size={14} color={P.muted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutRow}
          onPress={() => logout()}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={P.error} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: P.gold,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: P.text,
    letterSpacing: -0.4,
  },
  content: { paddingHorizontal: 20, gap: 16 },

  profileCard: {
    backgroundColor: P.surface,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: P.borderHard,
    padding: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#16123A',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: P.goldRim,
    overflow: 'hidden' as const,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 14 },
  avatarText: { color: P.gold, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  profileName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  profileSub: { fontSize: 12, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: P.goldBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 0.5,
    borderColor: P.goldRim,
  },

  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  card: {
    backgroundColor: P.surface,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: P.borderHard,
    padding: 14,
    gap: 12,
  },
  tailorRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  tailorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: P.goldBg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tailorName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  tailorSub: { fontSize: 12, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
  contactRow: { flexDirection: 'row' as const, gap: 8 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: P.pageBg,
    borderWidth: 0.5,
    borderColor: P.borderHard,
  },
  contactBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },

  emptyTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  emptySub: { fontSize: 12, color: P.sub, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' },
  inviteInput: {
    borderWidth: 0.5,
    borderColor: P.borderHard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: P.text,
    backgroundColor: P.pageBg,
    textAlign: 'center' as const,
  },
  linkBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#16123A',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: P.goldRim,
  },
  linkBtnText: { color: P.gold, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  linkBtnSecondary: {
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  linkBtnSecondaryText: { color: P.primary, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },

  menuRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: P.surface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: P.borderHard,
    padding: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  menuSub: { fontSize: 11, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
  menuHint: { fontSize: 11, color: P.error, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },

  logoutRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.error },
});
