// ==========================================
// PROFIL UTILISATEUR — Module 0 — TailorPro
// Entité Couturier complète
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
    View, Text, TouchableOpacity,
    ScrollView, Switch, StatusBar, TextInput,
    ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useProfile } from '@hooks/useProfile';
import { useAppStore } from '@store/useAppStore';
import { supabase } from '@/src/lib/supabase';
import { uploadProfilePhoto } from '@services/supabaseService';
import { useThemedStyles, type Palette } from '@/src/theme';
import { t } from '@/src/i18n';
import { formatCurrency, formatCurrencyShort } from '@utils/formatters';
import { buildInbox } from '@/src/utils/buildInbox';
import {
    getNotificationsEnabled,
    requestNotificationPermission,
    setNotificationsEnabled,
    syncDeviceNotifications,
} from '@/src/notifications/deviceNotifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// ── CONSTANTES ───────────────────────────────────────────────────
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOURS_LABELS: Record<string, string> = {
    lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer',
    jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
};
const DEFAULT_HORAIRES = Object.fromEntries(JOURS.map(j => [j, j === 'dimanche' ? 'Fermé' : '8h-18h']));

const SPECIALITIES_OPTIONS = [
    { id: 'mariage',      label: 'Robes de mariée' },
    { id: 'traditionnel', label: 'Tenues traditionnelles' },
    { id: 'bureau',       label: 'Tenues de bureau' },
    { id: 'enfant',       label: 'Vêtements enfants' },
    { id: 'homme',        label: 'Costumes homme' },
    { id: 'broderie',     label: 'Broderie & Dentelle' },
    { id: 'retouche',     label: 'Retouches' },
    { id: 'accessoires',  label: 'Accessoires' },
];

const planMetaFor = (P: Palette): Record<string, { label: string; color: string; bg: string; desc: string }> => ({
    gratuit: { label: 'Gratuit',  color: P.sub,     bg: P.primaryBg, desc: 'Fonctionnalités de base' },
    pro:     { label: 'Pro',      color: P.primary,  bg: P.primaryMid, desc: 'Toutes les fonctionnalités' },
    business:{ label: 'Business', color: P.gold,     bg: P.goldBg,    desc: 'Multi-atelier & analytics' },
});

// ── ASYNC STORAGE KEYS ────────────────────────────────────────────
const DEVICES_KEY   = (uid: string) => `@tailorpro_devices_${uid}`;
const HISTORY_KEY   = (uid: string) => `@tailorpro_login_history_${uid}`;
const BIOMETRIC_KEY = (uid: string) => `@biometrics_enabled_${uid}`;

// ── TYPES ─────────────────────────────────────────────────────────
interface StoredDevice {
    id: string; name: string; os: string; osVersion: string;
    location: string; lastSeen: string; registeredAt: string;
}
interface LoginEvent {
    id: string; action: string; location: string; date: string; success: boolean;
}

// ── HELPERS ───────────────────────────────────────────────────────
const getCurrentDeviceId = () =>
    `${Device.modelName ?? 'unknown'}_${Device.osName ?? ''}_${Platform.OS}`.replace(/\s/g, '_');
const getCurrentDeviceName = () =>
    Device.deviceName ?? Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android');
const getCurrentOs = () => {
    const os = Device.osName ?? (Platform.OS === 'ios' ? 'iOS' : 'Android');
    return `${os}${Device.osVersion ? ` ${Device.osVersion}` : ''}`;
};
const now = () => new Date().toISOString();
const formatEventDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (d.toDateString() === today.toDateString()) return `Aujourd'hui ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Hier ${time}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`;
};

// ── SUB-COMPOSANTS ────────────────────────────────────────────────
const SectionTitle = ({ title }: { title: string }) => {
    const { styles } = useThemedStyles(makeStyles);
    return <Text style={styles.sectionTitle}>{title}</Text>;
};
const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => {
    const { styles } = useThemedStyles(makeStyles);
    return <View style={[styles.card, style]}>{children}</View>;
};
const Divider = () => {
    const { styles } = useThemedStyles(makeStyles);
    return <View style={styles.divider} />;
};

const SettingRow = ({
                        icon, iconBg, iconColor, title, subtitle,
                        right, onPress, danger, isEditing, renderInput, multiline,
                    }: {
    icon: keyof typeof Ionicons.glyphMap; iconBg: string; iconColor?: string;
    title: string; subtitle?: string; right?: React.ReactNode;
    onPress?: () => void; danger?: boolean; isEditing?: boolean;
    renderInput?: () => React.ReactNode; multiline?: boolean;
}) => {
    const { colors: P, styles } = useThemedStyles(makeStyles);
    return (
    <TouchableOpacity
        style={[styles.row, multiline && styles.rowMulti]}
        onPress={isEditing ? undefined : onPress}
        activeOpacity={onPress && !isEditing ? 0.65 : 1}
    >
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={17} color={iconColor ?? P.gold} />
        </View>
        <View style={[styles.rowContent, multiline && { alignSelf: 'flex-start', paddingTop: 2 }]}>
            <Text style={[styles.rowTitle, danger && { color: P.error }]}>{title}</Text>
            {isEditing && renderInput
                ? <View style={[styles.inputWrapper, multiline && { borderBottomWidth: 0 }]}>{renderInput()}</View>
                : subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null
            }
        </View>
        {!isEditing && (right ?? (onPress && <Ionicons name="chevron-forward" size={15} color={P.muted} />))}
    </TouchableOpacity>
    );
};

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────
export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: P, styles, isDark } = useThemedStyles(makeStyles);
    const { profile, updateProfile, refetch } = useProfile();
    const { statistics, orders, clients, activities } = useAppStore();

    const [activeTab, setActiveTab] = useState<'profil' | 'securite' | 'atelier'>('profil');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // ── Profil tab state ──────────────────────────────────────────
    const [displayName, setDisplayName] = useState('');
    const [atelierName, setAtelierName] = useState('');
    const [phone, setPhone]             = useState('');
    const [whatsapp, setWhatsapp]       = useState('');
    const [ville, setVille]             = useState('');
    const [adresse, setAdresse]         = useState('');
    const [description, setDescription] = useState('');
    const [statutCatalogue, setStatutCatalogue] = useState<'public' | 'prive'>('prive');

    // ── Atelier tab state ─────────────────────────────────────────
    const [horaires, setHoraires]       = useState<Record<string, string>>(DEFAULT_HORAIRES);
    const [facebook, setFacebook]       = useState('');
    const [instagram, setInstagram]     = useState('');
    const [tiktok, setTiktok]           = useState('');
    const [specialites, setSpecialites] = useState<string[]>([]);

    // ── Securité state ────────────────────────────────────────────
    const [biometricEnabled, setBiometricEnabled]   = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled]           = useState(false);
    const [notifEnabled, setNotifEnabled]           = useState(true);
    const [devices, setDevices]                     = useState<StoredDevice[]>([]);
    const [loadingDevices, setLoadingDevices]       = useState(true);
    const [loginHistory, setLoginHistory]           = useState<LoginEvent[]>([]);
    const [loadingHistory, setLoadingHistory]       = useState(true);

    // ── Init depuis profil ────────────────────────────────────────
    useEffect(() => {
        if (!profile) return;
        setDisplayName(profile.display_name || '');
        setAtelierName(profile.atelier_name || '');
        setPhone(profile.phone || '');
        setWhatsapp(profile.whatsapp || '');
        setVille(profile.city || '');
        setAdresse(profile.adresse || '');
        setDescription(profile.description || '');
        setStatutCatalogue(profile.statut_catalogue ?? 'prive');
        setHoraires({ ...DEFAULT_HORAIRES, ...(profile.horaires ?? {}) });
        const rs = profile.reseaux_sociaux ?? {};
        setFacebook(rs.facebook || '');
        setInstagram(rs.instagram || '');
        setTiktok(rs.tiktok || '');
        setSpecialites(profile.specialities ?? []);
    }, [profile]);

    // ── Init biométrie ────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const hw = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(hw && enrolled);
            if (profile?.id) {
                const stored = await AsyncStorage.getItem(BIOMETRIC_KEY(profile.id));
                setBiometricEnabled(stored === 'true');
                setNotifEnabled(await getNotificationsEnabled(profile.id));
            }
        };
        init();
    }, [profile?.id]);

    // ── Appareils ─────────────────────────────────────────────────
    const loadDevices = useCallback(async () => {
        if (!profile?.id) return;
        setLoadingDevices(true);
        try {
            const raw = await AsyncStorage.getItem(DEVICES_KEY(profile.id));
            const stored: StoredDevice[] = raw ? JSON.parse(raw) : [];
            const currentId = getCurrentDeviceId();
            const existing = stored.find(d => d.id === currentId);
            const cur: StoredDevice = {
                id: currentId, name: getCurrentDeviceName(),
                os: getCurrentOs(), osVersion: Device.osVersion ?? '',
                location: 'Appareil actuel', lastSeen: now(),
                registeredAt: existing?.registeredAt ?? now(),
            };
            const updated = [cur, ...stored.filter(d => d.id !== currentId)];
            await AsyncStorage.setItem(DEVICES_KEY(profile.id), JSON.stringify(updated));
            setDevices(updated);
        } finally { setLoadingDevices(false); }
    }, [profile?.id]);

    // ── Historique ────────────────────────────────────────────────
    const loadHistory = useCallback(async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        try {
            const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
            const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];
            setLoginHistory(stored.slice(0, 10));
        } finally { setLoadingHistory(false); }
    }, [profile?.id]);

    const recordSecurityEvent = async (action: string) => {
        if (!profile?.id) return;
        const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
        const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];
        const ev: LoginEvent = {
            id: Date.now().toString(), action,
            location: getCurrentDeviceName(), date: now(), success: true,
        };
        const updated = [ev, ...stored].slice(0, 20);
        await AsyncStorage.setItem(HISTORY_KEY(profile.id), JSON.stringify(updated));
        setLoginHistory(updated.slice(0, 10));
    };

    useEffect(() => {
        const recordLogin = async () => {
            if (!profile?.id) return;
            const sessionKey = `@tailorpro_session_recorded_${profile.id}`;
            if (await AsyncStorage.getItem(sessionKey) === 'true') return;
            const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
            const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];
            const ev: LoginEvent = {
                id: Date.now().toString(), action: 'Connexion',
                location: `${Device.deviceName ?? 'Appareil'} · ${getCurrentOs()}`,
                date: now(), success: true,
            };
            const updated = [ev, ...stored].slice(0, 20);
            await AsyncStorage.setItem(HISTORY_KEY(profile.id), JSON.stringify(updated));
            await AsyncStorage.setItem(sessionKey, 'true');
            setLoginHistory(updated.slice(0, 10));
        };
        recordLogin();
        loadDevices();
        loadHistory();
    }, [profile?.id, loadDevices, loadHistory]);

    // ── Stats ─────────────────────────────────────────────────────
    const totalClients = statistics.totalClients ?? clients.length;
    const totalOrders  = orders.length;
    const unpaidAmount = statistics.unpaidAmount ?? 0;

    // ── Avatar ────────────────────────────────────────────────────
    const handleAvatarPress = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission requise', 'Autorisez l\'accès à la galerie.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        setIsUploadingAvatar(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non connecté');
            const { publicUrl, error: upErr } = await uploadProfilePhoto(asset.uri, user.id);
            if (upErr || !publicUrl) throw upErr ?? new Error('Upload échoué');
            const { error } = await updateProfile({ avatar_url: publicUrl });
            if (error) throw error;
            showSuccess('Photo mise à jour', 'Votre avatar a été enregistré.');
        } catch (e: any) {
            showAlert('Erreur', e.message ?? 'Upload échoué');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // ── Sauvegarder ───────────────────────────────────────────────
    const handleSaveChanges = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const updates: Record<string, any> = {
                display_name: displayName.trim() || null,
                atelier_name: profile.role === 'tailor' ? (atelierName.trim() || null) : null,
                phone: phone.trim() || null,
                whatsapp: whatsapp.trim() || null,
                city: ville.trim() || null,
                adresse: adresse.trim() || null,
                description: description.trim() || null,
                statut_catalogue: statutCatalogue,
                horaires,
                reseaux_sociaux: { facebook: facebook.trim(), instagram: instagram.trim(), tiktok: tiktok.trim() },
            };
            const { error } = await updateProfile(updates);
            if (error) throw error;
            showSuccess('Enregistré', 'Votre profil a été mis à jour.');
            setIsEditing(false);
        } catch (e: any) {
            showAlert('Erreur', e.message ?? 'Impossible de sauvegarder.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Biométrie ─────────────────────────────────────────────────
    const handleToggleBiometrics = async (value: boolean) => {
        if (!profile?.id) return;
        if (value && !biometricAvailable) {
            showAlert('Indisponible', 'Aucun capteur biométrique configuré sur cet appareil.');
            return;
        }
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: value
                ? 'Confirmez pour activer la biométrie'
                : 'Confirmez pour désactiver la biométrie',
            fallbackLabel: 'Utiliser le mot de passe',
        });
        if (result.success) {
            if (value) {
                await AsyncStorage.setItem(BIOMETRIC_KEY(profile.id), 'true');
                setBiometricEnabled(true);
                await recordSecurityEvent('Biométrie activée');
                showAlert('Activé', 'Connexion biométrique activée.');
            } else {
                await AsyncStorage.removeItem(BIOMETRIC_KEY(profile.id));
                setBiometricEnabled(false);
                await recordSecurityEvent('Biométrie désactivée');
                showAlert('Désactivé', 'Connexion biométrique retirée.');
            }
        }
    };

    const handleToggleNotif = async (value: boolean) => {
        if (!profile?.id) return;
        if (!value) {
            setNotifEnabled(false);
            await setNotificationsEnabled(profile.id, false);
            return;
        }
        const granted = await requestNotificationPermission();
        if (!granted) {
            setNotifEnabled(false);
            await setNotificationsEnabled(profile.id, false);
            showAlert(
                'Notifications refusées',
                Platform.OS === 'web'
                    ? 'Les notifications système ne sont pas disponibles sur le web.'
                    : 'Autorisez les notifications TailorPro dans les réglages du téléphone pour recevoir les alertes atelier (livraisons, paiements) sur l’écran de verrouillage.',
            );
            return;
        }
        setNotifEnabled(true);
        await setNotificationsEnabled(profile.id, true);
        await syncDeviceNotifications(
            profile.id,
            buildInbox({ orders, clients, activities, statistics }),
        );
    };

    const handleRevokeDevice = (device: StoredDevice) => {
        showAlert('Déconnecter l\'appareil', `Retirer "${device.name}" ?`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Retirer', style: 'destructive',
                onPress: async () => {
                    if (!profile?.id) return;
                    const raw = await AsyncStorage.getItem(DEVICES_KEY(profile.id));
                    const stored: StoredDevice[] = raw ? JSON.parse(raw) : [];
                    const updated = stored.filter(d => d.id !== device.id);
                    await AsyncStorage.setItem(DEVICES_KEY(profile.id), JSON.stringify(updated));
                    setDevices(updated);
                    await recordSecurityEvent(`Appareil retiré : ${device.name}`);
                },
            },
        ]);
    };

    const handleRevokeAllOthers = () => {
        showAlert('Déconnecter tous les autres ?', 'Seul l\'appareil actuel restera.', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Confirmer', style: 'destructive',
                onPress: async () => {
                    if (!profile?.id) return;
                    const currentId = getCurrentDeviceId();
                    const current = devices.find(d => d.id === currentId);
                    const updated = current ? [current] : [];
                    await AsyncStorage.setItem(DEVICES_KEY(profile.id), JSON.stringify(updated));
                    setDevices(updated);
                    await recordSecurityEvent('Tous les autres appareils déconnectés');
                },
            },
        ]);
    };

    const handleChangePassword = async () => {
        if (!profile?.email) return;
        showAlert('Réinitialiser le mot de passe', `Un e-mail sera envoyé à ${profile.email}`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Envoyer',
                onPress: async () => {
                    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                    if (error) showAlert('Erreur', error.message);
                    else {
                        showAlert('E-mail envoyé', 'Vérifiez votre boîte de réception.');
                        await recordSecurityEvent('Réinitialisation mot de passe demandée');
                    }
                },
            },
        ]);
    };

    const handleLogout = async () => {
        if (profile?.id) await AsyncStorage.removeItem(`@tailorpro_session_recorded_${profile.id}`);
        await supabase.auth.signOut();
    };

    const handleDeleteAccount = () => {
        showAlert('Supprimer le compte', 'Cette action est irréversible. Toutes vos données seront perdues.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => showAlert('Demande enregistrée', 'Notre équipe traitera votre demande sous 48h.') },
        ]);
    };

    const getInitials = () => {
        const name = profile?.display_name ?? '';
        if (!name) return '?';
        return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const currentDeviceId = getCurrentDeviceId();
    const plan = profile?.plan_abonnement ?? 'gratuit';
    const planMeta = planMetaFor(P)[plan] ?? planMetaFor(P).gratuit;

    // ── RENDER ────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={P.pageBg} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Mon profil</Text>
                </View>
                <TouchableOpacity
                    style={[styles.editBtn, isEditing && styles.editBtnActive]}
                    onPress={() => {
                        if (isEditing) setIsEditing(false);
                        else { setIsEditing(true); setActiveTab('profil'); }
                    }}
                >
                    <Ionicons
                        name={isEditing ? 'close-outline' : 'create-outline'}
                        size={19}
                        color={isEditing ? '#fff' : P.primary}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── HERO ── */}
                <View style={styles.heroCard}>
                    <View style={styles.heroBlob1} />
                    <View style={styles.heroBlob2} />
                    <View style={styles.heroGoldLine} />

                    {/* Avatar */}
                    <TouchableOpacity
                        style={styles.avatarWrap}
                        onPress={handleAvatarPress}
                        activeOpacity={0.75}
                    >
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{getInitials()}</Text>
                            </View>
                        )}
                        {isUploadingAvatar ? (
                            <View style={styles.avatarEdit}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        ) : (
                            <View style={styles.avatarEdit}>
                                <Ionicons name="camera-outline" size={12} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.heroName}>{profile?.display_name ?? 'Couturier'}</Text>
                    {profile?.atelier_name ? <Text style={styles.heroAtelier}>{profile.atelier_name}</Text> : null}
                    <Text style={styles.heroEmail}>{profile?.email ?? ''}</Text>

                    {/* Plan badge */}
                    <View style={[styles.planBadge, { backgroundColor: planMeta.bg }]}>
                        <Text style={[styles.planBadgeText, { color: planMeta.color }]}>
                            ✦ Plan {planMeta.label}
                        </Text>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{totalClients}</Text>
                            <Text style={styles.statLbl}>Clients</Text>
                        </View>
                        <View style={styles.statSep} />
                        <View style={styles.statItem}>
                            <Text style={styles.statVal}>{totalOrders}</Text>
                            <Text style={styles.statLbl}>Commandes</Text>
                        </View>
                        <View style={styles.statSep} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statVal, unpaidAmount > 0 && { color: P.error }]}>
                                {formatCurrencyShort(unpaidAmount)}
                            </Text>
                            <Text style={styles.statLbl}>Impayés</Text>
                        </View>
                    </View>
                </View>

                {/* ── ONGLETS ── */}
                <View style={styles.tabs}>
                    {(['profil', 'atelier', 'securite'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'profil' ? 'Profil' : tab === 'atelier' ? 'Atelier' : 'Sécurité'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ══════════════════════════════
                    ONGLET PROFIL
                ══════════════════════════════ */}
                {activeTab === 'profil' && (
                    <View>
                        <SectionTitle title="Identité" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="person-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Nom complet" subtitle={displayName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={displayName}
                                               onChangeText={setDisplayName}
                                               placeholder="Votre nom complet" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            {profile?.role === 'tailor' && (
                                <>
                                    <SettingRow
                                        icon="storefront-outline" iconBg={P.goldBg} iconColor={P.gold}
                                        title="Nom de l'atelier" subtitle={atelierName || '—'}
                                        isEditing={isEditing}
                                        renderInput={() => (
                                            <TextInput style={styles.textInput} value={atelierName}
                                                       onChangeText={setAtelierName}
                                                       placeholder="Nom de votre atelier" placeholderTextColor={P.muted} />
                                        )}
                                    />
                                    <Divider />
                                </>
                            )}
                            <SettingRow
                                icon="mail-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Email" subtitle={profile?.email ?? '—'}
                                right={<View style={styles.fixedBadge}><Text style={styles.fixedBadgeText}>Fixe</Text></View>}
                            />
                            <Divider />
                            <SettingRow
                                icon="shield-checkmark-outline" iconBg={P.successBg} iconColor={P.success}
                                title="Rôle"
                                subtitle={profile?.role === 'tailor' ? 'Couturier / Tailleur' : 'Client'}
                                right={
                                    <View style={[styles.fixedBadge, { backgroundColor: P.successBg, borderColor: 'rgba(22,163,74,0.25)' }]}>
                                        <Text style={[styles.fixedBadgeText, { color: P.success }]}>Vérifié</Text>
                                    </View>
                                }
                            />
                        </Card>

                        <SectionTitle title="Contact" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="call-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Téléphone" subtitle={phone || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={phone}
                                               onChangeText={setPhone} keyboardType="phone-pad"
                                               placeholder="Ex: +237 6XX XXX XXX" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="logo-whatsapp" iconBg="rgba(37,211,102,0.10)" iconColor="#25D366"
                                title="WhatsApp" subtitle={whatsapp || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={whatsapp}
                                               onChangeText={setWhatsapp} keyboardType="phone-pad"
                                               placeholder="Numéro WhatsApp" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="location-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Ville" subtitle={ville || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={ville}
                                               onChangeText={setVille} autoCapitalize="words"
                                               placeholder="Douala, Yaoundé…" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="map-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Adresse" subtitle={adresse || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={adresse}
                                               onChangeText={setAdresse}
                                               placeholder="Quartier, rue…" placeholderTextColor={P.muted} />
                                )}
                            />
                        </Card>

                        <SectionTitle title="À propos de l'atelier" />
                        <Card style={{ marginBottom: 16 }}>
                            <View style={styles.descriptionRow}>
                                <View style={[styles.rowIcon, { backgroundColor: P.primaryBg, flexShrink: 0 }]}>
                                    <Ionicons name="document-text-outline" size={17} color={P.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowTitle}>Description</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.descriptionInput}
                                            value={description}
                                            onChangeText={setDescription}
                                            multiline
                                            numberOfLines={4}
                                            placeholder="Décrivez votre atelier, vos services, votre expérience…"
                                            placeholderTextColor={P.muted}
                                            textAlignVertical="top"
                                        />
                                    ) : (
                                        <Text style={[styles.rowSub, description ? {} : { color: P.muted }]}>
                                            {description || 'Aucune description renseignée'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Card>

                        <SectionTitle title="Catalogue" />
                        <Card style={{ marginBottom: 16 }}>
                            <View style={styles.row}>
                                <View style={[styles.rowIcon, { backgroundColor: P.goldBg }]}>
                                    <Ionicons name="eye-outline" size={17} color={P.gold} />
                                </View>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>Visibilité du catalogue</Text>
                                    <Text style={styles.rowSub}>
                                        {statutCatalogue === 'public' ? '🌍 Public — visible par tous' : '🔒 Privé — sur invitation'}
                                    </Text>
                                </View>
                                <Switch
                                    value={statutCatalogue === 'public'}
                                    onValueChange={v => setStatutCatalogue(v ? 'public' : 'prive')}
                                    disabled={!isEditing}
                                    trackColor={{ false: P.border, true: P.gold }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </Card>

                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                                onPress={handleSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <>
                                        <Ionicons name="checkmark-outline" size={18} color="#fff" />
                                        <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                                    </>
                                }
                            </TouchableOpacity>
                        )}

                        <SectionTitle title="Compte" />
                        <Card>
                            <SettingRow
                                icon="log-out-outline" iconBg={P.errorBg} iconColor={P.error}
                                title="Se déconnecter" danger
                                onPress={() => showAlert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
                                    { text: 'Annuler', style: 'cancel' },
                                    { text: 'Déconnexion', style: 'destructive', onPress: handleLogout },
                                ])}
                            />
                            <Divider />
                            <SettingRow
                                icon="trash-outline" iconBg={P.errorBg} iconColor={P.error}
                                title="Supprimer le compte" danger onPress={handleDeleteAccount}
                            />
                        </Card>
                    </View>
                )}

                {/* ══════════════════════════════
                    ONGLET ATELIER
                ══════════════════════════════ */}
                {activeTab === 'atelier' && (
                    <View>
                        {/* Horaires */}
                        <SectionTitle title="Horaires d'ouverture" />
                        <Card style={{ marginBottom: 16 }}>
                            {JOURS.map((jour, i) => (
                                <React.Fragment key={jour}>
                                    <View style={styles.horaireRow}>
                                        <Text style={styles.joursLabel}>{JOURS_LABELS[jour]}</Text>
                                        {isEditing ? (
                                            <TextInput
                                                style={styles.horaireInput}
                                                value={horaires[jour] ?? ''}
                                                onChangeText={v => setHoraires(prev => ({ ...prev, [jour]: v }))}
                                                placeholder="Ex: 8h-18h ou Fermé"
                                                placeholderTextColor={P.muted}
                                            />
                                        ) : (
                                            <Text style={[
                                                styles.horaireValue,
                                                (horaires[jour] === 'Fermé' || horaires[jour] === '') && { color: P.muted },
                                            ]}>
                                                {horaires[jour] || 'Fermé'}
                                            </Text>
                                        )}
                                    </View>
                                    {i < JOURS.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </Card>

                        {/* Réseaux sociaux */}
                        <SectionTitle title="Réseaux sociaux" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="logo-facebook" iconBg="rgba(24,119,242,0.10)" iconColor="#1877F2"
                                title="Facebook" subtitle={facebook || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={facebook}
                                               onChangeText={setFacebook} autoCapitalize="none"
                                               placeholder="Lien ou page Facebook" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="logo-instagram" iconBg="rgba(225,48,108,0.10)" iconColor="#E1306C"
                                title="Instagram" subtitle={instagram || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={instagram}
                                               onChangeText={setInstagram} autoCapitalize="none"
                                               placeholder="@votre_atelier" placeholderTextColor={P.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="logo-tiktok" iconBg="rgba(0,0,0,0.06)" iconColor="#000000"
                                title="TikTok" subtitle={tiktok || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={tiktok}
                                               onChangeText={setTiktok} autoCapitalize="none"
                                               placeholder="@votre_atelier" placeholderTextColor={P.muted} />
                                )}
                            />
                        </Card>

                        {/* Spécialités */}
                        <SectionTitle title="Spécialités" />
                        <Card style={{ marginBottom: 16, padding: 14 }}>
                            {specialites.length === 0 ? (
                                <Text style={[styles.rowSub, { color: P.muted, textAlign: 'center', paddingVertical: 8 }]}>
                                    Aucune spécialité renseignée
                                </Text>
                            ) : (
                                <View style={styles.chipsGrid}>
                                    {specialites.map(id => {
                                        const s = SPECIALITIES_OPTIONS.find(o => o.id === id);
                                        return s ? (
                                            <View key={id} style={styles.chip}>
                                                <Text style={styles.chipText}>{s.label}</Text>
                                            </View>
                                        ) : null;
                                    })}
                                </View>
                            )}
                            <TouchableOpacity
                                style={styles.editSpecBtn}
                                onPress={() => showAlert('Spécialités', 'Modifiez vos spécialités depuis les Paramètres de l\'atelier.')}
                            >
                                <Ionicons name="pencil-outline" size={13} color={P.primary} />
                                <Text style={styles.editSpecText}>Modifier les spécialités</Text>
                            </TouchableOpacity>
                        </Card>

                        {/* Plan abonnement */}
                        <SectionTitle title="Mon abonnement" />
                        <Card style={{ marginBottom: 16 }}>
                            <View style={[styles.planRow, { borderColor: planMeta.bg }]}>
                                <View style={[styles.rowIcon, { backgroundColor: planMeta.bg }]}>
                                    <Ionicons name="star-outline" size={17} color={planMeta.color} />
                                </View>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowTitle}>Plan actuel</Text>
                                    <Text style={[styles.rowSub, { color: planMeta.color }]}>
                                        ✦ {planMeta.label} — {planMeta.desc}
                                    </Text>
                                </View>
                                {plan !== 'business' && (
                                    <TouchableOpacity
                                        style={styles.upgradeBtn}
                                        onPress={() => showAlert('Upgrade', 'La mise à niveau vers Pro / Business sera disponible prochainement.')}
                                    >
                                        <Text style={styles.upgradeBtnText}>Upgrader</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Card>

                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                                onPress={handleSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <>
                                        <Ionicons name="checkmark-outline" size={18} color="#fff" />
                                        <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                                    </>
                                }
                            </TouchableOpacity>
                        )}

                        {/* Préférences app */}
                        <SectionTitle title="Application" />
                        <Card>
                            <SettingRow
                                icon="notifications-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Notifications de l'appareil"
                                subtitle={notifEnabled ? 'Bannière et écran de verrouillage' : 'Désactivées'}
                                right={<Switch value={notifEnabled} onValueChange={handleToggleNotif}
                                               trackColor={{ false: P.border, true: P.primary }} thumbColor="#fff" />}
                            />
                            <Divider />
                            <SettingRow
                                icon="settings-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title={t('profile.prefs')}
                                subtitle="Thème, langue, devise — un seul endroit"
                                onPress={() => navigation.navigate('Settings')}
                            />
                        </Card>
                    </View>
                )}

                {/* ══════════════════════════════
                    ONGLET SÉCURITÉ
                ══════════════════════════════ */}
                {activeTab === 'securite' && (
                    <View>
                        <SectionTitle title="Verrouillage & Accès" />
                        <Card>
                            <SettingRow
                                icon="finger-print-outline" iconBg={P.successBg} iconColor={P.success}
                                title="Biométrie"
                                subtitle={!biometricAvailable ? 'Non disponible sur cet appareil' : biometricEnabled ? 'Activée' : 'Désactivée'}
                                right={<Switch value={biometricEnabled} onValueChange={handleToggleBiometrics}
                                               disabled={!biometricAvailable}
                                               trackColor={{ false: P.border, true: P.success }} thumbColor="#fff" />}
                            />
                            <Divider />
                            <SettingRow
                                icon="shield-outline" iconBg={P.warningBg} iconColor={P.warning}
                                title="Double authentification (2FA)"
                                subtitle={twoFAEnabled ? 'Activée' : 'Désactivée · Bientôt disponible'}
                                right={<Switch value={twoFAEnabled}
                                               onValueChange={v => { setTwoFAEnabled(v); if (v) showAlert('2FA', 'Le 2FA sera disponible prochainement.'); }}
                                               trackColor={{ false: P.border, true: P.warning }} thumbColor="#fff" />}
                            />
                            <Divider />
                            <SettingRow
                                icon="lock-closed-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Changer le mot de passe"
                                subtitle="Envoi d'un e-mail de réinitialisation"
                                onPress={handleChangePassword}
                            />
                            <Divider />
                            <SettingRow
                                icon="key-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Gérer les passkeys"
                                subtitle="Clé d'accès sans mot de passe — Bientôt"
                                onPress={() => showAlert('Passkeys', 'Gestionnaire disponible prochainement.')}
                            />
                        </Card>

                        <View style={styles.sectionHeaderRow}>
                            <SectionTitle title="Appareils enregistrés" />
                            {devices.length > 1 && (
                                <TouchableOpacity onPress={handleRevokeAllOthers}>
                                    <Text style={styles.revokeAllText}>Tout retirer</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Card>
                            {loadingDevices ? (
                                <ActivityIndicator style={{ padding: 20 }} color={P.primary} />
                            ) : devices.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun appareil enregistré.</Text>
                            ) : (
                                devices.map((device, i) => {
                                    const isCurrent = device.id === currentDeviceId;
                                    return (
                                        <React.Fragment key={device.id}>
                                            <View style={styles.deviceRow}>
                                                <View style={[styles.deviceIconWrap, isCurrent && styles.deviceIconWrapActive]}>
                                                    <Ionicons
                                                        name={device.os.toLowerCase().includes('ios') ? 'logo-apple' : 'logo-android'}
                                                        size={18} color={isCurrent ? P.gold : P.sub}
                                                    />
                                                </View>
                                                <View style={styles.deviceInfo}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text>
                                                        {isCurrent && (
                                                            <View style={styles.deviceCurrentBadge}>
                                                                <Text style={styles.deviceCurrentText}>Cet appareil</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.deviceSub}>{device.os}</Text>
                                                    <Text style={styles.deviceSub}>
                                                        {isCurrent ? 'Actif maintenant' : `Vu le ${formatEventDate(device.lastSeen)}`}
                                                    </Text>
                                                </View>
                                                {!isCurrent ? (
                                                    <TouchableOpacity style={styles.deviceRevokeBtn} onPress={() => handleRevokeDevice(device)}>
                                                        <Feather name="trash-2" size={15} color={P.error} />
                                                    </TouchableOpacity>
                                                ) : (
                                                    <View style={styles.deviceActiveIndicator} />
                                                )}
                                            </View>
                                            {i < devices.length - 1 && <Divider />}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </Card>

                        <SectionTitle title="Historique de connexion" />
                        <Card>
                            {loadingHistory ? (
                                <ActivityIndicator style={{ padding: 20 }} color={P.primary} />
                            ) : loginHistory.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun événement enregistré.</Text>
                            ) : (
                                loginHistory.map((h, i) => (
                                    <React.Fragment key={h.id}>
                                        <View style={styles.historyRow}>
                                            <View style={[styles.historyDot, { backgroundColor: h.success ? P.success : P.error }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.historyAction}>{h.action}</Text>
                                                <Text style={styles.historySub} numberOfLines={1}>{h.location}</Text>
                                                <Text style={styles.historyDate}>{formatEventDate(h.date)}</Text>
                                            </View>
                                            <Ionicons
                                                name={h.success ? 'checkmark-circle' : 'close-circle'}
                                                size={18} color={h.success ? P.success : P.error}
                                            />
                                        </View>
                                        {i < loginHistory.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </Card>
                        {loginHistory.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearHistoryBtn}
                                onPress={() => showAlert('Effacer l\'historique ?', 'Cet historique ne sera plus consultable.', [
                                    { text: 'Annuler', style: 'cancel' },
                                    {
                                        text: 'Effacer',
                                        onPress: async () => {
                                            if (!profile?.id) return;
                                            await AsyncStorage.removeItem(HISTORY_KEY(profile.id));
                                            setLoginHistory([]);
                                        },
                                    },
                                ])}
                            >
                                <Feather name="trash-2" size={13} color={P.error} />
                                <Text style={styles.clearHistoryText}>Effacer l'historique</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <Text style={styles.version}>TailorPro v1.0.0 · Module 0</Text>
            </ScrollView>
        </View>
    );
};

// ── STYLES ────────────────────────────────────────────────────────
const makeStyles = (P: Palette) => ({
    container: { flex: 1, backgroundColor: P.pageBg },

    header: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: P.pageBg,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    editBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
    },
    editBtnActive: { backgroundColor: P.bg, borderColor: P.goldRim },

    scroll: { paddingHorizontal: 20, paddingTop: 16 },

    sectionTitle: {
        fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
        letterSpacing: 1.4, textTransform: 'uppercase',
        marginTop: 22, marginBottom: 10, paddingHorizontal: 2,
    },
    card: {
        backgroundColor: P.surface, borderRadius: 18,
        borderWidth: 0.5, borderColor: P.borderHard, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    rowMulti: { alignItems: 'flex-start', paddingVertical: 16 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    rowSub: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text, marginTop: 2 },
    inputWrapper: { marginTop: 4, borderBottomWidth: 1.5, borderBottomColor: P.gold, paddingBottom: 2 },
    divider: { height: 0.5, backgroundColor: P.border, marginLeft: 66 },

    heroCard:    { borderRadius: 22, padding: 22, alignItems: 'center', backgroundColor: P.bg, borderWidth: 1, borderColor: P.goldRim, marginBottom: 16, overflow: 'hidden', position: 'relative' },
    heroBlob1:   { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(108,62,184,0.35)' },
    heroBlob2:   { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(212,175,55,0.05)' },
    heroGoldLine:{ position: 'absolute', top: 0, left: 24, right: 24, height: 0.5, backgroundColor: P.goldRim },

    avatarWrap:  { position: 'relative', marginBottom: 12, zIndex: 1 },
    avatarCircle:{ width: 80, height: 80, borderRadius: 40, backgroundColor: P.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: P.goldRim },
    avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: P.goldRim },
    avatarText:  { fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff' },
    avatarEdit:  { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: P.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: P.bg },

    heroName:    { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#fff', zIndex: 1 },
    heroAtelier: { fontSize: 13, color: P.gold, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 2, zIndex: 1 },
    heroEmail:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, zIndex: 1 },

    planBadge:   { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14, zIndex: 1 },
    planBadgeText:{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.3 },

    statsRow:  { flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', zIndex: 1 },
    statSep:   { width: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
    statItem:  { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statVal:   { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
    statLbl:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3, marginTop: 2 },

    tabs:         { flexDirection: 'row', backgroundColor: P.surface, borderRadius: 14, padding: 4, marginBottom: 4, borderWidth: 0.5, borderColor: P.borderHard },
    tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: P.surface },
    tabActive:    { backgroundColor: P.bg, borderWidth: 1, borderColor: P.goldRim },
    tabText:      { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
    tabTextActive:{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

    textInput:    { fontSize: 14, color: P.text, paddingVertical: 2, fontFamily: 'PlusJakartaSans_600SemiBold' },
    fixedBadge:   { backgroundColor: P.goldBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: P.goldRim },
    fixedBadgeText:{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    saveBtn:      { backgroundColor: P.bg, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4, borderWidth: 1, borderColor: P.goldRim },
    saveBtnText:  { color: '#fff', fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },

    descriptionRow:   { flexDirection: 'row', gap: 14, padding: 16 },
    descriptionInput: { fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 4, borderWidth: 1, borderColor: P.gold, borderRadius: 10, padding: 10, minHeight: 90, lineHeight: 20 },

    horaireRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    joursLabel:   { width: 38, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub },
    horaireInput: { flex: 1, fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_600SemiBold', borderBottomWidth: 1.5, borderBottomColor: P.gold, paddingBottom: 2 },
    horaireValue: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },

    chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip:      { backgroundColor: P.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: P.borderHard },
    chipText:  { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
    editSpecBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: P.border },
    editSpecText: { fontSize: 12, color: P.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },

    planRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    upgradeBtn: { backgroundColor: P.bg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: P.goldRim },
    upgradeBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },

    sectionHeaderRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    revokeAllText:     { fontSize: 11, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 10 },
    clearHistoryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10, paddingVertical: 8 },
    clearHistoryText:  { fontSize: 12, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold' },
    emptyText: { textAlign: 'center', color: P.sub, paddingVertical: 20, fontSize: 12 },
    version:   { textAlign: 'center', fontSize: 11, color: P.muted, marginTop: 32, marginBottom: 8, letterSpacing: 0.5 },

    deviceRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    deviceIconWrap:{ width: 38, height: 38, borderRadius: 11, backgroundColor: P.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: P.borderHard },
    deviceIconWrapActive: { backgroundColor: P.goldBg, borderColor: P.goldRim },
    deviceInfo:    { flex: 1, minWidth: 0 },
    deviceName:    { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    deviceSub:     { fontSize: 11, color: P.sub, marginTop: 1 },
    deviceCurrentBadge: { backgroundColor: P.goldBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 0.5, borderColor: P.goldRim },
    deviceCurrentText:  { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    deviceRevokeBtn:    { padding: 6 },
    deviceActiveIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: P.success },

    historyRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    historyDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
    historyAction: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    historySub:    { fontSize: 11, color: P.sub, marginTop: 1 },
    historyDate:   { fontSize: 10, color: P.muted, marginTop: 1 },
});
