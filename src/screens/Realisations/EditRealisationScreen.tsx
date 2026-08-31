// ==========================================
// ÉCRAN MODIFICATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { uploadRealisationPhoto } from '@services/supabaseService';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { RealisationForm, RC, parseDate, type RealisationFormValues } from '@screens/Realisations/RealisationForm';

type Props = NativeStackScreenProps<RootStackParamList, 'EditRealisation'>;

export const EditRealisationScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { realisationId, clientId } = route.params;

  const { getRealisationById, updateRealisation, userId } = useAppStore();
  const realisation = getRealisationById(realisationId, clientId);
  const [isSaving, setIsSaving] = useState(false);

  if (!realisation) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: RC.ivory }}>
          <Text style={{ color: RC.textSec }}>Réalisation introuvable</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ color: RC.plum, fontFamily: 'PlusJakartaSans_700Bold' }}>Retour</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const initialValues: RealisationFormValues = {
    modeleId: realisation.modeleId,
    ficheMensurationId: realisation.ficheMensurationId,
    tissuId: realisation.tissuId,
    tissuLabel: realisation.tissuLabel ?? '',
    couleur: realisation.couleur,
    accessoires: realisation.accessoires,
    observations: realisation.observations ?? '',
    dateCreation: '', // non modifiable en édition (fixée à la création)
    dateEssayage: isoToDisplay(realisation.dateEssayage),
    dateLivraison: isoToDisplay(realisation.dateLivraison),
    existingPhotos: realisation.photos,
    newPhotoUris: [],
  };

  const handleSubmit = async (v: RealisationFormValues) => {
    setIsSaving(true);

    // Upload des nouvelles photos ajoutées, puis fusion avec celles conservées.
    const uploadedUrls: string[] = [];
    for (const uri of v.newPhotoUris) {
      const { publicUrl } = await uploadRealisationPhoto(uri, userId ?? '', realisationId);
      if (publicUrl) uploadedUrls.push(publicUrl);
    }
    const finalPhotos = [...v.existingPhotos, ...uploadedUrls];

    await updateRealisation(realisationId, clientId, {
      modeleId: v.modeleId,
      ficheMensurationId: v.ficheMensurationId,
      tissuId: v.tissuId,
      tissuLabel: v.tissuLabel.trim() || undefined,
      couleur: v.couleur.trim(),
      accessoires: v.accessoires,
      observations: v.observations.trim() || undefined,
      dateEssayage: v.dateEssayage ? parseDate(v.dateEssayage) : undefined,
      dateLivraison: v.dateLivraison ? parseDate(v.dateLivraison) : undefined,
      photos: finalPhotos,
    });
    setIsSaving(false);
    navigation.goBack();
  };

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={RC.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier la réalisation</Text>
          <View style={{ width: 36 }} />
        </View>

        <RealisationForm
            mode="edit"
            clientId={clientId}
            initialValues={initialValues}
            isSaving={isSaving}
            submitLabel="Enregistrer les modifications"
            onSubmit={handleSubmit}
        />
      </View>
  );
};

function isoToDisplay(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RC.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: RC.hairline, backgroundColor: RC.ivory,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text, textAlign: 'center' },
});