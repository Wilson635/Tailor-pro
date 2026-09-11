import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/src/lib/supabase';
import { requestNotificationPermission } from '@/src/notifications/deviceNotifications';

const INSTALL_KEY = '@tailorpro_install_id';

export type AccountDevice = {
  id: string;
  user_id: string;
  device_id: string;
  name: string;
  os: string;
  expo_push_token: string | null;
  is_primary: boolean;
  first_seen: string;
  last_seen: string;
  revoked_at: string | null;
};

export type AccountLoginEvent = {
  id: string;
  action: string;
  location: string;
  date: string;
  success: boolean;
};

export const getInstallId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(INSTALL_KEY);
  if (existing) return existing;
  const id = `${Platform.OS}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALL_KEY, id);
  return id;
};

export const getDeviceLabel = () =>
  Device.deviceName ?? Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android');

export const getDeviceOsLabel = () => {
  const os = Device.osName ?? (Platform.OS === 'ios' ? 'iOS' : 'Android');
  return `${os}${Device.osVersion ? ` ${Device.osVersion}` : ''}`;
};

const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return null;
    const ok = await requestNotificationPermission();
    if (!ok) return null;
    const token = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return token.data ?? null;
  } catch {
    return null;
  }
};

const isMissingTable = (error: { message?: string; code?: string } | null) => {
  const msg = (error?.message ?? '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist')
  );
};

const sendExpoPush = async (to: string, title: string, body: string) => {
  if (!to.startsWith('ExponentPushToken') && !to.startsWith('ExpoPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: 'atelier',
      }),
    });
  } catch {
    /* hors-ligne : l’historique cloud reste */
  }
};

const sendNewLoginEmail = async (
  email: string | null | undefined,
  deviceName: string,
  os: string,
) => {
  if (!email) return;
  const when = new Date().toLocaleString('fr-FR');
  try {
    await supabase.functions.invoke('new-login-alert', {
      body: { email, deviceName, os, when },
    });
  } catch {
    /* fonction non déployée : la notif push reste le canal principal */
  }
};

const alertExistingDevices = async (
  others: AccountDevice[],
  deviceName: string,
  os: string,
  email?: string | null,
) => {
  const body =
    `Connexion détectée sur « ${deviceName} » (${os}). ` +
    `Si ce n’est pas vous, changez votre mot de passe et retirez l’appareil dans Profil.`;

  const primary =
    others.find((d) => d.is_primary && d.expo_push_token) ??
    others
      .slice()
      .sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime())
      .find((d) => d.expo_push_token);

  if (primary?.expo_push_token) {
    await sendExpoPush(primary.expo_push_token, 'Nouvelle connexion TailorPro', body);
  }
  await sendNewLoginEmail(email, deviceName, os);
};

export const listAccountDevices = async (
  userId: string,
): Promise<{ devices: AccountDevice[]; tableMissing: boolean }> => {
  const { data, error } = await supabase
    .from('account_devices')
    .select('*')
    .eq('user_id', userId)
    .order('first_seen', { ascending: true });
  if (error) {
    return { devices: [], tableMissing: isMissingTable(error) };
  }
  return { devices: (data ?? []) as AccountDevice[], tableMissing: false };
};

export const listLoginEvents = async (userId: string): Promise<AccountLoginEvent[]> => {
  const { data, error } = await supabase
    .from('account_login_events')
    .select('id, action, location, created_at, success')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    action: row.action,
    location: row.location ?? '',
    date: row.created_at,
    success: row.success !== false,
  }));
};

export const recordLoginEvent = async (
  userId: string,
  action: string,
  location?: string,
) => {
  await supabase.from('account_login_events').insert({
    user_id: userId,
    device_id: await getInstallId(),
    action,
    location: location ?? `${getDeviceLabel()} · ${getDeviceOsLabel()}`,
    success: true,
  });
};

export const syncAccountDevice = async (
  userId: string,
  email?: string | null,
): Promise<{ devices: AccountDevice[]; tableMissing: boolean }> => {
  const deviceId = await getInstallId();
  const name = getDeviceLabel();
  const os = getDeviceOsLabel();
  const token = await getExpoPushToken();
  const now = new Date().toISOString();

  const listed = await listAccountDevices(userId);
  if (listed.tableMissing) return { devices: [], tableMissing: true };

  const existing = listed.devices;
  const mine = existing.find((d) => d.device_id === deviceId);
  const others = existing.filter((d) => d.device_id !== deviceId && !d.revoked_at);

  if (mine) {
    await supabase
      .from('account_devices')
      .update({
        name,
        os,
        expo_push_token: token ?? mine.expo_push_token,
        last_seen: now,
        revoked_at: null,
      })
      .eq('id', mine.id);
  } else {
    const isPrimary = existing.length === 0;
    const { error } = await supabase.from('account_devices').insert({
      user_id: userId,
      device_id: deviceId,
      name,
      os,
      expo_push_token: token,
      is_primary: isPrimary,
      first_seen: now,
      last_seen: now,
    });
    if (error) {
      return { devices: existing, tableMissing: isMissingTable(error) };
    }
    if (!isPrimary) {
      await alertExistingDevices(others, name, os, email);
      await recordLoginEvent(userId, `Nouvelle connexion : ${name}`, `${name} · ${os}`);
    } else {
      await recordLoginEvent(userId, 'Premier appareil enregistré', `${name} · ${os}`);
    }
  }

  return listAccountDevices(userId);
};

export const revokeAccountDevice = async (userId: string, deviceId: string) => {
  await supabase
    .from('account_devices')
    .update({ revoked_at: new Date().toISOString(), expo_push_token: null })
    .eq('user_id', userId)
    .eq('device_id', deviceId);
};

export const revokeOtherAccountDevices = async (userId: string, keepDeviceId: string) => {
  await supabase
    .from('account_devices')
    .update({ revoked_at: new Date().toISOString(), expo_push_token: null })
    .eq('user_id', userId)
    .neq('device_id', keepDeviceId)
    .is('revoked_at', null);
};

export const devicesTableSqlHint = () =>
  'Ouvre Supabase → SQL Editor et exécute le fichier supabase/migrations/021_account_devices.sql (une fois).';
