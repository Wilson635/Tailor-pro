// ==========================================
// ÉTAPE 3 TAILLEUR — Personnalisation Atelier
// TailorPro (Redesign)
// ==========================================

import React, { useState, useRef } from "react";
import { showAlert } from '@/src/context/DialogContext';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Animated,
    Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/src/lib/supabase";
import type { RootStackParamList } from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "TailorSetup">;

// ── PALETTE ──────────────────────────────────────────────────────
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
    gold100:    "#FAEEDA",
    gold800:    "#412402",
};

// ── SPÉCIALITÉS DISPONIBLES ───────────────────────────────────────
interface Speciality {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const SPECIALITIES: Speciality[] = [
    { id: "mariage",      label: "Robes de mariée",        icon: "heart-outline" },
    { id: "traditionnel", label: "Tenues traditionnelles", icon: "globe-outline" },
    { id: "bureau",       label: "Tenues de bureau",       icon: "briefcase-outline" },
    { id: "enfant",       label: "Vêtements enfants",      icon: "happy-outline" },
    { id: "homme",        label: "Costumes homme",         icon: "man-outline" },
    { id: "broderie",     label: "Broderie & Dentelle",    icon: "color-palette-outline" },
    { id: "retouche",     label: "Retouches",              icon: "cut-outline" },
    { id: "accessoires",  label: "Accessoires",            icon: "bag-outline" },
];

// ── INDICATEUR D'ÉTAPES ───────────────────────────────────────────
const StepIndicator = () => (
    <View style={stepStyles.container}>
        {[0, 1, 2].map((i) => (
            <View
                key={i}
                style={[
                    stepStyles.dot,
                    i < 2 ? stepStyles.dotDone : stepStyles.dotActive,
                ]}
            />
        ))}
    </View>
);

const stepStyles = StyleSheet.create({
    container:   { flexDirection: "row", gap: 6, alignItems: "center" },
    dot:         { height: 6, borderRadius: 3 },
    dotDone:     { width: 20, backgroundColor: C.purple600, opacity: 0.4 },
    dotActive:   { width: 22, backgroundColor: C.purple600 },
});

// ── CHIP SPÉCIALITÉ ───────────────────────────────────────────────
const SpecialityChip = ({
                            item,
                            selected,
                            onPress,
                        }: {
    item: Speciality;
    selected: boolean;
    onPress: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
        ]).start();
        onPress();
    };

    return (
        <TouchableOpacity activeOpacity={1} onPress={handlePress}>
            <Animated.View
                style={[
                    chipStyles.chip,
                    selected ? chipStyles.chipSelected : chipStyles.chipUnselected,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Ionicons
                    name={item.icon}
                    size={14}
                    color={selected ? C.purple600 : C.textTertiary}
                />
                <Text style={[chipStyles.label, selected && chipStyles.labelSelected]}>
                    {item.label}
                </Text>
                {selected && (
                    <Ionicons name="checkmark" size={12} color={C.purple600} />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const chipStyles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
    },
    chipUnselected: {
        backgroundColor: C.surface,
        borderColor: C.border,
    },
    chipSelected: {
        backgroundColor: C.purple100,
        borderColor: C.purple200,
    },
    label: {
        fontSize: 13,
        fontWeight: "500",
        color: C.textSecondary,
    },
    labelSelected: {
        color: C.purple600,
        fontWeight: "600",
    },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────
export const TailorSetupScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading]             = useState(false);
    const [avatarUri, setAvatarUri]         = useState<string | null>(null);
    const [city, setCity]                   = useState("");
    const [district, setDistrict]           = useState("");
    const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
    const [cityError, setCityError]         = useState<string | undefined>();

    const toggleSpec = (id: string) => {
        setSelectedSpecs((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            showAlert("Permission requise", "Autorisez l'accès à votre galerie pour ajouter une photo.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleFinish = async () => {
        if (!city.trim()) {
            setCityError("Veuillez indiquer votre ville");
            return;
        }
        setCityError(undefined);
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur introuvable");

            // Mise à jour du profil tailleur dans la table users
            const { error } = await supabase
                .from("users")
                .update({
                    city:          city.trim(),
                    district:      district.trim() || null,
                    specialities:  selectedSpecs,
                    // avatar_url: à uploader via supabase storage si avatarUri est défini
                })
                .eq("id", user.id);

            if (error) throw error;

            // Navigation vers le dashboard tailleur
            // navigation.reset({ index: 0, routes: [{ name: "TailorHome" }] });

        } catch (e: any) {
            showAlert("Erreur", e.message ?? "Impossible de sauvegarder le profil");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // navigation.reset({ index: 0, routes: [{ name: "TailorHome" }] });
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
                        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── HEADER ── */}
                    <View style={styles.topRow}>
                        <StepIndicator />
                        <View style={styles.profileBadge}>
                            <Ionicons name="cut-outline" size={13} color={C.purple600} />
                            <Text style={styles.profileBadgeText}>Espace tailleur</Text>
                        </View>
                    </View>
                    <Text style={styles.stepLabel}>Étape 3 sur 3</Text>

                    {/* ── TITRE ── */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Votre{"\n"}
                            <Text style={{ color: C.purple600 }}>atelier en détail</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Ces informations aideront vos futurs clients à vous trouver et à choisir vos services.
                        </Text>
                    </View>

                    {/* ── PHOTO DE PROFIL ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Photo / Logo</Text>
                        <View style={styles.avatarRow}>
                            <TouchableOpacity
                                onPress={pickImage}
                                activeOpacity={0.85}
                                style={styles.avatarTouch}
                            >
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="camera-outline" size={26} color={C.purple600} />
                                    </View>
                                )}
                                <View style={styles.avatarEditBadge}>
                                    <Ionicons name="add" size={14} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.avatarHintTitle}>Ajoutez votre photo</Text>
                                <Text style={styles.avatarHint}>
                                    Un visuel professionnel augmente la confiance de vos clients. Format carré recommandé.
                                </Text>
                                {avatarUri && (
                                    <TouchableOpacity onPress={() => setAvatarUri(null)} style={styles.removePhoto}>
                                        <Text style={styles.removePhotoText}>Supprimer</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ── LOCALISATION ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Localisation</Text>

                        {/* Ville */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.fieldLabel}>Ville *</Text>
                            <View style={[
                                styles.inputWrap,
                                cityError ? styles.inputError : null,
                            ]}>
                                <Ionicons
                                    name="location-outline"
                                    size={17}
                                    color={cityError ? C.borderError : C.textTertiary}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={city}
                                    onChangeText={(v) => { setCity(v); if (cityError) setCityError(undefined); }}
                                    placeholder="Douala, Yaoundé…"
                                    placeholderTextColor={C.textTertiary}
                                    autoCapitalize="words"
                                />
                            </View>
                            {cityError && (
                                <View style={styles.errorRow}>
                                    <Ionicons name="alert-circle-outline" size={12} color={C.error} />
                                    <Text style={styles.errorText}>{cityError}</Text>
                                </View>
                            )}
                        </View>

                        {/* Quartier */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.fieldLabel}>Quartier <Text style={styles.optional}>(optionnel)</Text></Text>
                            <View style={styles.inputWrap}>
                                <Ionicons
                                    name="map-outline"
                                    size={17}
                                    color={C.textTertiary}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={district}
                                    onChangeText={setDistrict}
                                    placeholder="Bonanjo, Bastos…"
                                    placeholderTextColor={C.textTertiary}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>
                    </View>

                    {/* ── SPÉCIALITÉS ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Spécialités</Text>
                            {selectedSpecs.length > 0 && (
                                <View style={styles.specCount}>
                                    <Text style={styles.specCountText}>{selectedSpecs.length}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            Sélectionnez tout ce que vous proposez.
                        </Text>
                        <View style={styles.chipsGrid}>
                            {SPECIALITIES.map((item) => (
                                <SpecialityChip
                                    key={item.id}
                                    item={item}
                                    selected={selectedSpecs.includes(item.id)}
                                    onPress={() => toggleSpec(item.id)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* ── FOOTER ── */}
                    <View style={styles.footer}>
                        {/* CTA principal */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleFinish}
                            disabled={loading}
                            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.ctaButtonText}>Finaliser mon atelier</Text>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={18}
                                        color={C.gold}
                                        style={{ marginLeft: 8 }}
                                    />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Passer cette étape */}
                        <TouchableOpacity
                            onPress={handleSkip}
                            activeOpacity={0.7}
                            style={styles.skipButton}
                        >
                            <Text style={styles.skipText}>Passer cette étape</Text>
                            <Ionicons name="arrow-forward-outline" size={14} color={C.textTertiary} />
                        </TouchableOpacity>

                        <Text style={styles.footerNote}>
                            Vous pourrez compléter ces infos à tout moment depuis votre profil.
                        </Text>
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

    // Top
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.purple200,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: C.purple100,
    },
    profileBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: C.purple600,
        letterSpacing: 0.3,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textTertiary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginTop: 8,
        marginBottom: 24,
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

    // Sections
    section:       { marginBottom: 28 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: C.textTertiary,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: C.textSecondary,
        marginBottom: 12,
        marginTop: -8,
    },
    specCount: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.purple600,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    specCountText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // Avatar
    avatarRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    avatarTouch: { position: "relative" },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: C.purple100,
        borderWidth: 2,
        borderColor: C.purple200,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    avatarEditBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.purple600,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: C.bg,
    },
    avatarHintTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: C.textPrimary,
        marginBottom: 4,
    },
    avatarHint: {
        fontSize: 12,
        lineHeight: 18,
        color: C.textSecondary,
    },
    removePhoto: { marginTop: 6 },
    removePhotoText: {
        fontSize: 12,
        color: C.error,
        fontWeight: "600",
    },

    // Fields
    fieldWrap:  { marginBottom: 12 },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textSecondary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 6,
    },
    optional: {
        fontWeight: "400",
        color: C.textTertiary,
        textTransform: "none",
        fontSize: 11,
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
    input: { flex: 1, fontSize: 15, color: C.textPrimary, height: "100%" },
    errorRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    errorText: { fontSize: 12, color: C.error },

    // Chips grid
    chipsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    // Footer
    footer: { marginTop: "auto", paddingTop: 8 },
    ctaButton: {
        height: 54,
        borderRadius: 16,
        backgroundColor: C.purple900,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.1,
    },
    skipButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingVertical: 10,
        marginBottom: 10,
    },
    skipText: {
        fontSize: 14,
        color: C.textTertiary,
        fontWeight: "500",
    },
    footerNote: {
        textAlign: "center",
        fontSize: 12,
        color: C.textTertiary,
        lineHeight: 18,
    },
});