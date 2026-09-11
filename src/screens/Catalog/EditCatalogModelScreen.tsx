// ==========================================
// MODIFIER UN MODÈLE — TailorPro
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
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
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

type Props = NativeStackScreenProps<RootStackParamList, 'EditCatalogModel'>;

export const EditCatalogModelScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { modelId } = route.params;
  const { getModelById, updateCatalogModel, archiveCatalogModel } = useAppStore();
  const model = getModelById(modelId);

  const [nom, setNom] = useState(model?.nom ?? '');
  const [categorie, setCategorie] = useState<CatalogCategory>(model?.categorie ?? 'robe');
  const [prix, setPrix] = useState(model && model.prixIndicatif > 0 ? String(model.prixIndicatif) : '');
  const [description, setDescription] = useState(model?.description ?? '');
  const [photos, setPhotos] = useState<string[]>(model ? [...model.photos] : []);
  const [difficulte, setDifficulte] = useState<Difficulte>(model?.difficulte ?? 'moyen');
  const [tempsRealisation, setTemps] = useState(model?.tempsMoyenRealisation ? String(model.tempsMoyenRealisation) : '');
  const [tissus, setTissus] = useState<string[]>(model ? [...model.tissusRecommandes] : []);
  const [accessoires, setAccessoires] = useState<string[]>(model ? [...model.accessoiresNecessaires] : []);
  const [statut, setStatut] = useState<'public' | 'prive'>(model?.statut ?? 'prive');
  const [isLoading, setIsLoading] = useState(false);

  if (!model) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>Modèle introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission refusée', 'Autorisez l’accès à la galerie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission refusée', 'Autorisez l’accès à la caméra.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
  };

  const handlePickSource = () =>
    showAlert('Photos', 'Choisissez une source', [
      { text: 'Galerie', onPress: pickPhotos },
      { text: 'Caméra', onPress: takePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);

  const handleSave = async () => {
    if (!nom.trim()) {
      showAlert('Champ requis', 'Donnez un nom à ce modèle.');
      return;
    }
    setIsLoading(true);
    try {
      const finalPhotos: string[] = [];
      for (const uri of photos) {
        if (uri.startsWith('http')) {
          finalPhotos.push(uri);
        } else {
          const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
          const url = await catalogService.uploadPhoto(uri, fileName);
          if (url) finalPhotos.push(url);
        }
      }
      await updateCatalogModel(modelId, {
        nom: nom.trim(),
        categorie,
        prixIndicatif: prix ? parseFloat(prix.replace(/\s/g, '')) : 0,
        description: description.trim() || undefined,
        photos: finalPhotos,
        difficulte,
        tempsMoyenRealisation: tempsRealisation ? parseInt(tempsRealisation, 10) : null,
        tissusRecommandes: tissus,
        accessoiresNecessaires: accessoires,
        statut,
      });
      showSuccess('Modèle modifié', 'Les modifications ont été enregistrées.', () => navigation.goBack());
    } catch (error: any) {
      showAlert('Erreur', error?.message || 'Impossible de modifier le modèle.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = () => {
    showAlert(
      'Archiver ce modèle ?',
      `"${model.nom}" quittera le catalogue. L’historique des commandes reste intact.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          style: 'destructive',
          onPress: async () => {
            await archiveCatalogModel(modelId);
            showSuccess('Modèle retiré', `"${model.nom}" a quitté le catalogue.`, () => navigation.popToTop());
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardAvoidBehavior}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Catalogue</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>Modifier</Text>
        </View>
        <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive}>
          <Ionicons name="archive-outline" size={16} color={P.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CatalogSection icon="camera-outline" title="Photos" sub="Le premier visuel est la couverture" colors={P}>
          <CatalogPhotoStrip
            photos={photos}
            colors={P}
            onAdd={handlePickSource}
            onRemove={(i) => setPhotos((p) => p.filter((_, idx) => idx !== i))}
          />
        </CatalogSection>

        <CatalogSection icon="information-circle-outline" title="Informations" colors={P}>
          <CatalogFieldLabel label="Nom du modèle" required colors={P} />
          <CatalogInput colors={P} value={nom} onChangeText={setNom} placeholder="ex. Robe princesse brodée" />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Prix indicatif" optional colors={P} />
          <CatalogInput colors={P} value={prix} onChangeText={(v) => setPrix(v.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="numeric" />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Description" optional colors={P} />
          <CatalogInput colors={P} multiline value={description} onChangeText={setDescription} placeholder="Coupe, style, occasions…" />
        </CatalogSection>

        <CatalogSection icon="grid-outline" title="Catégorie" colors={P}>
          <CatalogCategoryPills value={categorie} onChange={setCategorie} colors={P} />
        </CatalogSection>

        <CatalogSection icon="speedometer-outline" title="Fabrication" colors={P}>
          <CatalogFieldLabel label="Difficulté" colors={P} />
          <CatalogDifficulteRow value={difficulte} onChange={setDifficulte} colors={P} />
          <View style={{ height: 14 }} />
          <CatalogFieldLabel label="Temps moyen" optional colors={P} />
          <CatalogInput colors={P} value={tempsRealisation} onChangeText={(v) => setTemps(v.replace(/\D/g, ''))} placeholder="Jours, ex. 5" keyboardType="number-pad" />
        </CatalogSection>

        <CatalogSection icon="layers-outline" title="Tissus recommandés" colors={P}>
          <CatalogTagInput
            tags={tissus}
            suggestions={TISSUS_COMMUNS}
            placeholder="Satin, bazin, wax…"
            colors={P}
            onAdd={(t) => setTissus((p) => [...p, t])}
            onRemove={(i) => setTissus((p) => p.filter((_, j) => j !== i))}
          />
        </CatalogSection>

        <CatalogSection icon="construct-outline" title="Accessoires" colors={P}>
          <CatalogTagInput
            tags={accessoires}
            suggestions={ACCESSOIRES_COMMUNS}
            placeholder="Fermeture, boutons…"
            colors={P}
            onAdd={(a) => setAccessoires((p) => [...p, a])}
            onRemove={(i) => setAccessoires((p) => p.filter((_, j) => j !== i))}
          />
        </CatalogSection>

        <CatalogSection icon="eye-outline" title="Visibilité" colors={P}>
          <CatalogStatutCards value={statut} onChange={setStatut} colors={P} />
        </CatalogSection>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.submit} onPress={handleSave} disabled={isLoading} activeOpacity={0.88}>
          {isLoading ? (
            <ActivityIndicator color={P.gold} />
          ) : (
            <>
              <Text style={styles.submitText}>Enregistrer</Text>
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
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12 },
  missing: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  backLink: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.primary },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 20, paddingBottom: 12,
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
  archiveBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: P.errorBg, borderWidth: 0.5, borderColor: P.errorLight,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
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
