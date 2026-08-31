// ==========================================
// ÉCRAN CRÉATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { RealisationForm, RC, parseDate, type RealisationFormValues } from '@screens/Realisations/RealisationForm';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRealisation'>;

export const AddRealisationScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId, commandeId, modeleId: preModeleId } = route.params;
  const { addRealisation } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toLocaleDateString('fr-FR');
  const initialValues: RealisationFormValues = {
    modeleId: preModeleId,
    ficheMensurationId: undefined,
    tissuId: undefined,
    tissuLabel: '',
    couleur: '',
    accessoires: [],
    observations: '',
    dateCreation: today,
    dateEssayage: '',
    dateLivraison: '',
    existingPhotos: [],
    newPhotoUris: [],
  };

  const handleSubmit = async (v: RealisationFormValues) => {
    const dc = parseDate(v.dateCreation)!; // déjà validé par le formulaire
    const dl = v.dateLivraison ? parseDate(v.dateLivraison) : undefined;
    const de = v.dateEssayage ? parseDate(v.dateEssayage) : undefined;

    setIsSaving(true);
    const result = await addRealisation(clientId, {
      commandeId: commandeId ?? undefined,
      modeleId: v.modeleId,
      ficheMensurationId: v.ficheMensurationId,
      tissuId: v.tissuId,
      tissuLabel: v.tissuLabel.trim() || undefined,
      couleur: v.couleur.trim(),
      accessoires: v.accessoires,
      photos: [], // uploadées par le store depuis newPhotoUris
      observations: v.observations.trim() || undefined,
      statut: 'en_cours',
      dateCreation: dc,
      dateEssayage: de,
      dateLivraison: dl,
    }, v.newPhotoUris);
    setIsSaving(false);

    if (result) {
      navigation.replace('RealisationDetails', { realisationId: result.id, clientId });
    } else {
      Alert.alert('Erreur', "Impossible de créer la réalisation.");
    }
  };

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={RC.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle réalisation</Text>
          <View style={{ width: 36 }} />
        </View>

        <RealisationForm
            mode="create"
            clientId={clientId}
            initialValues={initialValues}
            isSaving={isSaving}
            submitLabel="Créer la réalisation"
            onSubmit={handleSubmit}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RC.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: RC.hairline, backgroundColor: RC.ivory,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: RC.text, textAlign: 'center' },
});