// ==========================================
// ÉCRAN CRÉATION RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useEffect, useState } from 'react';
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
  const { addRealisation, loadFiches, loadCatalog, loadTissus } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFiches(clientId);
    loadCatalog();
    loadTissus();
  }, [clientId]);

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
            <Ionicons name="arrow-back" size={18} color={RC.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Atelier</Text>
            <Text style={styles.headerTitle}>Nouvelle réalisation</Text>
          </View>
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