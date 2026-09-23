// ==========================================
// ÉCRAN MESURES — TailorPro (Module 3)
// Vue atelier (édition) ou client (lecture)
// ==========================================

import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  TYPE_VETEMENT_LABELS, TYPE_VETEMENT_ICONS, TYPE_VETEMENT_COLORS,
} from '@constants/mensurationConstants';
import type { FicheMensuration, TypeVetement } from '../../types';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useThemedStyles, type Palette } from '@/src/theme';
import { confectionRequestMessage, openWhatsApp, atelierWhatsApp } from '@utils/atelierContact';

type Props = NativeStackScreenProps<RootStackParamList, 'Measurements'>;

const TypeGroupCard = ({
  type,
  fiches,
  onPress,
}: {
  type: TypeVetement;
  fiches: FicheMensuration[];
  onPress: () => void;
}) => {
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const col = TYPE_VETEMENT_COLORS[type] ?? TYPE_VETEMENT_COLORS.autre;
  const reference = fiches.find(f => f.isActive) ?? fiches[0];
  const dateStr = new Date(reference.datePrise).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const nbChamps = Object.keys(reference.mesures).length;

  return (
    <TouchableOpacity style={styles.groupCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.groupIcon, { backgroundColor: col.bg, borderColor: col.border }]}>
        <Text style={styles.groupEmoji}>{TYPE_VETEMENT_ICONS[type] ?? '📐'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.groupTitle}>{TYPE_VETEMENT_LABELS[type] ?? type}</Text>
        <Text style={styles.groupSub}>
          {nbChamps} champ{nbChamps !== 1 ? 's' : ''} · {dateStr}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {fiches.length > 1 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{fiches.length} fiches</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={P.muted} />
      </View>
    </TouchableOpacity>
  );
};

export const MeasurementsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;
  const { colors: P, styles } = useThemedStyles(makeStyles);

  const { fiches, loadFiches, getClientById, profile, linkedTailors, getAtelierById } = useAppStore();
  const isClient = profile?.role === 'client';
  const client = getClientById(clientId);
  const clientFiches = fiches[clientId] ?? [];
  const primaryTailorId = client?.couturierId ?? linkedTailors[0]?.id;
  const primaryTailor = primaryTailorId
    ? (getAtelierById(primaryTailorId) ?? linkedTailors[0])
    : linkedTailors[0];

  useEffect(() => {
    loadFiches(clientId);
  }, [clientId]);

  const { globalGroup, garmentGroups } = React.useMemo(() => {
    const byType = new Map<TypeVetement, FicheMensuration[]>();
    for (const f of clientFiches) {
      const list = byType.get(f.typeVetement) ?? [];
      list.push(f);
      byType.set(f.typeVetement, list);
    }
    for (const list of byType.values()) {
      list.sort((a, b) => new Date(b.datePrise).getTime() - new Date(a.datePrise).getTime());
    }
    const global = byType.get('global');
    byType.delete('global');
    return { globalGroup: global, garmentGroups: Array.from(byType.entries()) };
  }, [clientFiches]);

  const groups = garmentGroups;

  const handleOpenGroup = (type: TypeVetement, groupFiches: FicheMensuration[]) => {
    const reference = groupFiches.find(f => f.isActive) ?? groupFiches[0];
    navigation.navigate('FicheDetails', { ficheId: reference.id, clientId });
  };

  const askTailorUpdate = () => {
    openWhatsApp(
      atelierWhatsApp(primaryTailor),
      confectionRequestMessage({
        atelierName: primaryTailor?.atelierName ?? primaryTailor?.displayName,
      }).replace('confection', 'mise à jour de mes mesures'),
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{isClient ? 'Mes mesures' : 'Mesures'}</Text>
          <Text style={styles.headerSub}>
            {isClient ? 'Fiches prises par votre couturier' : (client?.nom ?? 'Client')}
          </Text>
        </View>
        {!isClient && (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('AddMeasurements', { clientId })}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={P.text} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {!globalGroup && groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="body-outline" size={48} color={P.muted} />
            <Text style={styles.emptyTitle}>Aucune mesure enregistrée</Text>
            <Text style={styles.emptySub}>
              {isClient
                ? 'Votre couturier enregistrera vos fiches ici. Contactez-le pour une prise de mesures.'
                : 'Prends les mesures du client pour un type de vêtement — tu pourras en ajouter autant de champs que nécessaire.'}
            </Text>
            {isClient ? (
              <TouchableOpacity style={styles.emptyBtn} onPress={askTailorUpdate} activeOpacity={0.85}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={P.gold} />
                <Text style={styles.emptyBtnText}>Demander une prise de mesures</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddMeasurements', { clientId })}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={P.gold} />
                <Text style={styles.emptyBtnText}>Prendre des mesures</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {globalGroup ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.groupSectionTitle}>Mesures générales</Text>
                <TypeGroupCard
                  type="global"
                  fiches={globalGroup}
                  onPress={() => handleOpenGroup('global', globalGroup)}
                />
              </View>
            ) : !isClient ? (
              <TouchableOpacity
                style={styles.globalMissingCard}
                onPress={() => navigation.navigate('AddMeasurements', { clientId, typeVetement: 'global' })}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={P.primary} />
                <Text style={styles.globalMissingText}>Prendre les mesures générales du client</Text>
              </TouchableOpacity>
            ) : null}

            {groups.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={styles.groupSectionTitle}>Par type de vêtement</Text>
                <View style={{ gap: 10 }}>
                  {groups.map(([type, groupFiches]) => (
                    <TypeGroupCard
                      key={type}
                      type={type}
                      fiches={groupFiches}
                      onPress={() => handleOpenGroup(type, groupFiches)}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {(groups.length > 0 || globalGroup) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          {isClient ? (
            <TouchableOpacity style={styles.addBtn} onPress={askTailorUpdate} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={P.gold} />
              <Text style={styles.addBtnText}>Demander une mise à jour</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddMeasurements', { clientId })}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={P.gold} />
              <Text style={styles.addBtnText}>Nouvelle prise de mesure</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: P.surface,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  headerTitle: { fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: P.sub, marginTop: 1, fontFamily: 'PlusJakartaSans_500Medium' },
  divider: { height: 0.5, backgroundColor: P.borderHard },
  content: { padding: 14 },
  groupSectionTitle: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
    textTransform: 'uppercase' as const, letterSpacing: 0.4,
  },
  globalMissingCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
    backgroundColor: P.primaryBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: P.primary, borderStyle: 'dashed' as const,
  },
  globalMissingText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary, flex: 1 },
  groupCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    backgroundColor: P.surface, borderRadius: 18, padding: 14,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  groupEmoji: { fontSize: 22 },
  groupTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, letterSpacing: -0.1 },
  groupSub: { fontSize: 12, color: P.sub, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },
  countBadge: {
    backgroundColor: P.primaryBg, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 10, color: P.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },
  emptyState: {
    alignItems: 'center' as const, justifyContent: 'center' as const,
    paddingVertical: 60, paddingHorizontal: 24, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, marginTop: 8 },
  emptySub: { fontSize: 13, color: P.sub, textAlign: 'center' as const, lineHeight: 19, fontFamily: 'PlusJakartaSans_500Medium' },
  emptyBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    backgroundColor: '#16123A', borderRadius: 14, borderWidth: 1, borderColor: P.goldRim,
    paddingHorizontal: 20, paddingVertical: 13, marginTop: 16,
  },
  emptyBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: P.surface, borderTopWidth: 0.5, borderTopColor: P.borderHard,
  },
  addBtn: {
    height: 52, borderRadius: 16, backgroundColor: '#16123A',
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    borderWidth: 1, borderColor: P.goldRim,
  },
  addBtnText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
});
