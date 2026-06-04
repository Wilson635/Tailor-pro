// ==========================================
// PROFIL UTILISATEUR — TailorPro
// Palette app (violet/gold/dark) · Sans ombres · 100% dynamique
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Switch, StatusBar, Alert, TextInput,
    ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useProfile } from '@hooks/useProfile';
import { useAppStore } from '@store/useAppStore';
import { supabase } from '@/src/lib/supabase';
import { formatCurrency } from '@utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// ──────────────────────────────────────────
// PALETTE — charte TailorPro
// ──────────────────────────────────────────

const P = {
    bg:         '#16123A',
    primary:    '#6C3EB8',
    primaryBg:  'rgba(108,62,184,0.08)',
    primaryMid: 'rgba(108,62,184,0.15)',
    pageBg:     '#F5F4FB',
    surface:    '#FFFFFF',
    text:       '#1A1033',
    sub:        '#7C6FA8',
    muted:      'rgba(124,111,168,0.55)',
    border:     'rgba(108,62,184,0.10)',
    borderHard: 'rgba(108,62,184,0.18)',
    gold:       '#D4AF37',
    goldBg:     'rgba(212,175,55,0.10)',
    goldRim:    'rgba(212,175,55,0.28)',
    success:    '#16A34A',
    successBg:  'rgba(22,163,74,0.10)',
    error:      '#EF4444',
    errorBg:    'rgba(239,68,68,0.10)',
    warning:    '#D97706',
    warningBg:  'rgba(217,119,6,0.10)',
};

// ──────────────────────────────────────────
// TYPES LOCAUX
// ──────────────────────────────────────────

interface StoredDevice {
    id: string;
    name: string;
    os: string;
    osVersion: string;
    location: string;
    lastSeen: string;
    registeredAt: string;
}

interface LoginEvent {
    id: string;
    action: string;
    location: string;
    date: string;
    success: boolean;
}

// ──────────────────────────────────────────
// HELPERS AsyncStorage
// ──────────────────────────────────────────

const DEVICES_KEY  = (uid: string) => `@tailorpro_devices_${uid}`;
const HISTORY_KEY  = (uid: string) => `@tailorpro_login_history_${uid}`;
const NOTIF_KEY    = (uid: string) => `@tailorpro_notif_${uid}`;
const BIOMETRIC_KEY= (uid: string) => `@biometrics_enabled_${uid}`;

const getCurrentDeviceId = () =>
    `${Device.modelName ?? 'unknown'}_${Device.osName ?? ''}_${Platform.OS}`.replace(/\s/g, '_');

const getCurrentDeviceName = () =>
    Device.deviceName ?? Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android');

const getCurrentOs = () => {
    const os = Device.osName ?? (Platform.OS === 'ios' ? 'iOS' : 'Android');
    const ver = Device.osVersion ?? '';
    return `${os}${ver ? ` ${ver}` : ''}`;
};

const now = () => new Date().toISOString();

const formatEventDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (d.toDateString() === today.toDateString()) return `Aujourd'hui ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Hier ${time}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`;
};

// ──────────────────────────────────────────
// SUB-COMPOSANTS
// ──────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
    <Text style={ss.sectionTitle}>{title}</Text>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={[ss.card, style]}>{children}</View>
);

const Divider = () => <View style={ss.divider} />;

const SettingRow = ({
                        icon, iconBg, iconColor = P.gold,
                        title, subtitle, right, onPress, danger, isEditing, renderInput,
                    }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string; iconColor?: string;
    title: string; subtitle?: string;
    right?: React.ReactNode; onPress?: () => void;
    danger?: boolean; isEditing?: boolean;
    renderInput?: () => React.ReactNode;
}) => (
    <TouchableOpacity
        style={ss.row}
        onPress={isEditing ? undefined : onPress}
        activeOpacity={onPress && !isEditing ? 0.65 : 1}
    >
        <View style={[ss.rowIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={ss.rowContent}>
            <Text style={[ss.rowTitle, danger && { color: P.error }]}>{title}</Text>
            {isEditing && renderInput ? (
                <View style={ss.inputWrapper}>{renderInput()}</View>
            ) : (
                subtitle ? <Text style={ss.rowSub}>{subtitle}</Text> : null
            )}
        </View>
        {!isEditing && (right ?? (onPress && (
            <Ionicons name="chevron-forward" size={15} color={P.muted} />
        )))}
    </TouchableOpacity>
);

const ss = StyleSheet.create({
    sectionTitle: {
        fontSize: 10, fontWeight: '700', color: P.sub,
        letterSpacing: 1.4, textTransform: 'uppercase',
        marginTop: 22, marginBottom: 10, paddingHorizontal: 2,
    },
    card: {
        backgroundColor: P.surface,
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: P.borderHard,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 14,
    },
    rowIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowContent: { flex: 1 },
    rowTitle:   { fontSize: 13, fontWeight: '500', color: P.sub },
    rowSub:     { fontSize: 14, fontWeight: '600', color: P.text, marginTop: 2 },
    inputWrapper: { marginTop: 4, borderBottomWidth: 1.5, borderBottomColor: P.gold, paddingBottom: 2 },
    divider:    { height: 0.5, backgroundColor: P.border, marginLeft: 66 },
});

// ──────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ──────────────────────────────────────────

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const insets    = useSafeAreaInsets();
    const { profile } = useProfile();
    const { statistics, orders, clients } = useAppStore();

    const [activeTab, setActiveTab]   = useState<'infos' | 'securite' | 'preferences'>('infos');
    const [isEditing, setIsEditing]   = useState(false);
    const [isSaving, setIsSaving]     = useState(false);

    // Champs édition
    const [displayName, setDisplayName] = useState('');
    const [atelierName, setAtelierName] = useState('');
    const [phone, setPhone]             = useState('');

    // Sécurité
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [twoFAEnabled, setTwoFAEnabled]           = useState(false);

    // Préférences
    const [notifEnabled, setNotifEnabled] = useState(true);

    // Appareils
    const [devices, setDevices]     = useState<StoredDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(true);

    // Historique
    const [loginHistory, setLoginHistory]   = useState<LoginEvent[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // ── Init profil ──
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setAtelierName(profile.atelier_name || '');
            setPhone(profile.phone || '');
        }
    }, [profile]);

    // ── Init biométrie & préférences ──
    useEffect(() => {
        const initSecurity = async () => {
            const hw = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(hw && enrolled);

            if (profile?.id) {
                const stored = await AsyncStorage.getItem(BIOMETRIC_KEY(profile.id));
                setBiometricEnabled(stored === 'true');

                const notifStored = await AsyncStorage.getItem(NOTIF_KEY(profile.id));
                if (notifStored !== null) setNotifEnabled(notifStored === 'true');
            }
        };
        initSecurity();
    }, [profile?.id]);

    // ── Appareils connectés ──
    const loadDevices = useCallback(async () => {
        if (!profile?.id) return;
        setLoadingDevices(true);
        try {
            const raw = await AsyncStorage.getItem(DEVICES_KEY(profile.id));
            const stored: StoredDevice[] = raw ? JSON.parse(raw) : [];

            // Enregistre / met à jour l'appareil courant
            const currentId = getCurrentDeviceId();
            const existing  = stored.find(d => d.id === currentId);

            const currentDevice: StoredDevice = {
                id:           currentId,
                name:         getCurrentDeviceName(),
                os:           getCurrentOs(),
                osVersion:    Device.osVersion ?? '',
                location:     'Appareil actuel',
                lastSeen:     now(),
                registeredAt: existing?.registeredAt ?? now(),
            };

            const updated = [
                currentDevice,
                ...stored.filter(d => d.id !== currentId),
            ];
            await AsyncStorage.setItem(DEVICES_KEY(profile.id), JSON.stringify(updated));
            setDevices(updated);
        } finally {
            setLoadingDevices(false);
        }
    }, [profile?.id]);

    // ── Historique de connexion ──
    const loadHistory = useCallback(async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        try {
            const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
            const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];
            setLoginHistory(stored.slice(0, 10));
        } finally {
            setLoadingHistory(false);
        }
    }, [profile?.id]);

    // ── Enregistre la connexion courante (1 fois par session) ──
    useEffect(() => {
        const recordLogin = async () => {
            if (!profile?.id) return;
            const sessionKey = `@tailorpro_session_recorded_${profile.id}`;
            const already = await AsyncStorage.getItem(sessionKey);
            if (already === 'true') return;

            const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
            const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];

            const newEvent: LoginEvent = {
                id:       Date.now().toString(),
                action:   'Connexion',
                location: `${Device.deviceName ?? 'Appareil'} · ${getCurrentOs()}`,
                date:     now(),
                success:  true,
            };

            const updated = [newEvent, ...stored].slice(0, 20);
            await AsyncStorage.setItem(HISTORY_KEY(profile.id), JSON.stringify(updated));
            await AsyncStorage.setItem(sessionKey, 'true');
            setLoginHistory(updated.slice(0, 10));
        };
        recordLogin();
    }, [profile?.id]);

    useEffect(() => {
        loadDevices();
        loadHistory();
    }, [loadDevices, loadHistory]);

    // ── Vraies stats (depuis le store) ──
    const totalClients  = statistics.totalClients ?? clients.length;
    const totalOrders   = orders.length;
    const totalRevenue  = statistics.monthlyRevenue ?? 0;
    const unpaidAmount  = statistics.unpaidAmount ?? 0;

    // ── Actions ──

    const handleToggleBiometrics = async (value: boolean) => {
        if (!profile?.id) return;
        if (value) {
            if (!biometricAvailable) {
                Alert.alert('Indisponible', 'Votre appareil ne possède pas de capteur biométrique configuré.');
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmez votre identité pour activer la connexion biométrique',
                fallbackLabel: 'Utiliser le mot de passe',
            });
            if (result.success) {
                await AsyncStorage.setItem(BIOMETRIC_KEY(profile.id), 'true');
                setBiometricEnabled(true);
                await recordSecurityEvent('Biométrie activée');
                Alert.alert('Activé', 'La connexion biométrique est maintenant activée.');
            }
        } else {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmez pour désactiver la biométrie',
            });
            if (result.success) {
                await AsyncStorage.removeItem(BIOMETRIC_KEY(profile.id));
                setBiometricEnabled(false);
                await recordSecurityEvent('Biométrie désactivée');
                Alert.alert('Désactivé', 'La connexion biométrique a été retirée.');
            }
        }
    };

    const handleToggleNotif = async (value: boolean) => {
        setNotifEnabled(value);
        if (profile?.id) {
            await AsyncStorage.setItem(NOTIF_KEY(profile.id), value ? 'true' : 'false');
        }
    };

    const recordSecurityEvent = async (action: string) => {
        if (!profile?.id) return;
        const raw = await AsyncStorage.getItem(HISTORY_KEY(profile.id));
        const stored: LoginEvent[] = raw ? JSON.parse(raw) : [];
        const newEvent: LoginEvent = {
            id: Date.now().toString(), action,
            location: getCurrentDeviceName(),
            date: now(), success: true,
        };
        const updated = [newEvent, ...stored].slice(0, 20);
        await AsyncStorage.setItem(HISTORY_KEY(profile.id), JSON.stringify(updated));
        setLoginHistory(updated.slice(0, 10));
    };

    const handleRevokeDevice = (device: StoredDevice) => {
        Alert.alert(
            'Déconnecter l\'appareil',
            `Retirer "${device.name}" de la liste ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Retirer',
                    style: 'destructive',
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
            ]
        );
    };

    const handleRevokeAllOthers = () => {
        Alert.alert(
            'Déconnecter tous les autres appareils ?',
            'Seul l\'appareil actuel restera enregistré.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
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
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!profile?.email) return;
        Alert.alert(
            'Réinitialiser le mot de passe',
            `Un e-mail sera envoyé à : ${profile.email}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Envoyer',
                    onPress: async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                        if (error) Alert.alert('Erreur', error.message);
                        else {
                            Alert.alert('E-mail envoyé', 'Vérifiez votre boîte de réception.');
                            await recordSecurityEvent('Réinitialisation mot de passe demandée');
                        }
                    },
                },
            ]
        );
    };

    const handleSaveChanges = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    display_name: displayName.trim(),
                    atelier_name: profile.role === 'tailor' ? atelierName.trim() : null,
                    phone: phone.trim(),
                })
                .eq('id', profile.id);
            if (error) throw error;
            Alert.alert('Enregistré', 'Votre profil a été mis à jour.');
            setIsEditing(false);
        } catch (e: any) {
            Alert.alert('Erreur', e.message ?? 'Impossible de sauvegarder.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        if (profile?.id) {
            // Efface le flag de session pour enregistrer la prochaine connexion
            await AsyncStorage.removeItem(`@tailorpro_session_recorded_${profile.id}`);
        }
        await supabase.auth.signOut();
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible. Toutes vos données seront perdues.',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => Alert.alert('Demande enregistrée', 'Notre équipe traitera votre demande sous 48h.') },
            ]
        );
    };

    const getInitials = () => {
        const name = profile?.display_name ?? '';
        if (!name) return '?';
        return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const currentDeviceId = getCurrentDeviceId();

    // ──────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon profil</Text>
                <TouchableOpacity
                    style={[styles.editBtn, isEditing && styles.editBtnActive]}
                    onPress={() => {
                        if (isEditing) setIsEditing(false);
                        else { setIsEditing(true); setActiveTab('infos'); }
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
                {/* ══ HERO ══ */}
                <View style={styles.heroCard}>
                    {/* Décors */}
                    <View style={styles.heroBlob1} />
                    <View style={styles.heroBlob2} />
                    <View style={styles.heroGoldLine} />

                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.avatarEdit}
                            onPress={() => Alert.alert('Photo de profil', 'Bientôt disponible !')}
                        >
                            <Ionicons name="camera-outline" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.heroName}>{profile?.display_name ?? 'Utilisateur'}</Text>
                    {profile?.atelier_name ? (
                        <Text style={styles.heroAtelier}>{profile.atelier_name}</Text>
                    ) : null}
                    <Text style={styles.heroEmail}>{profile?.email ?? ''}</Text>

                    {/* Stats réelles */}
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
                                {unpaidAmount >= 1000 ? `${Math.round(unpaidAmount / 1000)}k` : formatCurrency(unpaidAmount)}
                            </Text>
                            <Text style={styles.statLbl}>Impayés</Text>
                        </View>
                    </View>
                </View>

                {/* ══ ONGLETS ══ */}
                <View style={styles.tabs}>
                    {(['infos', 'securite', 'preferences'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => !isEditing && setActiveTab(tab)}
                            disabled={isEditing && tab !== 'infos'}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'infos' ? 'Infos' : tab === 'securite' ? 'Sécurité' : 'Préférences'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ══════════════════════════════
                    ONGLET INFOS
                ══════════════════════════════ */}
                {activeTab === 'infos' && (
                    <View>
                        <SectionTitle title="Informations personnelles" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="person-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Nom complet" subtitle={displayName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput
                                        style={styles.textInput}
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        placeholder="Votre nom complet"
                                        placeholderTextColor={P.muted}
                                    />
                                )}
                            />
                            <Divider />
                            {profile?.role === 'tailor' && (
                                <>
                                    <SettingRow
                                        icon="storefront-outline" iconBg={P.goldBg} iconColor={P.gold}
                                        title="Atelier" subtitle={atelierName || '—'}
                                        isEditing={isEditing}
                                        renderInput={() => (
                                            <TextInput
                                                style={styles.textInput}
                                                value={atelierName}
                                                onChangeText={setAtelierName}
                                                placeholder="Nom de l'atelier"
                                                placeholderTextColor={P.muted}
                                            />
                                        )}
                                    />
                                    <Divider />
                                </>
                            )}
                            <SettingRow
                                icon="mail-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Email" subtitle={profile?.email ?? '—'}
                                right={
                                    <View style={styles.fixedBadge}>
                                        <Text style={styles.fixedBadgeText}>Fixe</Text>
                                    </View>
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="call-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Téléphone" subtitle={phone || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput
                                        style={styles.textInput}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        placeholder="Ex: +237..."
                                        placeholderTextColor={P.muted}
                                    />
                                )}
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

                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                                onPress={handleSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-outline" size={18} color="#fff" />
                                        <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <SectionTitle title="Compte" />
                        <Card>
                            <SettingRow
                                icon="log-out-outline" iconBg={P.errorBg} iconColor={P.error}
                                title="Se déconnecter" danger
                                onPress={() =>
                                    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
                                        { text: 'Annuler', style: 'cancel' },
                                        { text: 'Déconnexion', style: 'destructive', onPress: handleLogout },
                                    ])
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="trash-outline" iconBg={P.errorBg} iconColor={P.error}
                                title="Supprimer le compte" danger
                                onPress={handleDeleteAccount}
                            />
                        </Card>
                    </View>
                )}

                {/* ══════════════════════════════
                    ONGLET SÉCURITÉ
                ══════════════════════════════ */}
                {activeTab === 'securite' && (
                    <View>
                        {/* Verrouillage & Accès */}
                        <SectionTitle title="Verrouillage & Accès" />
                        <Card>
                            <SettingRow
                                icon="finger-print-outline" iconBg={P.successBg} iconColor={P.success}
                                title="Biométrie"
                                subtitle={
                                    !biometricAvailable
                                        ? 'Non disponible sur cet appareil'
                                        : biometricEnabled ? 'Activée' : 'Désactivée'
                                }
                                right={
                                    <Switch
                                        value={biometricEnabled}
                                        onValueChange={handleToggleBiometrics}
                                        disabled={!biometricAvailable}
                                        trackColor={{ false: P.border, true: P.success }}
                                        thumbColor="#fff"
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="shield-outline" iconBg={P.warningBg} iconColor={P.warning}
                                title="Double authentification (2FA)"
                                subtitle={twoFAEnabled ? 'Activée' : 'Désactivée · Bientôt disponible'}
                                right={
                                    <Switch
                                        value={twoFAEnabled}
                                        onValueChange={val => {
                                            setTwoFAEnabled(val);
                                            if (val) Alert.alert('2FA', 'Le 2FA par SMS/TOTP sera disponible prochainement.');
                                        }}
                                        trackColor={{ false: P.border, true: P.warning }}
                                        thumbColor="#fff"
                                    />
                                }
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
                                onPress={() => Alert.alert('Passkeys', 'Gestionnaire disponible prochainement.')}
                            />
                        </Card>

                        {/* Appareils connectés */}
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
                                            <View style={dStyles.row}>
                                                <View style={[dStyles.iconWrap, isCurrent && dStyles.iconWrapActive]}>
                                                    <Ionicons
                                                        name={device.os.toLowerCase().includes('ios') ? 'logo-apple' : 'logo-android'}
                                                        size={18}
                                                        color={isCurrent ? P.gold : P.sub}
                                                    />
                                                </View>
                                                <View style={dStyles.info}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <Text style={dStyles.name} numberOfLines={1}>{device.name}</Text>
                                                        {isCurrent && (
                                                            <View style={dStyles.currentBadge}>
                                                                <Text style={dStyles.currentText}>Cet appareil</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={dStyles.sub}>{device.os}</Text>
                                                    <Text style={dStyles.sub}>
                                                        {isCurrent ? 'Actif maintenant' : `Vu le ${formatEventDate(device.lastSeen)}`}
                                                    </Text>
                                                </View>
                                                {!isCurrent && (
                                                    <TouchableOpacity
                                                        style={dStyles.revokeBtn}
                                                        onPress={() => handleRevokeDevice(device)}
                                                    >
                                                        <Feather name="trash-2" size={15} color={P.error} />
                                                    </TouchableOpacity>
                                                )}
                                                {isCurrent && (
                                                    <View style={dStyles.activeIndicator} />
                                                )}
                                            </View>
                                            {i < devices.length - 1 && <Divider />}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </Card>

                        {/* Historique de connexion */}
                        <SectionTitle title="Historique de connexion" />
                        <Card>
                            {loadingHistory ? (
                                <ActivityIndicator style={{ padding: 20 }} color={P.primary} />
                            ) : loginHistory.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun événement enregistré.</Text>
                            ) : (
                                loginHistory.map((h, i) => (
                                    <React.Fragment key={h.id}>
                                        <View style={hStyles.row}>
                                            <View style={[hStyles.dot, { backgroundColor: h.success ? P.success : P.error }]} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={hStyles.action}>{h.action}</Text>
                                                <Text style={hStyles.sub} numberOfLines={1}>{h.location}</Text>
                                                <Text style={hStyles.date}>{formatEventDate(h.date)}</Text>
                                            </View>
                                            <Ionicons
                                                name={h.success ? 'checkmark-circle' : 'close-circle'}
                                                size={18}
                                                color={h.success ? P.success : P.error}
                                            />
                                        </View>
                                        {i < loginHistory.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </Card>

                        {/* Bouton effacer l'historique */}
                        {loginHistory.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearHistoryBtn}
                                onPress={() =>
                                    Alert.alert('Effacer l\'historique ?', 'Cet historique ne sera plus consultable.', [
                                        { text: 'Annuler', style: 'cancel' },
                                        {
                                            text: 'Effacer',
                                            onPress: async () => {
                                                if (!profile?.id) return;
                                                await AsyncStorage.removeItem(HISTORY_KEY(profile.id));
                                                setLoginHistory([]);
                                            },
                                        },
                                    ])
                                }
                            >
                                <Feather name="trash-2" size={13} color={P.error} />
                                <Text style={styles.clearHistoryText}>Effacer l'historique</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ══════════════════════════════
                    ONGLET PRÉFÉRENCES
                ══════════════════════════════ */}
                {activeTab === 'preferences' && (
                    <View>
                        <SectionTitle title="Application" />
                        <Card>
                            <SettingRow
                                icon="notifications-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Notifications push"
                                subtitle={notifEnabled ? 'Activées' : 'Désactivées'}
                                right={
                                    <Switch
                                        value={notifEnabled}
                                        onValueChange={handleToggleNotif}
                                        trackColor={{ false: P.border, true: P.primary }}
                                        thumbColor="#fff"
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="language-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Langue" subtitle="Français"
                                onPress={() => Alert.alert('Langue', 'Multi-langue arrive prochainement.')}
                            />
                            <Divider />
                            <SettingRow
                                icon="color-palette-outline" iconBg={P.goldBg} iconColor={P.gold}
                                title="Thème" subtitle="Clair · Thème sombre bientôt"
                                onPress={() => Alert.alert('Thème', 'Le thème sombre sera disponible prochainement.')}
                            />
                            <Divider />
                            <SettingRow
                                icon="currency-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="Devise" subtitle="FCFA (XAF)"
                                onPress={() => Alert.alert('Devise', 'Autres devises bientôt disponibles.')}
                            />
                        </Card>

                        <SectionTitle title="Données" />
                        <Card>
                            <SettingRow
                                icon="download-outline" iconBg={P.successBg} iconColor={P.success}
                                title="Exporter mes données"
                                subtitle="CSV de vos clients et commandes"
                                onPress={() => Alert.alert('Export', 'L\'export CSV sera disponible prochainement.')}
                            />
                            <Divider />
                            <SettingRow
                                icon="information-circle-outline" iconBg={P.primaryBg} iconColor={P.primary}
                                title="À propos"
                                subtitle="TailorPro v1.0.0"
                                onPress={() => Alert.alert('TailorPro', 'Version 1.0.0\nFait avec ❤️ pour les tailleurs africains.')}
                            />
                        </Card>
                    </View>
                )}

                <Text style={styles.version}>TailorPro v1.0.0</Text>
            </ScrollView>
        </View>
    );
};

// ──────────────────────────────────────────
// STYLES SUB-COMPOSANTS
// ──────────────────────────────────────────

const dStyles = StyleSheet.create({
    row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    iconWrap:{
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: P.primaryBg,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    iconWrapActive: { backgroundColor: P.goldBg, borderColor: P.goldRim },
    info:    { flex: 1, minWidth: 0 },
    name:    { fontSize: 13, fontWeight: '700', color: P.text },
    sub:     { fontSize: 11, color: P.sub, marginTop: 1 },
    currentBadge: {
        backgroundColor: P.goldBg, borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 2,
        borderWidth: 0.5, borderColor: P.goldRim,
    },
    currentText:  { fontSize: 10, fontWeight: '700', color: P.gold },
    revokeBtn:    { padding: 6 },
    activeIndicator: { width: 7, height: 7, borderRadius: 4, backgroundColor: P.success },
});

const hStyles = StyleSheet.create({
    row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    dot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
    action: { fontSize: 13, fontWeight: '600', color: P.text },
    sub:    { fontSize: 11, color: P.sub, marginTop: 1 },
    date:   { fontSize: 10, color: P.muted, marginTop: 1 },
});

// ──────────────────────────────────────────
// STYLES PRINCIPAL
// ──────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: P.pageBg },

    // ── Header ──
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: P.pageBg,
        borderBottomWidth: 0.5, borderBottomColor: P.border,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: P.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    headerTitle:  { fontSize: 16, fontWeight: '700', color: P.text },
    editBtn:      { width: 38, height: 38, borderRadius: 11, backgroundColor: P.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: P.border },
    editBtnActive:{ backgroundColor: P.primary, borderColor: P.primary },

    scroll: { paddingHorizontal: 20, paddingTop: 16 },

    // ── Hero ──
    heroCard: {
        borderRadius: 22, padding: 22,
        alignItems: 'center',
        backgroundColor: P.bg,
        borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)',
        marginBottom: 16, overflow: 'hidden', position: 'relative',
    },
    heroBlob1:    { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(108,62,184,0.35)' },
    heroBlob2:    { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(212,175,55,0.05)' },
    heroGoldLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 0.5, backgroundColor: 'rgba(212,175,55,0.3)' },

    avatarWrap:   { position: 'relative', marginBottom: 12, zIndex: 1 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: P.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: P.goldRim,
    },
    avatarText:   { fontSize: 28, fontWeight: '800', color: '#fff' },
    avatarEdit: {
        position: 'absolute', bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: P.gold,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: P.bg,
    },

    heroName:    { fontSize: 20, fontWeight: '800', color: '#fff', zIndex: 1 },
    heroAtelier: { fontSize: 13, color: P.gold, fontWeight: '600', marginBottom: 2, zIndex: 1 },
    heroEmail:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, zIndex: 1 },

    statsRow:  {
        flexDirection: 'row', width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden', zIndex: 1,
    },
    statSep:   { width: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
    statItem:  { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statVal:   { fontSize: 18, fontWeight: '800', color: P.gold },
    statLbl:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3, marginTop: 2 },

    // ── Tabs ──
    tabs: {
        flexDirection: 'row',
        backgroundColor: P.surface,
        borderRadius: 14, padding: 4,
        marginBottom: 4,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive:    { backgroundColor: P.primary },
    tabText:      { fontSize: 12, fontWeight: '600', color: P.sub },
    tabTextActive:{ color: '#fff', fontWeight: '700' },

    // ── Édition ──
    textInput:       { fontSize: 14, color: P.text, paddingVertical: 2, fontWeight: '600' },
    fixedBadge:      { backgroundColor: P.goldBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: P.goldRim },
    fixedBadgeText:  { fontSize: 10, fontWeight: '700', color: P.gold },
    saveBtn:         { backgroundColor: P.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 },
    saveBtnText:     { color: '#fff', fontSize: 14, fontWeight: '700' },

    // ── Sécurité ──
    sectionHeaderRow:{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    revokeAllText:   { fontSize: 11, color: P.error, fontWeight: '600', marginBottom: 10 },
    clearHistoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10, paddingVertical: 8 },
    clearHistoryText:{ fontSize: 12, color: P.error, fontWeight: '600' },

    emptyText: { textAlign: 'center', color: P.sub, paddingVertical: 20, fontSize: 12 },
    version:   { textAlign: 'center', fontSize: 11, color: P.muted, marginTop: 32, marginBottom: 8, letterSpacing: 0.5 },
});
