import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@store/useAppStore';
import { buildInbox } from '@/src/utils/buildInbox';
import { bindNotificationNavigator } from '@/src/navigation/notificationNav';
import {
  startNotificationResponseListener,
  syncDeviceNotifications,
} from '@/src/notifications/deviceNotifications';
import { syncAccountDevice } from '@/src/services/accountDevices';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

export const NotificationBinder = () => {
  const navigation = useNavigation<any>();
  const profile = useAppStore((s) => s.profile);
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const activities = useAppStore((s) => s.activities);
  const statistics = useAppStore((s) => s.statistics);
  const lastSig = useRef('');

  useEffect(() => {
    startNotificationResponseListener();
    // MainTabs is a stack screen: this navigation object can open OrderDetails, Notifications, etc.
    bindNotificationNavigator({
      navigate: (name, params) => {
        navigation.navigate(name as never, params as never);
      },
    });
    return () => bindNotificationNavigator(null);
  }, [navigation]);

  useEffect(() => {
    if (!profile?.id) return;
    syncAccountDevice(profile.id, profile.email);
  }, [profile?.id, profile?.email]);

  useEffect(() => {
    const uid = profile?.id;
    if (!uid) return;
    const items = buildInbox({ orders, clients, activities, statistics });
    const sig = items.map((i) => i.id).join('|');
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    syncDeviceNotifications(uid, items);
  }, [profile?.id, orders, clients, activities, statistics]);

  return null;
};

export type NotificationRoute = keyof RootStackParamList;
