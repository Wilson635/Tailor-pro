import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';

import AppNavigator from './src/navigation/AppNavigator';
import { COLORS, Typography } from '@constants/theme';
import {  useAppStore } from '@store/useAppStore';

// Note: Firebase is not initialized in this demo version
// To enable Firebase, uncomment the import and initialization below:
// import { initializeFirebase } from './src/services/firebase/config';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // @ts-ignore
  const { loadMockData } = useAppStore();

  useEffect(() => {
    const prepare = async () => {
      try {
        // Load fonts if needed
        await Font.loadAsync({
          // Add custom fonts here if needed
        });

        // Initialize Firebase (uncomment when ready)
        // await initializeFirebase();

        // Load mock data for demonstration
        loadMockData();

        setIsReady(true);
      } catch (e) {
        console.error('Error loading app:', e);
        setError('Erreur lors du chargement de l\'application');
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
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
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
