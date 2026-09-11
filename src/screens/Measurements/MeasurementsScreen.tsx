// ==========================================
// ÉCRAN MESURES — TailorPro (Module 3)
// Migré vers le système FicheMensuration : une fiche par type de vêtement,
// champs illimités et personnalisables (plus de limite à 11 champs fixes).
// ==========================================

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Measurements'>;

// ── PALETTE (cohérente avec FicheDetailsScreen / CompareFichesScreen) ──
const C = {
  purple900: '#1A0033',
  purple600: '#534AB7',
  gold:      '#D4AF37',
  teal:      '#1D9E75',
  bg:        '#FFFFFF',
  surface:   '#F7F6F4',
  border:    '#EBEBEB',
  text:      '#0E0B14',
  textSec:   '#7A7787',
  textTer:   '#B0ACBA',
};

// ==========================================
// SOUS-COMPOSANT : carte "type de vêtement"
// Affiche la fiche de référence (isActive) — ou la plus récente à défaut —
// pour un type de vêtement donné, avec le nombre total de fiches.
// ==========================================

const TypeGroupCard = ({
                         type,
                         fiches,
                         onPress,
                       }: {
  type: TypeVetement;
  fiches: FicheMensuration[];
  onPress: () => void;
}) => {
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
          <Ionicons name="chevron-forward" size={18} color={C.textTer} />
        </View>
      </TouchableOpacity>
  );
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const MeasurementsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;

  const { fiches, loadFiches, getClientById } = useAppStore();
  const client = getClientById(clientId);
  const clientFiches = fiches[clientId] ?? [];

  useEffect(() => {
    loadFiches(clientId);
  }, [clientId]);

  // Regroupe les fiches par type de vêtement, triées par date décroissante.
  // "global" (la fiche générale du corps) est séparé du reste pour être affiché
  // en tête, distinctement des fiches par vêtement.
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

  const groups = garmentGroups; // conserve le nom utilisé plus bas pour l'état vide global

  const handleOpenGroup = (type: TypeVetement, groupFiches: FicheMensuration[]) => {
    const reference = groupFiches.find(f => f.isActive) ?? groupFiches[0];
    navigation.navigate('FicheDetails', { ficheId: reference.id, clientId });
  };

  return (
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Mesures</Text>
            <Text style={styles.headerSub}>{client?.nom ?? 'Client'}</Text>
          </View>
          <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('AddMeasurements', { clientId })}
              activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
        >
          {!globalGroup && groups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="body-outline" size={48} color={C.textTer} />
                <Text style={styles.emptyTitle}>Aucune mesure enregistrée</Text>
                <Text style={styles.emptySub}>
                  Prends les mesures du client pour un type de vêtement — tu pourras en ajouter
                  autant de champs que nécessaire (comme sur une fiche papier).
                </Text>
                <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.navigate('AddMeasurements', { clientId })}
                    activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.emptyBtnText}>Prendre des mesures</Text>
                </TouchableOpacity>
              </View>
          ) : (
              <View style={{ gap: 16 }}>
                {/* ── Fiche globale — épinglée, distincte des fiches par vêtement ── */}
                {globalGroup ? (
                    <View style={{ gap: 8 }}>
                      <Text style={styles.groupSectionTitle}>Mesures générales</Text>
                      <TypeGroupCard
                          type="global"
                          fiches={globalGroup}
                          onPress={() => handleOpenGroup('global', globalGroup)}
                      />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.globalMissingCard}
                        onPress={() => navigation.navigate('AddMeasurements', { clientId, typeVetement: 'global' })}
                        activeOpacity={0.85}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={C.purple600} />
                      <Text style={styles.globalMissingText}>Prendre les mesures générales du client</Text>
                    </TouchableOpacity>
                )}

                {/* ── Fiches par type de vêtement ── */}
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

        {/* ── Footer ── */}
        {(groups.length > 0 || globalGroup) && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
              <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => navigation.navigate('AddMeasurements', { clientId })}
                  activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={C.gold} />
                <Text style={styles.addBtnText}>Nouvelle prise de mesure</Text>
              </TouchableOpacity>
            </View>
        )}
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.surface },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg },
  headerBtn:   { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  headerSub:   { fontSize: 12, color: C.textSec, marginTop: 1 },
  divider:     { height: 0.5, backgroundColor: C.border },
  content:     { padding: 14 },

  // ── Group card ──
  groupSectionTitle: { fontSize: 12, fontWeight: '700', color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.4 },
  globalMissingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EEEDFE', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.purple600, borderStyle: 'dashed',
  },
  globalMissingText: { fontSize: 13, fontWeight: '600', color: C.purple600, flex: 1 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bg, borderRadius: 18, padding: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  groupIcon: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  groupEmoji: { fontSize: 22 },
  groupTitle: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: -0.1 },
  groupSub:   { fontSize: 12, color: C.textSec, marginTop: 2 },
  countBadge: {
    backgroundColor: 'rgba(83,74,183,0.08)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 10, color: C.purple600, fontWeight: '600' },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, paddingHorizontal: 24, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 8 },
  emptySub:   { fontSize: 13, color: C.textSec, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.purple900, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 13, marginTop: 16,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Footer ──
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border,
  },
  addBtn: {
    height: 52, borderRadius: 16, backgroundColor: C.purple900,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});