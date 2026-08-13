// ==========================================
// ÉCRAN DÉTAILS RÉALISATION — TailorPro (Module 5)
// ==========================================

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import {
  STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS, STATUT_REALISATION_ICONS,
  STATUT_REALISATION_LIST, STATUT_TRANSITIONS, STATUT_STEP,
} from '@constants/realisationConstants';
import { TYPE_VETEMENT_LABELS } from '@constants/mensurationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { StatutRealisation } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RealisationDetails'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ── PALETTE ──────────────────────────────────────────────────────────
const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

// ── INFO ROW ─────────────────────────────────────────────────────────
const InfoRow = ({
  icon, label, value,
}: {
  icon: string; label: string; value: string;
}) => (
  <View style={infoStyles.row}>
    <Ionicons name={icon as any} size={16} color={C.purple600} style={{ marginTop: 1 }} />
    <View style={{ flex: 1 }}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  </View>
);
const infoStyles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'flex-start' },
  label: { fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: C.text, fontWeight: '500', marginTop: 1 },
});

// ── STATUT STEPPER ───────────────────────────────────────────────────
const StatutStepper = ({
  current,
  onTransition,
}: {
  current: StatutRealisation;
  onTransition: (s: StatutRealisation) => void;
}) => {
  const step = STATUT_STEP[current];
  return (
    <View style={stepperStyles.wrap}>
      {STATUT_REALISATION_LIST.map((s, i) => {
        const done    = i <= step;
        const color   = STATUT_REALISATION_COLORS[s];
        const isNext  = STATUT_TRANSITIONS[current].includes(s);
        return (
          <React.Fragment key={s}>
            <TouchableOpacity
              style={stepperStyles.step}
              onPress={() => isNext && onTransition(s)}
              disabled={!isNext && s !== current}
            >
              <View style={[stepperStyles.dot,
                done ? { backgroundColor: color, borderColor: color } : { borderColor: C.border },
              ]}>
                {done && <Ionicons name="checkmark" size={10} color="#FFF" />}
              </View>
              <Text style={[stepperStyles.stepLabel, done && { color }]} numberOfLines={1}>
                {STATUT_REALISATION_LABELS[s]}
              </Text>
            </TouchableOpacity>
            {i < STATUT_REALISATION_LIST.length - 1 && (
              <View style={[stepperStyles.line, i < step && { backgroundColor: STATUT_REALISATION_COLORS[STATUT_REALISATION_LIST[i + 1]] }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};
const stepperStyles = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  step:      { alignItems: 'center', gap: 4, flex: 1 },
  dot:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border,
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 9, color: C.textTer, textAlign: 'center' },
  line:      { flex: 0.3, height: 2, backgroundColor: C.border, marginTop: 11 },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const RealisationDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { realisationId, clientId } = route.params;

  const { getRealisationById, updateRealisationStatut, deleteRealisation, addRealisationPhoto, getClientById } = useAppStore();
  const realisation = getRealisationById(realisationId, clientId);
  const client      = getClientById(clientId);

  const [photoIdx,    setPhotoIdx]    = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!realisation) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textTer} />
        <Text style={{ color: C.textSec, marginTop: 12 }}>Réalisation introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: C.purple600, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { photos, statut } = realisation;
  const statutColor = STATUT_REALISATION_COLORS[statut];

  // ── Ajouter une photo ────────────────────────────────────────────────
  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setIsUploading(true);
      for (const asset of result.assets) {
        await addRealisationPhoto(realisationId, clientId, asset.uri);
      }
      setIsUploading(false);
    }
  };

  // ── Transition de statut ─────────────────────────────────────────────
  const handleTransition = (newStatut: StatutRealisation) => {
    Alert.alert(
      'Changer le statut',
      `Passer à « ${STATUT_REALISATION_LABELS[newStatut]} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => updateRealisationStatut(realisationId, clientId, newStatut) },
      ]
    );
  };

  // ── Supprimer ────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Supprimer la réalisation',
      'Cette action est irréversible. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteRealisation(realisationId, clientId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {realisation.tissuLabel ?? 'Réalisation'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditRealisation', { realisationId, clientId })}
          >
            <Ionicons name="create-outline" size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galerie photos */}
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
                  <Image source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
                )}
              />
              {/* Indicateurs */}
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIdx && styles.dotActive]} />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Ionicons name="shirt-outline" size={64} color={C.textTer} />
              <Text style={styles.galleryPlaceholderText}>Aucune photo</Text>
            </View>
          )}
          {/* Bouton ajouter photo */}
          <TouchableOpacity style={styles.addPhotoOverlay} onPress={handleAddPhoto}>
            {isUploading
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Ionicons name="camera" size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Statut & progression */}
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statutColor }]}>
            <Text style={styles.cardTitle}>Progression</Text>
            <StatutStepper current={statut} onTransition={handleTransition} />
          </View>

          {/* Informations principales */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Détails</Text>
            {realisation.tissuLabel && (
              <InfoRow icon="layers-outline" label="Tissu" value={realisation.tissuLabel} />
            )}
            {realisation.couleur && (
              <InfoRow icon="color-palette-outline" label="Couleur" value={realisation.couleur} />
            )}
            {realisation.accessoires.length > 0 && (
              <InfoRow icon="sparkles-outline" label="Accessoires"
                value={realisation.accessoires.join(', ')} />
            )}
            <InfoRow icon="calendar-outline" label="Date de création"
              value={new Date(realisation.dateCreation).toLocaleDateString('fr-FR')} />
            {realisation.dateEssayage && (
              <InfoRow icon="body-outline" label="Date d'essayage"
                value={new Date(realisation.dateEssayage).toLocaleDateString('fr-FR')} />
            )}
            {realisation.dateLivraison && (
              <InfoRow icon="gift-outline" label="Date de livraison"
                value={new Date(realisation.dateLivraison).toLocaleDateString('fr-FR')} />
            )}
          </View>

          {/* Observations */}
          {realisation.observations ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notes & observations</Text>
              <Text style={styles.observations}>{realisation.observations}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => navigation.navigate('EditRealisation', { realisationId, clientId })}
        >
          <Ionicons name="create-outline" size={18} color={C.gold} />
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
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
  headerActions:{ flexDirection: 'row', gap: 4 },
  iconBtn:      { padding: 6, borderRadius: 8, backgroundColor: C.surface },

  gallery:      { height: 280, position: 'relative', backgroundColor: C.surface },
  galleryImg:   { width: SCREEN_W, height: 280 },
  galleryPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  galleryPlaceholderText: { fontSize: 14, color: C.textTer },
  dots:         { position: 'absolute', bottom: 12, alignSelf: 'center',
    flexDirection: 'row', gap: 6 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:    { backgroundColor: '#FFF', width: 16 },
  addPhotoOverlay: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },

  body:         { padding: 16, gap: 12 },
  card:         { backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8 },
  observations: { fontSize: 14, color: C.text, lineHeight: 22 },

  footer:       { borderTopWidth: 1, borderTopColor: C.border, padding: 16, backgroundColor: C.bg },
  footerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple900, borderRadius: 14, paddingVertical: 14 },
  footerBtnText:{ fontSize: 16, fontWeight: '700', color: C.gold },
});
