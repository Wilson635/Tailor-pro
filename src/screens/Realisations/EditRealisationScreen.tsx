// ==========================================
// ÉCRAN MODIFICATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import { COULEURS_RAPIDES } from '@constants/realisationConstants';
import { TYPE_VETEMENT_LABELS } from '@constants/mensurationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditRealisation'>;

// ── PALETTE ──────────────────────────────────────────────────────────
const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

// ── Helpers partagés ───────────────────────────────────────────────────
const TagInput = ({
  tags, onAdd, onRemove, placeholder,
}: {
  tags: string[]; onAdd: (t: string) => void;
  onRemove: (t: string) => void; placeholder?: string;
}) => {
  const [input, setInput] = useState('');
  const commit = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onAdd(v);
    setInput('');
  };
  return (
    <View>
      <View style={tagS.chips}>
        {tags.map(t => (
          <TouchableOpacity key={t} style={tagS.chip} onPress={() => onRemove(t)}>
            <Text style={tagS.chipText}>{t}</Text>
            <Ionicons name="close" size={12} color={C.purple600} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={tagS.row}>
        <TextInput style={tagS.inp} value={input} onChangeText={setInput}
          placeholder={placeholder ?? 'Ajouter…'} placeholderTextColor={C.textTer}
          onSubmitEditing={commit} returnKeyType="done" />
        <TouchableOpacity onPress={commit} style={tagS.add}>
          <Ionicons name="add" size={18} color={C.purple600} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const tagS = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.purple100,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, color: C.purple600 },
  row:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, overflow: 'hidden' },
  inp:   { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  add:   { padding: 10, backgroundColor: C.surface },
});

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={fS.label}>{label}</Text>
    {children}
  </View>
);
const fS = StyleSheet.create({ label: { fontSize: 13, color: C.textSec, marginBottom: 6, fontWeight: '500' } });

const Inp = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    style={[iS.inp, props.multiline && { height: 90, textAlignVertical: 'top' }]}
    placeholderTextColor={C.textTer}
    {...props}
  />
);
const iS = StyleSheet.create({
  inp: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: C.surface },
});

const parseDate = (d: string): string | undefined => {
  const parts = d.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return undefined;
  return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
};
const isoToDisplay = (iso?: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const EditRealisationScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { realisationId, clientId } = route.params;

  const { getRealisationById, updateRealisation, catalog, fiches } = useAppStore();
  const realisation = getRealisationById(realisationId, clientId);
  const clientFiches = fiches[clientId] ?? [];

  if (!realisation) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.textSec }}>Réalisation introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.purple600, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── État initialisé depuis la réalisation existante ─────────────────
  const [modeleId,      setModeleId]      = useState(realisation.modeleId);
  const [ficheId,       setFicheId]       = useState(realisation.ficheMensurationId);
  const [tissuLabel,    setTissuLabel]    = useState(realisation.tissuLabel ?? '');
  const [couleur,       setCouleur]       = useState(realisation.couleur);
  const [accessoires,   setAccessoires]   = useState(realisation.accessoires);
  const [observations,  setObservations]  = useState(realisation.observations ?? '');
  const [dateEssayage,  setDateEssayage]  = useState(isoToDisplay(realisation.dateEssayage));
  const [dateLivraison, setDateLivraison] = useState(isoToDisplay(realisation.dateLivraison));
  const [isSaving,      setIsSaving]      = useState(false);

  const availableModels = catalog.filter(m => !m.deletedAt && m.statut === 'public');

  const handleSubmit = async () => {
    setIsSaving(true);
    await updateRealisation(realisationId, clientId, {
      modeleId: modeleId ?? undefined,
      ficheMensurationId: ficheId ?? undefined,
      tissuLabel: tissuLabel.trim() || undefined,
      couleur: couleur.trim(),
      accessoires,
      observations: observations.trim() || undefined,
      dateEssayage:  dateLivraison ? parseDate(dateEssayage)  : undefined,
      dateLivraison: dateLivraison ? parseDate(dateLivraison) : undefined,
    });
    setIsSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la réalisation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tissu & Couleur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vêtement</Text>
          <Field label="Tissu">
            <Inp value={tissuLabel} onChangeText={setTissuLabel} placeholder="Bazin, Wax, Ankara…" />
          </Field>
          <Field label="Couleur">
            <Inp value={couleur} onChangeText={setCouleur} placeholder="Ex: Bleu nuit…" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.colorRow}>
                {COULEURS_RAPIDES.map(c => (
                  <TouchableOpacity
                    key={c.hex}
                    style={[styles.colorDot, { backgroundColor: c.hex,
                      borderWidth: couleur === c.label ? 3 : 1,
                      borderColor: couleur === c.label ? C.purple600 : C.border }]}
                    onPress={() => setCouleur(couleur === c.label ? '' : c.label)}
                  />
                ))}
              </View>
            </ScrollView>
          </Field>
          <Field label="Accessoires">
            <TagInput
              tags={accessoires}
              onAdd={t => setAccessoires(p => [...p, t])}
              onRemove={t => setAccessoires(p => p.filter(x => x !== t))}
              placeholder="Boutons, broderie…"
            />
          </Field>
        </View>

        {/* Modèle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modèle de catalogue (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickersRow}>
              <TouchableOpacity
                style={[styles.chip, !modeleId && styles.chipActive]}
                onPress={() => setModeleId(undefined)}
              >
                <Text style={[styles.chipText, !modeleId && { color: C.purple600 }]}>Sur-mesure</Text>
              </TouchableOpacity>
              {availableModels.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, modeleId === m.id && styles.chipActive]}
                  onPress={() => setModeleId(modeleId === m.id ? undefined : m.id)}
                >
                  <Text style={[styles.chipText, modeleId === m.id && { color: C.purple600 }]}
                    numberOfLines={1}>{m.nom}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Fiche mensuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiche de mensuration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickersRow}>
              <TouchableOpacity
                style={[styles.chip, !ficheId && styles.chipActive]}
                onPress={() => setFicheId(undefined)}
              >
                <Text style={[styles.chipText, !ficheId && { color: C.purple600 }]}>Aucune</Text>
              </TouchableOpacity>
              {clientFiches.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.chip, ficheId === f.id && styles.chipActive]}
                  onPress={() => setFicheId(ficheId === f.id ? undefined : f.id)}
                >
                  <Text style={[styles.chipText, ficheId === f.id && { color: C.purple600 }]}
                    numberOfLines={1}>
                    {TYPE_VETEMENT_LABELS[f.typeVetement]} — {new Date(f.datePrise).toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <Field label="Date d'essayage (optionnel)">
            <Inp value={dateEssayage} onChangeText={setDateEssayage} placeholder="JJ/MM/AAAA" keyboardType="numeric" />
          </Field>
          <Field label="Date de livraison prévue (optionnel)">
            <Inp value={dateLivraison} onChangeText={setDateLivraison} placeholder="JJ/MM/AAAA" keyboardType="numeric" />
          </Field>
        </View>

        {/* Observations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & observations</Text>
          <Inp value={observations} onChangeText={setObservations}
            placeholder="Remarques…" multiline />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitText}>Enregistrer les modifications</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:    { padding: 4, marginRight: 8 },
  headerTitle:{ flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  scroll:     { paddingHorizontal: 20, paddingTop: 20 },
  section:    { marginBottom: 24 },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12 },
  colorRow:   { flexDirection: 'row', gap: 8 },
  colorDot:   { width: 28, height: 28, borderRadius: 14 },
  pickersRow: { flexDirection: 'row', gap: 8 },
  chip:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.surface },
  chipActive: { borderColor: C.purple600, backgroundColor: C.purple100 },
  chipText:   { fontSize: 13, color: C.textSec, maxWidth: 160 },
  footer:     { borderTopWidth: 1, borderTopColor: C.border, padding: 16, backgroundColor: C.bg },
  submitBtn:  { backgroundColor: C.purple900, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: C.gold },
});
