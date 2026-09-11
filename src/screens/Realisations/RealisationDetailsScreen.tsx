// ==========================================
// ÉCRAN DÉTAILS RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useEffect, useState } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import {
  STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS,
  STATUT_REALISATION_LIST, STATUT_TRANSITIONS, STATUT_STEP,
} from '@constants/realisationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { StatutRealisation } from '../../types';
import { RC, realisationTitle } from '@screens/Realisations/RealisationForm';

type Props = NativeStackScreenProps<RootStackParamList, 'RealisationDetails'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ── FIL D'AVANCEMENT ────────────────────────────────────────────────
// Une piste fine qui se remplit d'or au fil des étapes, plutôt qu'une
// checklist de pastilles génériques — cohérent avec l'identité "atelier".
const ThreadProgress = ({ current, onTransition }: {
  current: StatutRealisation;
  onTransition: (s: StatutRealisation) => void;
}) => {
  const step = STATUT_STEP[current];
  const total = STATUT_REALISATION_LIST.length;
  const nextOptions = STATUT_TRANSITIONS[current];

  return (
      <View>
        <View style={tp.track}>
          <View style={[tp.fill, { width: `${(step / (total - 1)) * 100}%` }]} />
          {STATUT_REALISATION_LIST.map((s, i) => (
              <View
                  key={s}
                  style={[
                    tp.pip,
                    { left: `${(i / (total - 1)) * 100}%` },
                    i <= step && tp.pipDone,
                  ]}
              />
          ))}
        </View>

        <View style={tp.currentRow}>
          <View>
            <Text style={tp.currentLabel}>Étape actuelle</Text>
            <Text style={tp.currentValue}>{STATUT_REALISATION_LABELS[current]}</Text>
          </View>
        </View>

        {nextOptions.length > 0 && (
            <View style={tp.actionsRow}>
              {nextOptions.map(s => (
                  <TouchableOpacity key={s} style={tp.nextBtn} onPress={() => onTransition(s)}>
                    <Ionicons name="arrow-forward" size={13} color={RC.gold} />
                    <Text style={tp.nextBtnText}>{STATUT_REALISATION_LABELS[s]}</Text>
                  </TouchableOpacity>
              ))}
            </View>
        )}
      </View>
  );
};
const tp = StyleSheet.create({
  track: { height: 4, backgroundColor: RC.hairline, borderRadius: 2, marginTop: 6, marginBottom: 18, position: 'relative' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: RC.gold, borderRadius: 2 },
  pip: {
    position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6,
    backgroundColor: RC.ivory, borderWidth: 2, borderColor: RC.hairline, marginLeft: -6,
  },
  pipDone: { borderColor: RC.gold, backgroundColor: RC.gold },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  currentLabel: { fontSize: 11.5, color: RC.textSec, fontFamily: 'PlusJakartaSans_500Medium' },
  currentValue: { fontSize: 19, color: RC.text, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RC.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  nextBtnText: { color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' },
});

const MetaRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View style={meta.row}>
      <Ionicons name={icon} size={16} color={RC.plum} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={meta.label}>{label}</Text>
        <Text style={meta.value}>{value}</Text>
      </View>
    </View>
);
const meta = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: RC.hairline },
  label: { fontSize: 11.5, color: RC.textSec, fontFamily: 'PlusJakartaSans_500Medium' },
  value: { fontSize: 14.5, color: RC.text, fontFamily: 'PlusJakartaSans_600SemiBold', marginTop: 2 },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const RealisationDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { realisationId, clientId } = route.params;

  const {
    getRealisationById, updateRealisationStatut, deleteRealisation,
    addRealisationPhoto, updateRealisation, catalog, loadCatalog,
  } = useAppStore();
  const realisation = getRealisationById(realisationId, clientId);

  const [photoIdx, setPhotoIdx] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { loadCatalog(); }, []);

  if (!realisation) {
    return (
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
          <Ionicons name="alert-circle-outline" size={48} color={RC.textTer} />
          <Text style={{ color: RC.textSec, marginTop: 12 }}>Réalisation introuvable</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={{ color: RC.plum, fontFamily: 'PlusJakartaSans_700Bold' }}>Retour</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const { photos, statut } = realisation;
  const statutColor = STATUT_REALISATION_COLORS[statut];
  const title = realisationTitle(realisation, catalog);
  const modele = realisation.modeleId ? catalog.find(m => m.id === realisation.modeleId) : undefined;

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission requise', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85,
    });
    if (!result.canceled) {
      setIsUploading(true);
      let ok = 0;
      for (const asset of result.assets) {
        const saved = await addRealisationPhoto(realisationId, clientId, asset.uri);
        if (saved) ok += 1;
      }
      setIsUploading(false);
      if (ok === 0) {
        showAlert('Photo non ajoutée', "L'envoi a échoué. Vérifiez la connexion et réessayez.");
      } else {
        showSuccess(ok > 1 ? 'Photos ajoutées' : 'Photo ajoutée', 'La galerie a été mise à jour.');
      }
    }
  };

  const handleRemovePhoto = (url: string) => {
    showAlert('Retirer cette photo ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive',
        onPress: async () => {
          await updateRealisation(realisationId, clientId, { photos: photos.filter(p => p !== url) });
          showSuccess('Photo retirée', 'La galerie a été mise à jour.');
        },
      },
    ]);
  };

  const handleTransition = (newStatut: StatutRealisation) => {
    showAlert('Changer le statut', `Passer à « ${STATUT_REALISATION_LABELS[newStatut]} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        await updateRealisationStatut(realisationId, clientId, newStatut);
        showSuccess('Statut modifié', `La réalisation est maintenant « ${STATUT_REALISATION_LABELS[newStatut]} ».`);
      } },
    ]);
  };

  const handleDelete = () => {
    showAlert('Supprimer la réalisation', 'Cette action est irréversible. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteRealisation(realisationId, clientId);
          showSuccess('Réalisation supprimée', 'La pièce a été retirée de l’atelier.', () => navigation.goBack());
        },
      },
    ]);
  };

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ══ GALERIE PLEIN CADRE ══ */}
          <View style={styles.gallery}>
            {photos.length > 0 ? (
                <>
                  <FlatList
                      data={photos}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={e => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
                      keyExtractor={u => u}
                      renderItem={({ item: uri }) => (
                          <TouchableOpacity activeOpacity={0.95} onLongPress={() => handleRemovePhoto(uri)}>
                            <Image source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
                          </TouchableOpacity>
                      )}
                  />
                  <View style={styles.scrim} pointerEvents="none" />
                  <View style={styles.dots}>
                    {photos.map((_, i) => (
                        <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
                    ))}
                  </View>
                </>
            ) : (
                <View style={styles.galleryPlaceholder}>
                  <Ionicons name="shirt-outline" size={56} color={RC.textTer} />
                  <Text style={styles.galleryPlaceholderText}>Aucune photo pour l'instant</Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={handleAddPhoto}>
                    <Ionicons name="camera-outline" size={15} color="#fff" />
                    <Text style={styles.emptyAddBtnText}>Ajouter une photo</Text>
                  </TouchableOpacity>
                </View>
            )}

            {/* Boutons flottants sur l'image */}
            <View style={[styles.floatRow, { top: 12 }]}>
              <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={19} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                    style={styles.floatBtn}
                    onPress={() => navigation.navigate('EditRealisation', { realisationId, clientId })}
                >
                  <Ionicons name="create-outline" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {photos.length > 0 && (
                <TouchableOpacity style={styles.addPhotoFloat} onPress={handleAddPhoto} disabled={isUploading}>
                  {isUploading
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <Ionicons name="add" size={20} color="#FFF" />}
                </TouchableOpacity>
            )}

            {/* Titre superposé */}
            {photos.length > 0 && (
                <View style={styles.heroTitleWrap} pointerEvents="none">
                  <View style={[styles.statutPill, { backgroundColor: statutColor }]}>
                    <Text style={styles.statutPillText}>{STATUT_REALISATION_LABELS[statut]}</Text>
                  </View>
                  <Text style={styles.heroTitle} numberOfLines={1}>{title}</Text>
                  {realisation.couleur ? <Text style={styles.heroSub}>{realisation.couleur}</Text> : null}
                </View>
            )}
          </View>

          <View style={styles.body}>
            {photos.length === 0 && (
                <View>
                  <Text style={styles.plainTitle}>{title}</Text>
                  {realisation.couleur ? <Text style={styles.plainSub}>{realisation.couleur}</Text> : null}
                </View>
            )}

            {/* Progression */}
            <View style={styles.card}>
              <ThreadProgress current={statut} onTransition={handleTransition} />
            </View>

            {/* Vignettes photo (retrait facile, sans appui long sur la grande image) */}
            {photos.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {photos.map(url => (
                        <View key={url}>
                          <Image source={{ uri: url }} style={styles.thumbSm} />
                          <TouchableOpacity style={styles.thumbRemove} onPress={() => handleRemovePhoto(url)}>
                            <Ionicons name="close" size={11} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                    ))}
                  </View>
                </ScrollView>
            )}

            {/* Détails */}
            <View style={styles.card}>
              {modele && <MetaRow icon="albums-outline" label="Modèle" value={modele.nom} />}
              {realisation.tissuLabel && <MetaRow icon="layers-outline" label="Tissu" value={realisation.tissuLabel} />}
              {realisation.couleur && <MetaRow icon="color-palette-outline" label="Couleur" value={realisation.couleur} />}
              {realisation.accessoires.length > 0 && (
                  <MetaRow icon="sparkles-outline" label="Accessoires" value={realisation.accessoires.join(', ')} />
              )}
              <MetaRow icon="calendar-outline" label="Date de création" value={new Date(realisation.dateCreation).toLocaleDateString('fr-FR')} />
              {realisation.dateEssayage && (
                  <MetaRow icon="body-outline" label="Date d'essayage" value={new Date(realisation.dateEssayage).toLocaleDateString('fr-FR')} />
              )}
              {realisation.dateLivraison && (
                  <MetaRow icon="gift-outline" label="Date de livraison" value={new Date(realisation.dateLivraison).toLocaleDateString('fr-FR')} />
              )}
            </View>

            {/* Observations — note d'atelier */}
            {realisation.observations ? (
                <View style={styles.noteCard}>
                  <View style={styles.noteBar} />
                  <Text style={styles.noteText}>{realisation.observations}</Text>
                </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => navigation.navigate('EditRealisation', { realisationId, clientId })}
          >
            <Ionicons name="create-outline" size={18} color={RC.gold} />
            <Text style={styles.footerBtnText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RC.ivory },

  gallery: { height: 340, position: 'relative', backgroundColor: RC.linen },
  galleryImg: { width: SCREEN_W, height: 340 },
  scrim: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 140,
    backgroundColor: 'rgba(29,16,51,0.55)',
  },
  galleryPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  galleryPlaceholderText: { fontSize: 13.5, color: RC.textTer, fontFamily: 'PlusJakartaSans_500Medium' },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RC.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  emptyAddBtnText: { color: '#fff', fontSize: 12.5, fontFamily: 'PlusJakartaSans_700Bold' },

  dots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFF', width: 16 },

  floatRow: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  floatBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(29,16,51,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoFloat: {
    position: 'absolute', right: 14, bottom: 16, width: 38, height: 38, borderRadius: 19,
    backgroundColor: RC.gold, alignItems: 'center', justifyContent: 'center',
  },

  heroTitleWrap: { position: 'absolute', left: 18, bottom: 16, right: 70 },
  statutPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  statutPillText: { fontSize: 11, color: '#FFF', fontFamily: 'PlusJakartaSans_700Bold' },
  heroTitle: { fontSize: 21, color: '#FFF', fontFamily: 'PlusJakartaSans_700Bold' },
  heroSub: { fontSize: 13.5, color: 'rgba(255,255,255,0.8)', fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 },

  body: { padding: 18, gap: 14 },
  plainTitle: { fontSize: 22, color: RC.text, fontFamily: 'PlusJakartaSans_700Bold' },
  plainSub: { fontSize: 14, color: RC.textSec, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 },

  card: {
    backgroundColor: RC.linen, borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: RC.hairline,
  },

  thumbSm: { width: 56, height: 56, borderRadius: 10 },
  thumbRemove: {
    position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: RC.ember, alignItems: 'center', justifyContent: 'center',
  },

  noteCard: { flexDirection: 'row', backgroundColor: RC.goldSoft, borderRadius: 16, padding: 16, gap: 12 },
  noteBar: { width: 3, borderRadius: 2, backgroundColor: RC.gold },
  noteText: { flex: 1, fontSize: 14, color: RC.text, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' },

  footer: { borderTopWidth: 0.5, borderTopColor: RC.hairline, padding: 16, backgroundColor: RC.ivory },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: RC.ink, borderRadius: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)',
  },
  footerBtnText: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});