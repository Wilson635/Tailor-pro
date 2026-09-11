// ==========================================
// COMPOSANT CARD - TailorPro
// ==========================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SPACING } from '../../constants/theme';
import { usePalette } from '@/src/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
}) => {
  const colors = usePalette();
  const paddingValue = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.lg,
    lg: SPACING.xl,
  }[padding];

  return (
    <View
      style={[
        styles.card,
        {
          padding: paddingValue,
          backgroundColor: colors.surface,
          borderColor: colors.borderHard,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 0.5,
  },
});
