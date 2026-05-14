// ==========================================
// ÉCRAN CONNEXION - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';

// ==========================================
// TYPES
// ==========================================

type Props = {
    onNavigateToRegister: () => void;
};

// ==========================================
// ÉCRAN
// ==========================================

export const LoginScreen: React.FC<Props> = ({ onNavigateToRegister }) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        if (error) Alert.alert('Erreur de connexion', error.message);
        setLoading(false);
        // Si succès, onAuthStateChange dans _layout.tsx prend le relais
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Email requis', 'Entrez votre email pour réinitialiser le mot de passe');
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
            Alert.alert('Erreur', error.message);
        } else {
            Alert.alert('Email envoyé', 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxxl }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Hero ── */}
                <View style={[styles.hero, { paddingTop: insets.top + SPACING.xl }]}>
                    <View style={styles.logoWrap}>
                        <Ionicons name="cut-outline" size={28} color="#fff" />
                    </View>
                    <Text style={styles.heroTitle}>TailorPro</Text>
                    <Text style={styles.heroSub}>Gérez votre atelier avec sérénité</Text>
                </View>

                {/* ── Formulaire ── */}
                <View style={styles.form}>
                    <View style={styles.formHeader}>
                        <Ionicons name="log-in-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.formTitle}>Connexion</Text>
                    </View>

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Adresse email</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="mail-outline" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="couturier@atelier.com"
                                placeholderTextColor={COLORS.gray400}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Mot de passe */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { paddingRight: 44 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={COLORS.gray400}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={COLORS.gray400}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Mot de passe oublié */}
                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
                        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[styles.cta, loading && styles.ctaDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.ctaText}>Se connecter</Text>
                        }
                    </TouchableOpacity>

                    {/* Séparateur */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Lien inscription */}
                    <TouchableOpacity style={styles.switchWrap} onPress={onNavigateToRegister}>
                        <Text style={styles.switchText}>
                            Pas encore de compte ?{' '}
                            <Text style={styles.switchLink}>Créer un compte</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { flexGrow: 1 },

    hero: {
        backgroundColor: COLORS.primary,
        paddingBottom: 36,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    logoWrap: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xs,
    },
    heroTitle: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.semibold,
        color: '#fff',
    },
    heroSub: {
        fontSize: FONT_SIZES.sm,
        color: 'rgba(255,255,255,0.75)',
    },

    form: { padding: SPACING.xl },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.lg,
    },
    formTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.textSecondary,
    },

    field: { marginBottom: SPACING.lg },
    label: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.medium,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 46,
    },
    inputIcon: { marginRight: SPACING.sm },
    input: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        height: '100%',
    },
    eyeBtn: {
        position: 'absolute',
        right: SPACING.md,
        padding: 4,
    },

    forgotWrap: {
        alignSelf: 'flex-end',
        marginTop: -SPACING.sm,
        marginBottom: SPACING.lg,
    },
    forgotText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
    },

    cta: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    ctaDisabled: { opacity: 0.7 },
    ctaText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        color: '#fff',
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
    dividerText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

    switchWrap: { alignItems: 'center' },
    switchText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
    switchLink: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold },
});

/***********
import React, { useState } from 'react'
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function signInWithEmail() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (error) Alert.alert(error.message)
        setLoading(false)
    }

    async function signUpWithEmail() {
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (error) Alert.alert(error.message)
        if (!session) Alert.alert('Please check your inbox for email verification!')
        setLoading(false)
    }

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    autoCapitalize="none"
                    style={styles.input}
                />
            </View>
            <View style={styles.verticallySpaced}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    autoCapitalize="none"
                    style={styles.input}
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={() => signInWithEmail()}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Sign in</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.verticallySpaced}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={() => signUpWithEmail()}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Sign up</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 12,
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#86939e',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#86939e',
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2089dc',
        borderRadius: 4,
        padding: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
 */