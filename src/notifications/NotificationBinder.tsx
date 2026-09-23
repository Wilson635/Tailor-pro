import { useEffect, useRef } from 'react';
import { useAppStore } from '@store/useAppStore';
import { buildInbox } from '@/src/utils/buildInbox';
import { bindNotificationNavigator } from '@/src/navigation/notificationNav';
import {
  startNotificationResponseListener,
  syncDeviceNotifications,
} from '@/src/notifications/deviceNotifications';
import { syncAccountDevice } from '@/src/services/accountDevices';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type StackNav = {
  navigate: (name: keyof RootStackParamList, params?: object) => void;
};

export const NotificationBinder = ({ stackNavigation }: { stackNavigation: StackNav }) => {
  const profile = useAppStore((s) => s.profile);
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const activities = useAppStore((s) => s.activities);
  const statistics = useAppStore((s) => s.statistics);
  const lastSig = useRef('');

  useEffect(() => {
    startNotificationResponseListener();
    bindNotificationNavigator({
      navigate: (name, params) => {
        stackNavigation.navigate(name, params);
      },
    });
    return () => bindNotificationNavigator(null);
  }, [stackNavigation]);

  useEffect(() => {
    if (!profile?.id) return;
    syncAccountDevice(profile.id, profile.email);
  }, [profile?.id, profile?.email]);

  useEffect(() => {
    const uid = profile?.id;
    if (!uid) return;
    const items = buildInbox({
      orders,
      clients,
      activities,
      statistics,
      role: profile?.role === 'client' ? 'client' : 'tailor',
    });
    const sig = items.map((i) => i.id).join('|');
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    syncDeviceNotifications(uid, items);
  }, [profile?.id, profile?.role, orders, clients, activities, statistics]);

  return null;
};

export type NotificationRoute = keyof RootStackParamList;
