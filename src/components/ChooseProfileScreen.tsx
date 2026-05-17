// ==========================================
// ÉCRAN CHOIX DE PROFIL - TailorPro (Redesign)
// ==========================================

import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    StyleSheet,
    Animated,
    Easing,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ChooseProfile">;
type ProfileType = "tailor" | "client" | null;

// ── PALETTE ──────────────────────────────
const COLORS = {
    bg: "#FFFFFF",
    surface: "#F7F6F4",
    border: "#EBEBEB",
    textPrimary: "#0E0B14",
    textSecondary: "#7A7787",
    textTertiary: "#B0ACBA",

    // Brand
    purple900: "#1A0033",
    purple700: "#2E0057",
    purple600: "#534AB7",
    purple100: "#EEEDFE",
    purple50:  "#F7F5FF",

    // Gold
    gold:      "#D4AF37",
    gold800:   "#412402",
    gold100:   "#FAEEDA",
    gold50:    "#FFFBF0",

    // Tailor active
    tailorBg:  "#EEEDFE",
    tailorBorder: "#534AB7",
    tailorIcon:   "#534AB7",
    tailorText:   "#26215C",
    tailorDesc:   "#3C3489",
    tailorBadgeBg:"#534AB7",
    tailorChip1Bg:"#CECBF6",
    tailorChip1Text:"#26215C",

    // Client active
    clientBg:  "#FAEEDA",
    clientBorder: "#D4AF37",
    clientIcon:   "#D4AF37",
    clientText:   "#412402",
    clientDesc:   "#633806",
    clientBadgeBg:"#D4AF37",
    clientChip1Bg:"#9FE1CB",
    clientChip1Text:"#04342C",

    // Teal chip
    teal100: "#9FE1CB",
    teal800: "#04342C",
    blue100: "#B5D4F4",
    blue800: "#042C53",
};

// ── CHIP ─────────────────────────────────
type ChipProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    bg: string;
    textColor: string;
};
const Chip: React.FC<ChipProps> = ({ icon, label, bg, textColor }) => (
    <View style={[chipStyles.chip, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={13} color={textColor} />
        <Text style={[chipStyles.label, { color: textColor }]}>{label}</Text>
    </View>
);
const chipStyles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.1,
    },
});

// ── PROFILE CARD ─────────────────────────
type CardProps = {
    type: "tailor" | "client";
    selected: boolean;
    onPress: () => void;
};

const ProfileCard: React.FC<CardProps> = ({ type, selected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.975,
            useNativeDriver: true,
            speed: 30,
            bounciness: 4,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 6,
        }).start();
    };

    const isTailor = type === "tailor";

    const cardStyle = selected
        ? isTailor
            ? { backgroundColor: COLORS.tailorBg, borderColor: COLORS.tailorBorder, borderWidth: 2 }
            : { backgroundColor: COLORS.clientBg, borderColor: COLORS.clientBorder, borderWidth: 2 }
        : { backgroundColor: COLORS.bg, borderColor: COLORS.border, borderWidth: 1 };

    const iconBg = selected
        ? isTailor ? COLORS.tailorBorder : COLORS.clientBorder
        : COLORS.surface;

    const iconColor = selected
        ? isTailor ? "#FFFFFF" : COLORS.gold800
        : COLORS.textTertiary;

    const titleColor = selected
        ? isTailor ? COLORS.tailorText : COLORS.clientText
        : COLORS.textPrimary;

    const descColor = selected
        ? isTailor ? COLORS.tailorDesc : COLORS.clientDesc
        : COLORS.textSecondary;

    const checkBg = selected
        ? isTailor ? COLORS.tailorBorder : COLORS.clientBorder
        : "transparent";

    const checkBorderColor = selected
        ? "transparent"
        : COLORS.border;

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    cardStyles.card,
                    cardStyle,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {/* ── ROW ── */}
                <View style={cardStyles.row}>
                    {/* Icon */}
                    <View style={[cardStyles.iconBox, { backgroundColor: iconBg }]}>
                        <Ionicons
                            name={isTailor ? "cut-outline" : "person-outline"}
                            size={22}
                            color={iconColor}
                        />
                    </View>

                    {/* Text */}
                    <View style={cardStyles.textBlock}>
                        <Text style={[cardStyles.title, { color: titleColor }]}>
                            {isTailor ? "Couturier / Tailleur" : "Client"}
                        </Text>
                        <Text style={[cardStyles.description, { color: descColor }]}>
                            {isTailor
                                ? "Gérez vos clients, commandes et votre atelier au complet."
                                : "Suivez vos commandes et accédez à vos mesures facilement."}
                        </Text>
                    </View>

                    {/* Checkbox */}
                    <View
                        style={[
                            cardStyles.checkbox,
                            {
                                backgroundColor: checkBg,
                                borderColor: checkBorderColor,
                                borderWidth: selected ? 0 : 1,
                            },
                        ]}
                    >
                        {selected && (
                            <Ionicons
                                name="checkmark"
                                size={12}
                                color={isTailor ? "#FFFFFF" : COLORS.gold800}
                            />
                        )}
                    </View>
                </View>

                {/* ── BADGES ── */}
                {selected && (
                    <View style={cardStyles.chips}>
                        {isTailor ? (
                            <>
                                <Chip
                                    icon="sparkles-outline"
                                    label="Accès complet à l'atelier"
                                    bg={COLORS.tailorChip1Bg}
                                    textColor={COLORS.tailorChip1Text}
                                />
                                <Chip
                                    icon="people-outline"
                                    label="Gestion clients"
                                    bg={COLORS.tailorChip1Bg}
                                    textColor={COLORS.tailorChip1Text}
                                />
                            </>
                        ) : (
                            <>
                                <Chip
                                    icon="cube-outline"
                                    label="Suivi de commandes"
                                    bg={COLORS.teal100}
                                    textColor={COLORS.teal800}
                                />
                                <Chip
                                    icon="resize-outline"
                                    label="Mes mesures"
                                    bg={COLORS.blue100}
                                    textColor={COLORS.blue800}
                                />
                            </>
                        )}
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const cardStyles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 18,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    textBlock: {
        flex: 1,
        paddingRight: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: -0.2,
    },
    description: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 19,
        fontWeight: "400",
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
        flexShrink: 0,
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 0.5,
        borderTopColor: "rgba(0,0,0,0.07)",
    },
});

// ── MAIN SCREEN ───────────────────────────
export const ChooseProfileScreen: React.FC<Props> = ({ navigation }) => {
    const [selected, setSelected] = useState<ProfileType>(null);

    const handleContinue = () => {
        if (!selected) return;
        if (selected === "tailor") {
            navigation.navigate("Register");
        } else {
            navigation.navigate("RegisterClient");
        }
    };

    const btnActive = !!selected;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.logo}>
                        <View style={styles.logoBg}>
                            <Image
                                source={require("../../assets/logo/logo.png")}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={styles.logoText}>
                            Tailor<Text style={{ color: COLORS.gold }}>Pro</Text>
                        </Text>
                    </View>

                    {/* Spacer */}
                    <View style={{ width: 38 }} />
                </View>

                {/* ── STEP INDICATOR ── */}
                <View style={styles.stepRow}>
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                </View>
                <Text style={styles.stepLabel}>Étape 1 sur 3</Text>

                {/* ── TITLE ── */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Vous êtes…</Text>
                    <Text style={styles.subtitle}>
                        Choisissez votre profil pour personnaliser votre expérience.
                    </Text>
                </View>

                {/* ── CARDS ── */}
                <View style={styles.cardsContainer}>
                    <ProfileCard
                        type="tailor"
                        selected={selected === "tailor"}
                        onPress={() => setSelected("tailor")}
                    />
                    <ProfileCard
                        type="client"
                        selected={selected === "client"}
                        onPress={() => setSelected("client")}
                    />
                </View>

                {/* ── FOOTER ── */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        activeOpacity={btnActive ? 0.85 : 1}
                        onPress={handleContinue}
                        disabled={!btnActive}
                        style={[
                            styles.continueButton,
                            btnActive ? styles.continueButtonActive : styles.continueButtonDisabled,
                        ]}
                    >
                        <Text
                            style={[
                                styles.continueButtonText,
                                !btnActive && { color: COLORS.textTertiary },
                            ]}
                        >
                            Continuer
                        </Text>
                        {btnActive && (
                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color={COLORS.gold}
                                style={{ marginLeft: 8 }}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}
                        style={styles.loginLink}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.loginText}>
                            Déjà un compte ?{" "}
                            <Text style={styles.loginBold}>Se connecter</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

// ── STYLES ────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 40,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 28,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logoBg: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: COLORS.purple900,
        alignItems: "center",
        justifyContent: "center",
    },
    logoImage: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    logoText: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.purple900,
        letterSpacing: -0.3,
    },

    // Step indicator
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    stepDotActive: {
        backgroundColor: COLORS.purple600,
        width: 22,
        borderRadius: 4,
    },
    stepLine: {
        height: 1,
        width: 24,
        backgroundColor: COLORS.border,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textTertiary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 24,
    },

    // Title
    titleSection: {
        marginBottom: 28,
    },
    mainTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textSecondary,
        fontWeight: "400",
    },

    // Cards
    cardsContainer: {
        gap: 10,
        marginBottom: 36,
    },

    // Footer
    footer: {
        marginTop: "auto",
    },
    continueButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 18,
    },
    continueButtonActive: {
        backgroundColor: COLORS.purple900,
    },
    continueButtonDisabled: {
        backgroundColor: COLORS.surface,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
        letterSpacing: 0.1,
    },
    loginLink: {
        alignItems: "center",
        paddingVertical: 4,
    },
    loginText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    loginBold: {
        color: COLORS.purple600,
        fontWeight: "700",
    },
});