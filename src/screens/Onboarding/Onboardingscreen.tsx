// ==========================================
// ONBOARDING — TailorPro
// Clair, soft, illustrations atelier
// ==========================================

import React, { useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Dimensions, FlatList, Animated, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/theme';
import { ThemeToggle } from '@/src/components/ThemeToggle';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');
const ILLU_H = Math.min(height * 0.42, 360);

const SLIDES = [
    {
        id: '1',
        tag: 'Clients',
        title: 'Vos clients,\nen un regard',
        description: 'Fiches, mesures et historique — tout est là, simplement.',
        image: require('../../../assets/images/onboarding/clients.png'),
    },
    {
        id: '2',
        tag: 'Commandes',
        title: 'De la toile\nà la livraison',
        description: 'Suivez chaque confection sans friction, jusqu’au dernier ourlet.',
        image: require('../../../assets/images/onboarding/orders.png'),
    },
    {
        id: '3',
        tag: 'Paiements',
        title: 'Avances et soldes\ntransparents',
        description: 'Voyez ce qui est dû, ce qui est encaissé, sans tableau complexe.',
        image: require('../../../assets/images/onboarding/payments.png'),
    },
    {
        id: '4',
        tag: 'Alertes',
        title: 'L’atelier vous\nprévient à temps',
        description: 'Essayages, livraisons, relances — les moments qui comptent.',
        image: require('../../../assets/images/onboarding/alerts.png'),
    },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isDark, colors: P } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const finish = async () => {
        await AsyncStorage.setItem('onboarding_done', 'true');
        navigation.replace('Welcome');
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            finish();
        }
    };

    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <View style={[styles.root, { backgroundColor: P.pageBg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
                <Text style={[styles.brand, { color: P.text }]}>
                    Tailor<Text style={{ color: P.gold }}>Pro</Text>
                </Text>
                <ThemeToggle />
            </View>

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
                    { useNativeDriver: false },
                )}
                onMomentumScrollEnd={e => {
                    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
                }}
                renderItem={({ item }) => (
                    <View style={[styles.slide, { width }]}>
                        <View style={[styles.illuWrap, { backgroundColor: P.surface, borderColor: P.goldRim }]}>
                            <Image source={item.image} style={styles.illu} />
                        </View>
                        <Text style={[styles.tag, { color: P.gold }]}>{item.tag}</Text>
                        <Text style={[styles.title, { color: P.text }]}>{item.title}</Text>
                        <Text style={[styles.body, { color: P.sub }]}>{item.description}</Text>
                    </View>
                )}
            />

            <View style={[styles.footer, { paddingBottom: insets.bottom + 22 }]}>
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => {
                        const w = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [7, 22, 7],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [0.25, 1, 0.25],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[styles.dot, { width: w, opacity, backgroundColor: P.gold }]}
                            />
                        );
                    })}
                </View>

                <View style={styles.actions}>
                    {!isLast && (
                        <TouchableOpacity onPress={finish} hitSlop={12}>
                            <Text style={[styles.skip, { color: P.muted }]}>Passer</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={handleNext}
                        activeOpacity={0.88}
                        style={[
                            styles.next,
                            isLast && { flex: 1 },
                            { backgroundColor: isDark ? P.bg : '#16123A' },
                        ]}
                    >
                        <Text style={[styles.nextText, { color: P.gold }]}>
                            {isLast ? 'Commencer' : 'Continuer'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={P.gold} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        paddingBottom: 8,
        zIndex: 2,
    },
    brand: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        letterSpacing: -0.4,
    },
    slide: {
        flex: 1,
        paddingHorizontal: 22,
        paddingTop: 8,
    },
    illuWrap: {
        height: ILLU_H,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 0.5,
        marginBottom: 22,
    },
    illu: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    tag: {
        fontSize: 11,
        fontFamily: 'PlusJakartaSans_700Bold',
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 30,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        letterSpacing: -0.8,
        lineHeight: 36,
        marginBottom: 10,
    },
    body: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_500Medium',
        lineHeight: 23,
        maxWidth: 340,
    },
    footer: {
        paddingHorizontal: 22,
        paddingTop: 8,
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    dot: { height: 6, borderRadius: 3 },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    skip: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_600SemiBold',
        paddingVertical: 14,
        paddingRight: 8,
    },
    next: {
        minWidth: 168,
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextText: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
});
