import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@store/useAppStore';
import { buildInbox, type InboxItem, type InboxKind } from '@/src/utils/buildInbox';

const READ_KEY = (uid: string) => `@tailorpro_inbox_read_${uid}`;

export const useInbox = () => {
  const profile = useAppStore((s) => s.profile);
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const activities = useAppStore((s) => s.activities);
  const statistics = useAppStore((s) => s.statistics);
  const uid = profile?.id ?? 'anon';

  const items = useMemo(
    () => buildInbox({ orders, clients, activities, statistics }),
    [orders, clients, activities, statistics],
  );

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let live = true;
    (async () => {
      const raw = await AsyncStorage.getItem(READ_KEY(uid));
      if (!live) return;
      const list: string[] = raw ? JSON.parse(raw) : [];
      setReadIds(new Set(list));
    })();
    return () => {
      live = false;
    };
  }, [uid]);

  const persist = async (next: Set<string>) => {
    setReadIds(next);
    await AsyncStorage.setItem(READ_KEY(uid), JSON.stringify([...next]));
  };

  const isUnread = useCallback((id: string) => !readIds.has(id), [readIds]);
  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  const markRead = async (id: string) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    await persist(next);
  };

  const markAllRead = async () => {
    const next = new Set(items.map((i) => i.id));
    await persist(next);
  };

  return { items, unreadCount, isUnread, markRead, markAllRead };
};

export type { InboxItem, InboxKind };
