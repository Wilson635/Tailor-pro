// ==========================================
// ÉCRAN PRISE DE MESURES — TailorPro (Module 3)
// Migré vers le système FicheMensuration : réutilise DynamicMeasurementForm
// (déjà utilisé par MeasurementPickerModal) qui accepte les champs du template
// du type de vêtement ET des champs personnalisés ajoutés à la volée.
// ==========================================

import React, { useState } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { DynamicMeasurementForm } from '@screens/Projects/DynamicMeasurementForm';
import {
  TYPE_VETEMENT_LABELS, TYPE_VETEMENT_ICONS,
} from '@constants/mensurationConstants';
import type { TypeVetement } from '../../types';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeasurements'>;

// ── PALETTE (cohérente avec les autres écrans du module 3) ──
const C = {
  purple900: '#1A0033',
  purple600: '#534AB7',
  bg:        '#FFFFFF',
  surface:   '#F7F6F4',
  border:    '#EBEBEB',
  text:      '#0E0B14',
  textSec:   '#7A7787',
};

// Types de vêtements connus (le champ reste libre — ce ne sont que des raccourcis)
// "global" n'est pas un vêtement : c'est la fiche de mesures générales du corps,
// indépendante d'un vêtement précis (cf. fiche papier), à prendre une bonne fois
// et réutilisable ensuite pour n'importe quel type de vêtement.
const KNOWN_TYPES: TypeVetement[] = ['global', 'robe', 'costume', 'chemise', 'pantalon', 'boubou', 'autre'];

export const AddMeasurementsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId, typeVetement: initialType } = route.params;

  const { addFiche, getClientById } = useAppStore();
  const client = getClientById(clientId);

  const [typeVetement, setTypeVetement] = useState<TypeVetement | null>(
      (initialType as TypeVetement) ?? null
  );
  const [customType, setCustomType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ──────────────────────────────────────
  // Étape 1 : choix du type de vêtement
  // ──────────────────────────────────────

  const handleConfirmCustomType = () => {
    const trimmed = customType.trim();
    if (!trimmed) {
      showAlert('Champ requis', 'Précise le type de vêtement.');
      return;
    }
    setTypeVetement(trimmed);
  };

  // ──────────────────────────────────────
  // Étape 2 : soumission du formulaire dynamique
  // ──────────────────────────────────────

  const handleSubmit = async (mesures: Record<string, number>, unite: 'cm' | 'pouces') => {
    if (!typeVetement) return;
    setIsSaving(true);
    try {
      const fiche = await addFiche(clientId, {
        typeVetement,
        datePrise: new Date(),
        mesures,
        unite,
        notes: notes.trim() || undefined,
        isActive: true, // devient la fiche de référence pour ce type de vêtement
      });

      if (fiche) {
        showSuccess('Mesures enregistrées', 'La fiche a bien été créée.', () =>
          navigation.replace('FicheDetails', { ficheId: fiche.id, clientId }),
        );
      } else {
        showAlert('Erreur', 'Impossible d\'enregistrer les mesures. Réessayez.');
      }
    } catch {
      showAlert('Erreur', 'Une erreur inattendue s\'est produite.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelForm = () => {
    if (initialType) {
      navigation.goBack();
    } else {
      setTypeVetement(null);
    }
  };

  return (
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => (typeVetement && !initialType ? setTypeVetement(null) : navigation.goBack())}
              activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Nouvelle prise de mesure</Text>
            <Text style={styles.headerSub}>{client?.nom ?? 'Client'}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {!typeVetement ? (
              // ── Étape 1 : choix du type de vêtement ──
              <View style={{ gap: 16 }}>
                <TouchableOpacity
                    style={styles.globalOption}
                    onPress={() => setTypeVetement('global')}
                    activeOpacity={0.85}
                >
                  <Text style={styles.globalEmoji}>{TYPE_VETEMENT_ICONS['global'] ?? '📋'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.globalTitle}>{TYPE_VETEMENT_LABELS['global'] ?? 'Mesures générales'}</Text>
                    <Text style={styles.globalSub}>La fiche complète du corps, indépendante d'un vêtement</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.textSec} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Ou pour un type de vêtement précis</Text>
                <View style={styles.typesGrid}>
                  {KNOWN_TYPES.filter(t => t !== 'global').map((type) => (
                      <TouchableOpacity
                          key={type}
                          style={styles.typeChip}
                          onPress={() => setTypeVetement(type)}
                          activeOpacity={0.8}
                      >
                        <Text style={styles.typeEmoji}>{TYPE_VETEMENT_ICONS[type] ?? '📐'}</Text>
                        <Text style={styles.typeLabel}>{TYPE_VETEMENT_LABELS[type] ?? type}</Text>
                      </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.customSection}>
                  <Text style={styles.fieldLabel}>Autre type (personnalisé)</Text>
                  <View style={styles.customRow}>
                    <TextInput
                        style={styles.customInput}
                        placeholder="ex: Kimono, Gilet…"
                        placeholderTextColor={C.textSec}
                        value={customType}
                        onChangeText={setCustomType}
                        onSubmitEditing={handleConfirmCustomType}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.customBtn} onPress={handleConfirmCustomType} activeOpacity={0.8}>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
          ) : (
              // ── Étape 2 : formulaire de mesures dynamique ──
              <View style={{ gap: 16 }}>
                <View style={styles.typeSummary}>
                  <Text style={styles.typeSummaryEmoji}>{TYPE_VETEMENT_ICONS[typeVetement] ?? '📐'}</Text>
                  <Text style={styles.typeSummaryLabel}>
                    {TYPE_VETEMENT_LABELS[typeVetement] ?? typeVetement}
                  </Text>
                </View>

                <DynamicMeasurementForm
                    typeVetement={typeVetement}
                    onSubmit={handleSubmit}
                    onCancel={handleCancelForm}
                />

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Notes (optionnel)</Text>
                  <TextInput
                      style={styles.notesInput}
                      placeholder="Remarques particulières…"
                      placeholderTextColor={C.textSec}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                  />
                </View>

                {isSaving && (
                    <Text style={{ textAlign: 'center', color: C.textSec, fontSize: 13 }}>
                      Enregistrement en cours…
                    </Text>
                )}
              </View>
          )}
        </ScrollView>
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
  content:     { padding: 16 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  // ── Option "Mesures globales" ──
  globalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EEEDFE', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.purple600,
  },
  globalEmoji: { fontSize: 26 },
  globalTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  globalSub: { fontSize: 12, color: C.textSec, marginTop: 2 },

  // ── Étape 1 : types ──
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: {
    width: '31%', backgroundColor: C.bg, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', gap: 6, borderWidth: 0.5, borderColor: C.border,
  },
  typeEmoji: { fontSize: 26 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'center' },

  customSection: { gap: 8 },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, fontSize: 14, color: C.text, backgroundColor: C.bg,
  },
  customBtn: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: C.purple600,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Étape 2 ──
  typeSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 14, padding: 12,
    borderWidth: 0.5, borderColor: C.border,
  },
  typeSummaryEmoji: { fontSize: 22 },
  typeSummaryLabel: { fontSize: 15, fontWeight: '700', color: C.text },

  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  notesInput: {
    minHeight: 80, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text,
    backgroundColor: C.bg,
  },
});