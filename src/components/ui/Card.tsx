// ==========================================
// COMPOSANT CARD - TailorPro
// ==========================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/theme';

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
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
});
