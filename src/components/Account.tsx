// ==========================================
// ÉCRAN INSCRIPTION - TailorPro
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
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';

// ==========================================
// PAYS & CODES
// ==========================================

interface Country {
    name: string;
    flag: string;
    code: string;       // ex: "+225"
    iso: string;        // ex: "CI"
    format: string;     // masque d'affichage, X = chiffre
}

const COUNTRIES: Country[] = [
    // ── Afrique de l'Ouest ──
    { name: "Côte d'Ivoire", flag: '🇨🇮', code: '+225', iso: 'CI', format: 'XX XX XX XX XX' },
    { name: 'Sénégal',       flag: '🇸🇳', code: '+221', iso: 'SN', format: 'XX XXX XX XX' },
    { name: 'Mali',          flag: '🇲🇱', code: '+223', iso: 'ML', format: 'XXXX XXXX' },
    { name: 'Burkina Faso',  flag: '🇧🇫', code: '+226', iso: 'BF', format: 'XX XX XX XX' },
    { name: 'Guinée',        flag: '🇬🇳', code: '+224', iso: 'GN', format: 'XXX XX XX XX' },
    { name: 'Ghana',         flag: '🇬🇭', code: '+233', iso: 'GH', format: 'XX XXX XXXX' },
    { name: 'Togo',          flag: '🇹🇬', code: '+228', iso: 'TG', format: 'XX XX XX XX' },
    { name: 'Bénin',         flag: '🇧🇯', code: '+229', iso: 'BJ', format: 'XX XX XX XX' },
    { name: 'Niger',         flag: '🇳🇪', code: '+227', iso: 'NE', format: 'XX XX XX XX' },
    { name: 'Nigeria',       flag: '🇳🇬', code: '+234', iso: 'NG', format: 'XXX XXX XXXX' },
    // ── Afrique Centrale ──
    { name: 'Cameroun',      flag: '🇨🇲', code: '+237', iso: 'CM', format: 'X XXXX XXXX' },
    { name: 'Congo (RDC)',   flag: '🇨🇩', code: '+243', iso: 'CD', format: 'XXX XXX XXX' },
    { name: 'Congo',         flag: '🇨🇬', code: '+242', iso: 'CG', format: 'XX XXX XXXX' },
    { name: 'Gabon',         flag: '🇬🇦', code: '+241', iso: 'GA', format: 'X XX XX XX' },
    // ── Afrique de l'Est ──
    { name: 'Kenya',         flag: '🇰🇪', code: '+254', iso: 'KE', format: 'XXX XXX XXX' },
    { name: 'Éthiopie',      flag: '🇪🇹', code: '+251', iso: 'ET', format: 'XX XXX XXXX' },
    // ── Europe ──
    { name: 'France',        flag: '🇫🇷', code: '+33',  iso: 'FR', format: 'X XX XX XX XX' },
    { name: 'Belgique',      flag: '🇧🇪', code: '+32',  iso: 'BE', format: 'XXX XX XX XX' },
    { name: 'Suisse',        flag: '🇨🇭', code: '+41',  iso: 'CH', format: 'XX XXX XX XX' },
    // ── Autres ──
    { name: 'États-Unis',    flag: '🇺🇸', code: '+1',   iso: 'US', format: 'XXX XXX XXXX' },
    { name: 'Canada',        flag: '🇨🇦', code: '+1',   iso: 'CA', format: 'XXX XXX XXXX' },
    { name: 'Maroc',         flag: '🇲🇦', code: '+212', iso: 'MA', format: 'XX XXX XXXX' },
];

// ==========================================
// HELPERS - FORMATAGE
// ==========================================

/** Retire tous les non-chiffres */
const digitsOnly = (v: string) => v.replace(/\D/g, '');

/** Applique le masque au fur et à mesure de la saisie */
const applyFormat = (digits: string, format: string): string => {
    let result = '';
    let di = 0;
    for (let i = 0; i < format.length && di < digits.length; i++) {
        if (format[i] === 'X') {
            result += digits[di++];
        } else {
            result += format[i];
            // si le prochain char du format est un espace mais qu'on n'a plus de digit, on arrête
            if (di >= digits.length) break;
        }
    }
    return result;
};

/** Nombre max de chiffres selon le format */
const maxDigits = (format: string) => format.split('').filter((c) => c === 'X').length;

// ==========================================
// TYPES FORMULAIRE
// ==========================================

interface FormData {
    displayName: string;
    atelierName: string;
    phoneDigits: string;   // chiffres bruts
    phoneFormatted: string; // affichage avec espaces
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    displayName?: string;
    atelierName?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

// ==========================================
// VALIDATION
// ==========================================

const validate = (form: FormData, country: Country): FormErrors => {
    const errors: FormErrors = {};
    if (!form.displayName.trim()) errors.displayName = 'Champ requis';
    if (!form.atelierName.trim()) errors.atelierName = 'Champ requis';

    const max = maxDigits(country.format);
    if (!form.phoneDigits) {
        errors.phone = 'Champ requis';
    } else if (form.phoneDigits.length < max) {
        errors.phone = `${max} chiffres attendus pour ${country.name}`;
    }

    if (!form.email.trim()) {
        errors.email = 'Champ requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Email invalide';
    }
    if (!form.password) {
        errors.password = 'Champ requis';
    } else if (form.password.length < 6) {
        errors.password = '6 caractères minimum';
    }
    if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    return errors;
};

// ==========================================
// SOUS-COMPOSANT — CHAMP TEXTE GÉNÉRIQUE
// ==========================================

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
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'words' | 'sentences';
    secure?: boolean;
    error?: string;
    rightElement?: React.ReactNode;
}) => (
    <View style={fStyles.wrap}>
        <Text style={fStyles.label}>{label}</Text>
        <View style={[fStyles.inputWrap, error ? fStyles.inputError : null]}>
            <Ionicons name={icon} size={18} color={COLORS.gray400} style={fStyles.icon} />
            <TextInput
                style={[fStyles.input, rightElement ? { paddingRight: 44 } : null]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray400}
                keyboardType={keyboardType ?? 'default'}
                autoCapitalize={autoCapitalize ?? 'sentences'}
                autoCorrect={false}
                secureTextEntry={secure}
            />
            {rightElement}
        </View>
        {error ? <Text style={fStyles.errorText}>{error}</Text> : null}
    </View>
);

const fStyles = StyleSheet.create({
    wrap: { marginBottom: SPACING.md },
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
    inputError: { borderColor: COLORS.error },
    icon: { marginRight: SPACING.sm },
    input: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        height: '100%',
    },
    errorText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.error,
        marginTop: 4,
    },
});

// ==========================================
// SOUS-COMPOSANT — CHAMP TÉLÉPHONE
// ==========================================

const PhoneField = ({
                        country,
                        value,
                        onChangeText,
                        onCountryPress,
                        error,
                    }: {
    country: Country;
    value: string;         // texte formaté affiché
    onChangeText: (formatted: string, digits: string) => void;
    onCountryPress: () => void;
    error?: string;
}) => {
    const handleChange = (text: string) => {
        const digits = digitsOnly(text);
        const max = maxDigits(country.format);
        const clamped = digits.slice(0, max);
        const formatted = applyFormat(clamped, country.format);
        onChangeText(formatted, clamped);
    };

    return (
        <View style={fStyles.wrap}>
            <Text style={fStyles.label}>Téléphone</Text>
            <View style={[phoneStyles.row, error ? fStyles.inputError : null]}>
                {/* Sélecteur pays */}
                <TouchableOpacity style={phoneStyles.countryBtn} onPress={onCountryPress} activeOpacity={0.7}>
                    <Text style={phoneStyles.flag}>{country.flag}</Text>
                    <Text style={phoneStyles.code}>{country.code}</Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.gray400} />
                </TouchableOpacity>

                {/* Séparateur */}
                <View style={phoneStyles.sep} />

                {/* Input numéro */}
                <TextInput
                    style={phoneStyles.input}
                    value={value}
                    onChangeText={handleChange}
                    placeholder={country.format.replace(/X/g, '0')}
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                />
            </View>
            {/* Format hint */}
            <Text style={phoneStyles.hint}>
                Format : {country.code} {country.format.replace(/X/g, '0')}
            </Text>
            {error ? <Text style={fStyles.errorText}>{error}</Text> : null}
        </View>
    );
};

const phoneStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        height: 46,
        overflow: 'hidden',
    },
    countryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.md,
        height: '100%',
    },
    flag: { fontSize: 18 },
    code: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
        color: COLORS.text,
    },
    sep: {
        width: 0.5,
        height: '60%',
        backgroundColor: COLORS.border,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        paddingHorizontal: SPACING.md,
        height: '100%',
    },
    hint: {
        fontSize: 11,
        color: COLORS.textLight,
        marginTop: 4,
    },
});

// ==========================================
// SOUS-COMPOSANT — MODAL PAYS
// ==========================================

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
    const [search, setSearch] = useState('');

    const filtered = COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[modalStyles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>Choisir un pays</Text>
                    <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                        <Ionicons name="close" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* Recherche */}
                <View style={modalStyles.searchWrap}>
                    <Ionicons name="search-outline" size={16} color={COLORS.gray400} style={{ marginRight: 8 }} />
                    <TextInput
                        style={modalStyles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher un pays..."
                        placeholderTextColor={COLORS.gray400}
                        autoCapitalize="none"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Liste */}
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
                            <View style={modalStyles.itemInfo}>
                                <Text style={modalStyles.itemName}>{item.name}</Text>
                                <Text style={modalStyles.itemFormat}>
                                    {item.code} · {item.format.replace(/X/g, '0')}
                                </Text>
                            </View>
                            {item.iso === selected.iso && (
                                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={modalStyles.sep} />}
                    contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xxxl }}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.text,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: SPACING.lg,
        backgroundColor: COLORS.gray50,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.md,
    },
    countryItemActive: {
        backgroundColor: COLORS.secondary,
    },
    itemFlag: { fontSize: 22 },
    itemInfo: { flex: 1 },
    itemName: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        fontWeight: FONT_WEIGHTS.medium,
    },
    itemFormat: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    sep: {
        height: 0.5,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.lg,
    },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const RegisterScreen: React.FC<{ onNavigateToLogin: () => void }> = ({ onNavigateToLogin }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Côte d'Ivoire par défaut

    const [form, setForm] = useState<FormData>({
        displayName: '',
        atelierName: '',
        phoneDigits: '',
        phoneFormatted: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const update = (key: keyof FormData) => (value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (key !== 'phoneDigits' && key !== 'phoneFormatted' && errors[key as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    const handlePhoneChange = (formatted: string, digits: string) => {
        setForm((prev) => ({ ...prev, phoneFormatted: formatted, phoneDigits: digits }));
        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
    };

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        // Réinitialiser le numéro car le format change
        setForm((prev) => ({ ...prev, phoneFormatted: '', phoneDigits: '' }));
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
                        display_name: form.displayName.trim(),
                        atelier_name: form.atelierName.trim(),
                        phone: fullPhone,
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!data.user) throw new Error('Erreur lors de la création du compte');

            // Avec le trigger SQL, plus besoin d'insérer manuellement dans users ✅

            if (data.session) {
                // Email confirmation désactivé → connecté directement
                // Navigate vers l'écran principal
            } else {
                Alert.alert(
                    'Vérification requise',
                    'Un email de confirmation a été envoyé. Vérifiez votre boîte mail.',
                    [{ text: 'OK', onPress: onNavigateToLogin }]
                );
            }
        } catch (e: any) {
            Alert.alert('Erreur', e.message ?? "Impossible de créer le compte");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        <Text style={styles.heroSub}>Créez votre espace atelier</Text>
                    </View>

                    {/* ── Formulaire ── */}
                    <View style={styles.form}>
                        <View style={styles.formHeader}>
                            <Ionicons name="person-add-outline" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.formTitle}>Inscription</Text>
                        </View>

                        <Field
                            label="Nom complet"
                            icon="person-outline"
                            value={form.displayName}
                            onChangeText={update('displayName')}
                            placeholder="Marie Dupont"
                            error={errors.displayName}
                        />
                        <Field
                            label="Nom de l'atelier"
                            icon="storefront-outline"
                            value={form.atelierName}
                            onChangeText={update('atelierName')}
                            placeholder="Atelier Marie Couture"
                            error={errors.atelierName}
                        />

                        {/* Téléphone avec sélecteur de pays */}
                        <PhoneField
                            country={selectedCountry}
                            value={form.phoneFormatted}
                            onChangeText={handlePhoneChange}
                            onCountryPress={() => setShowCountryModal(true)}
                            error={errors.phone}
                        />

                        <Field
                            label="Adresse email"
                            icon="mail-outline"
                            value={form.email}
                            onChangeText={update('email')}
                            placeholder="marie@atelier.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />
                        <Field
                            label="Mot de passe"
                            icon="lock-closed-outline"
                            value={form.password}
                            onChangeText={update('password')}
                            placeholder="6 caractères minimum"
                            autoCapitalize="none"
                            secure={!showPassword}
                            error={errors.password}
                            rightElement={
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            }
                        />
                        <Field
                            label="Confirmer le mot de passe"
                            icon="lock-closed-outline"
                            value={form.confirmPassword}
                            onChangeText={update('confirmPassword')}
                            placeholder="Répétez le mot de passe"
                            autoCapitalize="none"
                            secure={!showConfirm}
                            error={errors.confirmPassword}
                            rightElement={
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm((v) => !v)}>
                                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray400} />
                                </TouchableOpacity>
                            }
                        />

                        <TouchableOpacity
                            style={[styles.cta, loading && styles.ctaDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.ctaText}>Créer mon compte</Text>
                            }
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>ou</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.switchWrap} onPress={onNavigateToLogin}>
                            <Text style={styles.switchText}>
                                Déjà un compte ?{' '}
                                <Text style={styles.switchLink}>Se connecter</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal sélection pays */}
            <CountryModal
                visible={showCountryModal}
                onClose={() => setShowCountryModal(false)}
                onSelect={handleCountrySelect}
                selected={selectedCountry}
            />
        </>
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
        paddingBottom: 32,
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

    eyeBtn: { position: 'absolute', right: SPACING.md, padding: 4 },

    cta: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.sm,
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