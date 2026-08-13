// ==========================================
// ÉCRAN AJOUTER UN CLIENT - TailorPro (Premium Redesign)
// Ajout manuel + import depuis le répertoire téléphonique
// ==========================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Modal,
  FlatList, TextInput, ActivityIndicator,
  Animated, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { useAppStore } from '@store/useAppStore';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

// ── PALETTE ─────────────────────────────────────────────────────
const C = {
  bg:            '#FFFFFF',
  surface:       '#F7F6F4',
  border:        '#EBEBEB',
  borderFocus:   '#534AB7',
  borderError:   '#EF4444',
  textPrimary:   '#0E0B14',
  textSecondary: '#7A7787',
  textTertiary:  '#B0ACBA',
  error:         '#EF4444',

  purple900:  '#1A0033',
  purple700:  '#2E0057',
  purple600:  '#534AB7',
  purple200:  '#AFA9EC',
  purple100:  '#EEEDFE',
  purple50:   '#F7F5FF',

  gold:       '#D4AF37',
  gold100:    '#FAEEDA',
  gold800:    '#412402',

  teal:       '#1D9E75',
  teal100:    '#9FE1CB',
  teal800:    '#04342C',
};

// ── CODES PAYS ───────────────────────────────────────────────────
interface CountryCode {
  code: string; dial: string; name: string; flag: string; format: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'CM', dial: '+237', name: 'Cameroun',           flag: '🇨🇲', format: '# ## ## ## ##' },
  { code: 'FR', dial: '+33',  name: 'France',             flag: '🇫🇷', format: '# ## ## ## ##' },
  { code: 'SN', dial: '+221', name: 'Sénégal',            flag: '🇸🇳', format: '## ### ## ##'  },
  { code: 'CI', dial: '+225', name: "Côte d'Ivoire",      flag: '🇨🇮', format: '## ## ## ## ##' },
  { code: 'NG', dial: '+234', name: 'Nigeria',            flag: '🇳🇬', format: '### ### ####'  },
  { code: 'GH', dial: '+233', name: 'Ghana',              flag: '🇬🇭', format: '## ### ####'   },
  { code: 'MA', dial: '+212', name: 'Maroc',              flag: '🇲🇦', format: '## ## ## ## ##' },
  { code: 'DZ', dial: '+213', name: 'Algérie',            flag: '🇩🇿', format: '### ## ## ##'  },
  { code: 'TN', dial: '+216', name: 'Tunisie',            flag: '🇹🇳', format: '## ### ###'    },
  { code: 'ZA', dial: '+27',  name: 'Afrique du Sud',     flag: '🇿🇦', format: '## ### ####'   },
  { code: 'KE', dial: '+254', name: 'Kenya',              flag: '🇰🇪', format: '### ### ###'   },
  { code: 'CD', dial: '+243', name: 'Congo (RDC)',         flag: '🇨🇩', format: '### ### ###'   },
  { code: 'CG', dial: '+242', name: 'Congo (Brazzaville)',flag: '🇨🇬', format: '## ### ####'   },
  { code: 'GA', dial: '+241', name: 'Gabon',              flag: '🇬🇦', format: '# ## ## ##'    },
  { code: 'BJ', dial: '+229', name: 'Bénin',              flag: '🇧🇯', format: '## ## ## ##'   },
  { code: 'TG', dial: '+228', name: 'Togo',               flag: '🇹🇬', format: '## ## ## ##'   },
  { code: 'BF', dial: '+226', name: 'Burkina Faso',       flag: '🇧🇫', format: '## ## ## ##'   },
  { code: 'ML', dial: '+223', name: 'Mali',               flag: '🇲🇱', format: '## ## ## ##'   },
  { code: 'GN', dial: '+224', name: 'Guinée',             flag: '🇬🇳', format: '### ## ## ##'  },
  { code: 'US', dial: '+1',   name: 'États-Unis',         flag: '🇺🇸', format: '(###) ###-####' },
  { code: 'GB', dial: '+44',  name: 'Royaume-Uni',        flag: '🇬🇧', format: '#### ### ###'  },
  { code: 'BE', dial: '+32',  name: 'Belgique',           flag: '🇧🇪', format: '### ## ## ##'  },
  { code: 'CA', dial: '+1',   name: 'Canada',             flag: '🇨🇦', format: '(###) ###-####' },
  { code: 'CH', dial: '+41',  name: 'Suisse',             flag: '🇨🇭', format: '## ### ## ##'  },
];

function formatPhoneNumber(raw: string, format: string): string {
  const digits = raw.replace(/\D/g, '');
  let result = '', di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === '#' ? digits[di++] : format[i];
  }
  return result;
}

// ── MODAL SÉLECTION PAYS ─────────────────────────────────────────
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
      c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[cpStyles.container, { paddingTop: insets.top || 16 }]}>
          <View style={cpStyles.handle} />
          <View style={cpStyles.header}>
            <Text style={cpStyles.title}>Choisir le pays</Text>
            <TouchableOpacity onPress={onClose} style={cpStyles.closeBtn}>
              <Ionicons name="close" size={18} color={C.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={cpStyles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={C.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
                style={cpStyles.searchInput}
                placeholder="Rechercher un pays ou indicatif…"
                placeholderTextColor={C.textTertiary}
                value={search}
                onChangeText={setSearch}
                autoFocus
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={15} color={C.textTertiary} />
                </TouchableOpacity>
            )}
          </View>

          <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              renderItem={({ item }) => {
                const isActive = item.code === selected.code;
                return (
                    <TouchableOpacity
                        style={[cpStyles.item, isActive && cpStyles.itemActive]}
                        onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                        activeOpacity={0.7}
                    >
                      <Text style={cpStyles.flag}>{item.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[cpStyles.itemName, isActive && cpStyles.itemNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={cpStyles.itemDial}>{item.dial}</Text>
                      </View>
                      {isActive && (
                          <View style={cpStyles.checkBadge}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                      )}
                    </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={cpStyles.sep} />}
          />
        </View>
      </Modal>
  );
};

const cpStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14 },
  title:       { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  closeBtn:    { width: 30, height: 30, borderRadius: 10, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  item:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  itemActive:  { backgroundColor: C.purple50 },
  flag:        { fontSize: 24 },
  itemName:    { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  itemNameActive: { color: C.purple600, fontWeight: '600' },
  itemDial:    { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  checkBadge:  { width: 22, height: 22, borderRadius: 11, backgroundColor: C.purple600,
    alignItems: 'center', justifyContent: 'center' },
  sep:         { height: 0.5, backgroundColor: C.border, marginHorizontal: 20 },
});

// ── MODAL RÉPERTOIRE TÉLÉPHONIQUE ─────────────────────────────────
interface Contact {
  id: string;
  name: string;
  phone: string;
  imageUri?: string;
}

interface ContactsPickerModalProps {
  visible: boolean;
  onSelect: (contact: Contact) => void;
  onClose: () => void;
}

const ContactsPickerModal: React.FC<ContactsPickerModalProps> = ({ visible, onSelect, onClose }) => {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [filtered, setFiltered]     = useState<Contact[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [permDenied, setPermDenied] = useState(false);

  React.useEffect(() => {
    if (visible) loadContacts();
  }, [visible]);

  React.useEffect(() => {
    if (!search.trim()) {
      setFiltered(contacts);
    } else {
      const q = search.toLowerCase();
      setFiltered(contacts.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q)
      ));
    }
  }, [search, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    setPermDenied(false);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermDenied(true);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const parsed: Contact[] = data
          .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
          .map(c => ({
            id:       c.id ?? Math.random().toString(),
            name:     c.name ?? '',
            phone:    c.phoneNumbers?.[0]?.number ?? '',
            imageUri: c.imageAvailable && c.image?.uri ? c.image.uri : undefined,
          }));

      setContacts(parsed);
      setFiltered(parsed);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les contacts.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
  };

  // Couleur d'avatar déterministe
  const avatarColors = ['#EEEDFE', '#FAEEDA', '#9FE1CB', '#B5D4F4', '#F9C5D1'];
  const avatarTextColors = [C.purple600, C.gold800, C.teal800, '#042C53', '#7C1D34'];
  const avatarColor = (name: string) => {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return { bg: avatarColors[idx], text: avatarTextColors[idx] };
  };

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[ctStyles.container, { paddingTop: insets.top || 16 }]}>
          {/* Handle */}
          <View style={ctStyles.handle} />

          {/* Header */}
          <View style={ctStyles.header}>
            <View>
              <Text style={ctStyles.title}>Répertoire</Text>
              {!loading && contacts.length > 0 && (
                  <Text style={ctStyles.subtitle}>{contacts.length} contact{contacts.length > 1 ? 's' : ''}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={ctStyles.closeBtn}>
              <Ionicons name="close" size={18} color={C.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Recherche */}
          {!permDenied && !loading && (
              <View style={ctStyles.searchWrap}>
                <Ionicons name="search-outline" size={15} color={C.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                    style={ctStyles.searchInput}
                    placeholder="Rechercher un contact…"
                    placeholderTextColor={C.textTertiary}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={15} color={C.textTertiary} />
                    </TouchableOpacity>
                )}
              </View>
          )}

          {/* Contenu */}
          {loading ? (
              <View style={ctStyles.center}>
                <ActivityIndicator size="large" color={C.purple600} />
                <Text style={ctStyles.loadingText}>Chargement des contacts…</Text>
              </View>
          ) : permDenied ? (
              <View style={ctStyles.center}>
                <View style={ctStyles.permIcon}>
                  <Ionicons name="lock-closed-outline" size={32} color={C.textTertiary} />
                </View>
                <Text style={ctStyles.permTitle}>Accès refusé</Text>
                <Text style={ctStyles.permDesc}>
                  Autorisez l'accès aux contacts dans les réglages de votre téléphone.
                </Text>
                <TouchableOpacity style={ctStyles.permBtn} onPress={loadContacts}>
                  <Text style={ctStyles.permBtnText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
          ) : filtered.length === 0 ? (
              <View style={ctStyles.center}>
                <Text style={ctStyles.emptyText}>Aucun contact trouvé</Text>
              </View>
          ) : (
              <FlatList
                  data={filtered}
                  keyExtractor={item => item.id}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                  renderItem={({ item }) => {
                    const colors = avatarColor(item.name);
                    return (
                        <TouchableOpacity
                            style={ctStyles.contactItem}
                            onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                            activeOpacity={0.7}
                        >
                          {/* Avatar */}
                          {item.imageUri ? (
                              <Image source={{ uri: item.imageUri }} style={ctStyles.contactAvatar} />
                          ) : (
                              <View style={[ctStyles.contactAvatarPlaceholder, { backgroundColor: colors.bg }]}>
                                <Text style={[ctStyles.contactInitials, { color: colors.text }]}>
                                  {initials(item.name)}
                                </Text>
                              </View>
                          )}

                          {/* Infos */}
                          <View style={{ flex: 1 }}>
                            <Text style={ctStyles.contactName} numberOfLines={1}>{item.name}</Text>
                            <Text style={ctStyles.contactPhone}>{item.phone}</Text>
                          </View>

                          {/* Chevron */}
                          <View style={ctStyles.importBtn}>
                            <Ionicons name="add" size={16} color={C.purple600} />
                          </View>
                        </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={ctStyles.sep} />}
              />
          )}
        </View>
      </Modal>
  );
};

const ctStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14 },
  title:        { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  subtitle:     { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  closeBtn:     { width: 30, height: 30, borderRadius: 10, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center' },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 12, height: 40 },
  searchInput:  { flex: 1, fontSize: 14, color: C.textPrimary },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  loadingText:  { fontSize: 14, color: C.textTertiary, marginTop: 8 },
  permIcon:     { width: 72, height: 72, borderRadius: 20, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  permTitle:    { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  permDesc:     { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  permBtn:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: C.purple100 },
  permBtnText:  { fontSize: 14, fontWeight: '600', color: C.purple600 },
  emptyText:    { fontSize: 15, color: C.textTertiary },
  contactItem:  { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 10 },
  contactAvatar:{ width: 46, height: 46, borderRadius: 14, flexShrink: 0 },
  contactAvatarPlaceholder: { width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center' },
  contactInitials: { fontSize: 15, fontWeight: '700' },
  contactName:  { fontSize: 15, fontWeight: '500', color: C.textPrimary },
  contactPhone: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  importBtn:    { width: 30, height: 30, borderRadius: 9, backgroundColor: C.purple100,
    alignItems: 'center', justifyContent: 'center' },
  sep:          { height: 0.5, backgroundColor: C.border, marginLeft: 80 },
});

// ── MODAL CARTE ───────────────────────────────────────────────────
interface MapPickerModalProps {
  visible: boolean;
  onConfirm: (neighborhood: string) => void;
  onClose: () => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({ visible, onConfirm, onClose }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion]           = useState<Region>({ latitude: 3.848, longitude: 11.502, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  const [markerCoord, setMarkerCoord] = useState({ latitude: 3.848, longitude: 11.502 });
  const [address, setAddress]         = useState('');
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
      if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la localisation est requis."); return; }
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

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={mapStyles.container}>
          <View style={[mapStyles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={onClose} style={mapStyles.headerBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={mapStyles.headerTitle}>Choisir le quartier</Text>
            <View style={{ width: 40 }} />
          </View>

          <MapView
              ref={mapRef}
              style={mapStyles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={async (e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setMarkerCoord({ latitude, longitude });
                await reverseGeocode(latitude, longitude);
              }}
              showsUserLocation
          >
            <Marker coordinate={markerCoord} pinColor={C.purple600} />
          </MapView>

          <TouchableOpacity style={mapStyles.locateBtn} onPress={locateMe} disabled={isLocating}>
            {isLocating
                ? <ActivityIndicator size="small" color={C.purple600} />
                : <Ionicons name="locate" size={22} color={C.purple600} />
            }
          </TouchableOpacity>

          <View style={[mapStyles.bottomCard, { paddingBottom: insets.bottom + 12 }]}>
            <View style={mapStyles.addressRow}>
              <View style={mapStyles.pinWrap}>
                <Ionicons name="location" size={20} color={C.purple600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mapStyles.addressLabel}>EMPLACEMENT SÉLECTIONNÉ</Text>
                {isGeocoding
                    ? <ActivityIndicator size="small" color={C.textTertiary} style={{ alignSelf: 'flex-start' }} />
                    : <Text style={mapStyles.addressText} numberOfLines={2}>
                      {address || 'Appuyez sur la carte pour choisir un point'}
                    </Text>
                }
              </View>
            </View>
            <TouchableOpacity
                style={[mapStyles.confirmBtn, !address && { opacity: 0.5 }]}
                onPress={() => { if (!address) return; onConfirm(address); onClose(); }}
                disabled={!address}
            >
              <Text style={mapStyles.confirmBtnText}>Confirmer ce quartier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );
};

const mapStyles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.purple700, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  headerBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: '#fff' },
  map:          { flex: 1 },
  locateBtn:    { position: 'absolute', right: 16, bottom: 190, width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 5 },
  bottomCard:   { backgroundColor: C.bg, padding: 20, gap: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10 },
  addressRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pinWrap:      { width: 40, height: 40, borderRadius: 12, backgroundColor: C.purple100, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 10, color: C.textTertiary, marginBottom: 4, letterSpacing: 0.8, fontWeight: '600' },
  addressText:  { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  confirmBtn:   { height: 52, borderRadius: 16, backgroundColor: C.purple700, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ── SECTION CARD ─────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconWrap}>
          <Ionicons name={icon} size={15} color={C.purple600} />
        </View>
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
);

const cardStyles = StyleSheet.create({
  card:    { backgroundColor: C.bg, borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 0.5, borderColor: C.border,
    shadowColor: C.purple900, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconWrap:{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.purple100, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.1 },
});

// ── CHAMP GÉNÉRIQUE ───────────────────────────────────────────────
const Field = ({
                 label, icon, value, onChangeText, placeholder,
                 keyboardType, autoCapitalize, optional,
               }: {
  label: string; icon: keyof typeof Ionicons.glyphMap;
  value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any;
  autoCapitalize?: any; optional?: boolean;
}) => (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {optional && <Text style={fieldStyles.optional}> (optionnel)</Text>}
      </Text>
      <View style={fieldStyles.inputWrap}>
        <Ionicons name={icon} size={16} color={C.textTertiary} style={{ marginRight: 10 }} />
        <TextInput
            style={fieldStyles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.textTertiary}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={autoCapitalize ?? 'sentences'}
            autoCorrect={false}
        />
      </View>
    </View>
);

const fieldStyles = StyleSheet.create({
  wrap:      { marginBottom: 12 },
  label:     { fontSize: 11, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  optional:  { color: C.textTertiary, fontWeight: '400', textTransform: 'none' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, height: 50 },
  input:     { flex: 1, fontSize: 15, color: C.textPrimary, height: '100%' },
});

// ── INTERFACE FORMDATA ────────────────────────────────────────────
interface FormData {
  fullName: string;
  phone: string;
  neighborhood: string;
  gender: 'female' | 'male';
}

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const AddClientScreen: React.FC<Props> = ({ navigation }) => {
  const insets    = useSafeAreaInsets();
  const addClient = useAppStore(s => s.addClient);

  // Modaux
  const [countryPickerVisible,  setCountryPickerVisible]  = useState(false);
  const [contactsPickerVisible, setContactsPickerVisible] = useState(false);
  const [mapPickerVisible,      setMapPickerVisible]      = useState(false);

  // State
  const [isLoading, setIsLoading]     = useState(false);
  const [photo, setPhoto]             = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
      COUNTRY_CODES.find(c => c.code === 'CM')!
  );
  const [formData, setFormData] = useState<FormData>({
    fullName: '', phone: '', neighborhood: '', gender: 'female',
  });

  const update = (field: keyof FormData) => (value: string) =>
      setFormData(prev => ({ ...prev, [field]: value }));

  // ── PHOTO ──
  const handlePhotoPress = () => {
    Alert.alert('Photo du client', 'Choisir une option', [
      { text: 'Galerie', onPress: pickFromGallery },
      { text: 'Caméra',  onPress: pickFromCamera  },
      { text: 'Annuler', style: 'cancel'          },
    ]);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  // ── IMPORT DEPUIS RÉPERTOIRE ──
  const handleContactSelected = (contact: Contact) => {
    setFormData(prev => ({
      ...prev,
      fullName: contact.name,
      phone:    formatPhoneNumber(contact.phone.replace(/\D/g, ''), selectedCountry.format),
    }));
    if (contact.imageUri) setPhoto(contact.imageUri);
  };

  // ── TÉLÉPHONE ──
  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value, selectedCountry.format) }));
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setFormData(prev => ({ ...prev, phone: '' }));
  };

  // ── SOUMISSION ──
  const handleSubmit = async () => {
    if (!formData.fullName.trim()) { Alert.alert('Erreur', 'Veuillez entrer le nom complet'); return; }
    if (!formData.phone.trim())    { Alert.alert('Erreur', 'Veuillez entrer le numéro de téléphone'); return; }

    setIsLoading(true);
    try {
      const newClient = await addClient({
        nom:     formData.fullName.trim(),
        telephone:        `${selectedCountry.dial} ${formData.phone.trim()}`,
        adresse: formData.neighborhood.trim(),
        sexe:       formData.gender === 'female' ? 'femme' : 'homme',
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
        {/* ── MODAUX ── */}
        <CountryPickerModal
            visible={countryPickerVisible}
            selected={selectedCountry}
            onSelect={handleCountrySelect}
            onClose={() => setCountryPickerVisible(false)}
        />
        <ContactsPickerModal
            visible={contactsPickerVisible}
            onSelect={handleContactSelected}
            onClose={() => setContactsPickerVisible(false)}
        />
        <MapPickerModal
            visible={mapPickerVisible}
            onConfirm={neighborhood => setFormData(prev => ({ ...prev, neighborhood }))}
            onClose={() => setMapPickerVisible(false)}
        />

        {/* ── HEADER BLANC PREMIUM ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={C.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Nouveau client</Text>
            <Text style={styles.headerSub}>Ajoutez les informations ci-dessous</Text>
          </View>

          {/* Bouton import répertoire */}
          <TouchableOpacity
              style={styles.importBtn}
              onPress={() => setContactsPickerVisible(true)}
              activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={16} color={C.purple600} />
            <Text style={styles.importBtnText}>Répertoire</Text>
          </TouchableOpacity>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* ── PHOTO ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoTouch} onPress={handlePhotoPress} activeOpacity={0.85}>
              {photo ? (
                  <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-outline" size={34} color={C.textTertiary} />
                  </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name={photo ? 'pencil' : 'camera'} size={13} color="#fff" />
              </View>
            </TouchableOpacity>

            {photo ? (
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                  <Ionicons name="trash-outline" size={12} color={C.error} />
                  <Text style={styles.removePhotoText}>Supprimer</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.photoHint}>Appuyez pour ajouter une photo</Text>
            )}
          </View>

          {/* ── BANNIÈRE IMPORT ── */}
          <TouchableOpacity
              style={styles.importBanner}
              onPress={() => setContactsPickerVisible(true)}
              activeOpacity={0.8}
          >
            <View style={styles.importBannerIcon}>
              <Ionicons name="person-add-outline" size={20} color={C.purple600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.importBannerTitle}>Importer depuis le répertoire</Text>
              <Text style={styles.importBannerSub}>Nom, numéro et photo récupérés automatiquement</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
          </TouchableOpacity>

          {/* ── INFORMATIONS PERSONNELLES ── */}
          <SectionCard icon="person-outline" title="Informations personnelles">
            <Field
                label="Nom complet"
                icon="person-outline"
                value={formData.fullName}
                onChangeText={update('fullName')}
                placeholder="Aminata Diallo"
                autoCapitalize="words"
            />

            {/* Téléphone */}
            <View style={fieldStyles.wrap}>
              <Text style={fieldStyles.label}>Numéro de téléphone</Text>
              <View style={phoneStyles.row}>
                <TouchableOpacity
                    style={phoneStyles.countryBtn}
                    onPress={() => setCountryPickerVisible(true)}
                    activeOpacity={0.7}
                >
                  <Text style={phoneStyles.flag}>{selectedCountry.flag}</Text>
                  <Text style={phoneStyles.dial}>{selectedCountry.dial}</Text>
                  <Ionicons name="chevron-down" size={12} color={C.textTertiary} />
                </TouchableOpacity>
                <View style={phoneStyles.sep} />
                <TextInput
                    style={phoneStyles.input}
                    placeholder={selectedCountry.format.replace(/#/g, '0')}
                    placeholderTextColor={C.textTertiary}
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                />
              </View>
            </View>
          </SectionCard>

          {/* ── LOCALISATION ── */}
          <SectionCard icon="location-outline" title="Localisation">
            <TouchableOpacity
                style={[locStyles.row, formData.neighborhood && locStyles.rowFilled]}
                onPress={() => setMapPickerVisible(true)}
                activeOpacity={0.7}
            >
              <View style={[locStyles.iconWrap, formData.neighborhood && locStyles.iconWrapFilled]}>
                <Ionicons
                    name={formData.neighborhood ? 'location' : 'map-outline'}
                    size={18}
                    color={formData.neighborhood ? C.purple600 : C.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={locStyles.topLabel}>
                  {formData.neighborhood ? 'Quartier sélectionné' : 'Quartier'}
                </Text>
                <Text style={[locStyles.value, !formData.neighborhood && locStyles.placeholder]} numberOfLines={1}>
                  {formData.neighborhood || 'Choisir sur la carte…'}
                </Text>
              </View>
              {formData.neighborhood ? (
                  <TouchableOpacity onPress={() => setFormData(p => ({ ...p, neighborhood: '' }))}>
                    <Ionicons name="close-circle" size={18} color={C.textTertiary} />
                  </TouchableOpacity>
              ) : (
                  <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
              )}
            </TouchableOpacity>
          </SectionCard>

          {/* ── GENRE ── */}
          <SectionCard icon="people-outline" title="Genre">
            <View style={genderStyles.segmented}>
              {(['female', 'male'] as const).map(g => {
                const active = formData.gender === g;
                return (
                    <TouchableOpacity
                        key={g}
                        style={[genderStyles.item, active && genderStyles.itemActive]}
                        onPress={() => setFormData(p => ({ ...p, gender: g }))}
                        activeOpacity={0.85}
                    >
                      <Ionicons
                          name={g === 'female' ? 'female' : 'male'}
                          size={17}
                          color={active ? C.purple600 : C.textTertiary}
                      />
                      <Text style={[genderStyles.label, active && genderStyles.labelActive]}>
                        {g === 'female' ? 'Femme' : 'Homme'}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
        </ScrollView>

        {/* ── FOOTER ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
              style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
          >
            {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <>
                  <Text style={styles.saveBtnText}>Enregistrer le client</Text>
                  <Ionicons name="checkmark" size={18} color={C.gold} style={{ marginLeft: 8 }} />
                </>
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ── STYLES PRINCIPAUX ─────────────────────────────────────────────
const phoneStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, height: 50, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: '100%' },
  flag:       { fontSize: 18 },
  dial:       { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  sep:        { width: 0.5, height: '60%', backgroundColor: C.border },
  input:      { flex: 1, fontSize: 15, color: C.textPrimary, paddingHorizontal: 14, height: '100%' },
});

const locStyles = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, padding: 12 },
  rowFilled:   { backgroundColor: C.purple50, borderColor: C.purple200 },
  iconWrap:    { width: 40, height: 40, borderRadius: 11, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  iconWrapFilled: { backgroundColor: C.purple100 },
  topLabel:    { fontSize: 10, color: C.textTertiary, fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  value:       { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  placeholder: { color: C.textTertiary, fontWeight: '400' },
});

const genderStyles = StyleSheet.create({
  segmented: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 3, gap: 4 },
  item:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, borderRadius: 10 },
  itemActive:{ backgroundColor: C.bg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  label:     { fontSize: 14, color: C.textTertiary, fontWeight: '500' },
  labelActive: { color: C.purple600, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.bg },
  headerBtn:  { width: 38, height: 38, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 17, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.2 },
  headerSub:  { fontSize: 12, color: C.textTertiary, marginTop: 1 },
  importBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10,
    backgroundColor: C.purple100, paddingHorizontal: 12, paddingVertical: 8 },
  importBtnText: { fontSize: 13, fontWeight: '600', color: C.purple600 },
  divider:    { height: 0.5, backgroundColor: C.border },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Photo
  photoSection: { alignItems: 'center', marginBottom: 16, gap: 8 },
  photoTouch:   { position: 'relative' },
  photo:        { width: 90, height: 90, borderRadius: 22 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 22, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center' },
  cameraBadge:  { position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.purple600, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: C.bg },
  photoHint:    { fontSize: 12, color: C.textTertiary },
  removePhoto:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removePhotoText: { fontSize: 12, color: C.error, fontWeight: '600' },

  // Bannière import
  importBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.purple50,
    borderRadius: 16, borderWidth: 1, borderColor: C.purple100, padding: 14, marginBottom: 12 },
  importBannerIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.purple100,
    alignItems: 'center', justifyContent: 'center' },
  importBannerTitle: { fontSize: 14, fontWeight: '600', color: C.purple600, marginBottom: 2 },
  importBannerSub:   { fontSize: 12, color: C.textSecondary, lineHeight: 17 },

  // Footer
  footer:     { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border,
    shadowColor: C.purple900, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 10 },
  saveBtn:    { height: 54, borderRadius: 16, backgroundColor: C.purple900, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.1 },
});