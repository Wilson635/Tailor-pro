// ==========================================
// ÉCRAN AJOUTER UNE COMMANDE - TailorPro
// ==========================================

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import {
  COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS,
  BORDER_RADIUS, CLOTHING_TYPE_LABELS,
} from '@constants/theme';
import type { ClothingType, RootStackParamList, UrgencyLevel } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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
                       iconName, iconBg, iconColor, title, children,
                     }: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string; iconColor: string;
  title: string; children: React.ReactNode;
}) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardHeadIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={15} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
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
          style={[styles.input, multiline && styles.inputMulti, suffix && { paddingRight: 56 }]}
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
            <Ionicons name={icon} size={16} color={COLORS.gray400} />
          </View>
      )}
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const AddOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { addOrder, getClientById } = useAppStore();

  const preselectedClientId = route.params?.clientId ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId] = useState(preselectedClientId);
  const [clothingType, setClothingType] = useState<ClothingType>('robe_longue');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');

  const [fabricPhotos, setFabricPhotos] = useState<string[]>([]);
  const [inspirationPhotos, setInspirationPhotos] = useState<string[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null;

  const total = parseInt(totalPrice) || 0;
  const advance = parseInt(advancePayment) || 0;
  const remaining = Math.max(0, total - advance);
  const paymentStatus = getPaymentStatus(total, advance);


  const pickImage = async (
      type: 'fabric' | 'inspiration'
  ) => {
    const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
          'Permission refusée',
          "L'accès à la galerie est requis."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      if (type === 'fabric') {
        setFabricPhotos(prev => [...prev, uri]);
      } else {
        setInspirationPhotos(prev => [...prev, uri]);
      }
    }
  };

  const removePhoto = (
      uri: string,
      type: 'fabric' | 'inspiration'
  ) => {
    if (type === 'fabric') {
      setFabricPhotos(prev =>
          prev.filter(p => p !== uri)
      );
    } else {
      setInspirationPhotos(prev =>
          prev.filter(p => p !== uri)
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client');
      return;
    }
    if (!totalPrice || total === 0) {
      Alert.alert('Erreur', 'Veuillez entrer le montant total');
      return;
    }

    setIsLoading(true);
    try {
      // Parser la date de livraison
      let parsedDeliveryDate: Date;
      if (deliveryDate) {
        const [day, month, year] = deliveryDate.split('/');
        parsedDeliveryDate = new Date(Number(year), Number(month) - 1, Number(day));
        if (isNaN(parsedDeliveryDate.getTime())) {
          parsedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        parsedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      const payStatus = remaining === 0 ? 'paid' as const
          : advance > 0 ? 'partial' as const
              : 'unpaid' as const;

      // 👇 Appel Supabase via le store
      const newOrder = await addOrder({
        clientId: selectedClientId,
        clientName: selectedClient?.fullName ?? '',
        clothingType,
        description,
        fabricPhotos,
        inspirationPhotos,
        deliveryDate: parsedDeliveryDate,
        urgencyLevel: urgency,
        totalPrice: total,
        advancePayment: advance,
        remainingAmount: remaining,
        paymentStatus: payStatus,
        orderStatus: 'pending',
      });

      if (!newOrder) {
        Alert.alert('Erreur', 'Impossible de créer la commande');
        return;
      }

      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la commande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (
      event: any,
      date?: Date
  ) => {
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
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle commande</Text>
          <View style={[styles.headerBtn, { opacity: 0 }]} />
        </View>

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >

          {/* ── Client ── */}
          <SectionCard iconName="person-outline" iconBg="#EDE9FE" iconColor="#6B21A8" title="Client">
            <TouchableOpacity
                style={styles.clientRow}
                onPress={() => navigation.navigate('Clients')}
                activeOpacity={0.7}
            >
              {selectedClient ? (
                  <>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>{getInitials(selectedClient.fullName)}</Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{selectedClient.fullName}</Text>
                      <Text style={styles.clientSub}>{selectedClient.neighborhood}</Text>
                    </View>
                  </>
              ) : (
                  <>
                    <View style={[styles.clientAvatar, { backgroundColor: COLORS.gray100 }]}>
                      <Ionicons name="person-outline" size={18} color={COLORS.gray400} />
                    </View>
                    <Text style={styles.clientPlaceholder}>Sélectionner un client</Text>
                  </>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          </SectionCard>

          {/* ── Type de vêtement ── */}
          <SectionCard iconName="shirt-outline" iconBg="#DBEAFE" iconColor="#1E40AF" title="Type de vêtement">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typesScroll}
            >
              {CLOTHING_TYPES.map((type) => (
                  <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, clothingType === type && styles.typeChipActive]}
                      onPress={() => setClothingType(type)}
                  >
                    <Text style={[styles.typeChipText, clothingType === type && styles.typeChipTextActive]}>
                      {CLOTHING_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          </SectionCard>

          {/* ── Photos ── */}
          <SectionCard iconName="images-outline" iconBg="#FEF3C7" iconColor="#92400E" title="Photos tissu & inspiration">
            <View style={styles.photosContainer}>

              {/* Photos tissu */}
              <View style={styles.photoSection}>
                <Text style={styles.photoTitle}>Tissu</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                      style={styles.photoAdd}
                      onPress={() => pickImage('fabric')}
                  >
                    <Ionicons
                        name="camera-outline"
                        size={24}
                        color={COLORS.gray400}
                    />
                    <Text style={styles.photoAddLabel}>
                      Ajouter
                    </Text>
                  </TouchableOpacity>

                  {fabricPhotos.map(uri => (
                      <View key={uri} style={styles.photoPreviewWrap}>
                        <Image
                            source={{ uri }}
                            style={styles.photoPreview}
                        />

                        <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => removePhoto(uri, 'fabric')}
                        >
                          <Ionicons
                              name="close"
                              size={14}
                              color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                  ))}
                </ScrollView>
              </View>

              {/* Inspiration */}
              <View style={styles.photoSection}>
                <Text style={styles.photoTitle}>
                  Inspiration
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                      style={styles.photoAdd}
                      onPress={() => pickImage('inspiration')}
                  >
                    <Ionicons
                        name="image-outline"
                        size={24}
                        color={COLORS.gray400}
                    />
                    <Text style={styles.photoAddLabel}>
                      Ajouter
                    </Text>
                  </TouchableOpacity>

                  {inspirationPhotos.map(uri => (
                      <View key={uri} style={styles.photoPreviewWrap}>
                        <Image
                            source={{ uri }}
                            style={styles.photoPreview}
                        />

                        <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() =>
                                removePhoto(uri, 'inspiration')
                            }
                        >
                          <Ionicons
                              name="close"
                              size={14}
                              color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </SectionCard>

          {/* ── Détails ── */}
          <SectionCard iconName="document-text-outline" iconBg="#EDE9FE" iconColor="#6B21A8" title="Détails">
            <View style={styles.cardBody}>
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
                <FieldLabel label="Date de livraison (JJ/MM/AAAA)" />
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker(true)}
                >
                  <StyledInput
                      placeholder="25/05/2025"
                      value={deliveryDate}
                      icon="calendar-outline"
                  />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={
                          Platform.OS === 'ios'
                              ? 'spinner'
                              : 'default'
                        }
                        minimumDate={new Date()}
                        onChange={handleDateChange}
                    />
                )}
              </View>
              <View style={styles.field}>
                <FieldLabel label="Niveau d'urgence" />
                <View style={styles.urgencyRow}>
                  {URGENCY_OPTIONS.map((opt) => (
                      <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.urgencyChip,
                            urgency === opt.key && { backgroundColor: opt.bg, borderColor: opt.dot },
                          ]}
                          onPress={() => setUrgency(opt.key)}
                      >
                        <View style={[styles.urgencyDot, { backgroundColor: opt.dot }]} />
                        <Text style={[
                          styles.urgencyLabel,
                          urgency === opt.key && { color: opt.color, fontWeight: FONT_WEIGHTS.medium },
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </SectionCard>

          {/* ── Paiement ── */}
          <SectionCard iconName="wallet-outline" iconBg="#D1FAE5" iconColor="#065F46" title="Paiement">
            <View style={styles.cardBody}>
              <View style={styles.twoCol}>
                <View style={styles.field}>
                  <FieldLabel label="Montant total" />
                  <StyledInput
                      placeholder="120 000"
                      value={totalPrice}
                      onChangeText={setTotalPrice}
                      keyboardType="numeric"
                      suffix="FCFA"
                  />
                </View>
                <View style={styles.field}>
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

              {/* Résumé paiement */}
              <View style={styles.pricingSummary}>
                <View>
                  <Text style={styles.psLabel}>Reste à payer</Text>
                  <Text style={styles.psValue}>
                    {total > 0 ? formatCurrency(remaining) : '–'}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: paymentStatus.bg }]}>
                  <Text style={[styles.statusPillText, { color: paymentStatus.color }]}>
                    {paymentStatus.label}
                  </Text>
                </View>
              </View>
            </View>
          </SectionCard>

        </ScrollView>

        {/* ── Footer CTA ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity
              style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
          >
            <Ionicons name={isLoading ? 'reload-outline' : 'checkmark'} size={20} color="#fff" />
            <Text style={styles.submitText}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer la commande'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ── Styles (identiques à la version originale) ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.md },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  cardHeadIcon: {
    width: 28, height: 28, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  cardBody: { padding: SPACING.md, gap: SPACING.md },
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, padding: SPACING.md,
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.primary,
  },
  clientInfo: { flex: 1 },
  clientName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  clientSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  clientPlaceholder: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.gray400 },
  typesScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm },
  typeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full, borderWidth: 0.5,
    borderColor: COLORS.border, backgroundColor: COLORS.gray50,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  typeChipTextActive: { color: '#fff', fontWeight: FONT_WEIGHTS.medium },
  photosGrid: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md },
  photoAdd: {
    flex: 1, aspectRatio: 1, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.gray300,
    backgroundColor: COLORS.gray50, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoAddLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  photosContainer: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },

  photoSection: {
    gap: SPACING.sm,
  },

  photoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },

  photoPreviewWrap: {
    marginLeft: SPACING.sm,
    position: 'relative',
  },

  photoPreview: {
    width: 90,
    height: 90,
    borderRadius: BORDER_RADIUS.md,
  },

  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 5 },
  fieldLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  inputSuffix: {
    position: 'absolute', right: SPACING.md, top: '50%', marginTop: -8,
    fontSize: FONT_SIZES.xs, color: COLORS.textSecondary,
  },
  inputIconRight: { position: 'absolute', right: SPACING.md, top: '50%', marginTop: -8 },
  urgencyRow: { flexDirection: 'row', gap: SPACING.sm },
  urgencyChip: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.gray50, alignItems: 'center', gap: 4,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyLabel: { fontSize: 11, color: COLORS.textSecondary },
  twoCol: { flexDirection: 'row', gap: SPACING.md },
  pricingSummary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.gray50, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.xs,
  },
  psLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 3 },
  psValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  statusPill: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  statusPillText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  footer: {
    backgroundColor: COLORS.white, borderTopWidth: 0.5,
    borderTopColor: COLORS.border, padding: SPACING.lg,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
  },
  submitText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: '#fff' },
});