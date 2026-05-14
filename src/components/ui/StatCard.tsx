// ==========================================
// COMPOSANT STAT CARD - TailorPro
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'highlight' | 'compact';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'default',
  style,
}) => {
  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.compactLabel}>{label}</Text>
        <Text style={styles.compactValue}>{value}</Text>
        {subValue && (
          <Text style={styles.compactSubValue}>{subValue}</Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        variant === 'highlight' && styles.highlightContainer,
        style,
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.label,
            variant === 'highlight' && styles.highlightLabel,
          ]}
        >
          {label}
        </Text>
        {icon}
      </View>
      
      <Text
        style={[
          styles.value,
          variant === 'highlight' && styles.highlightValue,
        ]}
      >
        {value}
      </Text>
      
      {trend && (
        <Text
          style={[
            styles.trend,
            trend.isPositive ? styles.trendPositive : styles.trendNegative,
          ]}
        >
          {trend.isPositive ? '+' : ''}{trend.value}% par rapport au mois dernier
        </Text>
      )}
      
      {subValue && (
        <Text
          style={[
            styles.subValue,
            variant === 'highlight' && styles.highlightSubValue,
          ]}
        >
          {subValue}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  highlightContainer: {
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  highlightLabel: {
    color: COLORS.white,
    opacity: 0.8,
  },
  value: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  highlightValue: {
    color: COLORS.white,
  },
  trend: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  trendPositive: {
    color: COLORS.success,
  },
  trendNegative: {
    color: COLORS.error,
  },
  subValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  highlightSubValue: {
    color: COLORS.white,
    opacity: 0.8,
  },
  
  // Compact variant
  compactContainer: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  compactLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  compactValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  compactSubValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
