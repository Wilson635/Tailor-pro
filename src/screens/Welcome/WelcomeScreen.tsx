// ==========================================
// ÉCRAN BIENVENUE — TailorPro
// Clair, soft, illustration atelier
// ==========================================

import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useTheme } from '@/src/theme';
import { ThemeToggle } from '@/src/components/ThemeToggle';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { height } = Dimensions.get('window');
const ILLU_H = Math.min(height * 0.38, 340);

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { isDark, colors: P } = useTheme();

    return (
        <View style={[styles.root, { backgroundColor: P.pageBg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 22 }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.top}>
                <Text style={[styles.brand, { color: P.text }]}>
                    Tailor<Text style={{ color: P.gold }}>Pro</Text>
                </Text>
                <ThemeToggle />
            </View>

            <View style={[styles.illuWrap, { backgroundColor: P.surface, borderColor: P.goldRim }]}>
                <Image
                    source={require('../../../assets/images/welcome.png')}
                    style={styles.illu}
                />
            </View>

            <Text style={[styles.tag, { color: P.gold }]}>Atelier</Text>
            <Text style={[styles.title, { color: P.text }]}>Bienvenue</Text>
            <Text style={[styles.body, { color: P.sub }]}>
                Gérez votre atelier — ou suivez vos confections — simplement, avec élégance.
            </Text>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate('Login')}
                style={[styles.primary, { backgroundColor: isDark ? P.bg : '#16123A' }]}
            >
                <Text style={[styles.primaryText, { color: P.gold }]}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={16} color={P.gold} />
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate('ChooseProfile')}
                style={[styles.secondary, { borderColor: P.borderHard, backgroundColor: P.surface }]}
            >
                <Text style={[styles.secondaryText, { color: P.text }]}>Créer un compte</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 22,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    brand: {
        fontSize: 20,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        letterSpacing: -0.4,
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
        fontSize: 34,
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        letterSpacing: -0.8,
        marginBottom: 10,
    },
    body: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_500Medium',
        lineHeight: 23,
        maxWidth: 340,
    },
    primary: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    primaryText: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    secondary: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryText: {
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
});
