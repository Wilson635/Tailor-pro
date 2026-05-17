// ==========================================
// ÉTAPE 3 CLIENT — Confirmation & Bienvenue
// TailorPro (Redesign)
// ==========================================

import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    Animated,
    Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ClientWelcome">;

// ── PALETTE ──────────────────────────────────────────────────────
const C = {
    bg:            "#FFFFFF",
    surface:       "#F7F6F4",
    border:        "#EBEBEB",
    textPrimary:   "#0E0B14",
    textSecondary: "#7A7787",
    textTertiary:  "#B0ACBA",

    purple900:  "#1A0033",
    purple600:  "#534AB7",
    purple100:  "#EEEDFE",

    gold:       "#D4AF37",
    gold100:    "#FAEEDA",
    gold800:    "#412402",

    teal:       "#1D9E75",
    teal100:    "#9FE1CB",
    teal800:    "#04342C",

    blue100:    "#B5D4F4",
    blue800:    "#042C53",

    green:      "#639922",
    green100:   "#C0DD97",
    green800:   "#173404",
};

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
    dotDone:     { width: 20, backgroundColor: C.gold, opacity: 0.4 },
    dotActive:   { width: 22, backgroundColor: C.gold },
});

// ── FEATURE CARD ─────────────────────────────────────────────────
const FeatureCard = ({
                         icon,
                         label,
                         description,
                         bg,
                         iconColor,
                         textColor,
                         descColor,
                         delay,
                     }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    bg: string;
    iconColor: string;
    textColor: string;
    descColor: string;
    delay: number;
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                featureStyles.card,
                { backgroundColor: bg },
                {
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                },
            ]}
        >
            <View style={[featureStyles.iconBox, { backgroundColor: "rgba(255,255,255,0.6)" }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[featureStyles.label, { color: textColor }]}>{label}</Text>
                <Text style={[featureStyles.desc, { color: descColor }]}>{description}</Text>
            </View>
        </Animated.View>
    );
};

const featureStyles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderRadius: 16,
        padding: 16,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    label: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
    desc:  { fontSize: 12, lineHeight: 17 },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────
export const ClientWelcomeScreen: React.FC<Props> = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();

    // Récupérer le nom depuis la navigation si disponible
    const displayName: string = (route.params as any)?.displayName ?? "vous";

    // Animations
    const checkAnim  = useRef(new Animated.Value(0)).current;
    const fadeAnim   = useRef(new Animated.Value(0)).current;
    const slideAnim  = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(checkAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleStart = () => {
        // Navigation vers le dashboard client
        // navigation.reset({ index: 0, routes: [{ name: "ClientHome" }] });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── STEP ── */}
            <View style={styles.topRow}>
                <StepIndicator />
                <View style={styles.profileBadge}>
                    <Ionicons name="person-outline" size={13} color={C.gold800} />
                    <Text style={styles.profileBadgeText}>Espace client</Text>
                </View>
            </View>
            <Text style={styles.stepLabel}>Étape 3 sur 3</Text>

            {/* ── ICÔNE CHECK ── */}
            <View style={styles.checkSection}>
                <Animated.View
                    style={[
                        styles.checkOuter,
                        { transform: [{ scale: checkAnim }] },
                    ]}
                >
                    <View style={styles.checkInner}>
                        <Ionicons name="checkmark" size={36} color={C.gold} />
                    </View>
                </Animated.View>
            </View>

            {/* ── TITRE ── */}
            <Animated.View
                style={[
                    styles.titleSection,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <Text style={styles.mainTitle}>
                    Bienvenue,{"\n"}
                    <Text style={{ color: C.gold }}>{displayName} 🎉</Text>
                </Text>
                <Text style={styles.subtitle}>
                    Votre compte client est prêt. Voici ce que vous pouvez faire dès maintenant.
                </Text>
            </Animated.View>

            {/* ── FEATURES ── */}
            <View style={styles.featuresSection}>
                <FeatureCard
                    icon="cube-outline"
                    label="Suivre mes commandes"
                    description="Consultez l'état de vos commandes en temps réel."
                    bg={C.teal100}
                    iconColor={C.teal800}
                    textColor={C.teal800}
                    descColor={C.teal}
                    delay={300}
                />
                <FeatureCard
                    icon="resize-outline"
                    label="Mes mesures"
                    description="Accédez à votre carnet de mesures personnalisé."
                    bg={C.blue100}
                    iconColor={C.blue800}
                    textColor={C.blue800}
                    descColor="#185FA5"
                    delay={420}
                />
                <FeatureCard
                    icon="notifications-outline"
                    label="Notifications"
                    description="Soyez alerté à chaque avancement de votre tenue."
                    bg={C.green100}
                    iconColor={C.green800}
                    textColor={C.green800}
                    descColor={C.green}
                    delay={540}
                />
            </View>

            {/* ── CTA ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleStart}
                    style={styles.ctaButton}
                >
                    <Text style={styles.ctaButtonText}>Accéder à mon espace</Text>
                    <Ionicons name="arrow-forward" size={17} color={C.gold800} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Un email de confirmation vous a été envoyé.
                </Text>
            </View>
        </View>
    );
};

// ── STYLES ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
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
        borderColor: C.gold,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: C.gold100,
    },
    profileBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: C.gold800,
        letterSpacing: 0.3,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textTertiary,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 32,
    },

    // Check
    checkSection: {
        alignItems: "center",
        marginBottom: 28,
    },
    checkOuter: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: C.gold100,
        alignItems: "center",
        justifyContent: "center",
    },
    checkInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: C.gold,
        alignItems: "center",
        justifyContent: "center",
    },

    // Title
    titleSection: { marginBottom: 28 },
    mainTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: C.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 36,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: C.textSecondary,
    },

    // Features
    featuresSection: { gap: 10, marginBottom: 32 },

    // Footer
    footer: { marginTop: "auto" },
    ctaButton: {
        height: 54,
        borderRadius: 16,
        backgroundColor: C.gold,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: C.gold800,
        letterSpacing: 0.1,
    },
    footerNote: {
        textAlign: "center",
        fontSize: 12,
        color: C.textTertiary,
    },
});