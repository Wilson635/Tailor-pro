// ==========================================
// AJOUTER UNE PERSONNE À UN PROJET — TailorPro
// Module 13
// ==========================================

import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppStore } from '@store/useAppStore';
import { SPACING } from '@constants/theme';
import { useThemedStyles, type Palette } from '@/src/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ParticipantRole } from '../../types';
import { showAlert, showSuccess } from '@/src/context/DialogContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddParticipant'>;

const ROLES: { value: ParticipantRole; label: string }[] = [
    { value: 'mariee',         label: 'Mariée' },
    { value: 'marie',          label: 'Marié' },
    { value: 'temoin_femme',   label: "Témoin (femme)" },
    { value: 'temoin_homme',   label: "Témoin (homme)" },
    { value: 'pere',           label: 'Père' },
    { value: 'mere',           label: 'Mère' },
    { value: 'enfant',         label: 'Enfant' },
    { value: 'garcon_honneur', label: "Garçon d'honneur" },
    { value: 'fille_honneur',  label: "Fille d'honneur" },
    { value: 'client',         label: 'Client' },
    { value: 'autre',          label: 'Autre' },
];

export const AddParticipantScreen: React.FC<Props> = ({ route, navigation }) => {
    const { projectId } = route.params;
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { clients, addParticipant } = useAppStore();

    const [mode, setMode] = useState<'existing' | 'new'>('new');
    const [nom, setNom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [role, setRole] = useState<ParticipantRole>('client');
    const [isLoading, setIsLoading] = useState(false);

    const [clientId, setClientId] = useState('');
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const selectedClient = clients.find(c => c.id === clientId);
    const filteredClients = useMemo(
        () => clients.filter(c =>
            c.nom.toLowerCase().includes(clientSearch.toLowerCase()) || c.telephone.includes(clientSearch)
        ),
        [clients, clientSearch]
    );

    const handleSubmit = async () => {
        if (mode === 'existing') {
            if (!clientId) { showAlert('Client', 'Sélectionne un client.'); return; }
        } else if (!nom.trim()) {
            showAlert('Champ requis', 'Le nom est requis.');
            return;
        }

        setIsLoading(true);
        const participant = await addParticipant({
            projectId,
            clientId: mode === 'existing' ? clientId : undefined,
            nom: mode === 'existing' ? (selectedClient?.nom ?? '') : nom.trim(),
            telephone: mode === 'existing' ? selectedClient?.telephone : (telephone || undefined),
            role,
            isTemporary: mode === 'new',
        });
        setIsLoading(false);

        if (!participant) {
            showAlert('Erreur', "Erreur lors de l'ajout.");
            return;
        }
        showSuccess('Personne ajoutée', `${participant.nom} a été ajouté(e) au projet.`, () => navigation.goBack());
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Ajouter une personne</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 120, gap: 14 }}>
                {/* ── Choix du mode ── */}
                <View style={styles.modeRow}>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'new' && styles.modeBtnActive]}
                        onPress={() => setMode('new')}
                    >
                        <Feather name="user-plus" size={16} color={mode === 'new' ? '#fff' : P.sub} />
                        <Text style={[styles.modeBtnText, mode === 'new' && styles.modeBtnTextActive]}>Nouvelle personne</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeBtn, mode === 'existing' && styles.modeBtnActive]}
                        onPress={() => setMode('existing')}
                    >
                        <Feather name="users" size={16} color={mode === 'existing' ? '#fff' : P.sub} />
                        <Text style={[styles.modeBtnText, mode === 'existing' && styles.modeBtnTextActive]}>Client existant</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    {mode === 'existing' ? (
                        <>
                            <Text style={styles.label}>Client *</Text>
                            <TouchableOpacity style={styles.clientRow} onPress={() => setClientModalVisible(true)}>
                                {selectedClient ? (
                                    <>
                                        <View style={styles.avatar}><Text style={styles.avatarText}>{selectedClient.nom.slice(0, 2).toUpperCase()}</Text></View>
                                        <Text style={styles.clientName}>{selectedClient.nom}</Text>
                                    </>
                                ) : (
                                    <>
                                        <View style={[styles.avatar, { backgroundColor: P.border }]}>
                                            <Feather name="search" size={16} color={P.sub} />
                                        </View>
                                        <Text style={styles.clientPlaceholder}>Choisir un client</Text>
                                    </>
                                )}
                                <Feather name="chevron-right" size={16} color={P.sub} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Nom *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom complet"
                                placeholderTextColor={P.sub}
                                value={nom}
                                onChangeText={setNom}
                            />
                            <Text style={styles.label}>Téléphone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Optionnel pour l'instant"
                                placeholderTextColor={P.sub}
                                value={telephone}
                                onChangeText={setTelephone}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.hint}>
                                Cette personne n'aura pas de fiche client tant qu'aucune commande ne lui est
                                associée. Elle sera créée automatiquement dès le premier vêtement.
                            </Text>
                        </>
                    )}

                    <Text style={styles.label}>Rôle</Text>
                    <View style={styles.chipsRow}>
                        {ROLES.map(r => (
                            <TouchableOpacity
                                key={r.value}
                                style={[styles.chip, role === r.value && styles.chipActive]}
                                onPress={() => setRole(r.value)}
                            >
                                <Text style={[styles.chipText, role === r.value && styles.chipTextActive]}>{r.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.submitBtnText}>{isLoading ? 'Ajout…' : 'Ajouter au projet'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={clientModalVisible} animationType="slide" onRequestClose={() => setClientModalVisible(false)}>
                <View style={[styles.root, { paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setClientModalVisible(false)}>
                            <Feather name="x" size={20} color={P.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Choisir un client</Text>
                        <View style={{ width: 36 }} />
                    </View>
                    <View style={{ padding: SPACING.md }}>
                        <TextInput
                            style={styles.input}
                            placeholder="Rechercher…"
                            placeholderTextColor={P.sub}
                            value={clientSearch}
                            onChangeText={setClientSearch}
                        />
                    </View>
                    <FlatList
                        data={filteredClients}
                        keyExtractor={c => c.id}
                        contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 8 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.clientRow}
                                onPress={() => { setClientId(item.id); setClientModalVisible(false); }}
                            >
                                <View style={styles.avatar}><Text style={styles.avatarText}>{item.nom.slice(0, 2).toUpperCase()}</Text></View>
                                <View>
                                    <Text style={styles.clientName}>{item.nom}</Text>
                                    <Text style={styles.hint}>{item.telephone}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const makeStyles = (P: Palette) => ({
    root: { flex: 1, backgroundColor: P.pageBg },
    header: {
        backgroundColor: P.pageBg, flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2,
    },
    headerTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.4 },

    modeRow: { flexDirection: 'row', gap: 10 },
    modeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 12, backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    modeBtnActive: { backgroundColor: P.bg, borderColor: P.goldRim },
    modeBtnText: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    modeBtnTextActive: { color: '#fff' },

    card: { backgroundColor: P.surface, borderRadius: 18, padding: 14, borderWidth: 0.5, borderColor: P.borderHard, gap: 10 },
    label: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    hint: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },
    input: {
        borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: P.text,
        fontFamily: 'PlusJakartaSans_500Medium', backgroundColor: P.pageBg,
    },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard },
    chipActive: { backgroundColor: P.bg, borderColor: P.goldRim },
    chipText: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    chipTextActive: { color: '#fff' },

    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: P.goldBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    clientName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    clientPlaceholder: { fontSize: 14, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: P.pageBg, borderTopWidth: 0.5, borderTopColor: P.borderHard,
        padding: SPACING.md,
    },
    submitBtn: { backgroundColor: P.bg, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: P.goldRim },
    submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
});