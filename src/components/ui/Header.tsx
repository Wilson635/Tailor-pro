// ==========================================
// COMPOSANT HEADER - TailorPro
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightIcon2?: keyof typeof Ionicons.glyphMap;
  onRightPress2?: () => void;
  variant?: 'default' | 'primary';
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  rightIcon2,
  onRightPress2,
  variant = 'default',
}) => {
  const insets = useSafeAreaInsets();
  const isPrimary = variant === 'primary';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.sm },
        isPrimary && styles.primaryContainer,
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isPrimary ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={[
          styles.title,
          isPrimary && styles.primaryTitle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.rightSection}>
        {rightIcon2 && (
          <TouchableOpacity
            onPress={onRightPress2}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon2}
              size={22}
              color={isPrimary ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon}
              size={22}
              color={isPrimary ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  primaryTitle: {
    color: COLORS.white,
  },
  iconButton: {
    padding: SPACING.xs,
  },
});
