// ==========================================
// ÉCRAN INSCRIPTION CLIENT - TailorPro (Redesign)
// ==========================================

import React, { useState } from "react";
import { showAlert } from '@/src/context/DialogContext';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    StyleSheet,
    Modal,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { RootStackParamList } from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterClient">;

// ── PALETTE (partagée avec ChooseProfileScreen) ──────────────────
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
    purple100:  "#EEEDFE",

    gold:       "#D4AF37",
    gold50:     "#FFFBF0",
    gold100:    "#FAEEDA",
    gold800:    "#412402",
    teal100:    "#9FE1CB",
    teal800:    "#04342C",
    blue100:    "#B5D4F4",
    blue800:    "#042C53",
};

// ── PAYS & CODES ─────────────────────────────────────────────────
interface Country {
    name: string;
    flag: string;
    code: string;
    iso: string;
    format: string;
}

const COUNTRIES: Country[] = [
    { name: "Côte d'Ivoire", flag: "🇨🇮", code: "+225", iso: "CI", format: "XX XX XX XX XX" },
    { name: "Sénégal",       flag: "🇸🇳", code: "+221", iso: "SN", format: "XX XXX XX XX" },
    { name: "Mali",          flag: "🇲🇱", code: "+223", iso: "ML", format: "XXXX XXXX" },
    { name: "Burkina Faso",  flag: "🇧🇫", code: "+226", iso: "BF", format: "XX XX XX XX" },
    { name: "Guinée",        flag: "🇬🇳", code: "+224", iso: "GN", format: "XXX XX XX XX" },
    { name: "Ghana",         flag: "🇬🇭", code: "+233", iso: "GH", format: "XX XXX XXXX" },
    { name: "Togo",          flag: "🇹🇬", code: "+228", iso: "TG", format: "XX XX XX XX" },
    { name: "Bénin",         flag: "🇧🇯", code: "+229", iso: "BJ", format: "XX XX XX XX" },
    { name: "Niger",         flag: "🇳🇪", code: "+227", iso: "NE", format: "XX XX XX XX" },
    { name: "Nigeria",       flag: "🇳🇬", code: "+234", iso: "NG", format: "XXX XXX XXXX" },
    { name: "Cameroun",      flag: "🇨🇲", code: "+237", iso: "CM", format: "X XXXX XXXX" },
    { name: "Congo (RDC)",   flag: "🇨🇩", code: "+243", iso: "CD", format: "XXX XXX XXX" },
    { name: "Congo",         flag: "🇨🇬", code: "+242", iso: "CG", format: "XX XXX XXXX" },
    { name: "Gabon",         flag: "🇬🇦", code: "+241", iso: "GA", format: "X XX XX XX" },
    { name: "Kenya",         flag: "🇰🇪", code: "+254", iso: "KE", format: "XXX XXX XXX" },
    { name: "Éthiopie",      flag: "🇪🇹", code: "+251", iso: "ET", format: "XX XXX XXXX" },
    { name: "France",        flag: "🇫🇷", code: "+33",  iso: "FR", format: "X XX XX XX XX" },
    { name: "Belgique",      flag: "🇧🇪", code: "+32",  iso: "BE", format: "XXX XX XX XX" },
    { name: "Suisse",        flag: "🇨🇭", code: "+41",  iso: "CH", format: "XX XXX XX XX" },
    { name: "États-Unis",    flag: "🇺🇸", code: "+1",   iso: "US", format: "XXX XXX XXXX" },
    { name: "Canada",        flag: "🇨🇦", code: "+1",   iso: "CA", format: "XXX XXX XXXX" },
    { name: "Maroc",         flag: "🇲🇦", code: "+212", iso: "MA", format: "XX XXX XXXX" },
];

// ── HELPERS ───────────────────────────────────────────────────────
const digitsOnly  = (v: string) => v.replace(/\D/g, "");
const maxDigits   = (format: string) => format.split("").filter((c) => c === "X").length;
const applyFormat = (digits: string, format: string): string => {
    let result = "";
    let di = 0;
    for (let i = 0; i < format.length && di < digits.length; i++) {
        if (format[i] === "X") { result += digits[di++]; }
        else { result += format[i]; if (di >= digits.length) break; }
    }
    return result;
};

// ── TYPES ────────────────────────────────────────────────────────
interface FormData {
    fullName: string;
    phoneDigits: string;
    phoneFormatted: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

// ── VALIDATION ───────────────────────────────────────────────────
const validate = (form: FormData, country: Country): FormErrors => {
    const errors: FormErrors = {};
    if (!form.fullName.trim()) errors.fullName = "Champ requis";
    const max = maxDigits(country.format);
    if (!form.phoneDigits) {
        errors.phone = "Champ requis";
    } else if (form.phoneDigits.length < max) {
        errors.phone = `${max} chiffres attendus pour ${country.name}`;
    }
    if (!form.email.trim()) {
        errors.email = "Champ requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = "Email invalide";
    }
    if (!form.password) {
        errors.password = "Champ requis";
    } else if (form.password.length < 6) {
        errors.password = "6 caractères minimum";
    }
    if (form.password !== form.confirmPassword) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    return errors;
};

// ── COMPOSANT CHAMP ───────────────────────────────────────────────
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
    keyboardType?: "default" | "email-address" | "phone-pad";
    autoCapitalize?: "none" | "words" | "sentences";
    secure?: boolean;
    error?: string;
    rightElement?: React.ReactNode;
}) => (
    <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>{label}</Text>
        <View style={[
            fieldStyles.inputWrap,
            error ? fieldStyles.inputError : null,
        ]}>
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
    wrap:       { marginBottom: 14 },
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
    icon:       { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 15,
        color: C.textPrimary,
        height: "100%",
    },
    errorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    errorText: { fontSize: 12, color: C.error },
});

// ── COMPOSANT CHAMP TÉLÉPHONE ─────────────────────────────────────
const PhoneField = ({
                        country,
                        value,
                        onChangeText,
                        onCountryPress,
                        error,
                    }: {
    country: Country;
    value: string;
    onChangeText: (formatted: string, digits: string) => void;
    onCountryPress: () => void;
    error?: string;
}) => {
    const handleChange = (text: string) => {
        const digits = digitsOnly(text);
        const max = maxDigits(country.format);
        const clamped = digits.slice(0, max);
        onChangeText(applyFormat(clamped, country.format), clamped);
    };

    return (
        <View style={fieldStyles.wrap}>
            <Text style={fieldStyles.label}>Téléphone</Text>
            <View style={[phoneStyles.row, error ? fieldStyles.inputError : null]}>
                <TouchableOpacity
                    style={phoneStyles.countryBtn}
                    onPress={onCountryPress}
                    activeOpacity={0.7}
                >
                    <Text style={phoneStyles.flag}>{country.flag}</Text>
                    <Text style={phoneStyles.code}>{country.code}</Text>
                    <Ionicons name="chevron-down" size={13} color={C.textTertiary} />
                </TouchableOpacity>
                <View style={phoneStyles.sep} />
                <TextInput
                    style={phoneStyles.input}
                    value={value}
                    onChangeText={handleChange}
                    placeholder={country.format.replace(/X/g, "0")}
                    placeholderTextColor={C.textTertiary}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                />
            </View>
            <Text style={phoneStyles.hint}>
                Format : {country.code} {country.format.replace(/X/g, "0")}
            </Text>
            {error && (
                <View style={fieldStyles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={12} color={C.error} />
                    <Text style={fieldStyles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const phoneStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        height: 50,
        overflow: "hidden",
    },
    countryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        height: "100%",
    },
    flag: { fontSize: 18 },
    code: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
    sep:  { width: 0.5, height: "60%", backgroundColor: C.border },
    input: { flex: 1, fontSize: 15, color: C.textPrimary, paddingHorizontal: 14, height: "100%" },
    hint: { fontSize: 11, color: C.textTertiary, marginTop: 4 },
});

// ── MODAL SÉLECTION PAYS ──────────────────────────────────────────
const CountryModal = ({
                          visible,
                          onClose,
                          onSelect,
                          selected,
                      }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (c: Country) => void;
    selected: Country;
}) => {
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState("");

    const filtered = COUNTRIES.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.includes(search)
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[modalStyles.container, { paddingTop: insets.top }]}>
                <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>Choisir un pays</Text>
                    <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
                        <Ionicons name="close" size={20} color={C.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={modalStyles.searchWrap}>
                    <Ionicons name="search-outline" size={15} color={C.textTertiary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={modalStyles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher un pays..."
                        placeholderTextColor={C.textTertiary}
                        autoCapitalize="none"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={15} color={C.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.iso}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                modalStyles.countryItem,
                                item.iso === selected.iso && modalStyles.countryItemActive,
                            ]}
                            onPress={() => { onSelect(item); onClose(); }}
                            activeOpacity={0.7}
                        >
                            <Text style={modalStyles.itemFlag}>{item.flag}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={modalStyles.itemName}>{item.name}</Text>
                                <Text style={modalStyles.itemFormat}>
                                    {item.code} · {item.format.replace(/X/g, "0")}
                                </Text>
                            </View>
                            {item.iso === selected.iso && (
                                <Ionicons name="checkmark" size={17} color={C.gold} />
                            )}
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={modalStyles.sep} />}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    title:    { fontSize: 17, fontWeight: "600", color: C.textPrimary },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: C.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        margin: 16,
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: C.border,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
    countryItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 14,
    },
    countryItemActive: { backgroundColor: C.gold100 },
    itemFlag:   { fontSize: 22 },
    itemName:   { fontSize: 15, color: C.textPrimary, fontWeight: "500" },
    itemFormat: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
    sep: { height: 0.5, backgroundColor: C.border, marginHorizontal: 20 },
});

// ── INDICATEUR D'ÉTAPES ───────────────────────────────────────────
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
    <View style={stepStyles.container}>
        {Array.from({ length: total }).map((_, i) => (
            <View
                key={i}
                style={[
                    stepStyles.dot,
                    i < current
                        ? stepStyles.dotDone
                        : i === current
                            ? stepStyles.dotActive
                            : stepStyles.dotInactive,
                ]}
            />
        ))}
    </View>
);

const stepStyles = StyleSheet.create({
    container: { flexDirection: "row", gap: 6, alignItems: "center" },
    dot:       { height: 6, borderRadius: 3 },
    dotInactive: { width: 6, backgroundColor: C.border },
    dotDone:     { width: 20, backgroundColor: C.purple600, opacity: 0.4 },
    dotActive:   { width: 22, backgroundColor: C.gold },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────
export const ClientRegisterScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading]               = useState(false);
    const [showPassword, setShowPassword]     = useState(false);
    const [showConfirm, setShowConfirm]       = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [errors, setErrors]                 = useState<FormErrors>({});
    const [selectedCountry, setSelectedCountry] = useState<Country>(
        COUNTRIES.find((c) => c.iso === "CM") ?? COUNTRIES[0]
    );
    const [form, setForm] = useState<FormData>({
        fullName: "",
        phoneDigits: "",
        phoneFormatted: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const update = (key: keyof FormData) => (value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (key !== "phoneDigits" && key !== "phoneFormatted" && errors[key as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const handlePhoneChange = (formatted: string, digits: string) => {
        setForm((prev) => ({ ...prev, phoneFormatted: formatted, phoneDigits: digits }));
        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
    };

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setForm((prev) => ({ ...prev, phoneFormatted: "", phoneDigits: "" }));
    };

    const handleRegister = async () => {
        const validationErrors = validate(form, selectedCountry);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        try {
            const fullPhone = `${selectedCountry.code} ${form.phoneFormatted}`;
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
                options: {
                    data: {
                        display_name: form.fullName.trim(),
                        phone:         fullPhone,
                        role:          "client",
                        atelier_name:  null,
                    },
                },
            });
            if (signUpError) throw signUpError;
            if (!data.user)  throw new Error("Erreur lors de la création du compte");

            if (!data.session) {
                showAlert(
                    "Vérification requise",
                    "Un email de confirmation a été envoyé. Vérifiez votre boîte mail.",
                    [{ text: "OK", onPress: () => navigation.navigate("Login") }]
                );
            }
        } catch (e: any) {
            showAlert("Erreur", e.message ?? "Impossible de créer le compte");
        } finally {
            setLoading(false);
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
                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={18} color={C.textPrimary} />
                        </TouchableOpacity>

                        {/* Badge profil */}
                        <View style={styles.profileBadge}>
                            <View style={[styles.profileBadgeIcon, { backgroundColor: C.gold100 }]}>
                                <Ionicons name="person-outline" size={14} color={C.gold800} />
                            </View>
                            <Text style={[styles.profileBadgeText, { color: C.gold800 }]}>
                                Espace client
                            </Text>
                        </View>
                    </View>

                    {/* ── STEP ── */}
                    <StepIndicator current={1} total={3} />
                    <Text style={styles.stepLabel}>Étape 2 sur 3</Text>

                    {/* ── TITRE ── */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Créer mon{"\n"}
                            <Text style={{ color: C.gold }}>compte client</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Suivez vos commandes et accédez à vos mesures en un clic.
                        </Text>
                    </View>

                    {/* ── FORMULAIRE ── */}
                    <View style={styles.formSection}>

                        {/* Section: Identité */}
                        <Text style={styles.sectionTitle}>Identité</Text>

                        <Field
                            label="Nom complet"
                            icon="person-outline"
                            value={form.fullName}
                            onChangeText={update("fullName")}
                            placeholder="Aminata Diallo"
                            autoCapitalize="words"
                            error={errors.fullName}
                        />
                        <PhoneField
                            country={selectedCountry}
                            value={form.phoneFormatted}
                            onChangeText={handlePhoneChange}
                            onCountryPress={() => setShowCountryModal(true)}
                            error={errors.phone}
                        />

                        {/* Section: Connexion */}
                        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Connexion</Text>

                        <Field
                            label="Adresse email"
                            icon="mail-outline"
                            value={form.email}
                            onChangeText={update("email")}
                            placeholder="aminata@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />
                        <Field
                            label="Mot de passe"
                            icon="lock-closed-outline"
                            value={form.password}
                            onChangeText={update("password")}
                            placeholder="6 caractères minimum"
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
                        <Field
                            label="Confirmer le mot de passe"
                            icon="lock-closed-outline"
                            value={form.confirmPassword}
                            onChangeText={update("confirmPassword")}
                            placeholder="Répétez le mot de passe"
                            autoCapitalize="none"
                            secure={!showConfirm}
                            error={errors.confirmPassword}
                            rightElement={
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowConfirm((v) => !v)}
                                >
                                    <Ionicons
                                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                                        size={17}
                                        color={C.textTertiary}
                                    />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    {/* ── FOOTER ── */}
                    <View style={styles.footer}>
                        {/* Chips recap */}
                        <View style={styles.chipsRow}>
                            <View style={[styles.chip, { backgroundColor: C.teal100 }]}>
                                <Ionicons name="cube-outline" size={12} color={C.teal800} />
                                <Text style={[styles.chipText, { color: C.teal800 }]}>Suivi de commandes</Text>
                            </View>
                            <View style={[styles.chip, { backgroundColor: C.blue100 }]}>
                                <Ionicons name="resize-outline" size={12} color={C.blue800} />
                                <Text style={[styles.chipText, { color: C.blue800 }]}>Mes mesures</Text>
                            </View>
                        </View>

                        {/* CTA */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleRegister}
                            disabled={loading}
                            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color={C.gold800} size="small" />
                            ) : (
                                <>
                                    <Text style={styles.ctaButtonText}>Créer mon compte</Text>
                                    <Ionicons name="arrow-forward" size={17} color={C.gold800} style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Séparateur */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ou</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Lien login */}
                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate("Login")}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginText}>
                                Déjà un compte ?{" "}
                                <Text style={styles.loginBold}>Se connecter</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal pays */}
            <CountryModal
                visible={showCountryModal}
                onClose={() => setShowCountryModal(false)}
                onSelect={handleCountrySelect}
                selected={selectedCountry}
            />
        </>
    );
};

// ── STYLES ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.gold,
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

    // Step
    stepLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textTertiary,
        letterSpacing: 0.5,
        //textTransform: "uppercase",
        marginTop: 8,
        marginBottom: 22,
    },

    // Title
    titleSection: { marginBottom: 28 },
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

    // Form
    formSection: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: C.textTertiary,
        letterSpacing: 0.8,
        //textTransform: "uppercase",
        marginBottom: 12,
    },
    eyeBtn: {
        position: "absolute",
        right: 14,
        padding: 4,
    },

    // Footer
    footer: { marginTop: "auto" },
    chipsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    chipText: { fontSize: 12, fontWeight: "600" },

    ctaButton: {
        height: 54,
        borderRadius: 16,
        backgroundColor: C.gold,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: C.gold800,
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