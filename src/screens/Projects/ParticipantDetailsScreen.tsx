// ==========================================
// DÉTAILS D'UNE PERSONNE (PROJET) — TailorPro
// Module 13
// ==========================================

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import { SPACING, CLOTHING_TYPE_LABELS } from '@constants/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useToast } from '@/src/context/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ParticipantDetails'>;

const P = {
    primary: '#6C3EB8', pageBg: '#F5F4FB', surface: '#FFFFFF',
    text: '#1A1033', sub: '#7C6FA8',
    border: 'rgba(108,62,184,0.10)', borderHard: 'rgba(108,62,184,0.15)',
    gold: '#D4AF37', goldBg: 'rgba(212,175,55,0.10)',
    success: '#16A34A', successBg: 'rgba(22,163,74,0.10)',
    error: '#EF4444', errorBg: 'rgba(239,68,68,0.10)',
    warning: '#D97706', warningBg: 'rgba(217,119,6,0.10)',
};

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:       { label: 'En attente',   color: P.sub },
    creee:         { label: 'Créée',        color: P.sub },
    en_attente:    { label: 'En attente',   color: P.sub },
    in_progress:   { label: 'En confection',color: P.warning },
    en_confection: { label: 'En confection',color: P.warning },
    essayage:      { label: 'Essayage',     color: P.primary },
    retouches:     { label: 'Retouches',    color: P.warning },
    terminee:      { label: 'Terminée',     color: P.success },
    completed:     { label: 'Terminée',     color: P.success },
    livree:        { label: 'Livrée',       color: P.success },
    delivered:     { label: 'Livrée',       color: P.success },
    cancelled:     { label: 'Annulée',      color: P.error },
    annulee:       { label: 'Annulée',      color: P.error },
};

export const ParticipantDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { projectId, participantId } = route.params;
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const {
        getProjectById, loadProjects,
        getParticipantsByProject, loadParticipants,
        getOrdersByParticipant, orders, loadOrders,
        promoteParticipant, deleteParticipant, updateParticipant,
        loadProjectRecap,
    } = useAppStore();

    useEffect(() => {
        if (!getProjectById(projectId)) loadProjects();
        loadParticipants(projectId);
        if (orders.length === 0) loadOrders();
    }, [projectId]);

    const participant = getParticipantsByProject(projectId).find(p => p.id === participantId);
    const garments = getOrdersByParticipant(participantId);

    const [promoteModal, setPromoteModal] = useState(false);
    const [promoteTelephone, setPromoteTelephone] = useState(participant?.telephone ?? '');
    const [promoting, setPromoting] = useState(false);

    if (!participant) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={P.primary} />
            </View>
        );
    }

    const handlePromote = async () => {
        if (!promoteTelephone.trim()) {
            showToast({ type: 'error', message: 'Un numéro de téléphone est requis pour créer la fiche client.' });
            return;
        }
        setPromoting(true);
        await promoteParticipant(participantId, projectId, { telephone: promoteTelephone.trim() });
        setPromoting(false);
        setPromoteModal(false);
        showToast({ type: 'success', message: `${participant.nom} est maintenant un client à part entière.` });
    };

    const handleDelete = () => {
        Alert.alert(
            'Retirer cette personne ?',
            garments.length > 0
                ? "Cette personne a déjà des vêtements associés — ils resteront dans le projet mais ne seront plus rattachés à personne."
                : 'Cette action est définitive.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Retirer', style: 'destructive',
                    onPress: async () => {
                        await deleteParticipant(participantId, projectId);
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{participant.nom}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={handleDelete}>
                    <Feather name="trash-2" size={18} color={P.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 120, gap: 14 }}>
                {/* ══ FICHE PERSONNE ══ */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{participant.nom.slice(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.clientName}>{participant.nom}</Text>
                            <Text style={styles.hint}>{participant.role ?? 'Participant'}</Text>
                        </View>
                    </View>

                    {participant.telephone ? (
                        <View style={styles.infoRow}>
                            <Feather name="phone" size={13} color={P.sub} />
                            <Text style={styles.hint}>{participant.telephone}</Text>
                        </View>
                    ) : null}

                    {participant.isTemporary ? (
                        <TouchableOpacity style={styles.promoteBtn} onPress={() => setPromoteModal(true)}>
                            <Feather name="user-check" size={14} color={P.primary} />
                            <Text style={styles.promoteBtnText}>Créer sa fiche client</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.infoRow}
                            onPress={() => navigation.navigate('ClientDetails', { clientId: participant.clientId! })}
                        >
                            <Feather name="user" size={13} color={P.success} />
                            <Text style={[styles.hint, { color: P.success }]}>Fiche client liée — voir</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ══ VÊTEMENTS ══ */}
                <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Vêtements ({garments.length})</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('AddOrder', { projectId, participantId })}
                    >
                        <Feather name="plus" size={14} color={P.primary} />
                        <Text style={styles.addBtnText}>Ajouter</Text>
                    </TouchableOpacity>
                </View>

                {garments.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.hint}>Aucun vêtement pour l'instant.</Text>
                    </View>
                ) : (
                    garments.map(g => {
                        const meta = ORDER_STATUS_LABELS[g.orderStatus] ?? { label: g.orderStatus, color: P.sub };
                        return (
                            <TouchableOpacity
                                key={g.id}
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: g.id })}
                            >
                                <View style={styles.rowBetween}>
                                    <Text style={styles.clientName}>
                                        {CLOTHING_TYPE_LABELS?.[g.clothingType] ?? g.clothingType}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: `${meta.color}1A` }]}>
                                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                                    </View>
                                </View>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.hint}>
                                        {g.ficheMensurationId ? '✓ Mesures prises' : '○ Mesures à prendre'}
                                    </Text>
                                    <Text style={styles.amountValue}>{formatCurrency(g.totalPrice)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* ══ MODAL PROMOTION ══ */}
            <Modal visible={promoteModal} transparent animationType="fade" onRequestClose={() => setPromoteModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.headerTitle}>Créer la fiche client</Text>
                        <Text style={styles.hint}>
                            Nécessaire pour rattacher des commandes à {participant.nom}. Son nom sera repris automatiquement.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Numéro de téléphone"
                            placeholderTextColor={P.sub}
                            keyboardType="phone-pad"
                            value={promoteTelephone}
                            onChangeText={setPromoteTelephone}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPromoteModal(false)}>
                                <Text style={styles.cancelBtnText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, { flex: 1 }, promoting && { opacity: 0.6 }]}
                                onPress={handlePromote}
                                disabled={promoting}
                            >
                                <Text style={styles.submitBtnText}>{promoting ? 'Création…' : 'Créer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: P.pageBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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

    card: { backgroundColor: P.surface, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: P.borderHard, gap: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hint: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },

    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: P.goldBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    clientName: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: P.border },

    promoteBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
        paddingVertical: 10, marginTop: 4, borderRadius: 10,
        backgroundColor: P.goldBg,
    },
    promoteBtnText: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12.5 },

    sectionTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addBtnText: { fontSize: 12, color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },
    amountValue: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,16,51,0.5)', justifyContent: 'center', padding: SPACING.lg },
    modalCard: { backgroundColor: P.surface, borderRadius: 20, padding: 18, gap: 10 },
    input: {
        borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: P.text,
        fontFamily: 'PlusJakartaSans_500Medium', backgroundColor: P.pageBg,
    },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: P.pageBg, alignItems: 'center' },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    submitBtn: { backgroundColor: P.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
});