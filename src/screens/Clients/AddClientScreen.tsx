// ==========================================
// ÉCRAN AJOUTER UN CLIENT - TailorPro (Premium Redesign)
// Ajout manuel + import depuis le répertoire téléphonique
// ==========================================

import React, { useState, useRef, useCallback } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
  View, Text, ScrollView,
  TouchableOpacity, Image, Modal,
  FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView,
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
import { Avatar, DateField, keyboardAvoidBehavior } from '@components/ui';
import { useThemedStyles, type Palette } from '@/src/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

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

function expectedLocalLength(format: string): number {
  return (format.match(/#/g) || []).length;
}

/** Enlève l'indicatif pays déjà présent (+237, 237, 00237…) pour ne garder que le numéro national. */
function parseImportedPhone(raw: string, fallback: CountryCode): { country: CountryCode; national: string } {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  const ranked = [...COUNTRY_CODES].sort(
    (a, b) => b.dial.replace(/\D/g, '').length - a.dial.replace(/\D/g, '').length,
  );

  const tryStrip = (cc: CountryCode, d: string): string | null => {
    const code = cc.dial.replace(/\D/g, '');
    if (!code || !d.startsWith(code)) return null;
    const rest = d.slice(code.length);
    const expected = expectedLocalLength(cc.format);
    if (rest.length >= expected) return rest;
    return null;
  };

  for (const cc of ranked) {
    const rest = tryStrip(cc, digits);
    if (rest) return { country: cc, national: rest };
  }

  const expected = expectedLocalLength(fallback.format);
  if (digits.startsWith('0') && digits.length === expected + 1) {
    return { country: fallback, national: digits.slice(1) };
  }
  return { country: fallback, national: digits };
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
  const { colors: P, styles: cpStyles } = useThemedStyles(make_cpStyles);
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
              <Ionicons name="close" size={18} color={P.text} />
            </TouchableOpacity>
          </View>

          <View style={cpStyles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={P.muted} style={{ marginRight: 8 }} />
            <TextInput
                style={cpStyles.searchInput}
                placeholder="Rechercher un pays ou indicatif…"
                placeholderTextColor={P.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={15} color={P.muted} />
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

const make_cpStyles = (P: Palette) => ({
  container:   { flex: 1, backgroundColor: P.pageBg },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: P.borderHard, alignSelf: 'center', marginBottom: 12 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14 },
  title:       { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  closeBtn:    { width: 30, height: 30, borderRadius: 10, backgroundColor: P.surface,
    alignItems: 'center', justifyContent: 'center' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: P.surface, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: P.text },
  item:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  itemActive:  { backgroundColor: P.primaryBg },
  flag:        { fontSize: 24 },
  itemName:    { fontSize: 15, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
  itemNameActive: { color: P.primary, fontFamily: 'PlusJakartaSans_600SemiBold' },
  itemDial:    { fontSize: 12, color: P.muted, marginTop: 2 },
  checkBadge:  { width: 22, height: 22, borderRadius: 11, backgroundColor: P.primary,
    alignItems: 'center', justifyContent: 'center' },
  sep:         { height: 0.5, backgroundColor: P.borderHard, marginHorizontal: 20 },
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
  const { colors: P, styles: ctStyles } = useThemedStyles(make_ctStyles);
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
      showAlert('Erreur', 'Impossible de charger les contacts.');
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
  const avatarTextColors = [P.primary, P.gold, P.success, '#042C53', '#7C1D34'];
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
              <Ionicons name="close" size={18} color={P.text} />
            </TouchableOpacity>
          </View>

          {/* Recherche */}
          {!permDenied && !loading && (
              <View style={ctStyles.searchWrap}>
                <Ionicons name="search-outline" size={15} color={P.muted} style={{ marginRight: 8 }} />
                <TextInput
                    style={ctStyles.searchInput}
                    placeholder="Rechercher un contact…"
                    placeholderTextColor={P.muted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={15} color={P.muted} />
                    </TouchableOpacity>
                )}
              </View>
          )}

          {/* Contenu */}
          {loading ? (
              <View style={ctStyles.center}>
                <ActivityIndicator size="large" color={P.primary} />
                <Text style={ctStyles.loadingText}>Chargement des contacts…</Text>
              </View>
          ) : permDenied ? (
              <View style={ctStyles.center}>
                <View style={ctStyles.permIcon}>
                  <Ionicons name="lock-closed-outline" size={32} color={P.muted} />
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
                            <Ionicons name="add" size={16} color={P.primary} />
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

const make_ctStyles = (P: Palette) => ({
  container:    { flex: 1, backgroundColor: P.pageBg },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: P.borderHard, alignSelf: 'center', marginBottom: 12 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14 },
  title:        { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  subtitle:     { fontSize: 12, color: P.muted, marginTop: 2 },
  closeBtn:     { width: 30, height: 30, borderRadius: 10, backgroundColor: P.surface,
    alignItems: 'center', justifyContent: 'center' },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: P.surface, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    paddingHorizontal: 12, height: 40 },
  searchInput:  { flex: 1, fontSize: 14, color: P.text },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  loadingText:  { fontSize: 14, color: P.muted, marginTop: 8 },
  permIcon:     { width: 72, height: 72, borderRadius: 20, backgroundColor: P.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  permTitle:    { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  permDesc:     { fontSize: 14, color: P.sub, textAlign: 'center', lineHeight: 20 },
  permBtn:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: P.primaryBg },
  permBtnText:  { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  emptyText:    { fontSize: 15, color: P.muted },
  contactItem:  { flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 10 },
  contactAvatar:{ width: 46, height: 46, borderRadius: 14, flexShrink: 0 },
  contactAvatarPlaceholder: { width: 46, height: 46, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center' },
  contactInitials: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
  contactName:  { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: P.text },
  contactPhone: { fontSize: 12, color: P.muted, marginTop: 2 },
  importBtn:    { width: 30, height: 30, borderRadius: 9, backgroundColor: P.primaryBg,
    alignItems: 'center', justifyContent: 'center' },
  sep:          { height: 0.5, backgroundColor: P.borderHard, marginLeft: 80 },
});

// ── MODAL CARTE ───────────────────────────────────────────────────
interface MapPickerModalProps {
  visible: boolean;
  onConfirm: (neighborhood: string) => void;
  onClose: () => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({ visible, onConfirm, onClose }) => {
  const { colors: P, styles: mapStyles } = useThemedStyles(make_mapStyles);
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
      if (status !== 'granted') { showAlert('Permission refusée', "L'accès à la localisation est requis."); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(newRegion);
      setMarkerCoord({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 800);
      await reverseGeocode(latitude, longitude);
    } catch {
      showAlert('Erreur', 'Impossible de récupérer votre position.');
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
            <Marker coordinate={markerCoord} pinColor={P.primary} />
          </MapView>

          <TouchableOpacity style={mapStyles.locateBtn} onPress={locateMe} disabled={isLocating}>
            {isLocating
                ? <ActivityIndicator size="small" color={P.primary} />
                : <Ionicons name="locate" size={22} color={P.primary} />
            }
          </TouchableOpacity>

          <View style={[mapStyles.bottomCard, { paddingBottom: insets.bottom + 12 }]}>
            <View style={mapStyles.addressRow}>
              <View style={mapStyles.pinWrap}>
                <Ionicons name="location" size={20} color={P.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mapStyles.addressLabel}>EMPLACEMENT SÉLECTIONNÉ</Text>
                {isGeocoding
                    ? <ActivityIndicator size="small" color={P.muted} style={{ alignSelf: 'flex-start' }} />
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

const make_mapStyles = (P: Palette) => ({
  container:    { flex: 1, backgroundColor: P.pageBg },
  header:       { backgroundColor: P.bg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  headerBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  map:          { flex: 1 },
  locateBtn:    { position: 'absolute', right: 16, bottom: 190, width: 48, height: 48, borderRadius: 24,
    backgroundColor: P.pageBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: P.borderHard },
  bottomCard:   { backgroundColor: P.pageBg, padding: 20, gap: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 0.5, borderColor: P.borderHard },
  addressRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pinWrap:      { width: 40, height: 40, borderRadius: 12, backgroundColor: P.primaryBg, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 10, color: P.muted, marginBottom: 4, letterSpacing: 0.8, fontFamily: 'PlusJakartaSans_600SemiBold' },
  addressText:  { fontSize: 15, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
  confirmBtn:   { height: 52, borderRadius: 16, backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});

// ── SECTION CARD ─────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => {
  const { colors: P, styles: cardStyles } = useThemedStyles(make_cardStyles);
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconWrap}>
          <Ionicons name={icon} size={15} color={P.primary} />
        </View>
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

const make_cardStyles = (P: Palette) => ({
  card:    { backgroundColor: P.surface, borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 0.5, borderColor: P.borderHard },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconWrap:{ width: 30, height: 30, borderRadius: 9, backgroundColor: P.primaryBg, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text, letterSpacing: -0.1 },
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
}) => {
    const { colors: P, styles: fieldStyles } = useThemedStyles(make_fieldStyles);
    return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {optional && <Text style={fieldStyles.optional}> (optionnel)</Text>}
      </Text>
      <View style={fieldStyles.inputWrap}>
        <Ionicons name={icon} size={16} color={P.muted} style={{ marginRight: 10 }} />
        <TextInput
            style={fieldStyles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={P.muted}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={autoCapitalize ?? 'sentences'}
            autoCorrect={false}
        />
      </View>
    </View>
  );
};

const make_fieldStyles = (P: Palette) => ({
  wrap:      { marginBottom: 12 },
  label:     { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  optional:  { color: P.muted, fontFamily: 'PlusJakartaSans_400Regular', textTransform: 'none' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: P.pageBg, borderRadius: 12,
    borderWidth: 0.5, borderColor: P.borderHard, paddingHorizontal: 14, height: 50 },
  input:     { flex: 1, fontSize: 15, color: P.text, height: '100%' },
});

// ── INTERFACE FORMDATA ────────────────────────────────────────────
interface FormData {
  nom: string;
  telephone: string;
  whatsapp: string;
  whatsappSameAsPhone: boolean;
  email: string;
  adresse: string;
  sexe: 'femme' | 'homme' | 'autre';
  dateNaissance: string;  // DD/MM/YYYY
  notesInternes: string;
}

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const AddClientScreen: React.FC<Props> = ({ navigation }) => {
  const insets    = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(make_styles);
  const { styles: fieldStyles } = useThemedStyles(make_fieldStyles);
  const { styles: phoneStyles } = useThemedStyles(make_phoneStyles);
  const { styles: locStyles } = useThemedStyles(make_locStyles);
  const { styles: genderStyles } = useThemedStyles(make_genderStyles);
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
    nom: '', telephone: '', whatsapp: '', whatsappSameAsPhone: true,
    email: '', adresse: '', sexe: 'femme', dateNaissance: '', notesInternes: '',
  });

  const update = (field: keyof FormData) => (value: string | boolean) =>
      setFormData(prev => ({ ...prev, [field]: value }));

  // Sync whatsapp quand "same as phone" est actif
  const handlePhoneChange = (value: string) => {
    const parsed = parseImportedPhone(value, selectedCountry);
    if (parsed.country.code !== selectedCountry.code) setSelectedCountry(parsed.country);
    const formatted = formatPhoneNumber(parsed.national, parsed.country.format);
    setFormData(prev => ({
      ...prev,
      telephone: formatted,
      ...(prev.whatsappSameAsPhone ? { whatsapp: formatted } : {}),
    }));
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setFormData(prev => ({ ...prev, telephone: '', ...(prev.whatsappSameAsPhone ? { whatsapp: '' } : {}) }));
  };

  const toggleWhatsappSame = (val: boolean) => {
    setFormData(prev => ({
      ...prev,
      whatsappSameAsPhone: val,
      ...(val ? { whatsapp: prev.telephone } : {}),
    }));
  };

  // ── PHOTO ──
  const handlePhotoPress = () => {
    showAlert('Photo du client', 'Choisir une option', [
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
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPhoto(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setPhoto(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri);
    }
  };

  // ── IMPORT DEPUIS RÉPERTOIRE ──
  const handleContactSelected = (contact: Contact) => {
    const parsed = parseImportedPhone(contact.phone, selectedCountry);
    setSelectedCountry(parsed.country);
    const formatted = formatPhoneNumber(parsed.national, parsed.country.format);
    setFormData(prev => ({
      ...prev,
      nom:       contact.name,
      telephone: formatted,
      ...(prev.whatsappSameAsPhone ? { whatsapp: formatted } : {}),
    }));
    if (contact.imageUri) setPhoto(contact.imageUri);
  };

  // ── HELPER date DD/MM/YYYY → Date ──
  const parseDateFR = (str: string): Date | null => {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    return isNaN(d.getTime()) ? null : d;
  };

  // ── SOUMISSION ──
  const handleSubmit = async () => {
    if (!formData.nom.trim())       { showAlert('Erreur', 'Veuillez entrer le nom complet'); return; }
    if (!formData.telephone.trim()) { showAlert('Erreur', 'Veuillez entrer le numéro de téléphone'); return; }

    setIsLoading(true);
    try {
      const fullPhone   = `${selectedCountry.dial} ${formData.telephone.trim()}`;
      const fullWa      = formData.whatsappSameAsPhone
          ? fullPhone
          : formData.whatsapp.trim() ? `${selectedCountry.dial} ${formData.whatsapp.trim()}` : null;

      const newClient = await addClient({
        couturierId:   '',          // rempli côté service via auth.uid()
        nom:           formData.nom.trim(),
        telephone:     fullPhone,
        whatsapp:      fullWa,
        email:         formData.email.trim() || null,
        adresse:       formData.adresse.trim() || null,
        sexe:          formData.sexe,
        dateNaissance: parseDateFR(formData.dateNaissance),
        photo:         photo ?? null,
        notesInternes: formData.notesInternes.trim() || null,
        isFavorite:    false,
        balance:       0,
        deletedAt:     null,
      });
      if (!newClient) { showAlert('Erreur', "Impossible d'ajouter le client"); return; }
      showSuccess('Client ajouté', `${formData.nom.trim()} a bien été enregistré.`, () => navigation.goBack());
    } catch {
      showAlert('Erreur', "Impossible d'ajouter le client");
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
            onConfirm={adresse => setFormData(prev => ({ ...prev, adresse }))}
            onClose={() => setMapPickerVisible(false)}
        />

        {/* ── HEADER BLANC PREMIUM ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={P.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Atelier</Text>
            <Text style={styles.headerTitle}>Nouveau client</Text>
          </View>
          <TouchableOpacity
              style={styles.goldBtn}
              onPress={() => setContactsPickerVisible(true)}
              activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={18} color={P.gold} />
          </TouchableOpacity>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={keyboardAvoidBehavior}
            keyboardVerticalOffset={insets.top + 56}
        >
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* ── PHOTO ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoTouch} onPress={handlePhotoPress} activeOpacity={0.85}>
              <Avatar source={photo} name={formData.nom} size={90} radius={22} />
              <View style={styles.cameraBadge}>
                <Ionicons name={photo ? 'pencil' : 'camera'} size={13} color="#fff" />
              </View>
            </TouchableOpacity>

            {photo ? (
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                  <Ionicons name="trash-outline" size={12} color={P.error} />
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
              <Ionicons name="person-add-outline" size={20} color={P.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.importBannerTitle}>Importer depuis le répertoire</Text>
              <Text style={styles.importBannerSub}>Nom, numéro et photo récupérés automatiquement</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={P.muted} />
          </TouchableOpacity>

          {/* ── INFORMATIONS PERSONNELLES ── */}
          <SectionCard icon="person-outline" title="Informations personnelles">
            <Field
                label="Nom complet"
                icon="person-outline"
                value={formData.nom}
                onChangeText={update('nom')}
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
                  <Ionicons name="chevron-down" size={12} color={P.muted} />
                </TouchableOpacity>
                <View style={phoneStyles.sep} />
                <TextInput
                    style={phoneStyles.input}
                    placeholder={selectedCountry.format.replace(/#/g, '0')}
                    placeholderTextColor={P.muted}
                    value={formData.telephone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* WhatsApp */}
            <View style={fieldStyles.wrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={fieldStyles.label}>WhatsApp <Text style={fieldStyles.optional}>(optionnel)</Text></Text>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => toggleWhatsappSame(!formData.whatsappSameAsPhone)}
                >
                  <View style={{
                    width: 36, height: 20, borderRadius: 10,
                    backgroundColor: formData.whatsappSameAsPhone ? P.success : P.borderHard,
                    justifyContent: 'center', paddingHorizontal: 2,
                  }}>
                    <View style={{
                      width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff',
                      alignSelf: formData.whatsappSameAsPhone ? 'flex-end' : 'flex-start',
                    }} />
                  </View>
                  <Text style={{ fontSize: 11, color: P.sub }}>= téléphone</Text>
                </TouchableOpacity>
              </View>
              {!formData.whatsappSameAsPhone && (
                  <View style={fieldStyles.inputWrap}>
                    <Ionicons name="logo-whatsapp" size={16} color={P.muted} style={{ marginRight: 10 }} />
                    <TextInput
                        style={fieldStyles.input}
                        value={formData.whatsapp}
                        onChangeText={v => update('whatsapp')(formatPhoneNumber(v, selectedCountry.format))}
                        placeholder={selectedCountry.format.replace(/#/g, '0')}
                        placeholderTextColor={P.muted}
                        keyboardType="phone-pad"
                    />
                  </View>
              )}
              {formData.whatsappSameAsPhone && (
                  <View style={[fieldStyles.inputWrap, { opacity: 0.6 }]}>
                    <Ionicons name="logo-whatsapp" size={16} color={P.success} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 15, color: P.sub }}>
                      {formData.telephone ? `${selectedCountry.dial} ${formData.telephone}` : 'Même que le téléphone'}
                    </Text>
                  </View>
              )}
            </View>

            {/* Email */}
            <Field
                label="Adresse email"
                icon="mail-outline"
                value={formData.email}
                onChangeText={update('email')}
                placeholder="exemple@mail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                optional
            />
          </SectionCard>

          {/* ── LOCALISATION ── */}
          <SectionCard icon="location-outline" title="Localisation">
            <Field
                label="Adresse / Quartier"
                icon="location-outline"
                value={formData.adresse}
                onChangeText={update('adresse')}
                placeholder="Cocody, Angré…"
                optional
            />
            <TouchableOpacity
                style={[locStyles.row, formData.adresse ? locStyles.rowFilled : null]}
                onPress={() => setMapPickerVisible(true)}
                activeOpacity={0.7}
            >
              <View style={[locStyles.iconWrap, formData.adresse ? locStyles.iconWrapFilled : null]}>
                <Ionicons name="map-outline" size={18} color={formData.adresse ? P.primary : P.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={locStyles.topLabel}>Choisir sur la carte</Text>
                <Text style={locStyles.placeholder}>Appuyez pour géolocaliser</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={P.muted} />
            </TouchableOpacity>
          </SectionCard>

          {/* ── GENRE ── */}
          <SectionCard icon="people-outline" title="Genre">
            <View style={genderStyles.segmented}>
              {(['femme', 'homme', 'autre'] as const).map(g => {
                const active = formData.sexe === g;
                const icon = g === 'femme' ? 'female' : g === 'homme' ? 'male' : 'person-outline';
                return (
                    <TouchableOpacity
                        key={g}
                        style={[genderStyles.item, active && genderStyles.itemActive]}
                        onPress={() => setFormData(p => ({ ...p, sexe: g }))}
                        activeOpacity={0.85}
                    >
                      <Ionicons
                          name={icon}
                          size={17}
                          color={active ? '#fff' : P.muted}
                      />
                      <Text style={[genderStyles.label, active && genderStyles.labelActive]}>
                        {g === 'femme' ? 'Femme' : g === 'homme' ? 'Homme' : 'Autre'}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── INFORMATIONS COMPLÉMENTAIRES ── */}
          <SectionCard icon="calendar-outline" title="Informations complémentaires">
            <DateField
                label="Date de naissance"
                value={formData.dateNaissance}
                onChange={(v) => update('dateNaissance')(v)}
                output="fr"
                placeholder="JJ/MM/AAAA"
            />
          </SectionCard>

          {/* ── NOTES INTERNES ── */}
          <SectionCard icon="document-text-outline" title="Notes internes">
            <View style={fieldStyles.wrap}>
              <Text style={[fieldStyles.label]}>
                Notes <Text style={fieldStyles.optional}>(visibles uniquement par vous)</Text>
              </Text>
              <View style={[fieldStyles.inputWrap, { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                    style={[fieldStyles.input, { height: 70, textAlignVertical: 'top' }]}
                    value={formData.notesInternes}
                    onChangeText={update('notesInternes')}
                    placeholder="Préférences, particularités, rappels…"
                    placeholderTextColor={P.muted}
                    multiline
                    numberOfLines={3}
                />
              </View>
            </View>
          </SectionCard>
        </ScrollView>
        </KeyboardAvoidingView>

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
                  <Ionicons name="checkmark" size={18} color={P.gold} style={{ marginLeft: 8 }} />
                </>
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ── STYLES PRINCIPAUX ─────────────────────────────────────────────
const make_phoneStyles = (P: Palette) => ({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: P.pageBg,
    borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard, height: 50, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: '100%' },
  flag:       { fontSize: 18 },
  dial:       { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
  sep:        { width: 0.5, height: '60%', backgroundColor: P.borderHard },
  input:      { flex: 1, fontSize: 15, color: P.text, paddingHorizontal: 14, height: '100%' },
});

const make_locStyles = (P: Palette) => ({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: P.surface,
    borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard, padding: 12 },
  rowFilled:   { backgroundColor: P.primaryBg, borderColor: P.borderHard },
  iconWrap:    { width: 40, height: 40, borderRadius: 11, backgroundColor: P.pageBg, alignItems: 'center', justifyContent: 'center' },
  iconWrapFilled: { backgroundColor: P.primaryBg },
  topLabel:    { fontSize: 10, color: P.muted, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.3, marginBottom: 2 },
  value:       { fontSize: 15, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
  placeholder: { color: P.muted, fontFamily: 'PlusJakartaSans_400Regular' },
});

const make_genderStyles = (P: Palette) => ({
  segmented: { flexDirection: 'row', backgroundColor: P.pageBg, borderRadius: 12, padding: 3, gap: 4 },
  item:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, borderRadius: 10 },
  itemActive:{ backgroundColor: P.bg, borderWidth: 1, borderColor: P.goldRim },
  label:     { fontSize: 14, color: P.muted, fontFamily: 'PlusJakartaSans_500Medium' },
  labelActive: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
});

const make_styles = (P: Palette) => ({
  container: { flex: 1, backgroundColor: P.pageBg },

  // Header
  header:     { flexDirection: 'row' as const, alignItems: 'flex-start' as const, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: P.pageBg, gap: 12 },
  headerBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 4 },
  goldBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg, borderWidth: 1, borderColor: P.goldRim,
    alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 4 },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle:{ fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  headerSub:  { fontSize: 12, color: P.muted, marginTop: 1 },
  importBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10,
    backgroundColor: P.primaryBg, paddingHorizontal: 12, paddingVertical: 8 },
  importBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
  divider:    { height: 0.5, backgroundColor: P.borderHard },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Photo
  photoSection: { alignItems: 'center', marginBottom: 16, gap: 8 },
  photoTouch:   { position: 'relative' },
  photo:        { width: 90, height: 90, borderRadius: 22 },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 22, backgroundColor: P.surface,
    borderWidth: 1.5, borderColor: P.borderHard, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center' },
  cameraBadge:  { position: 'absolute', right: -4, bottom: -4, width: 28, height: 28, borderRadius: 14,
    backgroundColor: P.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: P.pageBg },
  photoHint:    { fontSize: 12, color: P.muted },
  removePhoto:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  removePhotoText: { fontSize: 12, color: P.error, fontFamily: 'PlusJakartaSans_600SemiBold' },

  // Bannière import
  importBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: P.primaryBg,
    borderRadius: 16, borderWidth: 1, borderColor: P.primaryBg, padding: 14, marginBottom: 12 },
  importBannerIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: P.primaryBg,
    alignItems: 'center', justifyContent: 'center' },
  importBannerTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary, marginBottom: 2 },
  importBannerSub:   { fontSize: 12, color: P.sub, lineHeight: 17 },

  // Footer
  footer:     { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: P.pageBg, borderTopWidth: 0.5, borderTopColor: P.borderHard },
  saveBtn:    { height: 54, borderRadius: 16, backgroundColor: P.bg, flexDirection: 'row' as const,
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim },
  saveBtnText:{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', letterSpacing: 0.1 },
});