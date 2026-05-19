// ==========================================
// ONBOARDING - TailorPro
// ==========================================
// 4 étapes avant le WelcomeScreen
// Palette : #1A0033 / #D4AF37 / blanc
// ==========================================

import React, { useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Dimensions, FlatList, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

// ==========================================
// DATA
// ==========================================

const SLIDES = [
    {
        id: '1',
        icon:        'people' as const,
        iconBg:      '#2E0057',
        iconColor:   '#D4AF37',
        accentColor: '#D4AF37',
        tag:         'CLIENTS',
        title:       'Gérez vos\nclients facilement',
        description: 'Centralisez les fiches clients, mesures et historiques de commandes. Retrouvez n\'importe quelle information en quelques secondes.',
        features: ['Fiches clients détaillées', 'Mesures enregistrées', 'Historique complet'],
        bg1: '#1A0033',
        bg2: '#0D0019',
    },
    {
        id: '2',
        icon:        'cut' as const,
        iconBg:      '#D4AF37',
        iconColor:   '#1A0033',
        accentColor: '#D4AF37',
        tag:         'COMMANDES',
        title:       'Commandes &\nmesures en ordre',
        description: 'Suivez chaque commande de la prise de mesure jusqu\'à la livraison. Zéro oubli, zéro erreur.',
        features: ['Suivi en temps réel', 'Mesures précises', 'Délais respectés'],
        bg1: '#18002E',
        bg2: '#0A001A',
    },
    {
        id: '3',
        icon:        'wallet' as const,
        iconBg:      '#1A3A1A',
        iconColor:   '#4ADE80',
        accentColor: '#4ADE80',
        tag:         'PAIEMENTS',
        title:       'Paiements &\nabonnements clairs',
        description: 'Suivez les avances, soldes restants et factures en un clin d\'œil. Relancez automatiquement les impayés.',
        features: ['Avances & soldes', 'Facturation auto', 'Relances intelligentes'],
        bg1: '#001A00',
        bg2: '#000D00',
    },
    {
        id: '4',
        icon:        'notifications' as const,
        iconBg:      '#1A1000',
        iconColor:   '#F59E0B',
        accentColor: '#F59E0B',
        tag:         'NOTIFICATIONS',
        title:       'Suivi livraisons\n& alertes',
        description: 'Recevez des alertes pour chaque étape clé. Vos clients sont informés automatiquement de l\'avancement de leurs commandes.',
        features: ['Alertes en temps réel', 'Notifications clients', 'Rappels de livraison'],
        bg1: '#1A0E00',
        bg2: '#0D0700',
    },
];

// ==========================================
// COMPOSANT SLIDE
// ==========================================

const Slide = ({ item, index, scrollX }: {
    item: typeof SLIDES[0];
    index: number;
    scrollX: Animated.Value;
}) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [60, 0, 60],
        extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
    });
    const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.85, 1, 0.85],
        extrapolate: 'clamp',
    });

    return (
        <View style={[slideStyles.container, { width }]}>
            <LinearGradient
                colors={[item.bg1, item.bg2]}
                style={StyleSheet.absoluteFill}
            />

            {/* Cercles décoratifs */}
            <View style={[slideStyles.circle1, { borderColor: item.accentColor + '20' }]} />
            <View style={[slideStyles.circle2, { borderColor: item.accentColor + '10' }]} />

            <Animated.View style={[slideStyles.content, { opacity, transform: [{ translateY }, { scale }] }]}>

                {/* Tag */}
                <View style={[slideStyles.tag, { borderColor: item.accentColor + '40' }]}>
                    <View style={[slideStyles.tagDot, { backgroundColor: item.accentColor }]} />
                    <Text style={[slideStyles.tagText, { color: item.accentColor }]}>{item.tag}</Text>
                </View>

                {/* Icône principale */}
                <View style={[slideStyles.iconOuter, { borderColor: item.accentColor + '30' }]}>
                    <View style={[slideStyles.iconInner, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={52} color={item.iconColor} />
                    </View>
                </View>

                {/* Titre */}
                <Text style={slideStyles.title}>{item.title}</Text>

                {/* Description */}
                <Text style={slideStyles.description}>{item.description}</Text>

                {/* Features */}
                <View style={slideStyles.features}>
                    {item.features.map((f, i) => (
                        <View key={i} style={slideStyles.featureRow}>
                            <View style={[slideStyles.featureDot, { backgroundColor: item.accentColor }]} />
                            <Text style={slideStyles.featureText}>{f}</Text>
                        </View>
                    ))}
                </View>

            </Animated.View>
        </View>
    );
};

const slideStyles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 350,
        height: 350,
        borderRadius: 175,
        borderWidth: 1,
    },
    circle2: {
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 1,
    },
    content: {
        width: width - 48,
        alignItems: 'center',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 32,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    iconOuter: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 36,
    },
    iconInner: {
        width: 110,
        height: 110,
        borderRadius: 55,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -0.8,
        lineHeight: 40,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    features: {
        width: '100%',
        gap: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    featureDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    featureText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            // Marquer l'onboarding comme vu
            await AsyncStorage.setItem('onboarding_done', 'true');
            navigation.replace('Welcome');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('onboarding_done', 'true');
        navigation.replace('Welcome');
    };

    const isLast = currentIndex === SLIDES.length - 1;
    const accentColor = SLIDES[currentIndex].accentColor;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* ── Slides ── */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                )}
                onMomentumScrollEnd={e => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                renderItem={({ item, index }) => (
                    <Slide item={item} index={index} scrollX={scrollX} />
                )}
            />

            {/* ── Footer ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>

                {/* Dots */}
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const dotWidth = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const dotOpacity = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    { width: dotWidth, opacity: dotOpacity, backgroundColor: accentColor },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* Boutons */}
                <View style={styles.buttons}>

                    {/* Skip */}
                    {!isLast && (
                        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                            <Text style={styles.skipText}>Passer</Text>
                        </TouchableOpacity>
                    )}

                    {/* Suivant / Commencer */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={handleNext}
                        style={[styles.nextBtn, isLast && styles.nextBtnFull]}
                    >
                        <LinearGradient
                            colors={isLast ? ['#2E0057', '#18002E'] : [accentColor, accentColor + 'CC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.nextBtnGradient}
                        >
                            <Text style={[styles.nextBtnText, { color: isLast ? '#FFFFFF' : '#1A0033' }]}>
                                {isLast ? 'Commencer' : 'Suivant'}
                            </Text>
                            <Ionicons
                                name={isLast ? 'rocket-outline' : 'arrow-forward'}
                                size={17}
                                color={isLast ? '#D4AF37' : '#1A0033'}
                                style={{ marginLeft: 8 }}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A0033',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    skipBtn: {
        height: 54,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontWeight: '600',
    },
    nextBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    nextBtnFull: {
        flex: 1,
    },
    nextBtnGradient: {
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '700',
    },
});