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
import { PreferencesProvider } from '@/src/context/PreferencesContext';
import { useTheme } from '@/src/theme';

function ThemedApp({ session }: { session: Session | null }) {
    const { isDark } = useTheme();
    return (
        <>
            <StatusBar style={isDark ? 'light' : (session ? 'dark' : 'light')} />
            <AppNavigator session={session} />
        </>
    );
}

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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
            if (session?.user) loadAll();
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setIsLoading(false);
                if (session?.user) loadAll();
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading || !fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <PreferencesProvider>
                    <ToastProvider>
                        <ThemedApp session={session} />
                    </ToastProvider>
                </PreferencesProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
