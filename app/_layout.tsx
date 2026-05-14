// ==========================================
// APP.TSX - TailorPro
// ==========================================

import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { LoginScreen } from '@components/Auth';
import { RegisterScreen } from '@components/Account';
import AppNavigator from '../src/navigation/AppNavigator';
import { COLORS } from '@constants/theme';
import { useAppStore } from '@store/useAppStore';

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);

    const loadAll = useAppStore(s => s.loadAll);

    useEffect(() => {
        // Récupérer la session existante au démarrage
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
            // 👇 Charger toutes les données si déjà connecté
            if (session?.user) loadAll();
        });

        // Observer les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setIsLoading(false);
                // 👇 Charger après chaque login
                if (session?.user) loadAll();
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!session) {
        return (
            <SafeAreaProvider>
                <StatusBar style="light" />
                {showRegister ? (
                    <RegisterScreen onNavigateToLogin={() => setShowRegister(false)} />
                ) : (
                    <LoginScreen onNavigateToRegister={() => setShowRegister(true)} />
                )}
            </SafeAreaProvider>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <AppNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}


/***************

import 'react-native-url-polyfill/auto'
import { useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Session } from '@supabase/supabase-js'

import { supabase } from '@/src/lib/supabase'
import { LoginScreen } from '@components/Auth'
import { RegisterScreen } from '@components/Account'
import AppNavigator from '../src/navigation/AppNavigator'
import { COLORS } from '@constants/theme'
import { useAppStore } from '@store/useAppStore'

export default function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showRegister, setShowRegister] = useState(false)
    const fetchProfile = useAppStore((s) => s.fetchProfile)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setIsLoading(false)
            // Si session existante au démarrage, charger le profil
            if (session?.user) fetchProfile()
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setIsLoading(false)
                // À chaque login, charger le profil
                if (session?.user) {
                    fetchProfile()
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        )
    }

    if (!session) {
        return (
            <SafeAreaProvider>
                <StatusBar style="light" />
                {showRegister ? (
                    <RegisterScreen onNavigateToLogin={() => setShowRegister(false)} />
                ) : (
                    <LoginScreen onNavigateToRegister={() => setShowRegister(true)} />
                )}
            </SafeAreaProvider>
        )
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <AppNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    )
}*/