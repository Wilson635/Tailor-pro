// ==========================================
// ÉCRAN COMPARAISON DE FICHES — TailorPro (Module 3)
// ==========================================

import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  TYPE_VETEMENT_LABELS, TYPE_VETEMENT_ICONS, TYPE_VETEMENT_COLORS,
  MESURES_TEMPLATES,
} from '@constants/mensurationConstants';
import type { FicheMensuration } from '../../types';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CompareFiches'>;

const { width } = Dimensions.get('window');

// ── PALETTE ──────────────────────────────────────────────────────
const C = {
  purple900: '#1A0033',
  purple600: '#534AB7',
  purple100: '#EEEDFE',
  gold:      '#D4AF37',
  teal:      '#1D9E75',
  bg:        '#FFFFFF',
  surface:   '#F7F6F4',
  border:    '#EBEBEB',
  text:      '#0E0B14',
  textSec:   '#7A7787',
  textTer:   '#B0ACBA',
  error:     '#EF4444',
  green:     '#16A34A',
  greenBg:   '#F0FDF4',
  red:       '#DC2626',
  redBg:     '#FEF2F2',
};

// ── DIFF BADGE ───────────────────────────────────────────────────
const DiffBadge = ({ diff, unite }: { diff: number; unite: string }) => {
  if (diff === 0) return null;
  const isPos = diff > 0;
  return (
    <View style={[diffStyles.badge, { backgroundColor: isPos ? C.redBg : C.greenBg }]}>
      <Ionicons
        name={isPos ? 'trending-up' : 'trending-down'}
        size={10}
        color={isPos ? C.red : C.green}
      />
      <Text style={[diffStyles.text, { color: isPos ? C.red : C.green }]}>
        {isPos ? '+' : ''}{diff.toFixed(1)} {unite}
      </Text>
    </View>
  );
};
const diffStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  text:  { fontSize: 10, fontWeight: '700' },
});

// ── HEADER FICHE ─────────────────────────────────────────────────
const FicheHeader = ({ fiche, index }: { fiche: FicheMensuration; index: 1 | 2 }) => {
  const col    = TYPE_VETEMENT_COLORS[fiche.typeVetement];
  const dateStr = new Date(fiche.datePrise).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return (
    <View style={[fhStyles.wrap, { backgroundColor: col.bg, borderColor: col.border }]}>
      <Text style={fhStyles.indexLabel}>Fiche {index}</Text>
      <Text style={fhStyles.dateText}>{dateStr}</Text>
      {fiche.isActive && (
        <View style={fhStyles.activeBadge}>
          <Text style={fhStyles.activeText}>Référence</Text>
        </View>
      )}
      <Text style={fhStyles.uniteText}>{fiche.unite}</Text>
    </View>
  );
};
const fhStyles = StyleSheet.create({
  wrap:       { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  indexLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText:   { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },
  activeBadge:{ backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  activeText: { fontSize: 10, color: C.teal, fontWeight: '600' },
  uniteText:  { fontSize: 11, color: C.textSec },
});

// ── ROW DE COMPARAISON ───────────────────────────────────────────
const CompareRow = ({
  label, val1, val2, unite,
}: {
  label: string; val1?: number; val2?: number; unite: string;
}) => {
  const hasVal1 = val1 !== undefined && val1 !== null;
  const hasVal2 = val2 !== undefined && val2 !== null;
  const diff    = hasVal1 && hasVal2 ? val2 - val1 : 0;
  const changed = Math.abs(diff) > 0.01;

  return (
    <View style={[crStyles.row, changed && crStyles.rowChanged]}>
      <Text style={crStyles.label} numberOfLines={2}>{label}</Text>
      <View style={crStyles.valCol}>
        <Text style={[crStyles.val, !hasVal1 && crStyles.valEmpty]}>
          {hasVal1 ? val1 : '—'}
        </Text>
      </View>
      <View style={crStyles.diffCol}>
        {hasVal1 && hasVal2 ? <DiffBadge diff={diff} unite={unite} /> : null}
      </View>
      <View style={crStyles.valCol}>
        <Text style={[crStyles.val, !hasVal2 && crStyles.valEmpty]}>
          {hasVal2 ? val2 : '—'}
        </Text>
      </View>
    </View>
  );
};
const crStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowChanged: { backgroundColor: '#FAFAF0' },
  label:      { flex: 1.5, fontSize: 13, color: C.text },
  valCol:     { flex: 1, alignItems: 'center' },
  val:        { fontSize: 16, fontWeight: '700', color: C.text },
  valEmpty:   { color: C.textTer, fontWeight: '400' },
  diffCol:    { width: 70, alignItems: 'center' },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const CompareFichesScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { ficheId1, ficheId2, clientId } = route.params;

  const { getFicheById, getClientById } = useAppStore();
  const fiche1  = getFicheById(ficheId1, clientId);
  const fiche2  = getFicheById(ficheId2, clientId);
  const client  = getClientById(clientId);

  // Toutes les clés présentes dans l'une ou l'autre fiche
  const allKeys = useMemo(() => {
    if (!fiche1 || !fiche2) return [];
    const keys = new Set([
      ...Object.keys(fiche1.mesures),
      ...Object.keys(fiche2.mesures),
    ]);
    // Ordonner par template puis personnalisés
    const template = fiche1.typeVetement === fiche2.typeVetement
      ? MESURES_TEMPLATES[fiche1.typeVetement].map(f => f.key)
      : [];
    const ordered: string[] = [];
    for (const k of template) { if (keys.has(k)) { ordered.push(k); keys.delete(k); } }
    return [...ordered, ...Array.from(keys)];
  }, [fiche1, fiche2]);

  // Labels pour les clés
  const labelFor = (key: string) => {
    if (!fiche1) return key;
    const tpl = MESURES_TEMPLATES[fiche1.typeVetement].find(f => f.key === key);
    if (tpl) return tpl.label;
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Résumé diff
  const summary = useMemo(() => {
    if (!fiche1 || !fiche2) return { changed: 0, bigger: 0, smaller: 0 };
    let changed = 0, bigger = 0, smaller = 0;
    for (const k of allKeys) {
      const v1 = fiche1.mesures[k];
      const v2 = fiche2.mesures[k];
      if (v1 !== undefined && v2 !== undefined) {
        const diff = v2 - v1;
        if (Math.abs(diff) > 0.01) { changed++; if (diff > 0) bigger++; else smaller++; }
      }
    }
    return { changed, bigger, smaller };
  }, [fiche1, fiche2, allKeys]);

  if (!fiche1 || !fiche2) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: C.textSec, fontSize: 16 }}>Fiches introuvables</Text>
        </View>
      </View>
    );
  }

  const unite = fiche1.unite === fiche2.unite ? fiche1.unite : 'cm';

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Comparaison</Text>
          <Text style={styles.headerSub}>{client?.nom ?? 'Client'} · {TYPE_VETEMENT_LABELS[fiche1.typeVetement]}</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── En-têtes des deux fiches ── */}
        <View style={styles.headersRow}>
          <FicheHeader fiche={fiche1} index={1} />
          <View style={styles.vsLabel}><Text style={styles.vsText}>VS</Text></View>
          <FicheHeader fiche={fiche2} index={2} />
        </View>

        {/* ── Résumé ── */}
        {summary.changed > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="swap-vertical-outline" size={16} color={C.purple600} />
              <Text style={styles.summaryVal}>{summary.changed}</Text>
              <Text style={styles.summaryLabel}>modifié{summary.changed > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={16} color={C.red} />
              <Text style={[styles.summaryVal, { color: C.red }]}>{summary.bigger}</Text>
              <Text style={styles.summaryLabel}>en hausse</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trending-down" size={16} color={C.green} />
              <Text style={[styles.summaryVal, { color: C.green }]}>{summary.smaller}</Text>
              <Text style={styles.summaryLabel}>en baisse</Text>
            </View>
          </View>
        )}

        {/* ── Légende colonnes ── */}
        <View style={styles.colHeaderRow}>
          <Text style={[styles.colHeader, { flex: 1.5 }]}>Mesure</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Fiche 1</Text>
          <Text style={[styles.colHeader, { width: 70, textAlign: 'center' }]}>Écart</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Fiche 2</Text>
        </View>

        {/* ── Lignes de mesures ── */}
        <View style={styles.card}>
          {allKeys.map(key => (
            <CompareRow
              key={key}
              label={labelFor(key)}
              val1={fiche1.mesures[key]}
              val2={fiche2.mesures[key]}
              unite={unite}
            />
          ))}
          {allKeys.length === 0 && (
            <Text style={{ padding: 20, color: C.textSec, textAlign: 'center' }}>
              Aucune mesure commune à comparer.
            </Text>
          )}
        </View>

        {/* ── Notes ── */}
        {(fiche1.notes || fiche2.notes) && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesRow}>
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>Fiche 1</Text>
                <Text style={styles.noteText}>{fiche1.notes || '(aucune note)'}</Text>
              </View>
              <View style={styles.noteCard}>
                <Text style={styles.noteLabel}>Fiche 2</Text>
                <Text style={styles.noteText}>{fiche2.notes || '(aucune note)'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Légende ── */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.redBg, borderColor: C.red }]} />
            <Text style={styles.legendText}>Augmentation (prise de poids, bébé…)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.greenBg, borderColor: C.green }]} />
            <Text style={styles.legendText}>Diminution (perte de poids, sport…)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.surface },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn:      { margin: 16, width: 38, height: 38, borderRadius: 12, borderWidth: 0.5,
    borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg },
  headerBtn:    { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  headerSub:    { fontSize: 12, color: C.textSec, marginTop: 1 },
  divider:      { height: 0.5, backgroundColor: C.border },
  content:      { padding: 14 },

  headersRow:   { flexDirection: 'row', alignItems: 'stretch', gap: 6, marginBottom: 12 },
  vsLabel:      { width: 28, alignItems: 'center', justifyContent: 'center' },
  vsText:       { fontSize: 11, fontWeight: '700', color: C.textTer },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryItem:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg, borderRadius: 14, padding: 10, borderWidth: 0.5, borderColor: C.border },
  summaryVal:   { fontSize: 18, fontWeight: '800', color: C.purple600 },
  summaryLabel: { fontSize: 10, color: C.textSec },

  colHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  colHeader:    { fontSize: 10, fontWeight: '700', color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.4 },

  card:         { backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 16,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 14 },

  notesSection: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  notesRow:     { flexDirection: 'row', gap: 10 },
  noteCard:     { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: C.border },
  noteLabel:    { fontSize: 10, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.3, marginBottom: 6 },
  noteText:     { fontSize: 13, color: C.textSec, fontStyle: 'italic', lineHeight: 19 },

  legend:       { gap: 6 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:    { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  legendText:   { fontSize: 12, color: C.textSec },
});
