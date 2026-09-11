// ==========================================
// COMPOSANT CARD - TailorPro
// ==========================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/theme';
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
  shadow = 'sm',
}) => {
  const colors = usePalette();
  const paddingValue = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.lg,
    lg: SPACING.xl,
  }[padding];

  const shadowStyle = shadow !== 'none' ? SHADOWS[shadow] : {};

  return (
    <View
      style={[
        styles.card,
        shadowStyle,
        { padding: paddingValue, backgroundColor: colors.surface },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
  },
});
