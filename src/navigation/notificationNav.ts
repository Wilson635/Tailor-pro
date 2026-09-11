import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Pending = { name: keyof RootStackParamList; params?: object };

let pending: Pending | null = null;
let navigator: { navigate: (name: keyof RootStackParamList, params?: object) => void } | null = null;

export const bindNotificationNavigator = (nav: typeof navigator) => {
  navigator = nav;
  if (nav && pending) {
    const next = pending;
    pending = null;
    nav.navigate(next.name, next.params);
  }
};

export const openFromDeviceNotification = (name: keyof RootStackParamList, params?: object) => {
  if (navigator) {
    navigator.navigate(name, params);
    return;
  }
  pending = { name, params };
};
