// ==========================================
// ÉCRAN MODIFICATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useEffect, useState } from 'react';
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

  const { getRealisationById, updateRealisation, userId, loadFiches, loadCatalog, loadTissus } = useAppStore();
  const realisation = getRealisationById(realisationId, clientId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFiches(clientId);
    loadCatalog();
    loadTissus();
  }, [clientId]);

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
            <Ionicons name="arrow-back" size={18} color={RC.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Atelier</Text>
            <Text style={styles.headerTitle}>Modifier</Text>
          </View>
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: RC.ivory,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: RC.linen,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: RC.hairline,
  },
  kicker: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: RC.gold,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: RC.text },
});