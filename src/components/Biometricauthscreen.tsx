// ==========================================
// AUTHENTIFICATION BIOMÉTRIQUE - TailorPro
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, Alert, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import type {RootStackParamList} from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BiometricAuth'>;

// ── PALETTE ──
const C = {
    bg:      '#0E0B14',
    surface: '#1A1528',
    border:  '#2E2845',
    text:    '#FFFFFF',
    sub:     'rgba(255,255,255,0.5)',
    gold:    '#D4AF37',
    purple:  '#2E0057',
    success: '#4ADE80',
    error:   '#EF4444',
};

type BiometricState = 'idle' | 'scanning' | 'success' | 'error';
type AuthMethod = 'biometric' | '2fa' | 'passkey';

// ==========================================
// COMPOSANT PULSE RING (animation biométrie)
// ==========================================

const PulseRing = ({ color, active }: { color: string; active: boolean }) => {
    const scale1 = useRef(new Animated.Value(1)).current;
    const scale2 = useRef(new Animated.Value(1)).current;
    const opacity1 = useRef(new Animated.Value(0.6)).current;
    const opacity2 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        if (!active) {
            scale1.setValue(1);
            scale2.setValue(1);
            opacity1.setValue(0.6);
            opacity2.setValue(0.4);
            return;
        }

        const pulse = () => {
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale1, { toValue: 1.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(scale1, { toValue: 1,   duration: 800, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity1, { toValue: 0, duration: 800, useNativeDriver: true }),
                    Animated.timing(opacity1, { toValue: 0.6, duration: 800, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.delay(400),
                    Animated.timing(scale2, { toValue: 1.4, duration: 800, useNativeDriver: true }),
                    Animated.timing(scale2, { toValue: 1,   duration: 800, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.delay(400),
                    Animated.timing(opacity2, { toValue: 0, duration: 800, useNativeDriver: true }),
                    Animated.timing(opacity2, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                ]),
            ]).start(() => { if (active) pulse(); });
        };

        pulse();
    }, [active]);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[
                pulseStyles.ring,
                { borderColor: color, transform: [{ scale: scale2 }], opacity: opacity2 }
            ]} />
            <Animated.View style={[
                pulseStyles.ring,
                pulseStyles.ringSmall,
                { borderColor: color, transform: [{ scale: scale1 }], opacity: opacity1 }
            ]} />
        </View>
    );
};

const pulseStyles = StyleSheet.create({
    ring: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
    },
    ringSmall: {
        width: 130,
        height: 130,
        borderRadius: 65,
    },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const BiometricAuthScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [biometricState, setBiometricState] = useState<BiometricState>('idle');
    const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('biometric');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [hasBiometrics, setHasBiometrics] = useState(false);
    const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | 'none'>('none');

    const iconScale = useRef(new Animated.Value(1)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const hasHW = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(hasHW && enrolled);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('fingerprint');
        }
    };

    const handleBiometric = async () => {
        setBiometricState('scanning');

        // Animation de scan
        Animated.loop(
            Animated.sequence([
                Animated.timing(iconScale, { toValue: 1.1, duration: 600, useNativeDriver: true }),
                Animated.timing(iconScale, { toValue: 1,   duration: 600, useNativeDriver: true }),
            ]),
            { iterations: 3 }
        ).start();

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirmer votre identité',
                cancelLabel: 'Annuler',
                fallbackLabel: 'Mot de passe',
            });

            if (result.success) {
                setBiometricState('success');
                Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
                setTimeout(() => navigation.replace('Welcome'), 1200);
            } else {
                setBiometricState('error');
                setTimeout(() => setBiometricState('idle'), 2000);
            }
        } catch {
            setBiometricState('error');
            setTimeout(() => setBiometricState('idle'), 2000);
        }
    };

    const getBiometricIcon = () => {
        if (biometricType === 'face') return 'scan-outline';
        if (biometricType === 'fingerprint') return 'finger-print-outline';
        return 'shield-checkmark-outline';
    };

    const getBiometricColor = () => {
        if (biometricState === 'success') return C.success;
        if (biometricState === 'error')   return C.error;
        if (biometricState === 'scanning') return C.gold;
        return 'rgba(212,175,55,0.7)';
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={20} color={C.text} />
                    </TouchableOpacity>
                    <View style={styles.badge}>
                        <Ionicons name="shield-checkmark-outline" size={13} color={C.gold} />
                        <Text style={styles.badgeText}>CONNEXION SÉCURISÉE</Text>
                    </View>
                </View>

                {/* ── Titre ── */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Vérification{'\n'}d'identité</Text>
                    <Text style={styles.subtitle}>
                        Choisissez votre méthode d'authentification pour accéder à votre espace.
                    </Text>
                </View>

                {/* ── Sélecteur de méthode ── */}
                <View style={styles.methodTabs}>
                    {([
                        { key: 'biometric', icon: 'finger-print-outline', label: 'Biométrie' },
                        { key: '2fa',       icon: 'shield-outline',        label: '2FA' },
                        { key: 'passkey',   icon: 'key-outline',           label: 'Passkey' },
                    ] as const).map(m => (
                        <TouchableOpacity
                            key={m.key}
                            style={[styles.methodTab, selectedMethod === m.key && styles.methodTabActive]}
                            onPress={() => setSelectedMethod(m.key)}
                        >
                            <Ionicons
                                name={m.icon}
                                size={16}
                                color={selectedMethod === m.key ? C.gold : C.sub}
                            />
                            <Text style={[styles.methodTabText, selectedMethod === m.key && { color: C.gold }]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── BIOMÉTRIE ── */}
                {selectedMethod === 'biometric' && (
                    <View style={styles.biometricSection}>
                        <TouchableOpacity
                            style={styles.biometricCenter}
                            onPress={handleBiometric}
                            disabled={biometricState === 'scanning' || biometricState === 'success'}
                            activeOpacity={0.8}
                        >
                            <PulseRing
                                color={getBiometricColor()}
                                active={biometricState === 'scanning'}
                            />
                            <LinearGradient
                                colors={
                                    biometricState === 'success' ? ['#065F46', '#064E3B'] :
                                        biometricState === 'error'   ? ['#7F1D1D', '#991B1B'] :
                                            ['#2E0057', '#1A0033']
                                }
                                style={styles.biometricBtn}
                            >
                                <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                                    <Ionicons
                                        name={
                                            biometricState === 'success' ? 'checkmark-circle' :
                                                biometricState === 'error'   ? 'close-circle' :
                                                    getBiometricIcon()
                                        }
                                        size={52}
                                        color={getBiometricColor()}
                                    />
                                </Animated.View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.biometricLabel}>
                            {biometricState === 'idle'     ? `Appuyez pour utiliser ${biometricType === 'face' ? 'Face ID' : 'l\'empreinte'}` :
                                biometricState === 'scanning' ? 'Scan en cours...' :
                                    biometricState === 'success'  ? 'Identité confirmée ✓' :
                                        'Échec — Réessayez'}
                        </Text>

                        {!hasBiometrics && (
                            <View style={styles.noBiometricCard}>
                                <Ionicons name="information-circle-outline" size={18} color={C.gold} />
                                <Text style={styles.noBiometricText}>
                                    Biométrie non disponible. Activez-la dans les paramètres de votre appareil.
                                </Text>
                            </View>
                        )}

                        {/* Options alternatives */}
                        <View style={styles.altOptions}>
                            <View style={styles.altOption}>
                                <View style={[styles.altOptionIcon, { backgroundColor: '#1A1528' }]}>
                                    <Ionicons name="scan-outline" size={20} color={C.gold} />
                                </View>
                                <Text style={styles.altOptionLabel}>Face ID</Text>
                            </View>
                            <View style={styles.altOptionSep} />
                            <View style={styles.altOption}>
                                <View style={[styles.altOptionIcon, { backgroundColor: '#1A1528' }]}>
                                    <Ionicons name="finger-print-outline" size={20} color={C.gold} />
                                </View>
                                <Text style={styles.altOptionLabel}>Empreinte</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── 2FA ── */}
                {selectedMethod === '2fa' && (
                    <View style={styles.twoFASection}>
                        <View style={styles.twoFACard}>
                            <View style={styles.twoFAIcon}>
                                <Ionicons name="shield-outline" size={28} color={C.gold} />
                            </View>
                            <Text style={styles.twoFATitle}>Application Authenticator</Text>
                            <Text style={styles.twoFADesc}>
                                Ouvrez votre application Authenticator (Google, Authy…) et entrez le code à 6 chiffres.
                            </Text>

                            {/* Saisie OTP */}
                            <View style={styles.otpRow}>
                                {[0,1,2,3,4,5].map(i => (
                                    <View key={i} style={[styles.otpBox, i === 3 && styles.otpSep]}>
                                        <Text style={styles.otpText}>{otpDigits[i] || '—'}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.otpSubmit} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={['#2E0057', '#18002E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.otpSubmitGrad}
                                >
                                    <Text style={styles.otpSubmitText}>Vérifier le code</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.otpResend}>
                                Code expiré ?{' '}
                                <Text style={{ color: C.gold, fontWeight: '700' }}>Renvoyer</Text>
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── PASSKEY ── */}
                {selectedMethod === 'passkey' && (
                    <View style={styles.passkeySection}>
                        <View style={styles.passkeyCard}>
                            <View style={styles.passkeyIconWrap}>
                                <LinearGradient
                                    colors={['#2E0057', '#1A0033']}
                                    style={styles.passkeyIconBg}
                                >
                                    <Ionicons name="key-outline" size={36} color={C.gold} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.passkeyTitle}>Clé d'accès (Passkey)</Text>
                            <Text style={styles.passkeyDesc}>
                                Utilisez votre clé d'accès enregistrée pour une connexion instantanée et ultra-sécurisée, sans mot de passe.
                            </Text>

                            <View style={styles.passkeyFeatures}>
                                {['Résistant au phishing', 'Aucun mot de passe', 'Chiffrement de bout en bout'].map((f, i) => (
                                    <View key={i} style={styles.passkeyFeatureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color={C.success} />
                                        <Text style={styles.passkeyFeatureText}>{f}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity activeOpacity={0.85}>
                                <LinearGradient
                                    colors={['#2E0057', '#18002E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.passkeyBtn}
                                >
                                    <Ionicons name="key-outline" size={18} color={C.gold} />
                                    <Text style={styles.passkeyBtnText}>Utiliser ma clé d'accès</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── Lien retour connexion classique ── */}
                <TouchableOpacity
                    style={styles.classicLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Ionicons name="lock-closed-outline" size={14} color={C.sub} />
                    <Text style={styles.classicLinkText}>Connexion avec mot de passe</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingHorizontal: 24, paddingTop: 16 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 36,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: C.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: C.gold + '40',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    badgeText: {
        fontSize: 10, fontWeight: '700', color: C.gold, letterSpacing: 1.2,
    },

    titleSection: { marginBottom: 28 },
    title: {
        fontSize: 32, fontWeight: '800', color: C.text,
        letterSpacing: -0.8, lineHeight: 40, marginBottom: 10,
    },
    subtitle: {
        fontSize: 14, color: C.sub, lineHeight: 21,
    },

    methodTabs: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 4,
        marginBottom: 28,
    },
    methodTab: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 10,
    },
    methodTabActive: { backgroundColor: '#2E0057' },
    methodTabText: { fontSize: 12, fontWeight: '600', color: C.sub },

    // Biometric
    biometricSection: { alignItems: 'center', paddingTop: 16 },
    biometricCenter: {
        width: 120, height: 120,
        marginBottom: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    biometricBtn: {
        width: 100, height: 100, borderRadius: 50,
        alignItems: 'center', justifyContent: 'center',
    },
    biometricLabel: {
        fontSize: 14, color: C.sub, marginBottom: 24, textAlign: 'center',
    },
    noBiometricCard: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        backgroundColor: C.surface, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: C.gold + '30', marginBottom: 24,
    },
    noBiometricText: {
        flex: 1, fontSize: 13, color: C.sub, lineHeight: 19,
    },
    altOptions: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 14,
        padding: 16, gap: 0, width: '100%',
    },
    altOption: { flex: 1, alignItems: 'center', gap: 8 },
    altOptionIcon: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    altOptionLabel: { fontSize: 12, color: C.sub, fontWeight: '500' },
    altOptionSep: { width: 1, height: 40, backgroundColor: C.border },

    // 2FA
    twoFASection: { width: '100%' },
    twoFACard: {
        backgroundColor: C.surface, borderRadius: 20,
        borderWidth: 1, borderColor: C.border,
        padding: 24, alignItems: 'center',
    },
    twoFAIcon: {
        width: 60, height: 60, borderRadius: 18,
        backgroundColor: '#2E0057',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    twoFATitle: {
        fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8,
    },
    twoFADesc: {
        fontSize: 13, color: C.sub, textAlign: 'center',
        lineHeight: 20, marginBottom: 24,
    },
    otpRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    otpBox: {
        width: 44, height: 52, borderRadius: 12,
        backgroundColor: '#2E2845',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    otpSep: { marginLeft: 8 },
    otpText: { fontSize: 20, fontWeight: '700', color: C.text },
    otpSubmit: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
    otpSubmitGrad: {
        height: 50, alignItems: 'center', justifyContent: 'center',
    },
    otpSubmitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    otpResend: { fontSize: 13, color: C.sub },

    // Passkey
    passkeySection: { width: '100%' },
    passkeyCard: {
        backgroundColor: C.surface, borderRadius: 20,
        borderWidth: 1, borderColor: C.border,
        padding: 24, alignItems: 'center',
    },
    passkeyIconWrap: { marginBottom: 16 },
    passkeyIconBg: {
        width: 72, height: 72, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    passkeyTitle: {
        fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8,
    },
    passkeyDesc: {
        fontSize: 13, color: C.sub, textAlign: 'center',
        lineHeight: 20, marginBottom: 20,
    },
    passkeyFeatures: { width: '100%', gap: 10, marginBottom: 24 },
    passkeyFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    passkeyFeatureText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    passkeyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        height: 52, paddingHorizontal: 28, borderRadius: 14,
    },
    passkeyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

    classicLink: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginTop: 28, paddingVertical: 8,
    },
    classicLinkText: { fontSize: 13, color: C.sub, fontWeight: '500' },
});