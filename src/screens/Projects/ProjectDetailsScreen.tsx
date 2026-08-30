// ==========================================
// DÉTAILS D'UN PROJET / COMMANDE GROUPÉE — TailorPro
// Module 13
// ==========================================

import React, { useEffect, useMemo, useState } from 'react';
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
import { formatCurrency, formatDate } from '@utils/formatters';
import { SPACING } from '@constants/theme';
import { CLOTHING_TYPE_LABELS } from '@constants/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ProjectStatut } from '../../types';
import { useToast } from '@/src/context/ToastContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetails'>;

const P = {
    primary: '#6C3EB8', pageBg: '#F5F4FB', surface: '#FFFFFF',
    text: '#1A1033', sub: '#7C6FA8',
    border: 'rgba(108,62,184,0.10)', borderHard: 'rgba(108,62,184,0.15)',
    gold: '#D4AF37', goldBg: 'rgba(212,175,55,0.10)',
    success: '#16A34A', successBg: 'rgba(22,163,74,0.10)',
    error: '#EF4444', errorBg: 'rgba(239,68,68,0.10)',
    warning: '#D97706', warningBg: 'rgba(217,119,6,0.10)',
};

const PROJECT_STATUS_FLOW: ProjectStatut[] = [
    'brouillon', 'confirme', 'en_preparation', 'en_confection',
    'essayage', 'retouches', 'partiellement_termine', 'termine', 'livre',
];

const PROJECT_STATUS_META: Record<ProjectStatut, { label: string; color: string; bg: string }> = {
    brouillon:              { label: 'Brouillon',             color: P.sub,     bg: P.border },
    confirme:               { label: 'Confirmé',              color: P.primary, bg: P.goldBg },
    en_preparation:         { label: 'En préparation',        color: P.warning, bg: P.warningBg },
    en_confection:          { label: 'En confection',         color: P.warning, bg: P.warningBg },
    essayage:               { label: 'Essayage',              color: P.primary, bg: P.goldBg },
    retouches:              { label: 'Retouches',             color: P.warning, bg: P.warningBg },
    partiellement_termine:  { label: 'Partiellement terminé', color: P.warning, bg: P.warningBg },
    termine:                { label: 'Terminé',               color: P.success, bg: P.successBg },
    livre:                  { label: 'Livré',                 color: P.success, bg: P.successBg },
    annule:                 { label: 'Annulé',                color: P.error,   bg: P.errorBg },
};

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending:      { label: 'En attente',  color: P.sub },
    creee:        { label: 'Créée',       color: P.sub },
    en_attente:   { label: 'En attente',  color: P.sub },
    in_progress:  { label: 'En confection', color: P.warning },
    en_confection:{ label: 'En confection', color: P.warning },
    essayage:     { label: 'Essayage',    color: P.primary },
    retouches:    { label: 'Retouches',   color: P.warning },
    terminee:     { label: 'Terminée',    color: P.success },
    completed:    { label: 'Terminée',    color: P.success },
    livree:       { label: 'Livrée',      color: P.success },
    delivered:    { label: 'Livrée',      color: P.success },
    cancelled:    { label: 'Annulée',     color: P.error },
    annulee:      { label: 'Annulée',     color: P.error },
};

export const ProjectDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { projectId } = route.params;
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const {
        getProjectById, projectRecaps, loadProjects, loadProjectRecap,
        getParticipantsByProject, loadParticipants,
        getOrdersByProject, orders, loadOrders,
        updateProjectStatut, deleteProject,
        addPayment,
    } = useAppStore();

    const project = getProjectById(projectId);
    const recap = projectRecaps[projectId];
    const participants = getParticipantsByProject(projectId);
    const projectOrders = getOrdersByProject(projectId);

    const [statusModal, setStatusModal] = useState(false);
    const [payModal, setPayModal] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [savingPay, setSavingPay] = useState(false);

    useEffect(() => {
        if (!project) loadProjects();
        loadParticipants(projectId);
        loadProjectRecap(projectId);
        if (orders.length === 0) loadOrders();
    }, [projectId]);

    const ordersByParticipant = useMemo(() => {
        const map: Record<string, typeof projectOrders> = {};
        for (const p of participants) map[p.id] = projectOrders.filter(o => o.participantId === p.id);
        return map;
    }, [participants, projectOrders]);

    if (!project) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={P.primary} />
            </View>
        );
    }

    const statusMeta = PROJECT_STATUS_META[project.statut] ?? PROJECT_STATUS_META.brouillon;

    const handleAddPayment = async () => {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) return;
        setSavingPay(true);
        await addPayment({
            projectId,
            clientId: project.clientId,
            amount,
            method: 'cash',
        });
        setSavingPay(false);
        setPayAmount('');
        setPayModal(false);
        showToast({ type: 'success', message: 'Paiement enregistré.' });
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* ══ HEADER ══ */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{project.nom}</Text>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        Alert.alert(
                            'Supprimer ce projet ?',
                            'Les vêtements déjà créés restent dans leurs commandes respectives.',
                            [
                                { text: 'Annuler', style: 'cancel' },
                                {
                                    text: 'Supprimer', style: 'destructive',
                                    onPress: async () => { await deleteProject(projectId); navigation.goBack(); },
                                },
                            ]
                        );
                    }}
                >
                    <Feather name="more-horizontal" size={20} color={P.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 120, gap: 14 }}>
                {/* ══ STATUT ══ */}
                <TouchableOpacity style={styles.card} onPress={() => setStatusModal(true)} activeOpacity={0.7}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.cardLabel}>Statut du projet</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg, marginTop: 6 }]}>
                                <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={P.sub} />
                    </View>
                    {project.dateEvenement && (
                        <Text style={styles.hint}>
                            <Feather name="calendar" size={11} color={P.sub} /> Événement le {formatDate(project.dateEvenement)}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* ══ RÉCAP CHIFFRÉ ══ */}
                {recap && (
                    <View style={styles.card}>
                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{recap.nbPersonnes}</Text>
                                <Text style={styles.statLabel}>Personnes</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{recap.nbVetements}</Text>
                                <Text style={styles.statLabel}>Vêtements</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: P.success }]}>{recap.nbVetementsTermines}</Text>
                                <Text style={styles.statLabel}>Terminés</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.rowBetween}>
                            <Text style={styles.hint}>Montant total</Text>
                            <Text style={styles.amountValue}>{formatCurrency(recap.montantTotal)}</Text>
                        </View>
                        <View style={styles.rowBetween}>
                            <Text style={styles.hint}>Déjà payé</Text>
                            <Text style={[styles.amountValue, { color: P.success }]}>{formatCurrency(recap.totalPaye)}</Text>
                        </View>
                        <View style={styles.rowBetween}>
                            <Text style={styles.hint}>Reste à payer</Text>
                            <Text style={[styles.amountValue, { color: recap.resteAPayer > 0 ? P.warning : P.success }]}>
                                {formatCurrency(recap.resteAPayer)}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.payBtn} onPress={() => setPayModal(true)}>
                            <Feather name="credit-card" size={14} color="#fff" />
                            <Text style={styles.payBtnText}>Enregistrer un paiement global</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ══ PERSONNES ══ */}
                <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Personnes</Text>
                    <TouchableOpacity
                        style={styles.addPersonBtn}
                        onPress={() => navigation.navigate('AddParticipant', { projectId })}
                    >
                        <Feather name="user-plus" size={14} color={P.primary} />
                        <Text style={styles.addPersonBtnText}>Ajouter une personne</Text>
                    </TouchableOpacity>
                </View>

                {participants.length === 0 ? (
                    <View style={styles.card}>
                        <Text style={styles.hint}>Aucune personne pour l'instant.</Text>
                    </View>
                ) : (
                    participants.map(person => {
                        const personOrders = ordersByParticipant[person.id] ?? [];
                        return (
                            <TouchableOpacity
                                key={person.id}
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('ParticipantDetails', { projectId, participantId: person.id })}
                            >
                                <View style={styles.rowBetween}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{person.nom.slice(0, 2).toUpperCase()}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.clientName}>{person.nom}</Text>
                                            <Text style={styles.hint}>
                                                {person.role ?? 'Participant'}{person.isTemporary ? ' · temporaire' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <Feather name="chevron-right" size={16} color={P.sub} />
                                </View>

                                {personOrders.length > 0 && (
                                    <View style={{ marginTop: 10, gap: 6 }}>
                                        {personOrders.map(o => {
                                            const meta = ORDER_STATUS_LABELS[o.orderStatus] ?? { label: o.orderStatus, color: P.sub };
                                            return (
                                                <View key={o.id} style={styles.garmentRow}>
                                                    <Feather
                                                        name={meta.label.includes('Terminé') || meta.label.includes('Livrée') ? 'check-circle' : 'circle'}
                                                        size={13} color={meta.color}
                                                    />
                                                    <Text style={styles.garmentLabel} numberOfLines={1}>
                                                        {CLOTHING_TYPE_LABELS?.[o.clothingType] ?? o.clothingType}
                                                    </Text>
                                                    <Text style={[styles.garmentStatus, { color: meta.color }]}>{meta.label}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.addGarmentBtn}
                                    onPress={() => navigation.navigate('AddOrder', { projectId, participantId: person.id })}
                                >
                                    <Feather name="plus" size={13} color={P.primary} />
                                    <Text style={styles.addPersonBtnText}>Ajouter un vêtement</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* ══ MODAL STATUT ══ */}
            <Modal visible={statusModal} transparent animationType="fade" onRequestClose={() => setStatusModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.headerTitle}>Statut du projet</Text>
                        {PROJECT_STATUS_FLOW.concat('annule').map(s => (
                            <TouchableOpacity
                                key={s}
                                style={styles.statusOption}
                                onPress={async () => {
                                    await updateProjectStatut(projectId, s);
                                    setStatusModal(false);
                                }}
                            >
                                <View style={[styles.statusDot, { backgroundColor: PROJECT_STATUS_META[s].color }]} />
                                <Text style={styles.clientName}>{PROJECT_STATUS_META[s].label}</Text>
                                {project.statut === s && <Feather name="check" size={16} color={P.primary} style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModal(false)}>
                            <Text style={styles.cancelBtnText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ══ MODAL PAIEMENT GLOBAL ══ */}
            <Modal visible={payModal} transparent animationType="fade" onRequestClose={() => setPayModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.headerTitle}>Paiement global du projet</Text>
                        <Text style={styles.hint}>Ce paiement n'est pas lié à un vêtement précis.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Montant"
                            placeholderTextColor={P.sub}
                            keyboardType="numeric"
                            value={payAmount}
                            onChangeText={setPayAmount}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal(false)}>
                                <Text style={styles.cancelBtnText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.payBtn, { flex: 1 }, savingPay && { opacity: 0.6 }]}
                                onPress={handleAddPayment}
                                disabled={savingPay}
                            >
                                <Text style={styles.payBtnText}>{savingPay ? 'Enregistrement…' : 'Enregistrer'}</Text>
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
    cardLabel: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
    hint: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },

    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    statLabel: { fontSize: 11, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 },
    divider: { height: 0.5, backgroundColor: P.border, marginVertical: 6 },
    amountValue: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },

    payBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: P.primary, borderRadius: 10, paddingVertical: 11, marginTop: 6,
    },
    payBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },

    sectionTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    addPersonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addPersonBtnText: { fontSize: 12, color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },

    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: P.goldBg, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.gold },
    clientName: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },

    garmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
    garmentLabel: { flex: 1, fontSize: 12.5, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
    garmentStatus: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_600SemiBold' },

    addGarmentBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
        paddingTop: 10, borderTopWidth: 0.5, borderTopColor: P.border,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(26,16,51,0.5)', justifyContent: 'center', padding: SPACING.lg },
    modalCard: { backgroundColor: P.surface, borderRadius: 20, padding: 18, gap: 10, maxHeight: '80%' },
    statusOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    input: {
        borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: P.text,
        fontFamily: 'PlusJakartaSans_500Medium', backgroundColor: P.pageBg,
    },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: P.pageBg, alignItems: 'center' },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
