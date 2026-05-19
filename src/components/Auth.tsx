// ==========================================
// ÉCRAN CONNEXION - TailorPro (Redesign)
// ==========================================

import React, { useState } from "react";
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
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// ── PALETTE (Harmonisée avec Register) ───────────────────────────
const C = {
    bg:            "#FFFFFF",
    surface:       "#F7F6F4",
    border:        "#EBEBEB",
    borderError:   "#EF4444",
    textPrimary:   "#0E0B14",
    textSecondary: "#7A7787",
    textTertiary:  "#B0ACBA",
    error:         "#EF4444",

    purple900:  "#1A0033",
    purple700:  "#2E0057",
    purple600:  "#534AB7",
    purple200:  "#AFA9EC",
    purple100:  "#EEEDFE",
    purple50:   "#F7F5FF",

    gold:       "#D4AF37",
    gold800:    "#412402",
    gold100:    "#FAEEDA",
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

// ── COMPOSANT CHAMP GÉNÉRIQUE (Identique à Register) ──────────────
const Field = ({
                   label,
                   icon,
                   value,
                   onChangeText,
                   placeholder,
                   keyboardType,
                   autoCapitalize,
                   secure,
                   error,
                   rightElement,
               }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "sentences";
    secure?: boolean;
    error?: string;
    rightElement?: React.ReactNode;
}) => (
    <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>{label}</Text>
        <View style={[fieldStyles.inputWrap, error ? fieldStyles.inputError : null]}>
            <Ionicons
                name={icon}
                size={17}
                color={error ? C.borderError : C.textTertiary}
                style={fieldStyles.icon}
            />
            <TextInput
                style={fieldStyles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={C.textTertiary}
                keyboardType={keyboardType ?? "default"}
                autoCapitalize={autoCapitalize ?? "sentences"}
                autoCorrect={false}
                secureTextEntry={secure}
            />
            {rightElement}
        </View>
        {error && (
            <View style={fieldStyles.errorRow}>
                <Ionicons name="alert-circle-outline" size={12} color={C.error} />
                <Text style={fieldStyles.errorText}>{error}</Text>
            </View>
        )}
    </View>
);

const fieldStyles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    label: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textSecondary,
        letterSpacing: 0.5,
        //textTransform: "uppercase",
        marginBottom: 6,
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
        height: 50,
    },
    inputError: { borderColor: C.borderError, backgroundColor: "#FFF5F5" },
    icon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: C.textPrimary, height: "100%" },
    errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    errorText: { fontSize: 12, color: C.error },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    /*const handleLogin = async () => {
        const localErrors: { email?: string; password?: string } = {};
        if (!email.trim()) localErrors.email = "Champ requis";
        if (!password) localErrors.password = "Champ requis";

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) Alert.alert("Erreur de connexion", error.message);
        setLoading(false);
    };*/

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) throw error;

            if (data?.user) {
                const userId = data.user.id;

                //Vérifier si le choix de la biométrie est déjà enregistré pour cet id
                const isConfigured = await AsyncStorage.getItem(`@biometrics_enabled_${userId}`);

                if (isConfigured === null) {
                    // L'utilisateur ne s'est encore jamais prononcé : on lui propose l'option
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                    if (hasHardware && isEnrolled) {
                        Alert.alert(
                            "🔒 Connexion Biométrique",
                            "Souhaitez-vous activer votre empreinte digitale ou Face ID pour vos prochaines connexions ?",
                            [
                                {
                                    text: "Plus tard",
                                    style: "cancel",
                                    onPress: async () => {
                                        // On marque à false pour ne pas lui demander à CHAQUE connexion
                                        await AsyncStorage.setItem(`@biometrics_enabled_${userId}`, 'false');
                                    }
                                },
                                {
                                    text: "Activer",
                                    fontWeight: "bold",
                                    onPress: async () => {
                                        const authTest = await LocalAuthentication.authenticateAsync({
                                            promptMessage: 'Confirmez votre empreinte / FaceID',
                                        });
                                        if (authTest.success) {
                                            // Sauvegarde des identifiants chiffrés ou d'un flag d'autorisation d'accès direct
                                            await AsyncStorage.setItem(`@biometrics_enabled_${userId}`, 'true');
                                            // On sauvegarde l'email pour pouvoir appeler la reconnexion rapide
                                            await AsyncStorage.setItem(`@last_logged_email`, email.trim());
                                            Alert.alert("Activé !", "Vous pourrez utiliser la biométrie au prochain démarrage.");
                                        }
                                    }
                                }
                            ]
                        );
                    }
                } else if (isConfigured === 'true') {
                    // Met à jour l'email de sauvegarde au cas où il aurait changé
                    await AsyncStorage.setItem(`@last_logged_email`, email.trim());
                }
            }

        } catch (err: any) {
            Alert.alert("Erreur de connexion", err.message || "Identifiants incorrects.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setErrors({ email: "Entrez votre email pour la réinitialisation" });
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
            Alert.alert("Erreur", error.message);
        } else {
            Alert.alert("Email envoyé", "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.");
        }
    };

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: C.bg }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── HEADER (Sans flèche de retour) ── */}
                    <View style={styles.header}>
                        <View style={styles.profileBadge}>
                            <View style={[styles.profileBadgeIcon, { backgroundColor: C.purple100 }]}>
                                <Ionicons name="lock-open-outline" size={14} color={C.purple600} />
                            </View>
                            <Text style={[styles.profileBadgeText, { color: C.purple600 }]}>
                                Connexion sécurisée
                            </Text>
                        </View>
                    </View>

                    {/* ── TITRE ── */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Bon retour sur{"\n"}
                            <Text style={{ color: C.purple600 }}>TailorPro</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Connectez-vous pour gérer votre activité ou suivre vos commandes.
                        </Text>
                    </View>

                    {/* ── FORMULAIRE ── */}
                    <View style={styles.formSection}>
                        <Field
                            label="Adresse email"
                            icon="mail-outline"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setErrors(prev => ({...prev, email: undefined})); }}
                            placeholder="marie@atelier.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />

                        <Field
                            label="Mot de passe"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrors(prev => ({...prev, password: undefined})); }}
                            placeholder="••••••••"
                            autoCapitalize="none"
                            secure={!showPassword}
                            error={errors.password}
                            rightElement={
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowPassword((v) => !v)}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={17}
                                        color={C.textTertiary}
                                    />
                                </TouchableOpacity>
                            }
                        />

                        {/* Mot de passe oublié */}
                        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
                            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=> navigation.navigate('BiometricAuth')} style={styles.forgotWrap}>
                            <Text style={styles.forgotText}>Biometric Auth</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── FOOTER ── */}
                    <View style={styles.footer}>
                        {/* CTA Connexion */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleLogin}
                            disabled={loading}
                            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.ctaButtonText}>Se connecter</Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={17}
                                        color={C.gold}
                                        style={{ marginLeft: 8 }}
                                    />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Séparateur */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ou</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Lien Redirection Inscription */}
                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate("ChooseProfile")}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginText}>
                                Pas encore de compte ?{" "}
                                <Text style={styles.loginBold}>Créer un compte</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

// ── STYLES ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: 32,
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.purple200,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    profileBadgeIcon: {
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    profileBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    titleSection: { marginBottom: 32 },
    mainTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: C.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 36,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: C.textSecondary,
    },
    formSection: { marginBottom: 24 },
    eyeBtn: { position: "absolute", right: 14, padding: 4 },
    forgotWrap: {
        alignSelf: "flex-end",
        marginTop: 4,
        paddingVertical: 4,
    },
    forgotText: {
        fontSize: 13,
        color: C.purple600,
        fontWeight: "600",
    },
    footer: { marginTop: "auto" },
    ctaButton: {
        height: 54,
        borderRadius: 16,
        backgroundColor: C.purple900,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.1,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
    },
    dividerLine: { flex: 1, height: 0.5, backgroundColor: C.border },
    dividerText: { fontSize: 13, color: C.textTertiary },
    loginLink: { alignItems: "center", paddingVertical: 4 },
    loginText: { fontSize: 14, color: C.textSecondary },
    loginBold: { color: C.purple600, fontWeight: "700" },
});