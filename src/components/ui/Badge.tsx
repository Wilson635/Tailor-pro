// ==========================================
// COMPOSANT BADGE - TailorPro
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const VARIANT_COLORS = {
  primary: { bg: COLORS.secondary, text: COLORS.primary },
  success: { bg: COLORS.successLight, text: COLORS.success },
  warning: { bg: COLORS.warningLight, text: COLORS.warning },
  error: { bg: COLORS.errorLight, text: COLORS.error },
  info: { bg: COLORS.infoLight, text: COLORS.info },
  neutral: { bg: COLORS.gray100, text: COLORS.gray600 },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'sm',
  style,
}) => {
  const colors = VARIANT_COLORS[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'md' && styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  textMd: {
    fontSize: FONT_SIZES.sm,
  },
});
