import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from './ThemeContext';
import type { Palette } from './palette';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const usePalette = (): Palette => useTheme().colors;

export const useThemedStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (colors: Palette) => T,
): { colors: Palette; styles: T; isDark: boolean } => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  return { colors, styles, isDark };
};
