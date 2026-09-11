// ==========================================
// NOUVEAU MODÈLE CATALOGUE — TailorPro
// ==========================================

import React, { useState } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { catalogService } from '@services/supabaseService';
import { useThemedStyles, type Palette } from '@/src/theme';
import { keyboardAvoidBehavior } from '@components/ui';
import type { CatalogCategory } from '../../types';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { Difficulte } from '@constants/catalogConstants';
import {
  CatalogSection,
  CatalogFieldLabel,
  CatalogInput,
  CatalogPhotoStrip,
  CatalogCategoryPills,
  CatalogDifficulteRow,
  CatalogTagInput,
  CatalogStatutCards,
  TISSUS_COMMUNS,
  ACCESSOIRES_COMMUNS,
} from './catalogFormBits';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCatalogModel'>;
type Statut = 'public' | 'prive';

export const AddCatalogModelScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { addCatalogModel } = useAppStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CatalogCategory>('robe');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [difficulte, setDifficulte] = useState<Difficulte>('moyen');
  const [tempsMoyenRealisation, setTempsMoyenRealisation] = useState('');
  const [tissusRecommandes, setTissusRecommandes] = useState<string[]>([]);
  const [accessoiresNecessaires, setAccessoiresNecessaires] = useState<string[]>([]);
  const [statut, setStatut] = useState<Statut>('prive');
  const [isLoading, setIsLoading] = useState(false);

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission refusée', 'Autorisez l’accès à la galerie pour ajouter des photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission refusée', 'Autorisez l’accès à la caméra.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const handlePickSource = () => {
    showAlert('Photos du modèle', 'Choisissez une source', [
      { text: 'Galerie', onPress: pickPhotos },
      { text: 'Caméra', onPress: takePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Champ requis', 'Donnez un nom à ce modèle.');
      return;
    }
    setIsLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
        const url = await catalogService.uploadPhoto(uri, fileName);
        if (url) uploadedUrls.push(url);
      }
      const result = await addCatalogModel({
        nom: name.trim(),
        categorie: category,
        prixIndicatif: price ? parseFloat(price.replace(/\s/g, '')) : 0,
        description: description.trim() || undefined,
        photos: uploadedUrls,
        isFavorite: false,
        difficulte,
        tempsMoyenRealisation: tempsMoyenRealisation ? parseInt(tempsMoyenRealisation, 10) : null,
        tissusRecommandes,
        accessoiresNecessaires,
        statut,
      });
      if (result) {
        showSuccess('Ajouté au catalogue', `"${result.nom}" est prêt.`, () => navigation.goBack());
      } else {
        showAlert('Erreur', 'Impossible d’ajouter le modèle.');
      }
    } catch {
      showAlert('Erreur', 'Une erreur inattendue s’est produite.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={keyboardAvoidBehavior}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Catalogue</Text>
          <Text style={styles.headerTitle}>Nouveau modèle</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CatalogSection icon="camera-outline" title="Photos" sub="Jusqu’à 5 visuels, le premier est la couverture" colors={P}>
          <CatalogPhotoStrip photos={photos} colors={P} onAdd={handlePickSource} onRemove={(i) => setPhotos((p) => p.filter((_, idx) => idx !== i))} />
        </CatalogSection>

        <CatalogSection icon="information-circle-outline" title="Informations" colors={P}>
          <CatalogFieldLabel label="Nom du modèle" required colors={P} />
          <CatalogInput colors={P} placeholder="ex. Robe princesse brodée" value={name} onChangeText={setName} />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Prix indicatif" optional colors={P} />
          <CatalogInput colors={P} placeholder="0" value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Description" optional colors={P} />
          <CatalogInput colors={P} multiline placeholder="Coupe, style, occasions…" value={description} onChangeText={setDescription} />
        </CatalogSection>

        <CatalogSection icon="grid-outline" title="Catégorie" colors={P}>
          <CatalogCategoryPills value={category} onChange={setCategory} colors={P} />
        </CatalogSection>

        <CatalogSection icon="speedometer-outline" title="Fabrication" sub="Aide à estimer délais et matière" colors={P}>
          <CatalogFieldLabel label="Difficulté" colors={P} />
          <CatalogDifficulteRow value={difficulte} onChange={setDifficulte} colors={P} />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Temps moyen" optional colors={P} />
          <CatalogInput colors={P} placeholder="Jours, ex. 5" value={tempsMoyenRealisation} onChangeText={(v) => setTempsMoyenRealisation(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
        </CatalogSection>

        <CatalogSection icon="layers-outline" title="Tissus recommandés" colors={P}>
          <CatalogTagInput
            tags={tissusRecommandes}
            suggestions={TISSUS_COMMUNS}
            placeholder="Satin, bazin, wax…"
            colors={P}
            onAdd={(t) => setTissusRecommandes((p) => [...p, t])}
            onRemove={(i) => setTissusRecommandes((p) => p.filter((_, j) => j !== i))}
          />
        </CatalogSection>

        <CatalogSection icon="construct-outline" title="Accessoires" colors={P}>
          <CatalogTagInput
            tags={accessoiresNecessaires}
            suggestions={ACCESSOIRES_COMMUNS}
            placeholder="Fermeture, boutons…"
            colors={P}
            onAdd={(t) => setAccessoiresNecessaires((p) => [...p, t])}
            onRemove={(i) => setAccessoiresNecessaires((p) => p.filter((_, j) => j !== i))}
          />
        </CatalogSection>

        <CatalogSection icon="eye-outline" title="Visibilité" colors={P}>
          <CatalogStatutCards value={statut} onChange={setStatut} colors={P} />
        </CatalogSection>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.88}>
          {isLoading ? (
            <ActivityIndicator color={P.gold} />
          ) : (
            <>
              <Text style={styles.submitText}>Ajouter au catalogue</Text>
              <Ionicons name="checkmark" size={18} color={P.gold} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  kicker: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold,
    letterSpacing: 1.2, textTransform: 'uppercase' as const,
  },
  headerTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  footer: {
    position: 'absolute' as const, left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: P.pageBg, borderTopWidth: 0.5, borderTopColor: P.border,
  },
  submit: {
    height: 52, borderRadius: 16, backgroundColor: P.bg,
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    borderWidth: 1, borderColor: P.goldRim,
  },
  submitText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
