// ==========================================
// CRÉER UN PROJET / COMMANDE GROUPÉE — TailorPro
// Module 13
// ==========================================

import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
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
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAppStore } from '@store/useAppStore';
import { SPACING } from '@constants/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ParticipantRole } from '../../types';
import { useToast } from '@/src/context/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddProject'>;

const P = {
    primary: '#6C3EB8', pageBg: '#F5F4FB', surface: '#FFFFFF',
    text: '#1A1033', sub: '#7C6FA8',
    border: 'rgba(108,62,184,0.10)', borderHard: 'rgba(108,62,184,0.15)',
    gold: '#D4AF37', goldBg: 'rgba(212,175,55,0.10)',
    error: '#EF4444', errorBg: 'rgba(239,68,68,0.10)',
};

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

const TYPES_PROJET = ['Mariage', 'Cérémonie', 'Commande groupée', 'Autre'];

interface DraftParticipant {
    key: string;
    nom: string;
    telephone: string;
    role: ParticipantRole;
    clientId?: string;
}

export const AddProjectScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { clients, addProject, addParticipant } = useAppStore();

    const [nom, setNom] = useState('');
    const [typeProjet, setTypeProjet] = useState(TYPES_PROJET[0]);
    const [dateEvenement, setDateEvenement] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ── Contact principal : client existant obligatoire (porte le projet) ──
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

    // ── Personnes ajoutées avant même la création (brouillon local) ──
    const [participants, setParticipants] = useState<DraftParticipant[]>([]);
    const [participantModal, setParticipantModal] = useState(false);
    const [pNom, setPNom] = useState('');
    const [pTelephone, setPTelephone] = useState('');
    const [pRole, setPRole] = useState<ParticipantRole>('client');

    const addDraftParticipant = () => {
        if (!pNom.trim()) return;
        setParticipants(prev => [
            ...prev,
            { key: `${Date.now()}`, nom: pNom.trim(), telephone: pTelephone.trim(), role: pRole },
        ]);
        setPNom(''); setPTelephone(''); setPRole('client');
        setParticipantModal(false);
    };

    const removeDraftParticipant = (key: string) => {
        setParticipants(prev => prev.filter(p => p.key !== key));
    };

    const handleSubmit = async () => {
        if (!nom.trim() || !clientId) {
            showToast({ type: 'error', message: 'Nom du projet et contact principal sont requis.' });
            return;
        }
        setIsLoading(true);
        try {
            const project = await addProject({
                clientId,
                nom: nom.trim(),
                typeProjet,
                dateEvenement: dateEvenement ?? undefined,
                notes: notes || undefined,
            });
            if (!project) throw new Error('Création impossible');

            // Ajoute les personnes déjà saisies (en parallèle)
            await Promise.all(
                participants.map(p =>
                    addParticipant({
                        projectId: project.id,
                        nom: p.nom,
                        telephone: p.telephone || undefined,
                        role: p.role,
                    })
                )
            );

            showToast({ type: 'success', message: 'Projet créé avec succès.' });
            navigation.replace('ProjectDetails', { projectId: project.id });
        } catch (e) {
            showToast({ type: 'error', message: "Erreur lors de la création du projet." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau projet</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 120, gap: 16 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Infos projet ── */}
                <View style={styles.card}>
                    <Text style={styles.label}>Nom du projet *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Mariage Jean & Marie"
                        placeholderTextColor={P.sub}
                        value={nom}
                        onChangeText={setNom}
                    />

                    <Text style={styles.label}>Type</Text>
                    <View style={styles.chipsRow}>
                        {TYPES_PROJET.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, typeProjet === t && styles.chipActive]}
                                onPress={() => setTypeProjet(t)}
                            >
                                <Text style={[styles.chipText, typeProjet === t && styles.chipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Date de l'événement</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                        <Feather name="calendar" size={16} color={P.primary} />
                        <Text style={styles.dateBtnText}>
                            {dateEvenement
                                ? dateEvenement.toLocaleDateString('fr-FR')
                                : 'Sélectionner une date (optionnel)'}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dateEvenement ?? new Date()}
                            mode="date"
                            onChange={(_, date) => { setShowDatePicker(false); if (date) setDateEvenement(date); }}
                        />
                    )}

                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                        placeholder="Détails, lieu, contraintes…"
                        placeholderTextColor={P.sub}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </View>

                {/* ── Contact principal ── */}
                <View style={styles.card}>
                    <Text style={styles.label}>Contact principal *</Text>
                    <Text style={styles.hint}>La personne qui a réservé / porte le projet (doit être un client existant).</Text>
                    <TouchableOpacity style={styles.clientRow} onPress={() => setClientModalVisible(true)}>
                        {selectedClient ? (
                            <>
                                <View style={styles.avatar}><Text style={styles.avatarText}>{selectedClient.nom.slice(0, 2).toUpperCase()}</Text></View>
                                <Text style={styles.clientName}>{selectedClient.nom}</Text>
                            </>
                        ) : (
                            <>
                                <View style={[styles.avatar, { backgroundColor: P.border }]}>
                                    <Feather name="user-plus" size={16} color={P.sub} />
                                </View>
                                <Text style={styles.clientPlaceholder}>Choisir un client</Text>
                            </>
                        )}
                        <Feather name="chevron-right" size={16} color={P.sub} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </View>

                {/* ── Personnes du projet ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeadRow}>
                        <Text style={styles.label}>Personnes ({participants.length})</Text>
                        <TouchableOpacity style={styles.addPersonBtn} onPress={() => setParticipantModal(true)}>
                            <Feather name="plus" size={14} color={P.primary} />
                            <Text style={styles.addPersonBtnText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>
                        Tu pourras aussi en ajouter plus tard depuis la fiche du projet.
                    </Text>

                    {participants.map(p => (
                        <View key={p.key} style={styles.participantRow}>
                            <View style={styles.avatar}><Text style={styles.avatarText}>{p.nom.slice(0, 2).toUpperCase()}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientName}>{p.nom}</Text>
                                <Text style={styles.hint}>{ROLES.find(r => r.value === p.role)?.label ?? p.role}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeDraftParticipant(p.key)}>
                                <Feather name="x" size={18} color={P.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Bouton flottant ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.submitBtnText}>{isLoading ? 'Création…' : 'Créer le projet'}</Text>
                </TouchableOpacity>
            </View>

            {/* ── Modal choix client ── */}
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

            {/* ── Modal ajout personne ── */}
            <Modal visible={participantModal} transparent animationType="fade" onRequestClose={() => setParticipantModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.headerTitle}>Ajouter une personne</Text>

                        <Text style={styles.label}>Nom *</Text>
                        <TextInput style={styles.input} placeholder="Nom complet" placeholderTextColor={P.sub} value={pNom} onChangeText={setPNom} />

                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput style={styles.input} placeholder="Optionnel" placeholderTextColor={P.sub} value={pTelephone} onChangeText={setPTelephone} keyboardType="phone-pad" />

                        <Text style={styles.label}>Rôle</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                            <View style={styles.chipsRow}>
                                {ROLES.map(r => (
                                    <TouchableOpacity
                                        key={r.value}
                                        style={[styles.chip, pRole === r.value && styles.chipActive]}
                                        onPress={() => setPRole(r.value)}
                                    >
                                        <Text style={[styles.chipText, pRole === r.value && styles.chipTextActive]}>{r.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setParticipantModal(false)}>
                                <Text style={styles.cancelBtnText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} onPress={addDraftParticipant}>
                                <Text style={styles.submitBtnText}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: P.pageBg },
    header: {
        backgroundColor: P.surface, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: P.borderHard, gap: 8,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: P.pageBg,
        borderWidth: 0.5, borderColor: P.borderHard, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { flex: 1, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, textAlign: 'center' },

    card: { backgroundColor: P.surface, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: P.borderHard, gap: 10 },
    cardHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    hint: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },
    input: {
        borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: P.text,
        fontFamily: 'PlusJakartaSans_500Medium', backgroundColor: P.pageBg,
    },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: P.pageBg, borderWidth: 0.5, borderColor: P.borderHard },
    chipActive: { backgroundColor: P.primary, borderColor: P.primary },
    chipText: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    chipTextActive: { color: '#fff' },

    dateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, backgroundColor: P.pageBg,
    },
    dateBtnText: { fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },

    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: P.goldBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    clientName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    clientPlaceholder: { fontSize: 14, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },

    addPersonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addPersonBtnText: { fontSize: 12.5, color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },
    participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: P.border },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: P.surface, borderTopWidth: 0.5, borderTopColor: P.borderHard,
        padding: SPACING.md,
    },
    submitBtn: { backgroundColor: P.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
    cancelBtn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: P.pageBg },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,16,51,0.5)', justifyContent: 'center', padding: SPACING.lg },
    modalCard: { backgroundColor: P.surface, borderRadius: 20, padding: 18, gap: 10 },
});
