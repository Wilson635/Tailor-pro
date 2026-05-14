// ==========================================
// ÉCRAN AJOUTER UN CLIENT - TailorPro (redesign)
// ==========================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Modal,
  FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { Input, Button } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

// ─────────────────────────────────────────
// Données codes pays (inchangé)
// ─────────────────────────────────────────
interface CountryCode {
  code: string; dial: string; name: string; flag: string; format: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'CM', dial: '+237', name: 'Cameroun',          flag: '🇨🇲', format: '# ## ## ## ##' },
  { code: 'FR', dial: '+33',  name: 'France',            flag: '🇫🇷', format: '# ## ## ## ##' },
  { code: 'SN', dial: '+221', name: 'Sénégal',           flag: '🇸🇳', format: '## ### ## ##'  },
  { code: 'CI', dial: '+225', name: "Côte d'Ivoire",     flag: '🇨🇮', format: '## ## ## ## ##' },
  { code: 'NG', dial: '+234', name: 'Nigeria',           flag: '🇳🇬', format: '### ### ####'  },
  { code: 'GH', dial: '+233', name: 'Ghana',             flag: '🇬🇭', format: '## ### ####'   },
  { code: 'MA', dial: '+212', name: 'Maroc',             flag: '🇲🇦', format: '## ## ## ## ##' },
  { code: 'DZ', dial: '+213', name: 'Algérie',           flag: '🇩🇿', format: '### ## ## ##'  },
  { code: 'TN', dial: '+216', name: 'Tunisie',           flag: '🇹🇳', format: '## ### ###'    },
  { code: 'EG', dial: '+20',  name: 'Égypte',            flag: '🇪🇬', format: '### ### ####'  },
  { code: 'ZA', dial: '+27',  name: 'Afrique du Sud',    flag: '🇿🇦', format: '## ### ####'   },
  { code: 'KE', dial: '+254', name: 'Kenya',             flag: '🇰🇪', format: '### ### ###'   },
  { code: 'ET', dial: '+251', name: 'Éthiopie',          flag: '🇪🇹', format: '## ### ####'   },
  { code: 'TZ', dial: '+255', name: 'Tanzanie',          flag: '🇹🇿', format: '### ### ###'   },
  { code: 'RW', dial: '+250', name: 'Rwanda',            flag: '🇷🇼', format: '### ### ###'   },
  { code: 'CD', dial: '+243', name: 'Congo (RDC)',        flag: '🇨🇩', format: '### ### ###'   },
  { code: 'CG', dial: '+242', name: 'Congo (Brazzaville)',flag: '🇨🇬', format: '## ### ####'   },
  { code: 'GA', dial: '+241', name: 'Gabon',             flag: '🇬🇦', format: '# ## ## ##'    },
  { code: 'BJ', dial: '+229', name: 'Bénin',             flag: '🇧🇯', format: '## ## ## ##'   },
  { code: 'TG', dial: '+228', name: 'Togo',              flag: '🇹🇬', format: '## ## ## ##'   },
  { code: 'BF', dial: '+226', name: 'Burkina Faso',      flag: '🇧🇫', format: '## ## ## ##'   },
  { code: 'ML', dial: '+223', name: 'Mali',              flag: '🇲🇱', format: '## ## ## ##'   },
  { code: 'GN', dial: '+224', name: 'Guinée',            flag: '🇬🇳', format: '### ## ## ##'  },
  { code: 'US', dial: '+1',   name: 'États-Unis',        flag: '🇺🇸', format: '(###) ###-####' },
  { code: 'GB', dial: '+44',  name: 'Royaume-Uni',       flag: '🇬🇧', format: '#### ### ###'  },
  { code: 'DE', dial: '+49',  name: 'Allemagne',         flag: '🇩🇪', format: '#### ########' },
  { code: 'BE', dial: '+32',  name: 'Belgique',          flag: '🇧🇪', format: '### ## ## ##'  },
  { code: 'CA', dial: '+1',   name: 'Canada',            flag: '🇨🇦', format: '(###) ###-####' },
  { code: 'CH', dial: '+41',  name: 'Suisse',            flag: '🇨🇭', format: '## ### ## ##'  },
];

function formatPhoneNumber(raw: string, format: string): string {
  const digits = raw.replace(/\D/g, '');
  let result = '', di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === '#' ? digits[di++] : format[i];
  }
  return result;
}

// ─────────────────────────────────────────
// Modal Sélecteur de pays (redesign léger)
// ─────────────────────────────────────────
interface CountryPickerModalProps {
  visible: boolean;
  selected: CountryCode;
  onSelect: (c: CountryCode) => void;
  onClose: () => void;
}

const CountryPickerModal: React.FC<CountryPickerModalProps> = ({ visible, selected, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = COUNTRY_CODES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[cpStyles.container, { paddingTop: insets.top || SPACING.lg }]}>
          <View style={cpStyles.handle} />
          <View style={cpStyles.header}>
            <Text style={cpStyles.title}>Choisir le pays</Text>
            <TouchableOpacity onPress={onClose} style={cpStyles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={cpStyles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.gray400} />
            <TextInput
                style={cpStyles.searchInput}
                placeholder="Rechercher un pays ou indicatif…"
                placeholderTextColor={COLORS.gray400}
                value={search}
                onChangeText={setSearch}
                autoFocus
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                </TouchableOpacity>
            )}
          </View>

          <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
              renderItem={({ item }) => {
                const isActive = item.code === selected.code;
                return (
                    <TouchableOpacity
                        style={[cpStyles.item, isActive && cpStyles.itemActive]}
                        onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                    >
                      <Text style={cpStyles.flag}>{item.flag}</Text>
                      <View style={cpStyles.itemInfo}>
                        <Text style={[cpStyles.itemName, isActive && cpStyles.itemNameActive]}>{item.name}</Text>
                        <Text style={cpStyles.itemDial}>{item.dial}</Text>
                      </View>
                      {isActive && (
                          <View style={cpStyles.checkBadge}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </View>
                      )}
                    </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={cpStyles.separator} />}
          />
        </View>
      </Modal>
  );
};

const cpStyles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200,
    alignSelf: 'center', marginBottom: SPACING.md },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  title:          { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center' },
  searchContainer:{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  searchInput:    { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text },
  item:           { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  itemActive:     { backgroundColor: COLORS.secondary },
  flag:           { fontSize: 26 },
  itemInfo:       { flex: 1 },
  itemName:       { fontSize: FONT_SIZES.md, color: COLORS.text },
  itemNameActive: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold },
  itemDial:       { fontSize: FONT_SIZES.sm, color: COLORS.gray400, marginTop: 2 },
  checkBadge:     { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center' },
  separator:      { height: 0.5, backgroundColor: COLORS.border, marginLeft: SPACING.lg + 26 + SPACING.md },
});

// ─────────────────────────────────────────
// Modal Carte (inchangé sur la logique)
// ─────────────────────────────────────────
interface MapPickerModalProps {
  visible: boolean;
  onConfirm: (neighborhood: string) => void;
  onClose: () => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({ visible, onConfirm, onClose }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 3.848, longitude: 11.502, latitudeDelta: 0.05, longitudeDelta: 0.05,
  });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 3.848, longitude: 11.502 });
  const [address, setAddress]         = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating]   = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.district || r.subregion, r.city || r.region].filter(Boolean);
        setAddress(parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const locateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la localisation est requis."); return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(newRegion);
      setMarkerCoord({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 800);
      await reverseGeocode(latitude, longitude);
    } catch {
      Alert.alert('Erreur', 'Impossible de récupérer votre position.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
  };

  const handleConfirm = () => {
    if (!address) { Alert.alert('Erreur', 'Veuillez sélectionner un emplacement sur la carte.'); return; }
    onConfirm(address); onClose();
  };

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={mapStyles.container}>
          <View style={[mapStyles.header, { paddingTop: insets.top + SPACING.sm }]}>
            <TouchableOpacity onPress={onClose} style={mapStyles.headerBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={mapStyles.headerTitle}>Choisir le quartier</Text>
            <View style={[mapStyles.headerBtn, { opacity: 0 }]} />
          </View>

          <MapView
              ref={mapRef}
              style={mapStyles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
          >
            <Marker coordinate={markerCoord} pinColor={COLORS.primary} />
          </MapView>

          <TouchableOpacity style={mapStyles.locateBtn} onPress={locateMe} disabled={isLocating}>
            {isLocating
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Ionicons name="locate" size={22} color={COLORS.primary} />}
          </TouchableOpacity>

          <View style={[mapStyles.bottomCard, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <View style={mapStyles.addressRow}>
              <View style={mapStyles.pinIconWrap}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mapStyles.addressLabel}>EMPLACEMENT SÉLECTIONNÉ</Text>
                {isGeocoding
                    ? <ActivityIndicator size="small" color={COLORS.gray400} style={{ alignSelf: 'flex-start' }} />
                    : <Text style={mapStyles.addressText} numberOfLines={2}>
                      {address || 'Appuyez sur la carte pour choisir un point'}
                    </Text>
                }
              </View>
            </View>
            <Button title="Confirmer ce quartier" onPress={handleConfirm} fullWidth />
          </View>
        </View>
      </Modal>
  );
};

const mapStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerBtn:    { width: 38, height: 38, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: '#fff' },
  map:          { flex: 1 },
  locateBtn:    { position: 'absolute', right: SPACING.lg, bottom: 200,
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 5 },
  bottomCard:   { backgroundColor: COLORS.white, padding: SPACING.lg, gap: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.xl + 4, borderTopRightRadius: BORDER_RADIUS.xl + 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  addressRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  pinIconWrap:  { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addressLabel: { fontSize: 10, color: COLORS.gray400, marginBottom: 4, letterSpacing: 0.8,
    fontWeight: FONT_WEIGHTS.semibold },
  addressText:  { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: FONT_WEIGHTS.semibold },
});

// ─────────────────────────────────────────
// Écran principal — REDESIGN
// ─────────────────────────────────────────
interface FormData {
  fullName: string;
  phone: string;
  neighborhood: string;
  gender: 'female' | 'male';
}

export const AddClientScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const addClient = useAppStore(s => s.addClient);

  const [isLoading, setIsLoading]                       = useState(false);
  const [photo, setPhoto]                               = useState<string | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [mapPickerVisible, setMapPickerVisible]         = useState(false);
  const [selectedCountry, setSelectedCountry]           = useState<CountryCode>(
      COUNTRY_CODES.find(c => c.code === 'CM')!
  );
  const [formData, setFormData] = useState<FormData>({
    fullName: '', phone: '', neighborhood: '', gender: 'female',
  });

  const update = (field: keyof FormData) => (value: string) =>
      setFormData(prev => ({ ...prev, [field]: value }));

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la galerie est requis."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la caméra est requis."); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handlePhotoPress = () => {
    Alert.alert('Photo du client', 'Choisir une option', [
      { text: 'Galerie', onPress: pickFromGallery },
      { text: 'Caméra',  onPress: pickFromCamera  },
      { text: 'Annuler', style: 'cancel'          },
    ]);
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value, selectedCountry.format) }));
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setFormData(prev => ({ ...prev, phone: formatPhoneNumber(formData.phone, country.format) }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) { Alert.alert('Erreur', 'Veuillez entrer le nom complet'); return; }
    if (!formData.phone.trim())    { Alert.alert('Erreur', 'Veuillez entrer le numéro de téléphone'); return; }

    setIsLoading(true);
    try {
      const newClient = await addClient({
        fullName:     formData.fullName.trim(),
        phone:        `${selectedCountry.dial} ${formData.phone.trim()}`,
        neighborhood: formData.neighborhood.trim(),
        gender:       formData.gender,
        photo:        photo ?? undefined,
        isFavorite:   false,
        balance:      0,
      });
      if (!newClient) { Alert.alert('Erreur', "Impossible d'ajouter le client"); return; }
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', "Impossible d'ajouter le client");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <CountryPickerModal
            visible={countryPickerVisible}
            selected={selectedCountry}
            onSelect={handleCountrySelect}
            onClose={() => setCountryPickerVisible(false)}
        />
        <MapPickerModal
            visible={mapPickerVisible}
            onConfirm={neighborhood => setFormData(prev => ({ ...prev, neighborhood }))}
            onClose={() => setMapPickerVisible(false)}
        />

        {/* ── Header courbé ── */}
        <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Nouveau client</Text>
              <Text style={styles.headerSubtitle}>Ajoutez les informations ci-dessous</Text>
            </View>
            <View style={[styles.headerBtn, { opacity: 0 }]} />
          </View>
        </View>

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* ── Photo flottante au-dessus de la première carte ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoPress} activeOpacity={0.85}>
              {photo
                  ? <Image source={{ uri: photo }} style={styles.photo} />
                  : <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-outline" size={40} color={COLORS.gray400} />
                  </View>
              }
              <View style={styles.cameraBadge}>
                <Ionicons name={photo ? 'pencil' : 'camera'} size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            {photo
                ? (
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
                      <Ionicons name="trash-outline" size={13} color="#e53e3e" />
                      <Text style={styles.removePhotoText}>Supprimer la photo</Text>
                    </TouchableOpacity>
                )
                : <Text style={styles.photoHint}>Appuyez pour ajouter une photo</Text>
            }
          </View>

          {/* ── Carte : Informations personnelles ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="person" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
            </View>

            <Input
                label="Nom complet *"
                placeholder="Aminata Diallo"
                value={formData.fullName}
                onChangeText={update('fullName')}
                autoCapitalize="words"
            />

            <Text style={styles.label}>Numéro de téléphone *</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setCountryPickerVisible(true)}
                  activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDial}>{selectedCountry.dial}</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.gray400} />
              </TouchableOpacity>

              <TextInput
                  style={styles.phoneInput}
                  placeholder={selectedCountry.format.replace(/#/g, '0')}
                  placeholderTextColor={COLORS.gray400}
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ── Carte : Localisation ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Localisation</Text>
            </View>

            <TouchableOpacity
                style={[styles.neighborhoodInput, formData.neighborhood && styles.neighborhoodInputFilled]}
                onPress={() => setMapPickerVisible(true)}
                activeOpacity={0.7}
            >
              <View style={[
                styles.neighborhoodIcon,
                formData.neighborhood && { backgroundColor: COLORS.secondary }
              ]}>
                <Ionicons
                    name={formData.neighborhood ? 'location' : 'map-outline'}
                    size={18}
                    color={formData.neighborhood ? COLORS.primary : COLORS.gray400}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.neighborhoodLabel}>
                  {formData.neighborhood ? 'Quartier sélectionné' : 'Quartier'}
                </Text>
                <Text
                    style={[
                      styles.neighborhoodText,
                      !formData.neighborhood && styles.neighborhoodPlaceholder,
                    ]}
                    numberOfLines={1}
                >
                  {formData.neighborhood || 'Choisir sur la carte…'}
                </Text>
              </View>
              {formData.neighborhood
                  ? <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, neighborhood: '' }))}>
                    <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
                  </TouchableOpacity>
                  : <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
              }
            </TouchableOpacity>
          </View>

          {/* ── Carte : Genre (segmented) ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="people" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Genre</Text>
            </View>

            <View style={styles.segmented}>
              {(['female', 'male'] as const).map(g => {
                const active = formData.gender === g;
                return (
                    <TouchableOpacity
                        key={g}
                        style={[styles.segmentedItem, active && styles.segmentedItemActive]}
                        onPress={() => setFormData(prev => ({ ...prev, gender: g }))}
                        activeOpacity={0.85}
                    >
                      <Ionicons
                          name={g === 'female' ? 'female' : 'male'}
                          size={18}
                          color={active ? COLORS.primary : COLORS.gray500}
                      />
                      <Text style={[styles.segmentedText, active && styles.segmentedTextActive]}>
                        {g === 'female' ? 'Femme' : 'Homme'}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* ── Footer flottant ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
          <Button
              title="Enregistrer le client"
              onPress={handleSubmit}
              fullWidth
              loading={isLoading}
          />
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerWrap: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.xl + 8,
    borderBottomRightRadius: BORDER_RADIUS.xl + 8,
    paddingBottom: SPACING.xl + SPACING.md,
  },
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.md,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle:    { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  headerSubtitle: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: 0 },

  // Photo (chevauche le header)
  photoSection: {
    alignItems: 'center',
    marginTop: -(SPACING.xl + SPACING.sm),
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  photoContainer: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: COLORS.white,
    borderWidth: 4, borderColor: COLORS.background,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  photo: { width: '100%', height: '100%', borderRadius: 51 },
  photoPlaceholder: {
    width: '100%', height: '100%', borderRadius: 51,
    backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', right: 2, bottom: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.white,
  },
  photoHint:       { fontSize: FONT_SIZES.xs, color: COLORS.gray400, fontWeight: FONT_WEIGHTS.medium },
  removePhotoBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  removePhotoText: { fontSize: FONT_SIZES.xs, color: '#e53e3e', fontWeight: FONT_WEIGHTS.medium },

  // Cartes
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg + 4,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text,
  },

  label: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },

  // Téléphone
  phoneRow: { flexDirection: 'row', gap: SPACING.sm },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: FONT_WEIGHTS.semibold },
  phoneInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.text,
    backgroundColor: COLORS.gray50,
  },

  // Quartier
  neighborhoodInput: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderWidth: 1, borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.gray50,
  },
  neighborhoodInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  neighborhoodIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  neighborhoodLabel: {
    fontSize: 11, color: COLORS.gray400,
    fontWeight: FONT_WEIGHTS.medium, marginBottom: 2,
    letterSpacing: 0.3,
  },
  neighborhoodText: {
    fontSize: FONT_SIZES.md, color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  neighborhoodPlaceholder: {
    color: COLORS.gray400, fontWeight: FONT_WEIGHTS.regular,
  },

  // Genre — segmented control
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: 4, gap: 4,
  },
  segmentedItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md - 2,
  },
  segmentedItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  segmentedText: {
    fontSize: FONT_SIZES.md, color: COLORS.gray500,
    fontWeight: FONT_WEIGHTS.medium,
  },
  segmentedTextActive: {
    color: COLORS.primary, fontWeight: FONT_WEIGHTS.semibold,
  },

  // Footer flottant
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
});
