import { Platform } from 'react-native';

/**
 * useNativeDriver is only supported on native (iOS/Android).
 * On web, the RCTAnimation module is absent — pass this constant
 * instead of hardcoding `true` to silence the warning.
 */
export const nativeDriver = Platform.OS !== 'web';
