// ==========================================
// ÉCRAN AJOUTER UN CLIENT - TailorPro
// ==========================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Modal,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
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
// Données codes pays
// ─────────────────────────────────────────
interface CountryCode {
  code: string;   // ISO 3166-1 alpha-2
  dial: string;   // ex: "+237"
  name: string;
  flag: string;   // emoji
  format: string; // ex: "### ### ###"
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

// Formate un numéro brut selon le masque du pays
function formatPhoneNumber(raw: string, format: string): string {
  const digits = raw.replace(/\D/g, '');
  let result = '';
  let di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    if (format[i] === '#') {
      result += digits[di++];
    } else {
      result += format[i];
    }
  }
  return result;
}

// ─────────────────────────────────────────
// Modal Sélecteur de pays
// ─────────────────────────────────────────
interface CountryPickerModalProps {
  visible: boolean;
  selected: CountryCode;
  onSelect: (c: CountryCode) => void;
  onClose: () => void;
}

const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
                                                                 visible, selected, onSelect, onClose,
                                                               }) => {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = COUNTRY_CODES.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[cpStyles.container, { paddingTop: insets.top || SPACING.lg }]}>

          {/* Header */}
          <View style={cpStyles.header}>
            <Text style={cpStyles.title}>Choisir le pays</Text>
            <TouchableOpacity onPress={onClose} style={cpStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
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

          {/* Liste */}
          <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isActive = item.code === selected.code;
                return (
                    <TouchableOpacity
                        style={[cpStyles.item, isActive && cpStyles.itemActive]}
                        onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                    >
                      <Text style={cpStyles.flag}>{item.flag}</Text>
                      <View style={cpStyles.itemInfo}>
                        <Text style={[cpStyles.itemName, isActive && cpStyles.itemNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={cpStyles.itemDial}>{item.dial}</Text>
                      </View>
                      {isActive && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
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
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  title:          { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text },
  closeBtn:       { padding: SPACING.xs },
  searchContainer:{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  searchInput:    { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text },
  item:           { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  itemActive:     { backgroundColor: COLORS.secondary },
  flag:           { fontSize: 24 },
  itemInfo:       { flex: 1 },
  itemName:       { fontSize: FONT_SIZES.md, color: COLORS.text },
  itemNameActive: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  itemDial:       { fontSize: FONT_SIZES.sm, color: COLORS.gray400, marginTop: 2 },
  separator:      { height: 0.5, backgroundColor: COLORS.border, marginLeft: SPACING.lg + 24 + SPACING.md },
});

// ─────────────────────────────────────────
// Modal Carte pour le quartier
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
    latitude: 3.848,
    longitude: 11.502,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 3.848, longitude: 11.502 });
  const [address, setAddress]         = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating]   = useState(false);

  // Géocodage inverse
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

  // Géolocalisation
  const locateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la localisation est requis.");
        return;
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
    if (!address) {
      Alert.alert('Erreur', 'Veuillez sélectionner un emplacement sur la carte.');
      return;
    }
    onConfirm(address);
    onClose();
  };

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={mapStyles.container}>

          {/* Header */}
          <View style={[mapStyles.header, { paddingTop: insets.top + SPACING.sm }]}>
            <TouchableOpacity onPress={onClose} style={mapStyles.headerBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={mapStyles.headerTitle}>Choisir le quartier</Text>
            <View style={[mapStyles.headerBtn, { opacity: 0 }]} />
          </View>

          {/* Carte */}
          <MapView
              ref={mapRef}
              style={mapStyles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
          >
            <Marker
                coordinate={markerCoord}
                pinColor={COLORS.primary}
            />
          </MapView>

          {/* Bouton géoloc */}
          <TouchableOpacity style={mapStyles.locateBtn} onPress={locateMe} disabled={isLocating}>
            {isLocating
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Ionicons name="locate" size={22} color={COLORS.primary} />}
          </TouchableOpacity>

          {/* Carte adresse + confirmer */}
          <View style={[mapStyles.bottomCard, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <View style={mapStyles.addressRow}>
              <View style={mapStyles.pinIconWrap}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mapStyles.addressLabel}>Emplacement sélectionné</Text>
                {isGeocoding
                    ? <ActivityIndicator size="small" color={COLORS.gray400} style={{ alignSelf: 'flex-start' }} />
                    : <Text style={mapStyles.addressText} numberOfLines={2}>
                      {address || 'Appuyez sur la carte pour choisir un point'}
                    </Text>
                }
              </View>
            </View>

            <Button
                title="Confirmer ce quartier"
                onPress={handleConfirm}
                fullWidth
            />
          </View>
        </View>
      </Modal>
  );
};

const mapStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerBtn:    { width: 36, height: 36, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: '#fff' },
  map:          { flex: 1 },
  locateBtn:    { position: 'absolute', right: SPACING.lg, bottom: 180,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  bottomCard:   { backgroundColor: COLORS.white, padding: SPACING.lg, gap: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  addressRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  pinIconWrap:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addressLabel: { fontSize: FONT_SIZES.xs, color: COLORS.gray400, marginBottom: 4 },
  addressText:  { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: FONT_WEIGHTS.medium },
});

// ─────────────────────────────────────────
// Écran principal
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

  const [isLoading, setIsLoading]             = useState(false);
  const [photo, setPhoto]                     = useState<string | null>(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [mapPickerVisible, setMapPickerVisible]         = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
      COUNTRY_CODES.find(c => c.code === 'CM')!
  );
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    neighborhood: '',
    gender: 'female',
  });

  const update = (field: keyof FormData) => (value: string) =>
      setFormData(prev => ({ ...prev, [field]: value }));

  // ── Photo ──
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
      { text: 'Galerie',   onPress: pickFromGallery },
      { text: 'Caméra',    onPress: pickFromCamera  },
      { text: 'Annuler',   style: 'cancel'          },
    ]);
  };

  // ── Téléphone formaté ──
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value, selectedCountry.format);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    // Reformater le numéro déjà saisi avec le nouveau format
    const formatted = formatPhoneNumber(formData.phone, country.format);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // ── Submit ──
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
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Modals ── */}
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

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un client</Text>
          <View style={[styles.headerBtn, { opacity: 0 }]} />
        </View>

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* ── Photo ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoPress}>
              {photo
                  ? <Image source={{ uri: photo }} style={styles.photo} />
                  : <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={COLORS.gray400} />
                    <Text style={styles.photoHint}>Ajouter photo</Text>
                  </View>
              }
            </TouchableOpacity>
            {photo && (
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
                  <Ionicons name="trash-outline" size={14} color="#e53e3e" />
                  <Text style={styles.removePhotoText}>Supprimer</Text>
                </TouchableOpacity>
            )}
          </View>

          {/* ── Formulaire ── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Informations personnelles</Text>

            <Input
                label="Nom complet *"
                placeholder="Aminata Diallo"
                value={formData.fullName}
                onChangeText={update('fullName')}
                autoCapitalize="words"
            />

            {/* Téléphone + code pays */}
            <Text style={styles.label}>Numéro de téléphone *</Text>
            <View style={styles.phoneRow}>
              {/* Sélecteur pays */}
              <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setCountryPickerVisible(true)}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDial}>{selectedCountry.dial}</Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.gray400} />
              </TouchableOpacity>

              {/* Champ numéro */}
              <TextInput
                  style={styles.phoneInput}
                  placeholder={selectedCountry.format.replace(/#/g, '0')}
                  placeholderTextColor={COLORS.gray400}
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
              />
            </View>

            {/* Quartier via carte */}
            <Text style={styles.label}>Quartier</Text>
            <TouchableOpacity
                style={styles.neighborhoodInput}
                onPress={() => setMapPickerVisible(true)}
                activeOpacity={0.7}
            >
              <Ionicons
                  name={formData.neighborhood ? 'location' : 'location-outline'}
                  size={18}
                  color={formData.neighborhood ? COLORS.primary : COLORS.gray400}
              />
              <Text style={[
                styles.neighborhoodText,
                !formData.neighborhood && styles.neighborhoodPlaceholder,
              ]}>
                {formData.neighborhood || 'Choisir sur la carte…'}
              </Text>
              {formData.neighborhood
                  ? <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, neighborhood: '' }))}>
                    <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                  </TouchableOpacity>
                  : <Ionicons name="map-outline" size={18} color={COLORS.gray400} />
              }
            </TouchableOpacity>

            {/* Genre */}
            <Text style={styles.label}>Genre</Text>
            <View style={styles.genderContainer}>
              {(['female', 'male'] as const).map(g => (
                  <TouchableOpacity
                      key={g}
                      style={[styles.genderOption, formData.gender === g && styles.genderOptionActive]}
                      onPress={() => setFormData(prev => ({ ...prev, gender: g }))}
                  >
                    <Ionicons
                        name={g === 'female' ? 'female' : 'male'}
                        size={20}
                        color={formData.gender === g ? COLORS.primary : COLORS.gray500}
                    />
                    <Text style={[styles.genderText, formData.gender === g && styles.genderTextActive]}>
                      {g === 'female' ? 'Femme' : 'Homme'}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* ── Footer ── */}
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

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semibold, color: '#fff' },

  scrollView:   { flex: 1 },
  scrollContent: {},

  photoSection: {
    alignItems: 'center', paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white, borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  photoContainer:  { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  photo:           { width: '100%', height: '100%' },
  photoPlaceholder:{
    width: '100%', height: '100%', backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.gray200,
    borderStyle: 'dashed', borderRadius: 50, gap: 4,
  },
  photoHint:       { fontSize: FONT_SIZES.xs, color: COLORS.gray400 },
  removePhotoBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removePhotoText: { fontSize: FONT_SIZES.xs, color: '#e53e3e' },

  form:       { padding: SPACING.lg, gap: SPACING.sm },
  formTitle:  { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, marginBottom: SPACING.sm },
  label:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.sm, marginTop: SPACING.xs },

  // Téléphone
  phoneRow:        { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
  },
  countryFlag: { fontSize: 18 },
  countryDial: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: FONT_WEIGHTS.medium },
  phoneInput:  {
    flex: 1, borderWidth: 1, borderColor: COLORS.gray200, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.white,
  },

  // Quartier
  neighborhoodInput: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.gray200, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  neighborhoodText:        { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text },
  neighborhoodPlaceholder: { color: COLORS.gray400 },

  // Genre
  genderContainer:   { flexDirection: 'row', gap: SPACING.md },
  genderOption:      {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50,
  },
  genderOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.secondary },
  genderText:         { fontSize: FONT_SIZES.md, color: COLORS.gray500 },
  genderTextActive:   { color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },

  footer: {
    padding: SPACING.lg, backgroundColor: COLORS.white,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
});