// ==========================================
// BOÎTE DEMANDES — vue atelier
// ==========================================

import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ClientRequest, ClientRequestStatus } from '@/src/types';
import { useThemedStyles, type Palette } from '@/src/theme';
import { formatDate } from '@utils/formatters';
import { t } from '@/src/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'AtelierRequests'>;
type Filter = 'pending' | 'all';

const statusLabel = (s: ClientRequestStatus) => {
  if (s === 'pending') return t('requests.statusPending');
  if (s === 'accepted') return t('requests.statusAccepted');
  if (s === 'declined') return t('requests.statusDeclined');
  return t('requests.statusConverted');
};

export const AtelierRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const profile = useAppStore(s => s.profile);
  const requests = useAppStore(s => s.clientRequests);
  const clients = useAppStore(s => s.clients);
  const updateStatus = useAppStore(s => s.updateClientRequestStatus);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const mine = useMemo(
    () => requests.filter(r => r.couturierId === profile?.id),
    [requests, profile?.id],
  );

  const visible = useMemo(
    () => (filter === 'pending' ? mine.filter(r => r.status === 'pending') : mine),
    [mine, filter],
  );

  const nameFor = (r: ClientRequest) => {
    const c = r.clientId ? clients.find(x => x.id === r.clientId) : null;
    return c?.nom ?? t('requests.unknownClient');
  };

  const act = async (id: string, status: ClientRequestStatus, then?: () => void) => {
    setBusyId(id);
    const ok = await updateStatus(id, status);
    setBusyId(null);
    if (ok) then?.();
  };

  const renderItem = ({ item }: { item: ClientRequest }) => {
    const pending = item.status === 'pending';
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.kindPill, item.kind === 'rdv' ? styles.kindRdv : styles.kindDevis]}>
            <Text style={styles.kindPillText}>{item.kind === 'rdv' ? 'RDV' : 'Devis'}</Text>
          </View>
          <Text style={styles.status}>{statusLabel(item.status)}</Text>
        </View>
        <Text style={styles.client}>{nameFor(item)}</Text>
        <Text style={styles.message}>{item.message || '—'}</Text>
        <Text style={styles.meta}>
          {formatDate(item.createdAt)}
          {item.preferredAt ? ` · souhaité ${formatDate(item.preferredAt)}` : ''}
        </Text>
        {pending && (
          <View style={styles.actions}>
            {busyId === item.id ? (
              <ActivityIndicator color={P.gold} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.ghost}
                  onPress={() => act(item.id, 'declined')}
                >
                  <Text style={styles.ghostText}>{t('requests.decline')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => act(item.id, 'accepted')}
                >
                  <Text style={styles.primaryText}>{t('requests.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.gold}
                  onPress={() =>
                    act(item.id, 'converted', () =>
                      navigation.navigate('AddOrder', { clientId: item.clientId ?? undefined }),
                    )
                  }
                >
                  <Text style={styles.goldText}>{t('requests.convert')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.title}>{t('requests.inbox')}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {(['pending', 'all'] as Filter[]).map(f => {
          const on = filter === f;
          return (
            <TouchableOpacity key={f} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {f === 'pending' ? t('requests.filterPending') : t('requests.filterAll')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('requests.empty')}</Text>}
        renderItem={renderItem}
      />
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.surface,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.2, textTransform: 'uppercase' as const,
  },
  title: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  filters: { flexDirection: 'row' as const, gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  chipOn: { backgroundColor: '#16123A', borderColor: P.goldRim },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  chipTextOn: { color: P.gold },
  empty: { marginTop: 40, textAlign: 'center' as const, color: P.muted, fontFamily: 'PlusJakartaSans_500Medium' },
  card: {
    padding: 16, borderRadius: 18, backgroundColor: P.surface,
    borderWidth: 0.5, borderColor: P.borderHard, gap: 8,
  },
  cardHead: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
  kindPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  kindDevis: { backgroundColor: P.goldBg },
  kindRdv: { backgroundColor: P.infoBg },
  kindPillText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  status: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  client: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  message: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, lineHeight: 20 },
  meta: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted },
  actions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 6 },
  ghost: {
    paddingHorizontal: 12, height: 36, borderRadius: 12, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  ghostText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  primary: {
    paddingHorizontal: 12, height: 36, borderRadius: 12, justifyContent: 'center' as const,
    backgroundColor: P.successBg,
  },
  primaryText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.success },
  gold: {
    paddingHorizontal: 12, height: 36, borderRadius: 12, justifyContent: 'center' as const,
    backgroundColor: '#16123A',
  },
  goldText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
});
