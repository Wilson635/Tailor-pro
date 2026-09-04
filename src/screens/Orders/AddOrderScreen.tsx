// ==========================================
// ÉCRAN AJOUTER UNE COMMANDE - TailorPro (redesign)
// ==========================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import {
  COLORS, SPACING, FONT_SIZES,
  BORDER_RADIUS, CLOTHING_TYPE_LABELS,
} from '@constants/theme';
import type { ClothingType, RootStackParamList, UrgencyLevel } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from "@/src/lib/supabase";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import {useToast} from "@/src/context/ToastContext";
import { MeasurementPickerModal } from '@screens/Projects/MeasurementPickerModal';
import type { MeasurementChoiceResult, TypeVetement } from '../../types';

/** Les vêtements (Order.clothingType) et les fiches de mensuration (FicheMensuration.typeVetement)
 *  utilisent deux nomenclatures différentes — celle-ci fait le pont entre les deux. */
const CLOTHING_TYPE_TO_MEASUREMENT_TYPE: Record<ClothingType, TypeVetement> = {
  robe_longue:   'robe',
  robe_courte:   'robe',
  robe_mariage:  'robe',
  costume:       'costume',
  chemise:       'chemise',
  pantalon:      'pantalon',
  boubou:        'boubou',
  ensemble:      'autre',
  tenue_enfant:  'autre',
  autre:         'autre',
};

type Props = NativeStackScreenProps<RootStackParamList, 'AddOrder'>;

const CLOTHING_TYPES: ClothingType[] = [
  'robe_longue', 'robe_courte', 'costume', 'chemise',
  'pantalon', 'boubou', 'ensemble', 'robe_mariage', 'tenue_enfant', 'autre',
];

const URGENCY_OPTIONS: { key: UrgencyLevel; label: string; bg: string; color: string; dot: string }[] = [
  { key: 'low',    label: 'Normal',  bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  { key: 'medium', label: 'Moyen',   bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  { key: 'high',   label: 'Urgent',  bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
];

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getPaymentStatus = (total: number, advance: number) => {
  if (total === 0) return { label: 'Non payé', bg: '#FEE2E2', color: '#991B1B' };
  if (advance >= total) return { label: 'Payé', bg: '#D1FAE5', color: '#065F46' };
  if (advance > 0) return { label: 'Paiement partiel', bg: '#FEF3C7', color: '#92400E' };
  return { label: 'Non payé', bg: '#FEE2E2', color: '#991B1B' };
};

// ── Sous-composants ──
const SectionCard = ({
                       iconName, iconBg, iconColor, title, subtitle, children,
                     }: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string; iconColor: string;
  title: string; subtitle?: string;
  children: React.ReactNode;
}) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardHeadIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
);

const FieldLabel = ({ label }: { label: string }) => (
    <Text style={styles.fieldLabel}>{label}</Text>
);

const StyledInput = ({
                       placeholder, value, onChangeText, keyboardType, suffix, multiline, numberOfLines, icon,
                     }: {
  placeholder: string; value?: string;
  onChangeText?: (t: string) => void;
  keyboardType?: 'default' | 'numeric';
  suffix?: string; multiline?: boolean;
  numberOfLines?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}) => (
    <View style={styles.inputWrap}>
      <TextInput
          style={[styles.input, multiline && styles.inputMulti, suffix && { paddingRight: 60 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
          numberOfLines={numberOfLines}
      />
      {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      {icon && !suffix && (
          <View style={styles.inputIconRight}>
            <Ionicons name={icon} size={18} color={COLORS.gray400} />
          </View>
      )}
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const AddOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { addOrder, getClientById, clients, participants, promoteParticipant, loadProjectRecap, applyMeasurementChoice } = useAppStore();

  const preselectedClientId = route.params?.clientId ?? '';
  // ── Contexte "commande groupée" (arrivée depuis un Projet) ──
  const projectId = (route.params as any)?.projectId as string | undefined;
  const participantId = (route.params as any)?.participantId as string | undefined;
  const participant = useMemo(
      () => (projectId && participantId ? (participants[projectId] ?? []).find(p => p.id === participantId) : undefined),
      [participants, projectId, participantId]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || participant?.clientId || '');
  const [clothingType, setClothingType] = useState<ClothingType>('robe_longue');

  // ── Mensurations (Module 13) ──
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [measurementChoice, setMeasurementChoice] = useState<MeasurementChoiceResult | null>(null);
  useEffect(() => { setMeasurementChoice(null); }, [clothingType]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');

  const [fabricPhotos, setFabricPhotos] = useState<string[]>([]);
  const [inspirationPhotos, setInspirationPhotos] = useState<string[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── États modal client ──
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;

  const total = parseInt(totalPrice.replace(/\s/g, '')) || 0;
  const advance = parseInt(advancePayment.replace(/\s/g, '')) || 0;
  const remaining = Math.max(0, total - advance);
  const paymentStatus = getPaymentStatus(total, advance);

  // ── Liste filtrée pour le modal ──
  const filteredClients = useMemo(() =>
          clients.filter(c =>
              c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
              c.telephone.includes(clientSearch)
          ),
      [clients, clientSearch]
  );

  const pickImage = async (type: 'fabric' | 'inspiration') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est requis.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === 'fabric') setFabricPhotos(prev => [...prev, uri]);
      else setInspirationPhotos(prev => [...prev, uri]);
    }
  };

  const removePhoto = (uri: string, type: 'fabric' | 'inspiration') => {
    if (type === 'fabric') setFabricPhotos(prev => prev.filter(p => p !== uri));
    else setInspirationPhotos(prev => prev.filter(p => p !== uri));
  };

  const toSupabaseDate = (date: string | Date | null): string | null => {
    if (!date) return null;
    const str = date.toString();
    const parts = str.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return str;
  };

  const handleSubmit = async () => {
    // En contexte "projet", le client peut être résolu automatiquement depuis le participant.
    const effectiveClientId = selectedClientId || participant?.clientId;

    if (!effectiveClientId && !participant) {
      showToast({ type: 'error', message: 'Veuillez remplir les champs obligatoires.' });
      return;
    }
    if (!clothingType || !totalPrice) {
      showToast({
        type: 'error',
        message: 'Veuillez remplir les champs obligatoires.',
      });
      return;
    }
    if (!measurementChoice) {
      showToast({
        type: 'error',
        message: 'Veuillez sélectionner les mensurations avant d\'ajouter la commande.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Une commande (vêtement) doit toujours être rattachée à un client réel.
      // Si la personne du projet est encore temporaire (pas de fiche client), on la
      // promeut d'abord silencieusement — l'historique/mensurations restent attachés
      // à elle, seule sa fiche `clients` est créée à la volée.
      let clientId = effectiveClientId;
      if (!clientId && participant) {
        await promoteParticipant(participant.id, projectId!, { telephone: participant.telephone || '' });
        const updated = (useAppStore.getState().participants[projectId!] ?? []).find(p => p.id === participant.id);
        clientId = updated?.clientId ?? undefined;
        if (!clientId) throw new Error("Impossible de créer la fiche client pour cette personne.");
      }

      const parsedTotalPrice = parseFloat(totalPrice.replace(/\s/g, ''));
      const parsedAdvancePayment = parseFloat(advancePayment.replace(/\s/g, '')) || 0;
      const remainingAmount = parsedTotalPrice - parsedAdvancePayment;

      let computedPaymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
      if (parsedAdvancePayment >= parsedTotalPrice) computedPaymentStatus = 'paid';
      else if (parsedAdvancePayment > 0) computedPaymentStatus = 'partial';

      const resolvedClient = getClientById(clientId!);

      // 1. Création de la commande — un seul insert, via l'action du store
      //    (couvre aussi : mise à jour de la balance client, activité, réalisation auto-créée).
      const newOrder = await addOrder({
        clientId: clientId!,
        clientName: resolvedClient?.nom ?? participant?.nom ?? '',
        clothingType,
        description: description || undefined,
        fabricPhotos: [],
        inspirationPhotos: [],
        deliveryDate: selectedDate,
        urgencyLevel: urgency,
        totalPrice: parsedTotalPrice,
        advancePayment: parsedAdvancePayment,
        remainingAmount,
        paymentStatus: computedPaymentStatus,
        orderStatus: 'pending',
        projectId,
        participantId,
      });

      if (!newOrder) throw new Error("La commande n'a pas pu être créée.");

      // 1bis. Applique le choix de mensuration (fiche existante dupliquée, ou nouvelles mesures)
      if (measurementChoice) {
        await applyMeasurementChoice(
            newOrder.id,
            clientId,
            CLOTHING_TYPE_TO_MEASUREMENT_TYPE[clothingType],
            measurementChoice,
        );
      }

      // 2. Traitement des photos d'inspiration (inchangé — enrichit le catalogue)
      if (inspirationPhotos && inspirationPhotos.length > 0) {
        for (const photoUri of inspirationPhotos) {

          const { data: newCatalogModel, error: catalogError } = await supabase
              .from('catalog')
              .insert({
                couturier_id: user.id,
                name: `Modèle ${CLOTHING_TYPE_LABELS[clothingType] || clothingType} - ${resolvedClient?.nom ?? ''}`,
                category: clothingType,
                price: parsedTotalPrice,
                description: `Ajouté automatiquement depuis la commande de ${resolvedClient?.nom ?? ''}`,
                is_favorite: false
              })
              .select()
              .single();

          if (catalogError) {
            console.error("Erreur création catalogue auto:", catalogError);
            continue;
          }

          const fileExt = photoUri.split('.').pop() || 'jpg';
          const fileName = `${user.id}/${newCatalogModel.id}-${Date.now()}.${fileExt}`;
          const contentType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

          try {
            const base64Data = await FileSystem.readAsStringAsync(photoUri, {
              encoding: 'base64',
            });
            const arrayBuffer = decode(base64Data);

            const { error: uploadError } = await supabase.storage
                .from('catalog-photos')
                .upload(fileName, arrayBuffer, { contentType, upsert: true });

            if (uploadError) {
              console.error("Erreur upload storage:", uploadError);
              continue;
            }
          } catch (fileError) {
            console.error("Erreur lors de la lecture ou de l'upload du fichier:", fileError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
              .from('catalog-photos')
              .getPublicUrl(fileName);

          const { data: addedPhoto, error: photoError } = await supabase
              .from('catalog_photos')
              .insert({
                catalog_id: newCatalogModel.id,
                couturier_id: user.id,
                photo_url: publicUrl
              })
              .select()
              .single();

          if (photoError) {
            console.error("Erreur insertion catalog_photos:", photoError);
          }

          const modelWithPhoto = {
            ...newCatalogModel,
            catalog_photos: addedPhoto ? [addedPhoto] : [{ photo_url: publicUrl }]
          };
          useAppStore.getState().addCatalogModel(modelWithPhoto);
        }
      }

      // 3. Rafraîchit le récap du projet, si applicable
      if (projectId) loadProjectRecap(projectId);

      showToast({
        type: 'success',
        message: 'La commande a bien été enregistrée ! et votre catalogue enrichi',
      });

      if (projectId) navigation.goBack();

    } catch (error: any) {
      console.error(error);
      showToast({
        type: 'error',
        message: 'Une erreur est survenue lors de l\'enregistrement.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formatted =
          `${String(date.getDate()).padStart(2, '0')}/` +
          `${String(date.getMonth() + 1).padStart(2, '0')}/` +
          `${date.getFullYear()}`;
      setDeliveryDate(formatted);
    }
  };

  return (
      <KeyboardAvoidingView
          style={[styles.container, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header courbé ── */}
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Nouvelle commande</Text>
              <Text style={styles.headerSubtitle}>Créer une nouvelle pièce</Text>
            </View>
            <View style={[styles.headerBtn, { opacity: 0 }]} />
          </View>
        </View>

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >

          {/* ── Client ── */}
          {participant ? (
              <SectionCard
                  iconName="people-outline"
                  iconBg="#EDE9FE" iconColor="#6B21A8"
                  title="Vêtement pour"
                  subtitle="Commande groupée / Projet"
              >
                <View style={styles.clientRow}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{getInitials(participant.nom)}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{participant.nom}</Text>
                    <View style={styles.clientSubRow}>
                      <Ionicons name="ribbon-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.clientSub}>{participant.role ?? 'Participant'}</Text>
                    </View>
                  </View>
                </View>
              </SectionCard>
          ) : (
              <SectionCard
                  iconName="person-outline"
                  iconBg="#EDE9FE" iconColor="#6B21A8"
                  title="Client"
                  subtitle="Sélectionnez la personne concernée"
              >
                <TouchableOpacity
                    style={styles.clientRow}
                    onPress={() => setClientModalVisible(true)}
                    activeOpacity={0.7}
                >
                  {selectedClient ? (
                      <>
                        <View style={styles.clientAvatar}>
                          <Text style={styles.clientAvatarText}>{getInitials(selectedClient.nom)}</Text>
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>{selectedClient.nom}</Text>
                          <View style={styles.clientSubRow}>
                            <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.clientSub}>{selectedClient.adresse ?? '—'}</Text>
                          </View>
                        </View>
                      </>
                  ) : (
                      <>
                        <View style={[styles.clientAvatar, { backgroundColor: COLORS.gray100 }]}>
                          <Ionicons name="person-add-outline" size={20} color={COLORS.gray400} />
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={styles.clientPlaceholder}>Sélectionner un client</Text>
                          <Text style={styles.clientSub}>Touchez pour parcourir la liste</Text>
                        </View>
                      </>
                  )}
                  <View style={styles.chevWrap}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
                  </View>
                </TouchableOpacity>
              </SectionCard>
          )}

          {/* ── Type de vêtement ── */}
          <SectionCard
              iconName="shirt-outline"
              iconBg="#DBEAFE" iconColor="#1E40AF"
              title="Type de vêtement"
          >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typesScroll}
            >
              {CLOTHING_TYPES.map((type) => {
                const active = clothingType === type;
                return (
                    <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setClothingType(type)}
                        activeOpacity={0.8}
                    >
                      {active && (
                          <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                        {CLOTHING_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SectionCard>

          {/* ── Mensurations (Module 13) ── */}
          {(selectedClientId || participant) && (
              <SectionCard
                  iconName="body-outline"
                  iconBg="#DCFCE7" iconColor="#16A34A"
                  title="Mensurations"
                  subtitle="Utilise une fiche existante ou prends de nouvelles mesures"
              >
                {measurementChoice ? (
                    <View style={styles.measurementDoneRow}>
                      <View style={styles.measurementDoneBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                        <Text style={styles.measurementDoneText}>
                          {measurementChoice.mode === 'use_existing'
                              ? 'Fiche existante sélectionnée'
                              : 'Nouvelles mesures renseignées'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setMeasurementModalVisible(true)}>
                        <Text style={styles.measurementChangeLink}>Modifier</Text>
                      </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.measurementCta}
                        onPress={() => setMeasurementModalVisible(true)}
                    >
                      <Ionicons name="body-outline" size={16} color="#16A34A" />
                      <Text style={styles.measurementCtaText}>Choisir les mensurations</Text>
                    </TouchableOpacity>
                )}
              </SectionCard>
          )}

          {/* ── Photos ── */}
          <SectionCard
              iconName="images-outline"
              iconBg="#FEF3C7" iconColor="#92400E"
              title="Photos"
              subtitle="Tissu et inspiration"
          >
            <View style={styles.photosContainer}>

              {/* Tissu */}
              <View style={styles.photoSection}>
                <View style={styles.photoSectionHead}>
                  <Text style={styles.photoTitle}>Tissu</Text>
                  <Text style={styles.photoCount}>{fabricPhotos.length} photo{fabricPhotos.length > 1 ? 's' : ''}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                  <TouchableOpacity style={styles.photoAdd} onPress={() => pickImage('fabric')} activeOpacity={0.7}>
                    <View style={styles.photoAddIcon}>
                      <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.photoAddLabel}>Ajouter</Text>
                  </TouchableOpacity>
                  {fabricPhotos.map(uri => (
                      <View key={uri} style={styles.photoPreviewWrap}>
                        <Image source={{ uri }} style={styles.photoPreview} />
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(uri, 'fabric')}>
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.photoDivider} />

              {/* Inspiration */}
              <View style={styles.photoSection}>
                <View style={styles.photoSectionHead}>
                  <Text style={styles.photoTitle}>Inspiration</Text>
                  <Text style={styles.photoCount}>{inspirationPhotos.length} photo{inspirationPhotos.length > 1 ? 's' : ''}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                  <TouchableOpacity style={styles.photoAdd} onPress={() => pickImage('inspiration')} activeOpacity={0.7}>
                    <View style={styles.photoAddIcon}>
                      <Ionicons name="image-outline" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.photoAddLabel}>Ajouter</Text>
                  </TouchableOpacity>
                  {inspirationPhotos.map(uri => (
                      <View key={uri} style={styles.photoPreviewWrap}>
                        <Image source={{ uri }} style={styles.photoPreview} />
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(uri, 'inspiration')}>
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </SectionCard>

          {/* ── Détails ── */}
          <SectionCard
              iconName="document-text-outline"
              iconBg="#EDE9FE" iconColor="#6B21A8"
              title="Détails"
          >
            <View style={styles.field}>
              <FieldLabel label="Description / instructions" />
              <StyledInput
                  placeholder="Robe longue avec manches bouffantes..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <FieldLabel label="Date de livraison" />
              <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDatePicker(true)}>
                <StyledInput
                    placeholder="JJ/MM/AAAA"
                    value={deliveryDate}
                    icon="calendar-outline"
                />
              </TouchableOpacity>
              {showDatePicker && (
                  <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={new Date()}
                      onChange={handleDateChange}
                  />
              )}
            </View>

            <View style={styles.field}>
              <FieldLabel label="Niveau d'urgence" />
              <View style={styles.urgencyRow}>
                {URGENCY_OPTIONS.map((opt) => {
                  const active = urgency === opt.key;
                  return (
                      <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.urgencyChip,
                            active && { backgroundColor: opt.bg, borderColor: opt.dot },
                          ]}
                          onPress={() => setUrgency(opt.key)}
                          activeOpacity={0.8}
                      >
                        <View style={[styles.urgencyDot, { backgroundColor: opt.dot }]} />
                        <Text style={[
                          styles.urgencyLabel,
                          active && { color: opt.color, fontFamily: 'PlusJakartaSans_600SemiBold' },
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </SectionCard>

          {/* ── Paiement ── */}
          <SectionCard
              iconName="wallet-outline"
              iconBg="#D1FAE5" iconColor="#065F46"
              title="Paiement"
          >
            <View style={styles.twoCol}>
              <View style={[styles.field, { flex: 1 }]}>
                <FieldLabel label="Montant total" />
                <StyledInput
                    placeholder="120 000"
                    value={totalPrice}
                    onChangeText={setTotalPrice}
                    keyboardType="numeric"
                    suffix="FCFA"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <FieldLabel label="Avance reçue" />
                <StyledInput
                    placeholder="50 000"
                    value={advancePayment}
                    onChangeText={setAdvancePayment}
                    keyboardType="numeric"
                    suffix="FCFA"
                />
              </View>
            </View>

            <View style={styles.pricingSummary}>
              <View style={styles.pricingLeft}>
                <View style={styles.pricingIconWrap}>
                  <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.psLabel}>Reste à payer</Text>
                  <Text style={styles.psValue}>
                    {total > 0 ? formatCurrency(remaining) : '–'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusPill, { backgroundColor: paymentStatus.bg }]}>
                <Text style={[styles.statusPillText, { color: paymentStatus.color }]}>
                  {paymentStatus.label}
                </Text>
              </View>
            </View>
          </SectionCard>

        </ScrollView>

        {/* ── Footer flottant ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
          >
            <Ionicons name={isLoading ? 'reload-outline' : 'checkmark-circle'} size={22} color="#fff" />
            <Text style={styles.submitText}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer la commande'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════
          MODAL SÉLECTION CLIENT
      ══════════════════════════════════════ */}
        <Modal
            visible={clientModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setClientModalVisible(false)}
        >
          <View style={styles.modalContainer}>

            {/* ── Header modal ── */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Choisir un client</Text>
                <Text style={styles.modalSubtitle}>{clients.length} client{clients.length > 1 ? 's' : ''} disponible{clients.length > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => {
                    setClientModalVisible(false);
                    setClientSearch('');
                  }}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* ── Barre de recherche ── */}
            <View style={styles.modalSearchWrap}>
              <Ionicons name="search-outline" size={16} color={COLORS.gray400} />
              <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Rechercher par nom ou téléphone..."
                  placeholderTextColor={COLORS.gray400}
                  value={clientSearch}
                  onChangeText={setClientSearch}
                  autoFocus
              />
              {clientSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setClientSearch('')} style={{ padding: 2 }}>
                    <Ionicons name="close-circle" size={16} color={COLORS.gray400} />
                  </TouchableOpacity>
              )}
            </View>

            {/* ── Résultat filtré ── */}
            {clientSearch.length > 0 && (
                <Text style={styles.modalResultCount}>
                  {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}
                </Text>
            )}

            {/* ── Liste des clients ── */}
            <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <View style={styles.modalEmptyIcon}>
                      <Ionicons name="people-outline" size={32} color={COLORS.gray300} />
                    </View>
                    <Text style={styles.modalEmptyTitle}>Aucun client trouvé</Text>
                    <Text style={styles.modalEmptyText}>
                      {clientSearch ? `Aucun résultat pour "${clientSearch}"` : 'Votre carnet de clients est vide'}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedClientId === item.id;
                  return (
                      <TouchableOpacity
                          style={[styles.modalClientRow, isSelected && styles.modalClientRowActive]}
                          onPress={() => {
                            setSelectedClientId(item.id);
                            setClientModalVisible(false);
                            setClientSearch('');
                          }}
                          activeOpacity={0.7}
                      >
                        {/* Avatar */}
                        <View style={[styles.modalAvatar, isSelected && styles.modalAvatarActive]}>
                          <Text style={[styles.modalAvatarText, isSelected && styles.modalAvatarTextActive]}>
                            {getInitials(item.nom)}
                          </Text>
                        </View>

                        {/* Infos */}
                        <View style={styles.modalClientInfo}>
                          <Text style={[styles.modalClientName, isSelected && { color: COLORS.primary }]}>
                            {item.nom}
                          </Text>
                          <View style={styles.modalClientMeta}>
                            <Ionicons name="call-outline" size={11} color={COLORS.gray400} />
                            <Text style={styles.modalClientSub}>{item.telephone}</Text>
                            {item.adresse ? (
                                <>
                                  <Text style={styles.modalClientDot}>·</Text>
                                  <Ionicons name="location-outline" size={11} color={COLORS.gray400} />
                                  <Text style={styles.modalClientSub}>{item.adresse}</Text>
                                </>
                            ) : null}
                          </View>
                          {item.isFavorite && (
                              <View style={styles.modalFavBadge}>
                                <Ionicons name="star" size={10} color="#92400E" />
                                <Text style={styles.modalFavText}>Cliente fidèle</Text>
                              </View>
                          )}
                        </View>

                        {/* Check ou chevron */}
                        {isSelected ? (
                            <View style={styles.modalCheckWrap}>
                              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                            </View>
                        ) : (
                            <Ionicons name="chevron-forward" size={16} color={COLORS.gray300} />
                        )}
                      </TouchableOpacity>
                  );
                }}
            />
          </View>
        </Modal>

        {(selectedClientId || participant) && (
            <MeasurementPickerModal
                visible={measurementModalVisible}
                clientId={selectedClientId || participant?.clientId}
                typeVetement={CLOTHING_TYPE_TO_MEASUREMENT_TYPE[clothingType]}
                onClose={() => setMeasurementModalVisible(false)}
                onChoice={setMeasurementChoice}
            />
        )}

      </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──
  headerWrap: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    marginTop: -SPACING.md,
  },

  // ── Card ──
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  cardHeadIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  cardContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },

  // ── Client row ──
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  // ── Mensurations (Module 13) ──
  measurementCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: BORDER_RADIUS.md, paddingVertical: 12,
  },
  measurementCtaText: { color: '#16A34A', fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold' },
  measurementDoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  measurementDoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  measurementDoneText: { color: '#16A34A', fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  measurementChangeLink: { color: '#6C3EB8', fontSize: 12.5, fontFamily: 'PlusJakartaSans_700Bold' },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: FONT_SIZES.md, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.primary,
  },
  clientInfo: { flex: 1 },
  clientName: { fontSize: FONT_SIZES.md, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.text },
  clientSubRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  clientSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  clientPlaceholder: { fontSize: FONT_SIZES.md, color: COLORS.text, fontFamily: 'PlusJakartaSans_500Medium' },
  chevWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Types ──
  typesScroll: { paddingVertical: SPACING.xs, gap: SPACING.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.gray50,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  typeChipTextActive: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },

  // ── Photos ──
  photosContainer: { gap: SPACING.md },
  photoSection: { gap: SPACING.sm },
  photoSectionHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  photoTitle: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.text },
  photoCount: { fontSize: 11, color: COLORS.textSecondary },
  photoDivider: { height: 0.5, backgroundColor: COLORS.border },
  photoAdd: {
    width: 90, height: 90,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.gray50,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAddIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  photoAddLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' },
  photoPreviewWrap: { position: 'relative' },
  photoPreview: { width: 90, height: 90, borderRadius: BORDER_RADIUS.md },
  removePhotoBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },

  // ── Field / inputs ──
  field: { gap: 6 },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.text,
  },
  inputMulti: { height: 88, textAlignVertical: 'top' },
  inputSuffix: {
    position: 'absolute', right: SPACING.md, top: '50%', marginTop: -8,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  inputIconRight: { position: 'absolute', right: SPACING.md, top: '50%', marginTop: -9 },

  // ── Urgency ──
  urgencyRow: { flexDirection: 'row', gap: SPACING.sm },
  urgencyChip: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.gray50,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // ── Pricing ──
  twoCol: { flexDirection: 'row', gap: SPACING.md },
  pricingSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  pricingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pricingIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  psLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  psValue: { fontSize: FONT_SIZES.lg, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.text },
  statusPill: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  statusPillText: { fontSize: FONT_SIZES.xs, fontFamily: 'PlusJakartaSans_600SemiBold' },

  // ── Footer flottant ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { fontSize: FONT_SIZES.md, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },

  // ══════════════════════════════════════
  // STYLES MODAL CLIENT
  // ══════════════════════════════════════
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: {
    gap: 2,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  modalCloseBtn: {
    width: 36, height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
  },

  // Recherche
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    margin: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: '100%',
  },
  modalResultCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Liste
  modalList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  modalDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
  },

  // Item client
  modalClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  modalClientRowActive: {
    backgroundColor: '#F5F3FF',
  },
  modalAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  modalAvatarActive: {
    backgroundColor: COLORS.primary,
  },
  modalAvatarText: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.primary,
  },
  modalAvatarTextActive: {
    color: '#fff',
  },
  modalClientInfo: {
    flex: 1,
    gap: 3,
  },
  modalClientName: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },
  modalClientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  modalClientSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  modalClientDot: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray300,
  },
  modalFavBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  modalFavText: {
    fontSize: 10,
    color: '#92400E',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  modalCheckWrap: {
    flexShrink: 0,
  },

  // Empty state
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  },
  modalEmptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modalEmptyTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: COLORS.text,
  },
  modalEmptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    textAlign: 'center',
  },
});