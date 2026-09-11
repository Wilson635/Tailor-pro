// ==========================================
// FORMULAIRE RÉALISATION (PARTAGÉ) — TailorPro (Module 5)
// Utilisé par AddRealisationScreen ET EditRealisationScreen — une seule
// source de vérité pour les champs, y compris les photos, pour éviter que
// les deux écrans divergent (c'est ce qui avait fait disparaître les
// photos de l'écran de modification).
// ==========================================

import React, { useCallback, useState } from 'react';
import { showAlert } from '@/src/context/DialogContext';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import { COULEURS_RAPIDES } from '@constants/realisationConstants';
import { TYPE_VETEMENT_LABELS } from '@constants/mensurationConstants';
import { DateField } from '@components/ui';

// ── PALETTE "ATELIER" ────────────────────────────────────────────────
// Encre aubergine + fil d'or : identité de la collection Réalisations.
export const RC = {
  ink: '#16123A', plum: '#6C3EB8', plumSoft: 'rgba(108,62,184,0.08)',
  gold: '#D4AF37', goldSoft: 'rgba(212,175,55,0.10)',
  ivory: '#F5F4FB', linen: '#FFFFFF', hairline: 'rgba(108,62,184,0.15)',
  text: '#1A1033', textSec: '#7C6FA8', textTer: '#7C6FA8',
  ember: '#EF4444', emberSoft: 'rgba(239,68,68,0.10)',
};

export interface RealisationFormValues {
  modeleId?: string;
  ficheMensurationId?: string;
  tissuId?: string;
  tissuLabel: string;
  couleur: string;
  accessoires: string[];
  observations: string;
  dateCreation: string;   // JJ/MM/AAAA
  dateEssayage: string;   // JJ/MM/AAAA
  dateLivraison: string;  // JJ/MM/AAAA
  existingPhotos: string[]; // URLs déjà en ligne (édition)
  newPhotoUris: string[];   // URIs locales pas encore uploadées
}

interface Props {
  mode: 'create' | 'edit';
  clientId: string;
  initialValues: RealisationFormValues;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (values: RealisationFormValues) => void;
}

export const parseDate = (d: string): string | undefined => {
  const parts = d.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return undefined;
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
};
export const isoToDisplay = (iso?: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const realisationTitle = (
  r: { modeleId?: string; tissuLabel?: string },
  catalog: { id: string; nom: string }[],
): string => {
  const m = r.modeleId ? catalog.find((c) => c.id === r.modeleId) : undefined;
  return m?.nom || r.tissuLabel?.trim() || 'Réalisation';
};

// ── Champ à soulignement (carnet d'atelier plutôt que boîte grise) ──
const Underline = (props: React.ComponentProps<typeof TextInput> & { icon?: keyof typeof Ionicons.glyphMap }) => (
  <View style={us.wrap}>
    {props.icon && <Ionicons name={props.icon} size={15} color={RC.textTer} style={{ marginRight: 8 }} />}
    <TextInput
      style={[us.input, props.multiline && { height: 76, textAlignVertical: 'top', paddingTop: 6 }]}
      placeholderTextColor={RC.textTer}
      {...props}
    />
  </View>
);
const us = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: RC.hairline, paddingVertical: 9 },
  input: { flex: 1, fontSize: 15, color: RC.text, fontFamily: 'PlusJakartaSans_500Medium' },
});

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: 12, color: RC.textSec, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 2 }}>
    {children}
  </Text>
);

const SectionHead = ({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) => (
  <View style={shs.row}>
    <View style={shs.iconWrap}>
      <Ionicons name={icon} size={14} color={RC.plum} />
    </View>
    <Text style={shs.title}>{title}</Text>
  </View>
);
const shs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, backgroundColor: RC.plumSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text },
});

const TagInput = ({ tags, onAdd, onRemove, placeholder }: {
  tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder?: string;
}) => {
  const [input, setInput] = useState('');
  const commit = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onAdd(v);
    setInput('');
  };
  return (
    <View>
      {tags.length > 0 && (
        <View style={tagS.chips}>
          {tags.map(t => (
            <TouchableOpacity key={t} style={tagS.chip} onPress={() => onRemove(t)}>
              <Text style={tagS.chipText}>{t}</Text>
              <Ionicons name="close" size={12} color={RC.plum} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={us.wrap}>
        <Ionicons name="pricetag-outline" size={15} color={RC.textTer} style={{ marginRight: 8 }} />
        <TextInput
          style={us.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder ?? 'Ajouter…'}
          placeholderTextColor={RC.textTer}
          onSubmitEditing={commit}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={commit}>
          <Ionicons name="add-circle" size={22} color={RC.plum} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const tagS = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: RC.plumSoft,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12.5, color: RC.plum, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

const Chip = ({ label, sub, active, dashed, color, onPress }: {
  label: string; sub?: string; active?: boolean; dashed?: boolean; color?: string; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      chipS.base,
      active && { borderColor: RC.gold, backgroundColor: RC.ink },
      dashed && { borderStyle: 'dashed', borderColor: color ?? RC.gold },
    ]}
    onPress={onPress}
  >
    <Text style={[chipS.text, active && { color: '#fff' }, dashed && { color: color ?? RC.gold }]} numberOfLines={1}>
      {label}
    </Text>
    {sub ? <Text style={[chipS.sub, active && { color: 'rgba(255,255,255,0.72)' }]}>{sub}</Text> : null}
  </TouchableOpacity>
);
const chipS = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: RC.hairline, backgroundColor: RC.ivory,
  },
  text: { fontSize: 12.5, color: RC.textSec, fontFamily: 'PlusJakartaSans_600SemiBold', maxWidth: 150 },
  sub: { fontSize: 10.5, color: RC.textTer },
});

// ==========================================
// FORMULAIRE
// ==========================================
export const RealisationForm: React.FC<Props> = ({ mode, clientId, initialValues, isSaving, submitLabel, onSubmit }) => {
  const { catalog, fiches, tissus } = useAppStore();
  const clientFiches = fiches[clientId] ?? [];
  const availableModels = catalog.filter(m => !m.deletedAt && m.statut === 'public');

  const [v, setV] = useState<RealisationFormValues>(initialValues);
  const patch = (p: Partial<RealisationFormValues>) => setV(prev => ({ ...prev, ...p }));

  // ── Photos ──
  const pickPhotos = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission requise', "L'accès à la galerie est nécessaire pour ajouter des photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85,
    });
    if (!result.canceled) {
      patch({ newPhotoUris: [...v.newPhotoUris, ...result.assets.map(a => a.uri)] });
    }
  }, [v.newPhotoUris]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission requise', "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) patch({ newPhotoUris: [...v.newPhotoUris, result.assets[0].uri] });
  }, [v.newPhotoUris]);

  const removeExistingPhoto = (url: string) =>
      patch({ existingPhotos: v.existingPhotos.filter(p => p !== url) });
  const removeNewPhoto = (uri: string) =>
      patch({ newPhotoUris: v.newPhotoUris.filter(p => p !== uri) });

  const totalPhotos = v.existingPhotos.length + v.newPhotoUris.length;

  const handleSubmit = () => {
    if (mode === 'create' && !parseDate(v.dateCreation)) {
      showAlert('Date invalide', 'La date de création doit être au format JJ/MM/AAAA.');
      return;
    }
    onSubmit(v);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── PHOTOS — bande "planche d'atelier" ── */}
        <View style={{ marginBottom: 26 }}>
          <View style={styles.photoHeadRow}>
            <SectionHead icon="images-outline" title="Photos" />
            {totalPhotos > 0 && <Text style={styles.photoCount}>{totalPhotos}</Text>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoRow}>
              {v.existingPhotos.map(url => (
                <View key={url} style={styles.photoWrap}>
                  <Image source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removeExistingPhoto(url)}>
                    <Ionicons name="close-circle" size={20} color={RC.ember} />
                  </TouchableOpacity>
                </View>
              ))}
              {v.newPhotoUris.map(uri => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>nouveau</Text></View>
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removeNewPhoto(uri)}>
                    <Ionicons name="close-circle" size={20} color={RC.ember} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoTile} onPress={pickPhotos}>
                <Ionicons name="images-outline" size={22} color={RC.gold} />
                <Text style={styles.addPhotoText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoTile} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color={RC.gold} />
                <Text style={styles.addPhotoText}>Caméra</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── VÊTEMENT ── */}
        <View style={{ marginBottom: 26 }}>
          <SectionHead icon="cut-outline" title="Vêtement" />

          {tissus.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <FieldLabel>Tissu</FieldLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    <Chip
                        label="Saisir manuellement"
                        active={!v.tissuId}
                        onPress={() => patch({ tissuId: undefined, tissuLabel: '' })}
                    />
                    {tissus.map(t => (
                        <Chip
                            key={t.id}
                            label={t.nomCommercial}
                            sub={t.couleur || undefined}
                            active={v.tissuId === t.id}
                            onPress={() => patch({ tissuId: t.id, tissuLabel: t.nomCommercial })}
                        />
                    ))}
                  </View>
                </ScrollView>
              </View>
          )}

          {!v.tissuId && (
              <View style={{ marginBottom: 4 }}>
                <FieldLabel>{tissus.length > 0 ? 'Description du tissu' : 'Tissu'}</FieldLabel>
                <Underline
                    icon="layers-outline"
                    value={v.tissuLabel}
                    onChangeText={t => patch({ tissuLabel: t })}
                    placeholder="Bazin riche, Wax, Ankara…"
                />
              </View>
          )}

          <View style={{ marginTop: 14, marginBottom: 4 }}>
            <FieldLabel>Couleur principale</FieldLabel>
            <Underline
                icon="color-palette-outline"
                value={v.couleur}
                onChangeText={c => patch({ couleur: c })}
                placeholder="Bleu nuit, Rouge bordeaux…"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={styles.swatchRow}>
                {COULEURS_RAPIDES.map(c => (
                    <TouchableOpacity
                        key={c.hex}
                        style={[
                          styles.swatch,
                          { backgroundColor: c.hex },
                          v.couleur === c.label && styles.swatchActive,
                        ]}
                        onPress={() => patch({ couleur: v.couleur === c.label ? '' : c.label })}
                    >
                      {v.couleur === c.label && <Ionicons name="checkmark" size={13} color="#FFF" />}
                    </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={{ marginTop: 14 }}>
            <FieldLabel>Accessoires</FieldLabel>
            <TagInput
                tags={v.accessoires}
                onAdd={t => patch({ accessoires: [...v.accessoires, t] })}
                onRemove={t => patch({ accessoires: v.accessoires.filter(x => x !== t) })}
                placeholder="Boutons, fermeture, broderie…"
            />
          </View>
        </View>

        {/* ── MODÈLE DE CATALOGUE ── */}
        <View style={{ marginBottom: 26 }}>
          <SectionHead icon="albums-outline" title="Modèle de catalogue" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsRow}>
              <Chip label="Sur-mesure" active={!v.modeleId} onPress={() => patch({ modeleId: undefined })} />
              {availableModels.map(m => (
                  <Chip
                      key={m.id}
                      label={m.nom}
                      active={v.modeleId === m.id}
                      onPress={() => patch({ modeleId: v.modeleId === m.id ? undefined : m.id })}
                  />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── FICHE DE MENSURATION ── */}
        <View style={{ marginBottom: 26 }}>
          <SectionHead icon="body-outline" title="Fiche de mensuration" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipsRow}>
              <Chip label="Aucune" active={!v.ficheMensurationId} onPress={() => patch({ ficheMensurationId: undefined })} />
              {clientFiches.map(f => (
                  <Chip
                      key={f.id}
                      label={`${TYPE_VETEMENT_LABELS[f.typeVetement]}${f.isActive ? ' ★' : ''}`}
                      sub={new Date(f.datePrise).toLocaleDateString('fr-FR')}
                      active={v.ficheMensurationId === f.id}
                      onPress={() => patch({ ficheMensurationId: v.ficheMensurationId === f.id ? undefined : f.id })}
                  />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── DATES ── */}
        <View style={{ marginBottom: 26 }}>
          <SectionHead icon="calendar-outline" title="Dates" />
          {mode === 'create' && (
              <DateField
                  label="Date de création"
                  value={v.dateCreation}
                  onChange={t => patch({ dateCreation: t })}
              />
          )}
          <DateField
              label="Date d'essayage (optionnel)"
              value={v.dateEssayage}
              onChange={t => patch({ dateEssayage: t })}
              placeholder="Choisir une date d'essayage"
          />
          <DateField
              label="Date de livraison prévue (optionnel)"
              value={v.dateLivraison}
              onChange={t => patch({ dateLivraison: t })}
              placeholder="Choisir une date de livraison"
          />
        </View>

        {/* ── NOTES ── */}
        <View style={{ marginBottom: 26 }}>
          <SectionHead icon="reader-outline" title="Notes & observations" />
          <View style={styles.noteBox}>
            <Underline
                value={v.observations}
                onChangeText={t => patch({ observations: t })}
                placeholder="Remarques, instructions particulières…"
                multiline
            />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
            style={[styles.submitBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSaving}
        >
          {isSaving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{submitLabel}</Text>}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  photoHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoCount: { fontSize: 12, color: RC.textTer, fontFamily: 'PlusJakartaSans_600SemiBold' },
  photoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  photoWrap: { position: 'relative' },
  photoThumb: { width: 92, height: 92, borderRadius: 14 },
  newBadge: {
    position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(29,16,51,0.75)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 9, color: RC.gold, fontFamily: 'PlusJakartaSans_600SemiBold' },
  removePhoto: { position: 'absolute', top: -6, right: -6, backgroundColor: RC.ivory, borderRadius: 10 },
  addPhotoTile: {
    width: 92, height: 92, borderRadius: 14, borderWidth: 1.5, borderColor: RC.gold, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: RC.goldSoft,
  },
  addPhotoText: { fontSize: 11, color: RC.gold, fontFamily: 'PlusJakartaSans_600SemiBold' },

  chipsRow: { flexDirection: 'row', gap: 8 },
  swatchRow: { flexDirection: 'row', gap: 9 },
  swatch: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: RC.hairline,
  },
  swatchActive: { borderWidth: 2, borderColor: RC.ink },

  noteBox: { backgroundColor: RC.linen, borderRadius: 14, paddingHorizontal: 12 },

  footer: { borderTopWidth: 0.5, borderTopColor: RC.hairline, padding: 16, backgroundColor: RC.ivory },
  submitBtn: {
    backgroundColor: RC.ink, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  submitText: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
