// ==========================================
// PROFIL UTILISATEUR COMPLET - TailorPro (Version Claire avec Onglets & Actions)
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

const C = {
    bg:      '#F9FAFB',
    surface: '#FFFFFF',
    border:  '#E5E7EB',
    text:    '#111827',
    sub:     '#4B5563',
    muted:   '#9CA3AF',
    gold:    '#B8860B',
    purple:  '#4C1D95',
    success: '#10B981',
    error:   '#EF4444',
    warning: '#F59E0B',
};

// ── SOUS-COMPOSANTS ──

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
        activeOpacity={onPress && !isEditing ? 0.7 : 1}
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
        {!isEditing && (right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={C.muted} />))}
    </TouchableOpacity>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={[sStyles.card, style]}>{children}</View>
);

const Divider = () => <View style={sStyles.divider} />;

const sStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: C.sub,
        letterSpacing: 1.2, textTransform: 'uppercase',
        marginTop: 20, marginBottom: 10, paddingHorizontal: 2,
    },
    card: {
        backgroundColor: C.surface, borderRadius: 16,
        borderWidth: 1, borderColor: C.border,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 13, fontWeight: '500', color: C.muted },
    rowSub: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 2 },
    inputWrapper: { marginTop: 4, borderBottomWidth: 1, borderBottomColor: C.purple, paddingBottom: 2 },
    divider: { height: 0.5, backgroundColor: C.border, marginLeft: 66 },
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

    // États d'édition
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [atelierName, setAtelierName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    // Données locales pour les appareils connectés (simulées pour l'exemple mais dynamiques au retrait)
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
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

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

    // Sauvegarde des modifications
    const handleSaveChanges = async () => {
        if (!profile?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    display_name: displayName,
                    atelier_name: profile.role === 'tailor' ? atelierName : null,
                    phone: phone
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

    // Révocation / Déconnexion d'un appareil connecté
    const handleRevokeDevice = (deviceId: string, deviceName: string) => {
        Alert.alert(
            'Déconnecter l\'appareil',
            `Voulez-vous vraiment déconnecter l'appareil "${deviceName}" ? Il devra se reconnecter.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnecter',
                    style: 'destructive',
                    onPress: () => {
                        setDevices(prev => prev.filter(d => d.id !== deviceId));
                        Alert.alert("Succès", "L'appareil a été déconnecté avec succès.");
                    }
                }
            ]
        );
    };

    // Demande de réinitialisation de mot de passe via Supabase Auth
    const handleChangePassword = async () => {
        if (!profile?.email) return;
        Alert.alert(
            'Changement de mot de passe',
            `Un e-mail de réinitialisation va être envoyé à l'adresse : ${profile.email}`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Envoyer',
                    onPress: async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                        if (error) {
                            Alert.alert("Erreur", error.message);
                        } else {
                            Alert.alert("E-mail envoyé", "Veuillez vérifier votre boîte de réception.");
                        }
                    }
                }
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
        { id: '1', action: 'Connexion',         location: 'Yaoundé, CM',  date: 'Aujourd\'hui 09:14',  success: true  },
        { id: '2', action: 'Mot de passe modifié', location: 'Yaoundé, CM', date: 'Hier 18:32',         success: true  },
        { id: '3', action: 'Tentative échouée', location: 'Inconnue',      date: '12/06 22:41',         success: false },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon profil</Text>
                <TouchableOpacity
                    style={[styles.editBtn, isEditing && { backgroundColor: C.purple }]}
                    onPress={() => {
                        if(isEditing) {
                            setIsEditing(false); // Annuler l'édition
                        } else {
                            setIsEditing(true);
                            setActiveTab('infos'); // Force le focus sur l'onglet infos pour éditer
                        }
                    }}
                >
                    <Ionicons name={isEditing ? "close-outline" : "create-outline"} size={19} color={isEditing ? "#FFF" : C.purple} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero profil ── */}
                <LinearGradient
                    colors={['#2E0057', '#1A0033', '#110924']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroCircle} />
                    <View style={styles.avatarWrap}>
                        <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.avatarGradient}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </LinearGradient>
                        <TouchableOpacity style={styles.avatarEdit} onPress={() => Alert.alert("Photo de profil", "Bientôt disponible !")}>
                            <Ionicons name="camera-outline" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.heroName}>{profile?.display_name ?? 'Utilisateur'}</Text>
                    {profile?.atelier_name && <Text style={styles.heroAtelier}>{profile.atelier_name}</Text>}
                    <Text style={styles.heroEmail}>{profile?.email ?? ''}</Text>

                    <View style={styles.planBadge}>
                        <Ionicons name="diamond-outline" size={13} color="#D4AF37" />
                        <Text style={styles.planBadgeText}>Plan Pro · Actif</Text>
                    </View>
                </LinearGradient>

                {/* ── Système d'onglets (Tabs) ── */}
                <View style={styles.tabsContainer}>
                    {(['infos', 'securite', 'preferences'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                            onPress={() => !isEditing && setActiveTab(tab)}
                            disabled={isEditing} // Empêche de changer d'onglet pendant qu'on édite les données
                            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive, isEditing && { opacity: 0.5 }]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'infos' ? 'Infos' : tab === 'securite' ? 'Sécurité' : 'Préférences'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── CONTENU DYNAMIQUE SELON L'ONGLET ── */}

                {activeTab === 'infos' && (
                    <View>
                        <SectionTitle title="Informations personnelles" />
                        <Card style={{ marginBottom: 16 }}>
                            <SettingRow
                                icon="person-outline" iconBg="#ECECFE" iconColor={C.purple}
                                title="Nom complet" subtitle={displayName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={displayName} onChangeText={setDisplayName} placeholder="Votre nom" placeholderTextColor={C.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow
                                icon="storefront-outline" iconBg="#ECECFE" iconColor={C.purple}
                                title="Atelier" subtitle={atelierName || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={atelierName} onChangeText={setAtelierName} placeholder="Nom de l'atelier" placeholderTextColor={C.muted} />
                                )}
                            />
                            <Divider />
                            <SettingRow icon="mail-outline" iconBg="#ECECFE" iconColor={C.purple} title="Email (Non modifiable)" subtitle={profile?.email ?? '—'} />
                            <Divider />
                            <SettingRow
                                icon="call-outline" iconBg="#ECECFE" iconColor={C.purple}
                                title="Téléphone" subtitle={phone || '—'}
                                isEditing={isEditing}
                                renderInput={() => (
                                    <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Ex: +237..." placeholderTextColor={C.muted} />
                                )}
                            />
                        </Card>

                        {/* Bouton Sauvegarder conditionnel */}
                        {isEditing && (
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-outline" size={18} color="#FFF" />
                                        <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <SectionTitle title="Compte" />
                        <Card>
                            <SettingRow
                                icon="log-out-outline" iconBg="#FEE2E2" iconColor={C.error}
                                title="Se déconnecter" danger
                                onPress={() =>
                                    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter de l\'application ?', [
                                        { text: 'Annuler', style: 'cancel' },
                                        { text: 'Déconnexion', style: 'destructive', onPress: handleLogout },
                                    ])
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="trash-outline" iconBg="#FEE2E2" iconColor={C.error}
                                title="Supprimer le compte" danger
                                onPress={() => Alert.alert('Supprimer', 'Cette action est définitive et effacera l\'intégralité de vos données TailorPro.', [
                                    { text: 'Annuler', style: 'cancel' },
                                    { text: 'Supprimer', style: 'destructive', onPress: () => Alert.alert("Compte", "Demande enregistrée.") },
                                ])}
                            />
                        </Card>
                    </View>
                )}

                {activeTab === 'securite' && (
                    <View>
                        <SectionTitle title="Verrouillage & Accès" />
                        <Card>
                            <SettingRow
                                icon="finger-print-outline" iconBg="#E6F4EA" iconColor={C.success}
                                title="Biométrie" subtitle={biometricEnabled ? 'Activée' : 'Désactivée'}
                                right={
                                    <Switch
                                        value={biometricEnabled}
                                        onValueChange={handleToggleBiometrics}
                                        trackColor={{ false: C.border, true: '#10B981' }}
                                        thumbColor={biometricEnabled ? '#FFF' : C.muted}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow
                                icon="shield-outline" iconBg="#FEF3C7" iconColor={C.warning}
                                title="Double authentification (2FA)" subtitle={twoFAEnabled ? 'Activée' : 'Désactivée'}
                                right={
                                    <Switch
                                        value={twoFAEnabled}
                                        onValueChange={setTwoFAEnabled}
                                        trackColor={{ false: C.border, true: '#F59E0B' }}
                                        thumbColor={twoFAEnabled ? '#FFF' : C.muted}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow icon="key-outline" iconBg="#ECECFE" iconColor={C.purple} title="Gérer les clés d'accès" subtitle="Passkeys configurées : 1" onPress={() => Alert.alert("Passkeys", "Gestionnaire bientôt disponible.")} />
                            <Divider />
                            <SettingRow icon="lock-closed-outline" iconBg="#F3F4F6" iconColor={C.sub} title="Changer le mot de passe" onPress={handleChangePassword} />
                        </Card>

                        <SectionTitle title="Appareils connectés" />
                        <Card>
                            {devices.length === 0 ? (
                                <Text style={styles.emptyText}>Aucun appareil enregistré.</Text>
                            ) : (
                                devices.map((device, i) => (
                                    <React.Fragment key={device.id}>
                                        <View style={deviceStyles.row}>
                                            <View style={deviceStyles.iconWrap}>
                                                <Ionicons
                                                    name={device.type === 'ios' ? 'logo-apple' : 'logo-android'}
                                                    size={18}
                                                    color={device.current ? C.purple : C.sub}
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

                        <SectionTitle title="Historique" />
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

                {activeTab === 'preferences' && (
                    <View>
                        <SectionTitle title="Application" />
                        <Card>
                            <SettingRow
                                icon="notifications-outline" iconBg="#ECECFE" iconColor={C.purple}
                                title="Notifications" subtitle={notifEnabled ? 'Activées' : 'Désactivées'}
                                right={
                                    <Switch
                                        value={notifEnabled}
                                        onValueChange={setNotifEnabled}
                                        trackColor={{ false: C.border, true: C.purple }}
                                        thumbColor={notifEnabled ? '#FFF' : C.muted}
                                    />
                                }
                            />
                            <Divider />
                            <SettingRow icon="language-outline" iconBg="#ECECFE" iconColor={C.purple} title="Langue" subtitle="Français" onPress={() => Alert.alert("Langue", "Le support multi-langue arrive prochainement.")} />
                            <Divider />
                            <SettingRow icon="color-palette-outline" iconBg="#ECECFE" iconColor={C.purple} title="Thème" subtitle="Clair" onPress={() => Alert.alert("Thème", "Le thème sombre manuel sera disponible dans la prochaine mise à jour.")} />
                        </Card>
                    </View>
                )}

                <Text style={styles.version}>TailorPro v1.0.0</Text>
            </ScrollView>
        </View>
    );
};

// ── STYLES ──

const deviceStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    iconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1 },
    name: { fontSize: 14, fontWeight: '600', color: C.text },
    sub: { fontSize: 12, color: C.sub, marginTop: 2 },
    currentBadge: {
        backgroundColor: 'rgba(76,29,149,0.1)', borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 2,
    },
    currentText: { fontSize: 10, fontWeight: '600', color: C.purple },
});

const histStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    action: { fontSize: 14, fontWeight: '600', color: C.text },
    sub: { fontSize: 12, color: C.sub, marginTop: 2 },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    scroll: { paddingHorizontal: 20, paddingTop: 8 },

    heroCard: { borderRadius: 24, padding: 24, alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: '#4C1D95', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 },
    heroCircle: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(212,175,55,0.08)' },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#4C1D95', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#110924' },
    heroName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 2 },
    heroAtelier: { fontSize: 13, color: '#D4AF37', fontWeight: '600', marginBottom: 4 },
    heroEmail: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
    planBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(212,175,55,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
    planBadgeText: { fontSize: 12, fontWeight: '700', color: '#D4AF37' },

    tabsContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginTop: 20, marginBottom: 10 },
    tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabButtonActive: { backgroundColor: C.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    tabText: { fontSize: 13, fontWeight: '600', color: C.sub },
    tabTextActive: { color: C.purple, fontWeight: '700' },

    textInput: { fontSize: 14, color: C.text, paddingVertical: 2, fontWeight: '600' },
    saveBtn: { backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: C.muted, paddingVertical: 16, fontSize: 13 },
    version: { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 28, marginBottom: 8 },
});