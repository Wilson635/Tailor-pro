// ==========================================
// PROFIL UTILISATEUR - TailorPro (Light Premium)
// ==========================================

import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Switch, StatusBar, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useProfile } from '@hooks/useProfile';
import { supabase } from '@/src/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

// ==========================================
// PALETTE LIGHT PREMIUM
// ==========================================

const C = {
    bg:       '#F5F3EE',       // beige ivoire chaud — pas un blanc froid
    surface:  '#FFFFFF',
    surfaceAlt: '#FAF8F4',     // surfaces secondaires légèrement chaudes
    border:   '#E8E3DA',       // bordure beige sable
    borderMid: '#D4C9B8',
    text:     '#1A1207',       // presque noir — brun très foncé
    sub:      '#5C5040',       // brun moyen
    muted:    '#9C8E7C',       // gris-beige
    hint:     '#C4B8A6',
    gold:     '#B8860B',       // gold foncé — lisible sur clair
    goldBg:   '#FDF5E0',       // fond doré très léger
    goldRim:  '#E8CC7A',       // bordure gold douce
    goldDeep: '#8B6508',       // gold profond pour texte
    purple:   '#3D1A72',       // accent profond
    purpleBg: '#F0EAF8',
    success:  '#1A7A4A',
    successBg:'#E8F5EE',
    error:    '#C0392B',
    errorBg:  '#FBE9E7',
    warning:  '#B5620A',
    warningBg:'#FEF3E2',
};

// ==========================================
// SOUS-COMPOSANTS
// ==========================================

const SectionTitle = ({ title }: { title: string }) => (
    <Text style={sStyles.sectionTitle}>{title}</Text>
);

const SettingRow = ({
                        icon, iconBg, iconColor = C.gold,
                        title, subtitle, right, onPress, danger, isEditing, renderInput
                    }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
    isEditing?: boolean;
    renderInput?: () => React.ReactNode;
}) => (
    <TouchableOpacity
        style={sStyles.row}
        onPress={isEditing ? undefined : onPress}
        activeOpacity={onPress && !isEditing ? 0.65 : 1}
    >
        <View style={[sStyles.rowIcon, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={sStyles.rowContent}>
            <Text style={[sStyles.rowTitle, danger && { color: C.error }]}>{title}</Text>
            {isEditing && renderInput ? (
                <View style={sStyles.inputWrapper}>{renderInput()}</View>
            ) : (
                subtitle && <Text style={sStyles.rowSub}>{subtitle}</Text>
            )}
        </View>
        {!isEditing && (right ?? (onPress && (
            <Ionicons name="chevron-forward" size={15} color={C.hint} />
        )))}
    </TouchableOpacity>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={[sStyles.card, style]}>{children}</View>
);

const Divider = () => <View style={sStyles.divider} />;

const sStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: C.muted,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        shadowColor: '#8B6508',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowContent: { flex: 1 },
    rowTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: C.muted,
    },
    rowSub: {
        fontSize: 14,
        fontWeight: '600',
        color: C.text,
        marginTop: 2,
    },
    inputWrapper: {
        marginTop: 4,
        borderBottomWidth: 1.5,
        borderBottomColor: C.gold,
        paddingBottom: 2,
    },
    divider: {
        height: 0.5,
        backgroundColor: C.border,
        marginLeft: 66,
    },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'infos' | 'securite' | 'preferences'>('infos');

    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(true);

    const { profile, loading: profileLoading } = useProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [atelierName, setAtelierName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const [devices, setDevices] = useState([
        { id: '1', name: 'Samsung Galaxy S24', type: 'android', location: 'Yaoundé, CM', current: true,  lastSeen: 'Actif maintenant' },
        { id: '2', name: 'iPhone 15 Pro',      type: 'ios',     location: 'Douala, CM',  current: false, lastSeen: 'Il y a 2 jours' },
    ]);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setAtelierName(profile.atelier_name || '');
            setPhone(profile.phone || '');
        }
        checkBiometricStatus();
    }, [profile]);

    const checkBiometricStatus = async () => {
        if (profile) {
            const storedStatus = await AsyncStorage.getItem(`@biometrics_enabled_${profile.id}`);
            setBiometricEnabled(storedStatus === 'true');
        }
    };

    const handleToggleBiometrics = async (value: boolean) => {
        if (!profile) return;
        if (value) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
            if (!hasHardware || !isEnrolled) {
                Alert.alert("Indisponible", "Votre appareil ne possède pas de capteur biométrique configuré.");
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmez votre identité pour activer la connexion biométrique',
                fallbackLabel: 'Utiliser le mot de passe',
            });
            if (result.success) {
                await AsyncStorage.setItem(`@biometrics_enabled_${profile.id}`, 'true');
                setBiometricEnabled(true);
                Alert.alert("Succès", "Connexion biométrique activée !");
            } else {
                setBiometricEnabled(false);
            }
        } else {
            await AsyncStorage.removeItem(`@biometrics_enabled_${profile.id}`);
            setBiometricEnabled(false);
            Alert.alert("Désactivé", "La connexion biométrique a été retirée.");
        }
    };

    const handleSaveChanges = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    display_name: displayName,
                    atelier_name: profile.role === 'tailor' ? atelierName : null,
                    phone,
                })
                .eq('id', profile.id);
            if (error) throw error;
            Alert.alert("Succès", "Votre profil a été mis à jour !");
            setIsEditing(false);
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de sauvegarder les modifications.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevokeDevice = (deviceId: string, deviceName: string) => {
        Alert.alert(
            'Déconnecter l\'appareil',
            `Voulez-vous vraiment déconnecter "${deviceName}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnecter',
                    style: 'destructive',
                    onPress: () => {
                        setDevices(prev => prev.filter(d => d.id !== deviceId));
                        Alert.alert("Succès", "L'appareil a été déconnecté.");
                    },
                },
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!profile?.email) return;
        Alert.alert(
            'Changement de mot de passe',
            `Un e-mail sera envoyé à : ${profile.email}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Envoyer',
                    onPress: async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                        if (error) Alert.alert("Erreur", error.message);
                        else Alert.alert("E-mail envoyé", "Vérifiez votre boîte de réception.");
                    },
                },
            ]
        );
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const getInitials = () => {
        if (!profile?.display_name) return '?';
        return profile.display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const HISTORY = [
        { id: '1', action: 'Connexion',            location: 'Yaoundé, CM', date: "Aujourd'hui 09:14", success: true  },
        { id: '2', action: 'Mot de passe modifié', location: 'Yaoundé, CM', date: 'Hier 18:32',        success: true  },
        { id: '3', action: 'Tentative échouée',    location: 'Inconnue',     date: '12/06 22:41',       success: false },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
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
                        name={isEditing ? "close-outline" : "create-outline"}
                        size={19}
                        color={isEditing ? C.surface : C.gold}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── HERO ── */}
                <View style={styles.heroCard}>
                    {/* Fond décoratif léger */}
                    <View style={styles.heroOrb1} />
                    <View style={styles.heroOrb2} />

                    <View style={styles.avatarWrap}>
                        <LinearGradient
                            colors={['#D4AF37', '#8B6508']}
                            style={styles.avatarGradient}
                        >
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </LinearGradient>
                        <TouchableOpacity
                            style={styles.avatarEdit}
                            onPress={() => Alert.alert("Photo de profil", "Bientôt disponible !")}
                        >
                            <Ionicons name="camera-outline" size={13} color={C.surface} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.heroName}>{profile?.display_name ?? 'Utilisateur'}</Text>
                    {profile?.atelier_name && (
                        <Text style={styles.heroAtelier}>{profile.atelier_name}</Text>
                    )}
                    <Text style={styles.heroEmail}>{profile?.email ?? ''}</Text>

                    {/*<View style={styles.planBadge}>
                        <Ionicons name="diamond-outline" size={12} color={C.goldDeep} />
                        <Text style={styles.planBadgeText}>Plan Pro · Actif</Text>
                    </View> */}

                    {/* Statistiques */}
                    <View style={styles.statsRow}>
                        {[
                            { val: '48',  lbl: 'Clients' },
                            { val: '127', lbl: 'Commandes' },
                        ].map((s, i) => (
                            <React.Fragment key={s.lbl}>
                                {i > 0 && <View style={styles.statSep} />}
                                <View style={styles.statItem}>
                                    <Text style={styles.statVal}>{s.val}</Text>
                                    <Text style={styles.statLbl}>{s.lbl}</Text>
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* ── TABS ── */}
                <View style={styles.tabsContainer}>
                    {(['infos', 'securite', 'preferences'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tabButton,
                                activeTab === tab && styles.tabButtonActive,
                                isEditing && tab !== 'infos' && { opacity: 0.4 },
                            ]}
                            onPress={() => !isEditing && setActiveTab(tab)}
                            disabled={isEditing && tab !== 'infos'}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'infos' ? 'Infos' : tab === 'securite' ? 'Sécurité' : 'Préférences'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── ONGLET : INFOS ── */}
                {activeTab === 'infos' && (
                    <View>
                        <SectionTitle title="Informations personnelles" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="person-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Nom complet" subtitle={displayName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput
                                        style={styles.textInput}
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        placeholder="Votre nom"
                                        placeholderTextColor={C.hint}
                                    />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="storefront-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Atelier" subtitle={atelierName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput
                                        style={styles.textInput}
                                        value={atelierName}
                                        onChangeText={setAtelierName}
                                        placeholder="Nom de l'atelier"
                                        placeholderTextColor={C.hint}
                                    />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="mail-outline" iconBg={C.purpleBg} iconColor={C.purple}
                                title="Email"
                                subtitle={profile?.email ?? '—'}
                                right={
                                    <View style={styles.fixedBadge}>
                                        <Text style={styles.fixedBadgeText}>Fixe</Text>
                                    </View>
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="call-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Téléphone" subtitle={phone || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput
                                        style={styles.textInput}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        placeholder="Ex: +237..."
                                        placeholderTextColor={C.hint}
                                    />
                                )}
                            />
                        </Card>

                        {isEditing && (
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={C.surface} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-outline" size={18} color={C.surface} />
                                        <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <SectionTitle title="Compte" />
                        <Card>
                            <SettingRow
                                icon="log-out-outline" iconBg={C.errorBg} iconColor={C.error}
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
                                icon="trash-outline" iconBg={C.errorBg} iconColor={C.error}
                                title="Supprimer le compte" danger
                                onPress={() =>
                                    Alert.alert('Supprimer', 'Cette action est définitive.', [
                                        { text: 'Annuler', style: 'cancel' },
                                        { text: 'Supprimer', style: 'destructive', onPress: () => Alert.alert("Compte", "Demande enregistrée.") },
                                    ])
                                }
                            />
                        </Card>
                    </View>
                )}

                {/* ── ONGLET : SÉCURITÉ ── */}
                {activeTab === 'securite' && (
                    <View>
                        <SectionTitle title="Verrouillage & Accès" />
                        <Card>
                            <SettingRow
                                icon="finger-print-outline" iconBg={C.successBg} iconColor={C.success}
                                title="Biométrie"
                                subtitle={biometricEnabled ? 'Activée' : 'Désactivée'}
                                right={
                                    <Switch
                                        value={biometricEnabled}
                                        onValueChange={handleToggleBiometrics}
                                        trackColor={{ false: C.border, true: '#1A7A4A' }}
                                        thumbColor={C.surface}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="shield-outline" iconBg={C.warningBg} iconColor={C.warning}
                                title="Double authentification (2FA)"
                                subtitle={twoFAEnabled ? 'Activée' : 'Désactivée'}
                                right={
                                    <Switch
                                        value={twoFAEnabled}
                                        onValueChange={setTwoFAEnabled}
                                        trackColor={{ false: C.border, true: C.warning }}
                                        thumbColor={C.surface}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="key-outline" iconBg={C.purpleBg} iconColor={C.purple}
                                title="Gérer les clés d'accès"
                                subtitle="Passkeys configurées : 1"
                                onPress={() => Alert.alert("Passkeys", "Gestionnaire bientôt disponible.")}
                            />
                            <Divider />
                            <SettingRow
                                icon="lock-closed-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Changer le mot de passe"
                                onPress={handleChangePassword}
                            />
                        </Card>

                        <SectionTitle title="Appareils connectés" />
                        <Card>
                            {devices.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun appareil enregistré.</Text>
                            ) : (
                                devices.map((device, i) => (
                                    <React.Fragment key={device.id}>
                                        <View style={deviceStyles.row}>
                                            <View style={[deviceStyles.iconWrap, device.current && deviceStyles.iconWrapActive]}>
                                                <Ionicons
                                                    name={device.type === 'ios' ? 'logo-apple' : 'logo-android'}
                                                    size={18}
                                                    color={device.current ? C.gold : C.muted}
                                                />
                                            </View>
                                            <View style={deviceStyles.info}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={deviceStyles.name}>{device.name}</Text>
                                                    {device.current && (
                                                        <View style={deviceStyles.currentBadge}>
                                                            <Text style={deviceStyles.currentText}>Cet appareil</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={deviceStyles.sub}>{device.location} · {device.lastSeen}</Text>
                                            </View>
                                            {!device.current && (
                                                <TouchableOpacity onPress={() => handleRevokeDevice(device.id, device.name)}>
                                                    <Ionicons name="trash-outline" size={17} color={C.error} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {i < devices.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))
                            )}
                        </Card>

                        <SectionTitle title="Historique de connexion" />
                        <Card>
                            {HISTORY.map((h, i) => (
                                <React.Fragment key={h.id}>
                                    <View style={histStyles.row}>
                                        <View style={[histStyles.dot, { backgroundColor: h.success ? C.success : C.error }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={histStyles.action}>{h.action}</Text>
                                            <Text style={histStyles.sub}>{h.location} · {h.date}</Text>
                                        </View>
                                        <Ionicons
                                            name={h.success ? 'checkmark-circle' : 'close-circle'}
                                            size={18}
                                            color={h.success ? C.success : C.error}
                                        />
                                    </View>
                                    {i < HISTORY.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </Card>
                    </View>
                )}

                {/* ── ONGLET : PRÉFÉRENCES ── */}
                {activeTab === 'preferences' && (
                    <View>
                        <SectionTitle title="Application" />
                        <Card>
                            <SettingRow
                                icon="notifications-outline" iconBg={C.purpleBg} iconColor={C.purple}
                                title="Notifications"
                                subtitle={notifEnabled ? 'Activées' : 'Désactivées'}
                                right={
                                    <Switch
                                        value={notifEnabled}
                                        onValueChange={setNotifEnabled}
                                        trackColor={{ false: C.border, true: C.purple }}
                                        thumbColor={C.surface}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="language-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Langue"
                                subtitle="Français"
                                onPress={() => Alert.alert("Langue", "Multi-langue arrive prochainement.")}
                            />
                            <Divider />
                            <SettingRow
                                icon="color-palette-outline" iconBg={C.goldBg} iconColor={C.gold}
                                title="Thème"
                                subtitle="Clair"
                                onPress={() => Alert.alert("Thème", "Le thème sombre sera disponible prochainement.")}
                            />
                        </Card>
                    </View>
                )}

                <Text style={styles.version}>TailorPro v1.0.0</Text>
            </ScrollView>
        </View>
    );
};

// ==========================================
// STYLES
// ==========================================

const deviceStyles = StyleSheet.create({
    row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    iconWrap:{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    iconWrapActive: { backgroundColor: C.goldBg, borderColor: C.goldRim },
    info:    { flex: 1 },
    name:    { fontSize: 14, fontWeight: '600', color: C.text },
    sub:     { fontSize: 12, color: C.muted, marginTop: 2 },
    currentBadge: { backgroundColor: C.goldBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.goldRim },
    currentText:  { fontSize: 10, fontWeight: '700', color: C.goldDeep },
});

const histStyles = StyleSheet.create({
    row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    dot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    action: { fontSize: 14, fontWeight: '600', color: C.text },
    sub:    { fontSize: 12, color: C.muted, marginTop: 2 },
});

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: C.bg },

    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    editBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.goldBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.goldRim },
    editBtnActive: { backgroundColor: C.gold, borderColor: C.gold },

    scroll: { paddingHorizontal: 20, paddingTop: 4 },

    // Hero
    heroCard:     { borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden', position: 'relative', shadowColor: '#B8860B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
    heroOrb1:     { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: C.goldBg, opacity: 0.8 },
    heroOrb2:     { position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: C.purpleBg, opacity: 0.5 },
    avatarWrap:   { position: 'relative', marginBottom: 12, zIndex: 1 },
    avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.goldRim },
    avatarText:   { fontSize: 28, fontWeight: '800', color: C.surface },
    avatarEdit:   { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surface },
    heroName:     { fontSize: 20, fontWeight: '800', color: C.text, zIndex: 1 },
    heroAtelier:  { fontSize: 13, color: C.gold, fontWeight: '600', marginBottom: 4, zIndex: 1 },
    heroEmail:    { fontSize: 12, color: C.muted, marginBottom: 14, zIndex: 1 },
    planBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.goldBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.goldRim, marginBottom: 20, zIndex: 1 },
    planBadgeText:{ fontSize: 12, fontWeight: '700', color: C.goldDeep },

    statsRow:  { flexDirection: 'row', width: '100%', backgroundColor: C.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', zIndex: 1 },
    statSep:   { width: 1, backgroundColor: C.border },
    statItem:  { flex: 1, alignItems: 'center', paddingVertical: 12 },
    statVal:   { fontSize: 18, fontWeight: '800', color: C.gold },
    statLbl:   { fontSize: 10, color: C.muted, letterSpacing: 0.3, marginTop: 2 },

    // Tabs
    tabsContainer:  { flexDirection: 'row', backgroundColor: C.surfaceAlt, borderRadius: 14, padding: 4, marginBottom: 4, borderWidth: 1, borderColor: C.border },
    tabButton:      { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabButtonActive:{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.goldRim, shadowColor: '#B8860B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 },
    tabText:        { fontSize: 13, fontWeight: '600', color: C.muted },
    tabTextActive:  { color: C.goldDeep, fontWeight: '700' },

    textInput: { fontSize: 14, color: C.text, paddingVertical: 2, fontWeight: '600' },
    fixedBadge: { backgroundColor: C.goldBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.goldRim },
    fixedBadgeText: { fontSize: 10, fontWeight: '700', color: C.goldDeep },
    saveBtn:   { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4, shadowColor: '#B8860B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    saveBtnText: { color: C.surface, fontSize: 15, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: C.muted, paddingVertical: 20, fontSize: 13 },
    version:   { textAlign: 'center', fontSize: 11, color: C.hint, marginTop: 32, marginBottom: 8, letterSpacing: 0.5 },
});