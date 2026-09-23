import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from '@/src/notifications/expoNotificationsSafe';
import type { NotificationTriggerInput, NotificationResponse } from '@/src/notifications/expoNotificationsSafe';
import type { InboxItem } from '@/src/utils/buildInbox';
import { openFromDeviceNotification } from '@/src/navigation/notificationNav';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

export const notifEnabledKey = (uid: string) => `@tailorpro_notif_${uid}`;
const SENT_KEY = (uid: string, day: string) => `@tailorpro_os_notif_sent_${uid}_${day}`;
const PREFIX = 'tp-';
export const ATELIER_CHANNEL = 'atelier';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
} catch (e) {
  console.warn('Notification handler unavailable', e);
}

const dayStamp = () => new Date().toISOString().slice(0, 10);

export const getNotificationsEnabled = async (uid: string) => {
  const raw = await AsyncStorage.getItem(notifEnabledKey(uid));
  return raw !== 'false';
};

export const setNotificationsEnabled = async (uid: string, enabled: boolean) => {
  await AsyncStorage.setItem(notifEnabledKey(uid), enabled ? 'true' : 'false');
  if (!enabled) await cancelAllAtelierNotifications();
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ATELIER_CHANNEL, {
      name: 'Atelier TailorPro',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (e) {
    console.warn('Notification channel unavailable', e);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = asked.status;
    }
    return status === 'granted';
  } catch (e) {
    console.warn('Notification permission unavailable', e);
    return false;
  }
};

export const cancelAllAtelierNotifications = async () => {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch (e) {
    console.warn('Cancel notifications unavailable', e);
  }
};

const fireDateFor = (item: InboxItem): Date | null => {
  const now = new Date();
  if (item.id.startsWith('order-overdue-') || item.id.startsWith('order-today-') || item.id.startsWith('order-urgent-')) {
    return new Date(now.getTime() + 4000);
  }
  if (item.id.startsWith('order-soon-')) {
    const d = new Date(item.timestamp);
    d.setHours(8, 0, 0, 0);
    return d > now ? d : new Date(now.getTime() + 8000);
  }
  if (item.kind === 'payment' && item.priority === 'high') {
    return new Date(now.getTime() + 12000);
  }
  if (item.kind === 'stats') {
    const morning = new Date();
    morning.setHours(8, 30, 0, 0);
    return morning > now ? morning : null;
  }
  if (item.kind === 'activity') {
    return new Date(now.getTime() + 6000);
  }
  if (item.kind === 'client') {
    return new Date(now.getTime() + 10000);
  }
  return null;
};

const shouldAlertOs = (item: InboxItem) =>
  item.priority === 'high' ||
  item.kind === 'order' ||
  item.kind === 'payment' ||
  item.kind === 'activity' ||
  item.kind === 'client' ||
  item.kind === 'stats';

export const syncDeviceNotifications = async (uid: string, items: InboxItem[]) => {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const enabled = await getNotificationsEnabled(uid);
  if (!enabled) {
    await cancelAllAtelierNotifications();
    return;
  }
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAllAtelierNotifications();

  const sentRaw = await AsyncStorage.getItem(SENT_KEY(uid, dayStamp()));
  const sent = new Set<string>(sentRaw ? JSON.parse(sentRaw) : []);
  const nextSent = new Set(sent);

  const candidates = items.filter(shouldAlertOs).slice(0, 24);

  for (const item of candidates) {
    const when = fireDateFor(item);
    if (!when) continue;
    const immediate = when.getTime() - Date.now() < 30_000;
    if (immediate && sent.has(item.id)) continue;

    const seconds = Math.max(2, Math.round((when.getTime() - Date.now()) / 1000));
    const trigger: NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      ...(Platform.OS === 'android' ? { channelId: ATELIER_CHANNEL } : {}),
    };

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${item.id}`,
        content: {
          title: item.title,
          body: item.body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: '#16123A',
          interruptionLevel: item.priority === 'high' ? 'timeSensitive' : 'active',
          data: {
            inboxId: item.id,
            routeName: item.route?.name ?? 'Notifications',
            routeParams: item.route?.params ?? {},
          },
        },
        trigger,
      });
      if (immediate) nextSent.add(item.id);
    } catch (e) {
      console.warn('Notification schedule failed', item.id, e);
    }
  }

  await AsyncStorage.setItem(SENT_KEY(uid, dayStamp()), JSON.stringify([...nextSent]));
};

let responseSub: { remove: () => void } | null = null;

const openFromResponse = (response: NotificationResponse) => {
  const data = response.notification.request.content.data as {
    routeName?: keyof RootStackParamList;
    routeParams?: object;
    inboxId?: string;
  };
  const identifier = response.notification.request.identifier;
  if (identifier && !identifier.startsWith(PREFIX) && !data?.inboxId && !data?.routeName) {
    return;
  }
  const name = data?.routeName ?? 'Notifications';
  openFromDeviceNotification(name, data?.routeParams);
};

export const startNotificationResponseListener = () => {
  if (responseSub || Platform.OS === 'web') return;
  try {
    responseSub = Notifications.addNotificationResponseReceivedListener(openFromResponse);

    Notifications.getLastNotificationResponseAsync()
      .then((last) => {
        if (!last) return;
        openFromResponse(last);
        Notifications.clearLastNotificationResponse();
      })
      .catch(() => undefined);
  } catch (e) {
    console.warn('Notification response listener unavailable', e);
  }
};
