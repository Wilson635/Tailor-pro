// ==========================================
// PROFIL UTILISATEUR DYNAMIQUE ET ÉDITABLE - TailorPro
// ==========================================

import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Switch, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useProfile } from '@hooks/useProfile';
import { supabase } from '@/src/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const C = {
    bg:      '#0E0B14',
    surface: '#1A1528',
    border:  '#2E2845',
    text:    '#FFFFFF',
    sub:     'rgba(255,255,255,0.5)',
    muted:   'rgba(255,255,255,0.25)',
    gold:    '#D4AF37',
    purple:  '#2E0057',
    primary: '#534AB7',
    success: '#4ADE80',
    error:   '#EF4444',
};

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { profile, loading: profileLoading } = useProfile();

    // États d'édition des infos utilisateur
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [atelierName, setAtelierName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // État du commutateur Biométrie
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    // Initialisation des champs dès que le profil est chargé
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setAtelierName(profile.atelier_name || '');
            setPhone(profile.phone || '');
        }
        checkBiometricStatus();
    }, [profile]);

    // Vérifier si la biométrie est activée localement pour cet utilisateur
    const checkBiometricStatus = async () => {
        if (profile) {
            const storedStatus = await AsyncStorage.getItem(`@biometrics_enabled_${profile.id}`);
            setBiometricEnabled(storedStatus === 'true');
        }
    };

    // Activer / Désactiver l'option biométrique depuis le profil
    const handleToggleBiometrics = async (value: boolean) => {
        if (!profile) return;

        if (value) {
            // L'utilisateur veut activer : on vérifie la compatibilité matérielle
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert("Indisponible", "Votre appareil ne possède pas de capteur biométrique configuré.");
                return;
            }

            // Test de validation immédiat pour confirmer l'empreinte
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmez votre identité pour activer la connexion biométrique',
                fallbackLabel: 'Utiliser le mot de passe',
            });

            if (result.success) {
                await AsyncStorage.setItem(`@biometrics_enabled_${profile.id}`, 'true');
                // Optionnel : stocker de manière sécurisée un token ou indicateur si nécessaire
                setBiometricEnabled(true);
                Alert.alert("Succès", "Connexion biométrique activée pour vos prochaines connexions !");
            } else {
                setBiometricEnabled(false);
            }
        } else {
            // Désactivation
            await AsyncStorage.removeItem(`@biometrics_enabled_${profile.id}`);
            setBiometricEnabled(false);
            Alert.alert("Désactivé", "La connexion biométrique a été retirée.");
        }
    };

    // Sauvegarde des modifications dans public.users
    const handleSaveChanges = async () => {
        if (!profile?.id) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    display_name: displayName,
                    atelier_name: profile.role === 'tailor' ? atelierName : null, // Seulement si couturier
                    phone: phone
                })
                .eq('id', profile.id);

            if (error) throw error;

            Alert.alert("Succès", "Votre profil a été mis à jour avec succès !");
            setIsEditing(false);
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de sauvegarder les modifications.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (profileLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={C.gold} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header profil */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={styles.profileName}>{displayName || 'Utilisateur'}</Text>
                    <Text style={styles.profileEmail}>{profile?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{profile?.role === 'tailor' ? 'COUTURIER PRO' : 'CLIENT'}</Text>
                    </View>
                </View>

                {/* Formulaire d'informations */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
                        <TouchableOpacity onPress={() => isEditing ? handleSaveChanges() : setIsEditing(true)}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color={C.gold} />
                            ) : (
                                <Text style={styles.editActionText}>{isEditing ? "Enregistrer" : "Modifier"}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Champ Nom public */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Nom complet</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={displayName}
                            onChangeText={setDisplayName}
                            editable={isEditing}
                            placeholder="Votre nom complet"
                            placeholderTextColor={C.muted}
                        />
                    </View>

                    {/* Champ Atelier (Uniquement visible si l'utilisateur connecté est un Tailleur) */}
                    {profile?.role === 'tailor' && (
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Nom de l'atelier</Text>
                            <TextInput
                                style={[styles.input, !isEditing && styles.inputDisabled]}
                                value={atelierName}
                                onChangeText={setAtelierName}
                                editable={isEditing}
                                placeholder="Nom de votre atelier de couture"
                                placeholderTextColor={C.muted}
                            />
                        </View>
                    )}

                    {/* Champ Numéro de Téléphone */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Téléphone</Text>
                        <TextInput
                            style={[styles.input, !isEditing && styles.inputDisabled]}
                            value={phone}
                            onChangeText={setPhone}
                            editable={isEditing}
                            keyboardType="phone-pad"
                            placeholder="Votre numéro de téléphone"
                            placeholderTextColor={C.muted}
                        />
                    </View>
                </View>

                {/* Section Sécurité & Biométrie */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Sécurité & Accès</Text>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLeft}>
                            <Ionicons name="finger-print-outline" size={22} color={C.gold} />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.toggleTitle}>Connexion Biométrique</Text>
                                <Text style={styles.toggleDesc}>Empreinte digitale / Face ID</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometricEnabled}
                            onValueChange={handleToggleBiometrics}
                            trackColor={{ false: C.border, true: C.primary }}
                            thumbColor={biometricEnabled ? C.gold : C.sub}
                        />
                    </View>
                </View>

                {/* Bouton de déconnexion */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={C.error} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    profileHeader: { alignItems: 'center', marginVertical: 24 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: C.gold },
    profileName: { fontSize: 22, fontWeight: '700', color: C.text },
    profileEmail: { fontSize: 14, color: C.sub, marginTop: 4 },
    roleBadge: { backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
    roleBadgeText: { fontSize: 11, fontWeight: '700', color: C.gold },
    sectionCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
    editActionText: { color: C.gold, fontWeight: '600', fontSize: 14 },
    inputWrapper: { marginBottom: 14 },
    inputLabel: { fontSize: 12, color: C.sub, marginBottom: 6 },
    input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, height: 46, color: C.text, fontSize: 14 },
    inputDisabled: { opacity: 0.6, color: C.sub },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    toggleLeft: { flexDirection: 'row', alignItems: 'center' },
    toggleTitle: { fontSize: 14, fontWeight: '600', color: C.text },
    toggleDesc: { fontSize: 12, color: C.sub, marginTop: 2 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', height: 50, borderRadius: 12, marginTop: 10, marginBottom: 30 },
    logoutText: { color: C.error, fontWeight: '700', fontSize: 15 },
});