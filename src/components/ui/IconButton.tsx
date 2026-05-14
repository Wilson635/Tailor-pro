// ==========================================
// COMPOSANT ICON BUTTON - TailorPro
// ==========================================

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES } from '../../constants/theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
};

const BUTTON_SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  label,
  disabled = false,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: COLORS.primary, icon: COLORS.white };
      case 'outline':
        return { bg: 'transparent', icon: COLORS.primary };
      case 'ghost':
        return { bg: 'transparent', icon: COLORS.gray600 };
      default:
        return { bg: COLORS.gray100, icon: COLORS.gray600 };
    }
  };

  const colors = getColors();

  if (label) {
    return (
      <TouchableOpacity
        style={[
          styles.labeledContainer,
          { backgroundColor: colors.bg },
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconWrapper,
            { width: BUTTON_SIZES[size], height: BUTTON_SIZES[size] },
          ]}
        >
          <Ionicons name={icon} size={ICON_SIZES[size]} color={colors.icon} />
        </View>
        <Text style={[styles.label, { color: colors.icon }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          width: BUTTON_SIZES[size],
          height: BUTTON_SIZES[size],
        },
        variant === 'outline' && styles.outlined,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={ICON_SIZES[size]} color={colors.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  labeledContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 64,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});
