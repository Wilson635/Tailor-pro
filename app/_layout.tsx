// app/_layout.tsx
import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import {
    useFonts,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { supabase } from '@/src/lib/supabase';
import AppNavigator from '../src/navigation/AppNavigator';
import { COLORS } from '@constants/theme';
import { useAppStore } from '@store/useAppStore';
import { ToastProvider } from '@/src/context/ToastContext';

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    const loadAll = useAppStore(s => s.loadAll);

    useEffect(() => {
        // Récupérer la session existante au démarrage
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
            if (session?.user) loadAll();
        });

        // Observer les changements d'auth (Login / Logout / Register)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setIsLoading(false);
                if (session?.user) loadAll();
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Écran de chargement en attendant Supabase ET la police Plus Jakarta Sans
    if (isLoading || !fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Le navigateur prend désormais le contrôle complet selon l'état de "session"
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ToastProvider>
                    <StatusBar style={session ? "dark" : "light"} />
                    <AppNavigator session={session} />
                </ToastProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}