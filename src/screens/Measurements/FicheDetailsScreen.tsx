// ==========================================
// ÉCRAN DÉTAILS D'UNE FICHE — TailorPro (Module 3)
// ==========================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  TYPE_VETEMENT_LABELS, TYPE_VETEMENT_ICONS, TYPE_VETEMENT_COLORS,
  MESURES_TEMPLATES, UNITE_LABELS,
} from '@constants/mensurationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FicheDetails'>;

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
};

// ── MESURE ROW ───────────────────────────────────────────────────
const MesureRow = ({ label, value, unite }: { label: string; value: number; unite: string }) => (
  <View style={mrStyles.row}>
    <Text style={mrStyles.label}>{label}</Text>
    <View style={mrStyles.valueWrap}>
      <Text style={mrStyles.value}>{value}</Text>
      <Text style={mrStyles.unit}>{unite}</Text>
    </View>
  </View>
);
const mrStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: C.border },
  label:    { fontSize: 14, color: C.text, flex: 1 },
  valueWrap:{ flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value:    { fontSize: 18, fontWeight: '700', color: C.purple600 },
  unit:     { fontSize: 12, color: C.textSec },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const FicheDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { ficheId, clientId } = route.params;

  const { getFicheById, getFichesByType, setFicheActive, duplicateFiche, deleteFiche, getClientById } = useAppStore();
  const fiche  = getFicheById(ficheId, clientId);
  const client = getClientById(clientId);
  const [isActing, setIsActing] = useState(false);

  if (!fiche) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 16, color: C.textSec }}>Fiche introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: C.purple600, fontWeight: '600', fontSize: 15, marginTop: 12 }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const col        = TYPE_VETEMENT_COLORS[fiche.typeVetement];
  const template   = MESURES_TEMPLATES[fiche.typeVetement];
  const templateKeys = new Set(template.map(f => f.key));
  const dateStr    = new Date(fiche.datePrise).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Séparer les champs template vs personnalisés
  const templateFields = template.filter(f => fiche.mesures[f.key] !== undefined);
  const customEntries  = Object.entries(fiche.mesures).filter(([k]) => !templateKeys.has(k));

  // Autres fiches du même type (pour comparer)
  const otherFiches = getFichesByType(clientId, fiche.typeVetement).filter(f => f.id !== ficheId);

  // ── Partager ──
  const handleShare = async () => {
    const lines = [
      `📐 Mensuration — ${client?.nom ?? 'Client'}`,
      `Type: ${TYPE_VETEMENT_LABELS[fiche.typeVetement]}  |  ${dateStr}`,
      '',
      ...templateFields.map(f => `${f.label}: ${fiche.mesures[f.key]} ${fiche.unite}`),
      ...customEntries.map(([k, v]) => `${k}: ${v} ${fiche.unite}`),
    ];
    if (fiche.notes) lines.push('', `Notes: ${fiche.notes}`);
    await Share.share({ message: lines.join('\n') });
  };

  // ── Activer ──
  const handleSetActive = async () => {
    if (fiche.isActive) return;
    setIsActing(true);
    await setFicheActive(ficheId, clientId, fiche.typeVetement);
    setIsActing(false);
  };

  // ── Dupliquer ──
  const handleDuplicate = () => {
    Alert.alert(
      'Dupliquer cette fiche ?',
      'Une copie sera créée avec la date d\'aujourd\'hui pour compléter les nouvelles mesures.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dupliquer',
          onPress: async () => {
            setIsActing(true);
            const copy = await duplicateFiche(ficheId, clientId);
            setIsActing(false);
            if (copy) {
              navigation.replace('FicheDetails', { ficheId: copy.id, clientId });
            }
          },
        },
      ]
    );
  };

  // ── Supprimer ──
  const handleDelete = () => {
    Alert.alert(
      'Supprimer cette fiche ?',
      'Cette action est irréversible. L\'historique de versioning sera conservé pour les autres fiches.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteFiche(ficheId, clientId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ── Comparer ──
  const handleCompare = () => {
    if (otherFiches.length === 0) {
      Alert.alert('Comparaison impossible', 'Il n\'y a pas d\'autre fiche pour ce type de vêtement.');
      return;
    }
    if (otherFiches.length === 1) {
      navigation.navigate('CompareFiches', {
        ficheId1: ficheId, ficheId2: otherFiches[0].id, clientId,
      });
      return;
    }
    // Plusieurs autres fiches → afficher le choix
    const options = otherFiches.map(f => ({
      text: new Date(f.datePrise).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }),
      onPress: () => navigation.navigate('CompareFiches', { ficheId1: ficheId, ficheId2: f.id, clientId }),
    }));
    Alert.alert('Comparer avec…', 'Choisissez une fiche de référence', [
      ...options,
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Détail de la fiche</Text>
          <Text style={styles.headerSub}>{client?.nom ?? 'Client'}</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={18} color={C.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero badge ── */}
        <View style={[styles.heroBadge, { backgroundColor: col.bg, borderColor: col.border }]}>
          <Text style={styles.heroEmoji}>{TYPE_VETEMENT_ICONS[fiche.typeVetement]}</Text>
          <View>
            <Text style={[styles.heroType, { color: col.text }]}>
              {TYPE_VETEMENT_LABELS[fiche.typeVetement]}
            </Text>
            <Text style={styles.heroDate}>{dateStr}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[styles.uniteBadge]}>
              <Text style={styles.uniteText}>{fiche.unite}</Text>
            </View>
            {fiche.isActive && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={11} color={C.teal} />
                <Text style={styles.activeText}>Référence</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Mesures standards ── */}
        {templateFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mesures</Text>
            <View style={styles.card}>
              {templateFields.map(f => (
                <MesureRow key={f.key} label={f.label} value={fiche.mesures[f.key]} unite={fiche.unite} />
              ))}
            </View>
          </View>
        )}

        {/* ── Mesures personnalisées ── */}
        {customEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Champs personnalisés</Text>
            <View style={styles.card}>
              {customEntries.map(([key, val]) => (
                <MesureRow
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  value={val}
                  unite={fiche.unite}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Notes ── */}
        {fiche.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Ionicons name="document-text-outline" size={16} color={C.textSec} style={{ marginTop: 1 }} />
              <Text style={styles.notesText}>{fiche.notes}</Text>
            </View>
          </View>
        )}

        {/* ── Actions secondaires ── */}
        <View style={styles.actionsGrid}>
          {!fiche.isActive && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSetActive}
              disabled={isActing} activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={C.teal} />
              <Text style={styles.actionCardLabel}>Définir comme référence</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard} onPress={handleDuplicate} activeOpacity={0.8}>
            <Ionicons name="copy-outline" size={22} color={C.purple600} />
            <Text style={styles.actionCardLabel}>Dupliquer la fiche</Text>
          </TouchableOpacity>
          {otherFiches.length > 0 && (
            <TouchableOpacity style={styles.actionCard} onPress={handleCompare} activeOpacity={0.8}>
              <Ionicons name="git-compare-outline" size={22} color={C.purple600} />
              <Text style={styles.actionCardLabel}>Comparer</Text>
              <Text style={styles.actionCardSub}>{otherFiches.length} fiche{otherFiches.length > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionCard, styles.actionCardDanger]} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={22} color={C.error} />
            <Text style={[styles.actionCardLabel, { color: C.error }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Footer : Dupliquer pour mise à jour ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={styles.duplicateBtn}
          onPress={handleDuplicate}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color={C.gold} />
          <Text style={styles.duplicateBtnText}>Nouvelle prise de mesure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.surface },
  center:      { alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg },
  headerBtn:   { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  headerSub:   { fontSize: 12, color: C.textSec, marginTop: 1 },
  shareBtn:    { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  divider:     { height: 0.5, backgroundColor: C.border },
  content:     { padding: 14 },

  heroBadge:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20,
    borderWidth: 1, marginBottom: 14 },
  heroEmoji:   { fontSize: 32 },
  heroType:    { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  heroDate:    { fontSize: 13, color: C.textSec, marginTop: 2 },
  uniteBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.06)' },
  uniteText:   { fontSize: 11, color: C.textSec, fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, backgroundColor: '#D1FAE5' },
  activeText:  { fontSize: 10, color: C.teal, fontWeight: '600' },

  section:     { marginBottom: 14 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8, letterSpacing: -0.1 },
  card:        { backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 16, overflow: 'hidden',
    borderWidth: 0.5, borderColor: C.border },
  notesCard:   { backgroundColor: C.bg, borderRadius: 16, padding: 14, flexDirection: 'row',
    gap: 10, borderWidth: 0.5, borderColor: C.border },
  notesText:   { flex: 1, fontSize: 14, color: C.textSec, lineHeight: 21, fontStyle: 'italic' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionCard:  { flex: 1, minWidth: 130, backgroundColor: C.bg, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 8, borderWidth: 0.5, borderColor: C.border },
  actionCardDanger: { borderColor: '#FEE2E2', backgroundColor: '#FFF5F5' },
  actionCardLabel:  { fontSize: 12, color: C.text, fontWeight: '600', textAlign: 'center' },
  actionCardSub:    { fontSize: 11, color: C.textSec },

  footer:        { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border },
  duplicateBtn:  { height: 52, borderRadius: 16, backgroundColor: C.purple900,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  duplicateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
