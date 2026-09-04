// ==========================================
// ÉCRAN AJOUT TISSU — TailorPro (Module 6)
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
import {
  TYPE_TISSU_LIST, TYPE_TISSU_LABELS, TYPE_TISSU_COLORS,
} from '@constants/tissuConstants';
import { COULEURS_RAPIDES } from '@constants/realisationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTissu'>;

const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={fS.label}>{label}{required ? ' *' : ''}</Text>
    {children}
  </View>
);
const fS = StyleSheet.create({ label: { fontSize: 13, color: C.textSec, marginBottom: 6, fontWeight: '500' } });

const Inp = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    style={[iS.inp, props.multiline && { height: 80, textAlignVertical: 'top' }]}
    placeholderTextColor={C.textTer}
    {...props}
  />
);
const iS = StyleSheet.create({
  inp: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: C.text, backgroundColor: C.surface },
});

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={sS.title}>{title}</Text>
    {children}
  </View>
);
const sS = StyleSheet.create({
  title: { fontSize: 13, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 12 },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const AddTissuScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  // preselectedType comes from AddRealisation "Nouveau tissu" shortcut
  const preType = (route.params as any)?.preType as string | undefined;

  const { addTissu } = useAppStore();

  const [typeTissu,       setTypeTissu]       = useState(preType ?? '');
  const [nomCommercial,   setNomCommercial]   = useState('');
  const [couleur,         setCouleur]         = useState('');
  const [fournisseur,     setFournisseur]     = useState('');
  const [prixUnitaire,    setPrixUnitaire]    = useState('');
  const [quantiteUtilisee,setQuantiteUtilisee]= useState('0');
  const [photoUri,        setPhotoUri]        = useState<string | undefined>(undefined);
  const [isSaving,        setIsSaving]        = useState(false);

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission requise', "Accès galerie refusé."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission requise', "Accès caméra refusé."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }, []);

  const handleSubmit = async () => {
    if (!typeTissu)    { Alert.alert('Champ requis', 'Sélectionnez le type de tissu.'); return; }
    if (!nomCommercial.trim()) { Alert.alert('Champ requis', 'Entrez le nom commercial.'); return; }
    setIsSaving(true);
    const result = await addTissu({
      typeTissu,
      nomCommercial: nomCommercial.trim(),
      couleur: couleur.trim(),
      fournisseur: fournisseur.trim() || undefined,
      prixUnitaire: parseFloat(prixUnitaire.replace(/\s/g, '').replace(',', '.')) || 0,
      quantiteUtilisee: parseFloat(quantiteUtilisee.replace(/\s/g, '').replace(',', '.')) || 0,
      photo: undefined,
    }, photoUri);
    setIsSaving(false);

    if (result) {
      // If came from AddRealisation via picker, go back with the new tissu id
      if (navigation.canGoBack()) navigation.goBack();
    } else {
      Alert.alert('Erreur', 'Impossible de créer le tissu.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau tissu</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Photo */}
        <Section title="Photo (optionnel)">
          <View style={styles.photoRow}>
            {photoUri ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} resizeMode="cover" />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(undefined)}>
                  <Ionicons name="close-circle" size={22} color={C.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                  <Ionicons name="images-outline" size={28} color={C.purple600} />
                  <Text style={styles.addPhotoText}>Galerie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={28} color={C.purple600} />
                  <Text style={styles.addPhotoText}>Caméra</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Section>

        {/* Type de tissu */}
        <Section title="Type de tissu *">
          <View style={styles.typeGrid}>
            {TYPE_TISSU_LIST.map(t => {
              const active = typeTissu === t;
              const color  = TYPE_TISSU_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, active && { backgroundColor: color + '22', borderColor: color }]}
                  onPress={() => setTypeTissu(t)}
                >
                  <Text style={[styles.typeChipText, active && { color }]}>
                    {TYPE_TISSU_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Informations */}
        <Section title="Informations">
          <Field label="Nom commercial" required>
            <Inp value={nomCommercial} onChangeText={setNomCommercial} placeholder="Ex: Vlisco Wax, Super Bazin riche…" />
          </Field>
          <Field label="Couleur principale">
            <Inp value={couleur} onChangeText={setCouleur} placeholder="Ex: Bleu royal, Multicolore…" />
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
          <Field label="Fournisseur">
            <Inp value={fournisseur} onChangeText={setFournisseur} placeholder="Ex: Marché Sandaga, Importateur X…" />
          </Field>
        </Section>

        {/* Prix & Quantité */}
        <Section title="Prix & quantité">
          <Field label="Prix unitaire (F/m)">
            <Inp
              value={prixUnitaire}
              onChangeText={setPrixUnitaire}
              placeholder="Ex: 5000"
              keyboardType="decimal-pad"
            />
          </Field>
          <Field label="Quantité déjà utilisée (m)">
            <Inp
              value={quantiteUtilisee}
              onChangeText={setQuantiteUtilisee}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </Field>
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
            : <Text style={styles.submitText}>Ajouter le tissu</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  scroll:       { paddingHorizontal: 20, paddingTop: 20 },

  photoRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  photoWrap:    { position: 'relative' },
  photoThumb:   { width: 120, height: 120, borderRadius: 16 },
  removePhoto:  { position: 'absolute', top: -8, right: -8 },
  addPhotoBtn:  { width: 100, height: 100, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface },
  addPhotoText: { fontSize: 11, color: C.textSec },

  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.surface },
  typeChipText: { fontSize: 13, color: C.textSec, fontWeight: '500' },

  colorRow:     { flexDirection: 'row', gap: 8 },
  colorDot:     { width: 28, height: 28, borderRadius: 14 },

  footer:       { borderTopWidth: 1, borderTopColor: C.border, padding: 16, backgroundColor: C.bg },
  submitBtn:    { backgroundColor: C.purple900, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText:   { fontSize: 16, fontWeight: '700', color: C.gold },
});
