// ==========================================
// ÉCRAN MODIFIER UN CLIENT - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Modal,
  FlatList, TextInput, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '@store/useAppStore';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditClient'>;

// ── PALETTE ─────────────────────────────────────────────────────
const C = {
  bg:            '#FFFFFF',
  surface:       '#F7F6F4',
  border:        '#EBEBEB',
  borderFocus:   '#534AB7',
  textPrimary:   '#0E0B14',
  textSecondary: '#7A7787',
  textTertiary:  '#B0ACBA',
  error:         '#EF4444',
  purple900:     '#1A0033',
  purple700:     '#2E0057',
  purple600:     '#534AB7',
  purple200:     '#AFA9EC',
  purple100:     '#EEEDFE',
  purple50:      '#F7F5FF',
  gold:          '#D4AF37',
  teal:          '#1D9E75',
  teal100:       '#9FE1CB',
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
  { code: 'SN', dial: '+221', name: 'Sénégal',            flag: '🇸🇳', format: '## ### ## ##'  },
  { code: 'CD', dial: '+243', name: 'Congo (RDC)',         flag: '🇨🇩', format: '### ### ###'   },
  { code: 'GA', dial: '+241', name: 'Gabon',              flag: '🇬🇦', format: '# ## ## ##'    },
  { code: 'US', dial: '+1',   name: 'États-Unis',         flag: '🇺🇸', format: '(###) ###-####' },
  { code: 'BE', dial: '+32',  name: 'Belgique',           flag: '🇧🇪', format: '### ## ## ##'  },
];

function formatPhoneNumber(raw: string, format: string): string {
  const digits = raw.replace(/\D/g, '');
  let result = '', di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === '#' ? digits[di++] : format[i];
  }
  return result;
}

// ── MODAL PAYS ───────────────────────────────────────────────────
const CountryPickerModal: React.FC<{
  visible: boolean;
  selected: CountryCode;
  onSelect: (c: CountryCode) => void;
  onClose: () => void;
}> = ({ visible, selected, onSelect, onClose }) => {
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
                placeholder="Pays ou indicatif…"
                placeholderTextColor={C.textTertiary}
                value={search}
                onChangeText={setSearch}
                autoFocus
            />
          </View>
          <FlatList
              data={filtered}
              keyExtractor={item => item.code + item.dial}
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
                        <Text style={[cpStyles.itemName, isActive && cpStyles.itemNameActive]}>{item.name}</Text>
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
              ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: C.border, marginHorizontal: 20 }} />}
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
  title:       { fontSize: 17, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.textPrimary },
  closeBtn:    { width: 30, height: 30, borderRadius: 10, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  item:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  itemActive:  { backgroundColor: C.purple50 },
  flag:        { fontSize: 24 },
  itemName:    { fontSize: 15, color: C.textPrimary, fontFamily: 'PlusJakartaSans_500Medium' },
  itemNameActive: { color: C.purple600, fontFamily: 'PlusJakartaSans_600SemiBold' },
  itemDial:    { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  checkBadge:  { width: 22, height: 22, borderRadius: 11, backgroundColor: C.purple600,
    alignItems: 'center', justifyContent: 'center' },
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
  title:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.textPrimary, letterSpacing: -0.1 },
});

// ── CHAMP GÉNÉRIQUE ───────────────────────────────────────────────
const Field = ({
                 label, icon, value, onChangeText, placeholder,
                 keyboardType, autoCapitalize, optional, multiline,
               }: {
  label: string; icon: keyof typeof Ionicons.glyphMap;
  value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any;
  autoCapitalize?: any; optional?: boolean; multiline?: boolean;
}) => (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>
        {label}{optional && <Text style={fStyles.optional}> (optionnel)</Text>}
      </Text>
      <View style={[fStyles.inputWrap, multiline && { height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
        <Ionicons name={icon} size={16} color={C.textTertiary} style={{ marginRight: 10, ...(multiline ? { marginTop: 2 } : {}) }} />
        <TextInput
            style={[fStyles.input, multiline && { height: 70, textAlignVertical: 'top' }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.textTertiary}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={autoCapitalize ?? 'sentences'}
            autoCorrect={false}
            multiline={multiline}
        />
      </View>
    </View>
);
const fStyles = StyleSheet.create({
  wrap:      { marginBottom: 12 },
  label:     { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  optional:  { color: C.textTertiary, fontFamily: 'PlusJakartaSans_400Regular', textTransform: 'none' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, height: 50 },
  input:     { flex: 1, fontSize: 15, color: C.textPrimary, height: '100%' },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const EditClientScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;
  const { getClientById, updateClient, deleteClient } = useAppStore();
  const client = getClientById(clientId);

  if (!client) {
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.center}>
            <Text style={styles.errorText}>Client introuvable</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  // ── Extraire indicatif + numéro local depuis le téléphone stocké
  const parseStored = (full: string) => {
    const match = full.match(/^(\+\d+)\s(.+)$/);
    if (match) {
      const found = COUNTRY_CODES.find(c => c.dial === match[1]);
      return { country: found ?? COUNTRY_CODES[0], local: match[2] };
    }
    return { country: COUNTRY_CODES[0], local: full };
  };

  const parsed = parseStored(client.telephone);
  const parsedWa = client.whatsapp ? parseStored(client.whatsapp) : null;
  const waIsSame = client.whatsapp === client.telephone || !client.whatsapp;

  const [isLoading, setIsLoading]  = useState(false);
  const [photo, setPhoto]          = useState<string | null>(client.photo ?? null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(parsed.country);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const formatDOB = (d: Date | null) => {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  const [form, setForm] = useState({
    nom:                 client.nom,
    telephone:           parsed.local,
    whatsapp:            parsedWa ? parsedWa.local : '',
    whatsappSameAsPhone: waIsSame,
    email:               client.email ?? '',
    adresse:             client.adresse ?? '',
    sexe:                client.sexe,
    dateNaissance:       formatDOB(client.dateNaissance),
    notesInternes:       client.notesInternes ?? '',
  });

  const update = (field: keyof typeof form) => (value: string | boolean) =>
      setForm(prev => ({ ...prev, [field]: value }));

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value, selectedCountry.format);
    setForm(prev => ({
      ...prev,
      telephone: formatted,
      ...(prev.whatsappSameAsPhone ? { whatsapp: formatted } : {}),
    }));
  };

  const toggleWaSame = (val: boolean) =>
      setForm(prev => ({
        ...prev,
        whatsappSameAsPhone: val,
        ...(val ? { whatsapp: prev.telephone } : {}),
      }));

  // ── PHOTO ──
  const handlePhotoPress = () => {
    Alert.alert('Photo', 'Choisir une option', [
      { text: 'Galerie', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!r.canceled) setPhoto(r.assets[0].uri);
        }},
      { text: 'Caméra', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!r.canceled) setPhoto(r.assets[0].uri);
        }},
      { text: 'Supprimer la photo', style: 'destructive', onPress: () => setPhoto(null) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const parseDateFR = (str: string): Date | null => {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    return isNaN(d.getTime()) ? null : d;
  };

  // ── ENREGISTRER ──
  const handleSave = async () => {
    if (!form.nom.trim())       { Alert.alert('Erreur', 'Le nom est requis'); return; }
    if (!form.telephone.trim()) { Alert.alert('Erreur', 'Le téléphone est requis'); return; }

    setIsLoading(true);
    try {
      const fullPhone = `${selectedCountry.dial} ${form.telephone.trim()}`;
      const fullWa = form.whatsappSameAsPhone
          ? fullPhone
          : form.whatsapp.trim() ? `${selectedCountry.dial} ${form.whatsapp.trim()}` : null;

      await updateClient(clientId, {
        nom:           form.nom.trim(),
        telephone:     fullPhone,
        whatsapp:      fullWa,
        email:         form.email.trim() || null,
        adresse:       form.adresse.trim() || null,
        sexe:          form.sexe as 'homme' | 'femme' | 'autre',
        dateNaissance: parseDateFR(form.dateNaissance),
        photo:         photo ?? null,
        notesInternes: form.notesInternes.trim() || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', "Impossible de modifier le client");
    } finally {
      setIsLoading(false);
    }
  };

  // ── SUPPRIMER (SOFT DELETE) ──
  const handleDelete = () => {
    Alert.alert(
        'Archiver ce client ?',
        `${client.nom} sera archivé(e). L'historique des réalisations est conservé. Cette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Archiver',
            style: 'destructive',
            onPress: async () => {
              await deleteClient(clientId);
              navigation.popToTop();
            },
          },
        ]
    );
  };

  return (
      <View style={styles.container}>
        <CountryPickerModal
            visible={countryPickerVisible}
            selected={selectedCountry}
            onSelect={c => { setSelectedCountry(c); setForm(prev => ({ ...prev, telephone: '' })); }}
            onClose={() => setCountryPickerVisible(false)}
        />

        {/* ── HEADER ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={C.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Modifier le client</Text>
            <Text style={styles.headerSub}>{client.nom}</Text>
          </View>
          <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}
          >
            <Ionicons name="archive-outline" size={16} color={C.error} />
          </TouchableOpacity>
        </View>
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
            <Text style={styles.photoHint}>Appuyez pour changer la photo</Text>
          </View>

          {/* ── INFORMATIONS PERSONNELLES ── */}
          <SectionCard icon="person-outline" title="Informations personnelles">
            <Field
                label="Nom complet"
                icon="person-outline"
                value={form.nom}
                onChangeText={v => update('nom')(v)}
                placeholder="Aminata Diallo"
                autoCapitalize="words"
            />

            {/* Téléphone */}
            <View style={fStyles.wrap}>
              <Text style={fStyles.label}>Numéro de téléphone</Text>
              <View style={pStyles.row}>
                <TouchableOpacity style={pStyles.countryBtn} onPress={() => setCountryPickerVisible(true)} activeOpacity={0.7}>
                  <Text style={pStyles.flag}>{selectedCountry.flag}</Text>
                  <Text style={pStyles.dial}>{selectedCountry.dial}</Text>
                  <Ionicons name="chevron-down" size={12} color={C.textTertiary} />
                </TouchableOpacity>
                <View style={pStyles.sep} />
                <TextInput
                    style={pStyles.input}
                    placeholder={selectedCountry.format.replace(/#/g, '0')}
                    placeholderTextColor={C.textTertiary}
                    value={form.telephone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* WhatsApp */}
            <View style={fStyles.wrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={fStyles.label}>WhatsApp <Text style={fStyles.optional}>(optionnel)</Text></Text>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => toggleWaSame(!form.whatsappSameAsPhone)}
                >
                  <View style={{
                    width: 36, height: 20, borderRadius: 10,
                    backgroundColor: form.whatsappSameAsPhone ? C.teal : C.textTertiary,
                    justifyContent: 'center', paddingHorizontal: 2,
                  }}>
                    <View style={{
                      width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff',
                      alignSelf: form.whatsappSameAsPhone ? 'flex-end' : 'flex-start',
                    }} />
                  </View>
                  <Text style={{ fontSize: 11, color: C.textSecondary }}>= téléphone</Text>
                </TouchableOpacity>
              </View>
              {!form.whatsappSameAsPhone && (
                  <View style={fStyles.inputWrap}>
                    <Ionicons name="logo-whatsapp" size={16} color={C.textTertiary} style={{ marginRight: 10 }} />
                    <TextInput
                        style={fStyles.input}
                        value={form.whatsapp}
                        onChangeText={v => update('whatsapp')(formatPhoneNumber(v, selectedCountry.format))}
                        placeholder={selectedCountry.format.replace(/#/g, '0')}
                        placeholderTextColor={C.textTertiary}
                        keyboardType="phone-pad"
                    />
                  </View>
              )}
              {form.whatsappSameAsPhone && (
                  <View style={[fStyles.inputWrap, { opacity: 0.6 }]}>
                    <Ionicons name="logo-whatsapp" size={16} color={C.teal} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 15, color: C.textSecondary }}>
                      {form.telephone ? `${selectedCountry.dial} ${form.telephone}` : 'Même que le téléphone'}
                    </Text>
                  </View>
              )}
            </View>

            <Field
                label="Adresse email"
                icon="mail-outline"
                value={form.email}
                onChangeText={v => update('email')(v)}
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
                value={form.adresse}
                onChangeText={v => update('adresse')(v)}
                placeholder="Cocody, Angré…"
                optional
            />
          </SectionCard>

          {/* ── GENRE ── */}
          <SectionCard icon="people-outline" title="Genre">
            <View style={gStyles.segmented}>
              {(['femme', 'homme', 'autre'] as const).map(g => {
                const active = form.sexe === g;
                const icon = g === 'femme' ? 'female' : g === 'homme' ? 'male' : 'person-outline';
                return (
                    <TouchableOpacity
                        key={g}
                        style={[gStyles.item, active && gStyles.itemActive]}
                        onPress={() => setForm(p => ({ ...p, sexe: g }))}
                        activeOpacity={0.85}
                    >
                      <Ionicons name={icon} size={17} color={active ? C.purple600 : C.textTertiary} />
                      <Text style={[gStyles.label, active && gStyles.labelActive]}>
                        {g === 'femme' ? 'Femme' : g === 'homme' ? 'Homme' : 'Autre'}
                      </Text>
                    </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── INFORMATIONS COMPLÉMENTAIRES ── */}
          <SectionCard icon="calendar-outline" title="Informations complémentaires">
            <Field
                label="Date de naissance"
                icon="calendar-outline"
                value={form.dateNaissance}
                onChangeText={v => {
                  const digits = v.replace(/\D/g, '');
                  let formatted = digits;
                  if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                  if (digits.length > 4) formatted = formatted.slice(0, 5) + '/' + digits.slice(4, 8);
                  update('dateNaissance')(formatted);
                }}
                placeholder="JJ/MM/AAAA"
                keyboardType="number-pad"
                optional
            />
          </SectionCard>

          {/* ── NOTES INTERNES ── */}
          <SectionCard icon="document-text-outline" title="Notes internes">
            <Field
                label="Notes"
                icon="document-text-outline"
                value={form.notesInternes}
                onChangeText={v => update('notesInternes')(v)}
                placeholder="Préférences, particularités, rappels…"
                multiline
                optional
            />
          </SectionCard>
        </ScrollView>

        {/* ── FOOTER ── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
              style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.85}
          >
            {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                <>
                  <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                  <Ionicons name="checkmark" size={18} color={C.gold} style={{ marginLeft: 8 }} />
                </>
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────
const pStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, height: 50, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: '100%' },
  flag:       { fontSize: 18 },
  dial:       { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: C.textPrimary },
  sep:        { width: 0.5, height: '60%', backgroundColor: C.border },
  input:      { flex: 1, fontSize: 15, color: C.textPrimary, paddingHorizontal: 14, height: '100%' },
});

const gStyles = StyleSheet.create({
  segmented:   { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 3, gap: 4 },
  item:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, borderRadius: 10 },
  itemActive:  { backgroundColor: C.bg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  label:       { fontSize: 14, color: C.textTertiary, fontFamily: 'PlusJakartaSans_500Medium' },
  labelActive: { color: C.purple600, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:  { fontSize: 16, color: C.textSecondary },
  linkText:   { fontSize: 15, color: C.purple600, fontFamily: 'PlusJakartaSans_600SemiBold' },

  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, backgroundColor: C.bg },
  headerBtn:  { width: 38, height: 38, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color: C.textPrimary, letterSpacing: -0.2 },
  headerSub:  { fontSize: 12, color: C.textTertiary, marginTop: 1 },
  deleteBtn:  { width: 38, height: 38, borderRadius: 12, borderWidth: 0.5, borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' },
  divider:    { height: 0.5, backgroundColor: C.border },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

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

  footer:     { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border },
  saveBtn:    { height: 54, borderRadius: 16, backgroundColor: C.purple900, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff', letterSpacing: 0.1 },
});