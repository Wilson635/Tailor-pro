import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';
import { useInbox, type InboxItem, type InboxKind } from '@/src/hooks/useInbox';
import { formatDate } from '@utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type Filter = 'all' | 'reminders' | 'activity';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'reminders', label: 'Rappels' },
  { key: 'activity', label: 'Activité' },
];

const isReminder = (k: InboxKind) => k !== 'activity';

const metaFor = (P: Palette, kind: InboxKind) => {
  switch (kind) {
    case 'order':
      return { icon: 'scissors' as const, color: P.info, bg: P.infoBg };
    case 'payment':
      return { icon: 'credit-card' as const, color: P.warning, bg: P.warningBg };
    case 'client':
      return { icon: 'user-plus' as const, color: P.success, bg: P.successBg };
    case 'stats':
      return { icon: 'bar-chart-2' as const, color: P.primary, bg: P.primaryBg };
    default:
      return { icon: 'bell' as const, color: P.gold, bg: P.goldBg };
  }
};

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { items, unreadCount, isUnread, markRead, markAllRead } = useInbox();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'reminders') return items.filter((i) => isReminder(i.kind));
    if (filter === 'activity') return items.filter((i) => i.kind === 'activity');
    return items;
  }, [items, filter]);

  const openItem = async (item: InboxItem) => {
    await markRead(item.id);
    if (item.route) {
      navigation.navigate(item.route.name as never, (item.route.params ?? undefined) as never);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.markAll}>Tout lu</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={28} color={P.sub} />
            <Text style={styles.emptyTitle}>Rien pour l’instant</Text>
            <Text style={styles.emptySub}>
              Les rappels de livraison, impayés, nouveaux clients et l’activité de l’atelier apparaîtront ici.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = metaFor(P, item.kind);
          const unread = isUnread(item.id);
          return (
            <TouchableOpacity style={[styles.card, unread && styles.cardUnread]} onPress={() => openItem(item)} activeOpacity={0.75}>
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <Feather name={meta.icon} size={16} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  {unread ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={P.muted} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  markAll: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.primary, marginTop: 14 },
  filters: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  chipTextOn: { color: '#fff' },
  card: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: P.surface, borderRadius: 18, padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  cardUnread: { borderColor: P.goldRim },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  cardTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  cardBody: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  cardDate: { fontSize: 11, color: P.muted, marginTop: 4, fontFamily: 'PlusJakartaSans_500Medium' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.gold },
  empty: { alignItems: 'center' as const, paddingTop: 64, paddingHorizontal: 28, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, marginTop: 8 },
  emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const },
});
