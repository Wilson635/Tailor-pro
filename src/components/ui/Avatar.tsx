// ==========================================
// COMPOSANT AVATAR - TailorPro
// ==========================================

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  source?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeColor?: string;
}

const SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 100,
};

const FONT_SIZE_MAP = {
  sm: FONT_SIZES.xs,
  md: FONT_SIZES.md,
  lg: FONT_SIZES.xl,
  xl: FONT_SIZES.title,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  showBadge = false,
  badgeColor = COLORS.success,
}) => {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZE_MAP[size];

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      
      {showBadge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor },
            size === 'sm' && styles.badgeSm,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeSm: {
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: 0,
    right: 0,
  },
});
