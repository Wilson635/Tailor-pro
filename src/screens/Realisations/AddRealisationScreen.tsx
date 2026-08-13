// ==========================================
// ÉCRAN CRÉATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import { COULEURS_RAPIDES, STATUT_REALISATION_LABELS } from '@constants/realisationConstants';
import { TYPE_VETEMENT_LABELS } from '@constants/mensurationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRealisation'>;

// ── PALETTE ──────────────────────────────────────────────────────────
const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

// ── TAG INPUT ─────────────────────────────────────────────────────────
const TagInput = ({
  tags, onAdd, onRemove, placeholder,
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  placeholder?: string;
}) => {
  const [input, setInput] = useState('');
  const commit = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onAdd(v); }
    setInput('');
  };
  return (
    <View>
      <View style={tagStyles.chips}>
        {tags.map(t => (
          <TouchableOpacity key={t} style={tagStyles.chip} onPress={() => onRemove(t)}>
            <Text style={tagStyles.chipText}>{t}</Text>
            <Ionicons name="close" size={12} color={C.purple600} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={tagStyles.inputRow}>
        <TextInput
          style={tagStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder ?? 'Ajouter…'}
          placeholderTextColor={C.textTer}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={commit} style={tagStyles.addBtn}>
          <Ionicons name="add" size={18} color={C.purple600} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const tagStyles = StyleSheet.create({
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.purple100,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText:{ fontSize: 13, color: C.purple600, fontWeight: '500' },
  inputRow:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border,
    borderRadius: 10, overflow: 'hidden' },
  input:   { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  addBtn:  { padding: 10, backgroundColor: C.surface },
});

// ── SECTION LABEL ──────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={secStyles.wrap}>
    <Text style={secStyles.title}>{title}</Text>
    {children}
  </View>
);
const secStyles = StyleSheet.create({
  wrap:  { marginBottom: 24 },
  title: { fontSize: 13, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12 },
});

// ── FIELD WRAP ─────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={fieldStyles.wrap}>
    <Text style={fieldStyles.label}>{label}</Text>
    {children}
  </View>
);
const fieldStyles = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontSize: 13, color: C.textSec, marginBottom: 6, fontWeight: '500' },
});

// ── INPUT ──────────────────────────────────────────────────────────────
const Inp = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    style={[inpStyles.inp, props.multiline && { height: 90, textAlignVertical: 'top' }]}
    placeholderTextColor={C.textTer}
    {...props}
  />
);
const inpStyles = StyleSheet.create({
  inp: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: C.surface },
});

// ── DATE PICKER SIMPLE (texte) ──────────────────────────────────────────
const DateField = ({
  label, value, onChange, optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) => (
  <Field label={`${label}${optional ? ' (optionnel)' : ''}`}>
    <Inp
      value={value}
      onChangeText={onChange}
      placeholder="JJ/MM/AAAA"
      keyboardType="numeric"
    />
  </Field>
);

// Convertit "JJ/MM/AAAA" → "YYYY-MM-DD" pour la DB
const parseDate = (d: string): string | undefined => {
  const parts = d.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return undefined;
  return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
};
const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const AddRealisationScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId, commandeId, modeleId: preModeleId } = route.params;

  const { addRealisation, catalog, fiches, tissus, getClientById } = useAppStore();
  const client     = getClientById(clientId);
  const clientFiches = fiches[clientId] ?? [];

  // ── Formulaire ─────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('fr-FR');
  const [modeleId,      setModeleId]      = useState<string | undefined>(preModeleId);
  const [ficheId,       setFicheId]       = useState<string | undefined>(undefined);
  const [tissuId,       setTissuId]       = useState<string | undefined>(undefined);
  const [tissuLabel,    setTissuLabel]    = useState('');
  const [couleur,       setCouleur]       = useState('');
  const [accessoires,   setAccessoires]   = useState<string[]>([]);
  const [observations,  setObservations]  = useState('');
  const [dateCreation,  setDateCreation]  = useState(today);
  const [dateEssayage,  setDateEssayage]  = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [photos,        setPhotos]        = useState<string[]>([]);
  const [isSaving,      setIsSaving]      = useState(false);

  // ── Photos ──────────────────────────────────────────────────────────
  const pickPhotos = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour ajouter des photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris]);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setPhotos(prev => [...prev, result.assets[0].uri]);
  }, []);

  const removePhoto = (uri: string) => setPhotos(prev => prev.filter(p => p !== uri));

  // ── Soumission ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const dc = parseDate(dateCreation);
    if (!dc) { Alert.alert('Erreur', 'Date de création invalide (format JJ/MM/AAAA).'); return; }
    const dl = dateLivraison ? parseDate(dateLivraison) : undefined;
    const de = dateEssayage  ? parseDate(dateEssayage)  : undefined;

    setIsSaving(true);
    const result = await addRealisation(clientId, {
      commandeId: commandeId ?? undefined,
      modeleId: modeleId ?? undefined,
      ficheMensurationId: ficheId ?? undefined,
      tissuId: tissuId ?? undefined,
      tissuLabel: tissuLabel.trim() || undefined,
      couleur: couleur.trim(),
      accessoires,
      photos: [],        // les URIs locales seront uploadées par le store
      observations: observations.trim() || undefined,
      statut: 'en_cours',
      dateCreation: dc,
      dateEssayage: de,
      dateLivraison: dl,
    }, photos);
    setIsSaving(false);

    if (result) {
      navigation.replace('RealisationDetails', { realisationId: result.id, clientId });
    } else {
      Alert.alert('Erreur', "Impossible de créer la réalisation.");
    }
  };

  // ── Modèles disponibles ─────────────────────────────────────────────
  const availableModels = catalog.filter(m => !m.deletedAt && m.statut === 'public');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle réalisation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Photos */}
        <Section title="Photos">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoRow}>
              {photos.map(uri => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(uri)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhotos}>
                <Ionicons name="images-outline" size={24} color={C.purple600} />
                <Text style={styles.addPhotoText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color={C.purple600} />
                <Text style={styles.addPhotoText}>Caméra</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Section>

        {/* Vêtement */}
        <Section title="Vêtement">
          {/* Picker tissu du catalogue */}
          {tissus.length > 0 && (
            <Field label="Tissu (sélectionner)">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickersRow}>
                  <TouchableOpacity
                    style={[styles.pickerChip, !tissuId && styles.pickerChipActive]}
                    onPress={() => { setTissuId(undefined); setTissuLabel(''); }}
                  >
                    <Ionicons name="text-outline" size={13} color={!tissuId ? C.purple600 : C.textSec} />
                    <Text style={[styles.pickerChipText, !tissuId && { color: C.purple600 }]}>Saisir manuellement</Text>
                  </TouchableOpacity>
                  {tissus.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.pickerChip, tissuId === t.id && styles.pickerChipActive]}
                      onPress={() => { setTissuId(t.id); setTissuLabel(t.nomCommercial); }}
                    >
                      <Text style={[styles.pickerChipText, tissuId === t.id && { color: C.purple600 }]}
                        numberOfLines={1}>{t.nomCommercial}</Text>
                      {t.couleur ? <Text style={{ fontSize: 10, color: C.textSec }}>({t.couleur})</Text> : null}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.pickerChip, { borderColor: C.gold, borderStyle: 'dashed' }]}
                    onPress={() => navigation.navigate('AddTissu', {})}
                  >
                    <Ionicons name="add" size={13} color={C.gold} />
                    <Text style={[styles.pickerChipText, { color: C.gold }]}>Nouveau tissu</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Field>
          )}

          {/* Saisie manuelle (si pas de tissu sélectionné ou pas de tissus dans le catalogue) */}
          {!tissuId && (
            <Field label={tissus.length > 0 ? 'Description du tissu' : 'Tissu (description)'}>
              <Inp
                value={tissuLabel}
                onChangeText={setTissuLabel}
                placeholder="Ex: Bazin riche, Wax, Ankara…"
              />
            </Field>
          )}

          <Field label="Couleur principale">
            <Inp value={couleur} onChangeText={setCouleur} placeholder="Ex: Bleu nuit, Rouge bordeaux…" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.colorsRow}>
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
              placeholder="Boutons, fermeture, broderie…"
            />
          </Field>
        </Section>

        {/* Modèle catalogue (optionnel) */}
        <Section title="Modèle de catalogue (optionnel)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickersRow}>
              <TouchableOpacity
                style={[styles.pickerChip, !modeleId && styles.pickerChipActive]}
                onPress={() => setModeleId(undefined)}
              >
                <Ionicons name="close-circle-outline" size={14} color={!modeleId ? C.purple600 : C.textSec} />
                <Text style={[styles.pickerChipText, !modeleId && { color: C.purple600 }]}>Sur-mesure</Text>
              </TouchableOpacity>
              {availableModels.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.pickerChip, modeleId === m.id && styles.pickerChipActive]}
                  onPress={() => setModeleId(modeleId === m.id ? undefined : m.id)}
                >
                  <Text style={[styles.pickerChipText, modeleId === m.id && { color: C.purple600 }]}
                    numberOfLines={1}>{m.nom}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Fiche mensuration */}
        <Section title="Fiche de mensuration">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickersRow}>
              <TouchableOpacity
                style={[styles.pickerChip, !ficheId && styles.pickerChipActive]}
                onPress={() => setFicheId(undefined)}
              >
                <Text style={[styles.pickerChipText, !ficheId && { color: C.purple600 }]}>Aucune</Text>
              </TouchableOpacity>
              {clientFiches.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.pickerChip, ficheId === f.id && styles.pickerChipActive]}
                  onPress={() => setFicheId(ficheId === f.id ? undefined : f.id)}
                >
                  <View style={[styles.ficheDot, f.isActive && { backgroundColor: C.purple600 }]} />
                  <Text style={[styles.pickerChipText, ficheId === f.id && { color: C.purple600 }]}
                    numberOfLines={1}>
                    {TYPE_VETEMENT_LABELS[f.typeVetement]} — {new Date(f.datePrise).toLocaleDateString('fr-FR')}
                    {f.isActive ? ' ★' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Section>

        {/* Dates */}
        <Section title="Dates">
          <DateField label="Date de création" value={dateCreation} onChange={setDateCreation} />
          <DateField label="Date d'essayage" value={dateEssayage} onChange={setDateEssayage} optional />
          <DateField label="Date de livraison prévue" value={dateLivraison} onChange={setDateLivraison} optional />
        </Section>

        {/* Observations */}
        <Section title="Notes & observations">
          <Inp
            value={observations}
            onChangeText={setObservations}
            placeholder="Remarques, instructions particulières…"
            multiline
          />
        </Section>

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
            : <Text style={styles.submitText}>Créer la réalisation</Text>}
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

  photoRow:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  photoWrap:  { position: 'relative' },
  photoThumb: { width: 88, height: 88, borderRadius: 12 },
  removePhoto:{ position: 'absolute', top: -6, right: -6 },
  addPhotoBtn:{ width: 88, height: 88, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: C.surface },
  addPhotoText:{ fontSize: 11, color: C.textSec },

  colorsRow:  { flexDirection: 'row', gap: 8 },
  colorDot:   { width: 28, height: 28, borderRadius: 14 },

  pickersRow: { flexDirection: 'row', gap: 8 },
  pickerChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  pickerChipActive: { borderColor: C.purple600, backgroundColor: C.purple100 },
  pickerChipText: { fontSize: 13, color: C.textSec, maxWidth: 160 },
  ficheDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },

  footer:     { borderTopWidth: 1, borderTopColor: C.border, padding: 16, backgroundColor: C.bg },
  submitBtn:  { backgroundColor: C.purple900, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: C.gold },
});
