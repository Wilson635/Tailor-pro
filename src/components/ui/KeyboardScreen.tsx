import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** iOS : padding. Android : padding (associé à softwareKeyboardLayoutMode=resize). */
export const keyboardAvoidBehavior = Platform.OS === 'ios' ? 'padding' : 'padding';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Décalage au-dessus du clavier (header / safe area). */
  keyboardVerticalOffset?: number;
  scroll?: boolean;
};

export function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset,
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const offset = keyboardVerticalOffset ?? insets.top + 56;

  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior={keyboardAvoidBehavior}
      keyboardVerticalOffset={offset}
    >
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
