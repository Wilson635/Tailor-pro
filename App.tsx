import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';

import AppNavigator from './src/navigation/AppNavigator';
import { COLORS, Typography } from '@constants/theme';
import { useAppStore } from '@store/useAppStore';
import { ToastProvider } from './src/context/ToastContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // @ts-ignore
  const { loadMockData } = useAppStore();

  useEffect(() => {
    const prepare = async () => {
      try {
        await Font.loadAsync({});
        loadMockData();
        setIsReady(true);
      } catch (e) {
        console.error('Error loading app:', e);
        setError("Erreur lors du chargement de l'application");
        setIsReady(true);
      }
    };

    prepare();
  }, [loadMockData]);

  if (!isReady) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
    );
  }

  if (error) {
    return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
    );
  }

  return (
      <GestureHandlerRootView style={styles.container}>
        {/* 1. SafeAreaProvider en premier */}
        <SafeAreaProvider>
          {/* 2. ToastProvider à l'intérieur */}
          <ToastProvider>
            <StatusBar style="dark" />
            <AppNavigator session={null} />
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    ...Typography.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    ...Typography.body,
    color: COLORS.danger,
    textAlign: 'center',
  },
});