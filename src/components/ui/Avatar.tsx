// ==========================================
// AVATAR CLIENT — photo si disponible, sinon initiales
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { getInitials } from '@utils/formatters';
import { usePalette } from '@/src/theme';

type SizeToken = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name: string;
  size?: SizeToken | number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const SIZE_TOKENS: Record<SizeToken, number> = {
  sm: 32,
  md: 44,
  lg: 72,
  xl: 96,
};

const isUsableUri = (uri?: string | null) => {
  if (typeof uri !== 'string') return false;
  const value = uri.trim();
  if (!value) return false;
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('ph://') ||
    value.startsWith('data:')
  );
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  radius,
  style,
}) => {
  const P = usePalette();
  const dimension = typeof size === 'number' ? size : SIZE_TOKENS[size];
  const corner = radius ?? Math.round(dimension * 0.32);
  const [failed, setFailed] = useState(false);
  const uri = isUsableUri(source) ? source!.trim() : null;
  const showPhoto = !!uri && !failed;

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initials = getInitials(name || '?') || '?';
  const fontSize = Math.round(dimension * 0.36);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: dimension,
          height: dimension,
          borderRadius: corner,
          backgroundColor: P.bg,
          borderWidth: 1,
          borderColor: P.goldRim,
        },
        style,
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension, borderRadius: corner }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: P.gold }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
