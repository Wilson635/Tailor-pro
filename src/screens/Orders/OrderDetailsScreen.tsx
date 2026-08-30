// ==========================================
// DÉTAILS D'UNE COMMANDE — TailorPro
// Design épuré sans ombres
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
    Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppStore } from '@store/useAppStore';
import { paymentService, activityService, createPaiementM8 } from '@services/supabaseService';
import { TYPE_PAIEMENT_META, TYPES_PAIEMENT, TypePaiement } from '@constants/paiementConstants';
import { formatCurrency, formatDate } from '@utils/formatters';
import { SPACING } from '@constants/theme';
import {RootStackParamList} from "@/src/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

// ──────────────────────────────────────────
// PALETTE
// ──────────────────────────────────────────

const P = {
    bg:        '#16123A',
    primary:   '#6C3EB8',
    pageBg:    '#F5F4FB',
    surface:   '#FFFFFF',
    text:      '#1A1033',
    sub:       '#7C6FA8',
    border:    'rgba(108,62,184,0.10)',
    borderHard:'rgba(108,62,184,0.15)',
    gold:      '#D4AF37',
    goldBg:    'rgba(212,175,55,0.10)',
    goldRim:   'rgba(212,175,55,0.28)',
    success:   '#16A34A',
    successBg: 'rgba(22,163,74,0.10)',
    error:     '#EF4444',
    errorBg:   'rgba(239,68,68,0.10)',
    warning:   '#D97706',
    warningBg: 'rgba(217,119,6,0.10)',
    info:      '#2563EB',
    infoBg:    'rgba(37,99,235,0.10)',
};

// ──────────────────────────────────────────
// TYPES & CONSTANTES
// ──────────────────────────────────────────

type OrderStatus   = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer' | 'other';

const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'in_progress', 'completed', 'delivered'];

const ORDER_STATUS_META: Record<OrderStatus, {
    label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap;
}> = {
    pending:     { label: 'En attente',    color: P.warning, bg: P.warningBg, icon: 'clock'        },
    in_progress: { label: 'En cours',      color: P.info,    bg: P.infoBg,    icon: 'scissors'     },
    completed:   { label: 'Prêt à livrer', color: P.success, bg: P.successBg, icon: 'check-circle' },
    delivered:   { label: 'Livré',         color: P.gold,    bg: P.goldBg,    icon: 'package'      },
    cancelled:   { label: 'Annulée',       color: P.error,   bg: P.errorBg,   icon: 'x-circle'     },
};

const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
    unpaid:  { label: 'Impayée', color: P.error,   bg: P.errorBg   },
    partial: { label: 'Partiel', color: P.warning, bg: P.warningBg },
    paid:    { label: 'Soldée',  color: P.success, bg: P.successBg },
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { value: 'cash',          label: 'Espèces',      icon: 'dollar-sign'    },
    { value: 'mobile_money',  label: 'Mobile Money', icon: 'smartphone'     },
    { value: 'bank_transfer', label: 'Virement',     icon: 'credit-card'    },
    { value: 'other',         label: 'Autre',        icon: 'more-horizontal'},
];

const CLOTHING_LABELS: Record<string, string> = {
    robe_longue:  'Robe longue',     robe_courte: 'Robe courte',
    costume:      'Costume',         chemise:     'Chemise',
    pantalon:     'Pantalon',        boubou:      'Boubou',
    ensemble:     'Ensemble',        robe_mariage:'Robe de mariage',
    tenue_enfant: 'Tenue enfant',    autre:       'Autre',
};

const URGENCY_META: Record<string, { label: string; color: string }> = {
    low:    { label: 'Normal',  color: P.success },
    medium: { label: 'Moyen',  color: P.warning },
    high:   { label: 'Urgent', color: P.error   },
};

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

const calcPaymentStatus = (remaining: number, total: number): PaymentStatus => {
    if (remaining <= 0) return 'paid';
    if (remaining < total) return 'partial';
    return 'unpaid';
};

interface LocalPayment {
    id: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
    paymentDate: string;
}

// ──────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ──────────────────────────────────────────

export const OrderDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { orderId } = route.params;
    const insets = useSafeAreaInsets();

    const { orders, updateOrder, loadStatistics, loadActivities, realisations, getProjectById, getParticipantsByProject, loadProjects, loadParticipants } = useAppStore();
    const order = orders.find(o => o.id === orderId);
    // Réalisation liée à cette commande (Module 7)
    const linkedRealisation = order
        ? Object.values(realisations).flat().find((r: any) => r.commandeId === orderId)
        : undefined;

    // ── Contexte projet / commande groupée ──
    const project = order?.projectId ? getProjectById(order.projectId) : undefined;
    const participant = order?.projectId
        ? getParticipantsByProject(order.projectId).find(p => p.id === order.participantId)
        : undefined;

    useEffect(() => {
        if (order?.projectId && !project) loadProjects();
        if (order?.projectId) loadParticipants(order.projectId);
    }, [order?.projectId]);

    const [payments, setPayments]             = useState<LocalPayment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [savingStatus, setSavingStatus]     = useState(false);

    // Modal paiement
    const [payModal, setPayModal]   = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
    const [payNotes, setPayNotes]   = useState('');
    const [savingPay, setSavingPay] = useState(false);
    const [payType, setPayType]     = useState<string>('acompte');

    const fetchPayments = useCallback(async () => {
        setLoadingPayments(true);
        const { data, error } = await paymentService.getByOrder(orderId);
        if (!error && data) {
            setPayments((data as any[]).map(p => ({
                id:            p.id,
                amount:        Number(p.amount),
                paymentMethod: p.method,
                typePaiement:  p.type ?? 'acompte',
                notes:         p.notes ?? undefined,
                paymentDate:   p.date,
            })));
        }
        setLoadingPayments(false);
    }, [orderId]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    if (!order) {
        return (
            <View style={styles.notFound}>
                <Feather name="alert-circle" size={36} color={P.error} />
                <Text style={styles.notFoundText}>Commande introuvable</Text>
                <TouchableOpacity style={styles.notFoundBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.notFoundBtnText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculs
    const currentStatusMeta = ORDER_STATUS_META[order.orderStatus as OrderStatus] ?? ORDER_STATUS_META.pending;
    const currentPayMeta    = PAYMENT_STATUS_META[order.paymentStatus as PaymentStatus] ?? PAYMENT_STATUS_META.unpaid;
    const totalPaid         = payments.reduce((s, p) => s + p.amount, 0);
    const remaining         = Math.max(0, order.totalPrice - totalPaid);
    const currentStepIndex  = ORDER_STATUS_FLOW.indexOf(order.orderStatus as OrderStatus);
    const urgencyMeta       = URGENCY_META[order.urgencyLevel] ?? URGENCY_META.medium;

    // ── Changer le statut ──
    const handleStatusChange = async (newStatus: OrderStatus, confirmed = false) => {
        if (savingStatus) return;
        // Alerte livraison avec solde restant (Module 7)
        if (newStatus === 'delivered' && remaining > 0 && !confirmed) {
            Alert.alert(
                'Solde non soldé',
                `Il reste ${formatCurrency(remaining)} à encaisser. Confirmer quand même ?`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Confirmer', style: 'destructive',
                        onPress: () => handleStatusChange(newStatus, true) },
                ]
            );
            return;
        }
        setSavingStatus(true);
        try {
            await updateOrder(orderId, { orderStatus: newStatus });
            if (newStatus === 'completed' || newStatus === 'delivered') {
                await activityService.create({
                    type:     'order_completed',
                    title:    newStatus === 'delivered' ? 'Commande livrée' : 'Commande terminée',
                    subtitle: order.clientName,
                    clientId: order.clientId,
                    orderId:  order.id,
                });
                loadActivities();
            }
            loadStatistics();
        } finally {
            setSavingStatus(false);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Annuler la commande ?',
            'Cette action ne peut pas être annulée.',
            [
                { text: 'Non', style: 'cancel' },
                { text: 'Oui, annuler', style: 'destructive', onPress: () => handleStatusChange('cancelled') },
            ]
        );
    };

    // ── Enregistrer un paiement ──
    const handleAddPayment = async () => {
        const amount = parseFloat(payAmount.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Montant invalide', 'Entrez un montant supérieur à 0.');
            return;
        }
        if (amount > remaining + 0.01) {
            Alert.alert(
                'Montant trop élevé',
                `Le reste à payer est de ${formatCurrency(remaining)}. Continuer quand même ?`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Continuer', onPress: () => submitPayment(amount) },
                ]
            );
            return;
        }
        await submitPayment(amount);
    };

    const submitPayment = async (amount: number) => {
        setSavingPay(true);
        try {
            const { data, error } = await createPaiementM8({
                orderId,
                clientId:     order.clientId,
                amount,
                method:       payMethod,
                typePaiement: payType,
                notes:        payNotes.trim() || undefined,
            });

            if (error || !data) {
                Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement.');
                return;
            }

            const newRemaining = Math.max(0, remaining - amount);
            const newPayStatus = calcPaymentStatus(newRemaining, order.totalPrice);
            await updateOrder(orderId, { remainingAmount: newRemaining, paymentStatus: newPayStatus });

            await activityService.create({
                type:     'payment_received',
                title:    'Paiement reçu',
                subtitle: order.clientName,
                amount,
                clientId: order.clientId,
                orderId:  order.id,
            });

            loadStatistics();
            loadActivities();
            setPayModal(false);
            setPayAmount('');
            setPayNotes('');
            setPayMethod('cash');
            setPayType('acompte');
            fetchPayments();
            // Proposer le reçu
            const snapPaid = totalPaid + amount;
            Alert.alert(
                'Paiement enregistré ✓',
                `${formatCurrency(amount)} encaissé avec succès`,
                [
                    { text: 'Fermer' },
                    { text: 'Voir le reçu', onPress: () => navigation.navigate('Recu', {
                            amount,
                            typePaiement:   payType,
                            modePaiement:   payMethod,
                            date:           new Date().toISOString(),
                            notes:          payNotes.trim() || undefined,
                            clientName:     order.clientName,
                            commandeNumero: (order as any).numeroCommande,
                            totalAmount:    order.totalPrice,
                            paidAmount:     snapPaid,
                            remaining:      Math.max(0, order.totalPrice - snapPaid),
                        }) },
                ]
            );
        } finally {
            setSavingPay(false);
        }
    };

    // ──────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────

    return (
        <>
            <View style={[styles.root, { paddingTop: insets.top }]}>

                {/* ══ HEADER ══ */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color={P.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Détails commande</Text>
                    <TouchableOpacity
                        style={styles.clientBtn}
                        onPress={() => navigation.navigate('ClientDetails', { clientId: order.clientId })}
                    >
                        <Feather name="user" size={16} color={P.primary} />
                        <Text style={styles.clientBtnText}>Fiche client</Text>
                    </TouchableOpacity>
                </View>

                {/* ══ FIL D'ARIANE PROJET ══ */}
                {project && (
                    <TouchableOpacity
                        style={styles.projectBreadcrumb}
                        onPress={() => navigation.navigate('ProjectDetails', { projectId: project.id })}
                        activeOpacity={0.7}
                    >
                        <Feather name="folder" size={13} color={P.primary} />
                        <Text style={styles.projectBreadcrumbText} numberOfLines={1}>
                            {project.nom}
                            {participant ? ` · ${participant.nom}${participant.role ? ` (${participant.role})` : ''}` : ''}
                        </Text>
                        <Feather name="chevron-right" size={13} color={P.primary} />
                    </TouchableOpacity>
                )}

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                >

                    {/* ══ CARTE CLIENT ══ */}
                    <TouchableOpacity
                        style={styles.clientCard}
                        onPress={() => navigation.navigate('ClientDetails', { clientId: order.clientId })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.clientAvatar}>
                            <Text style={styles.clientAvatarText}>
                                {order.clientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.clientName}>{order.clientName}</Text>
                            <Text style={styles.clientSub}>Voir la fiche client</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color="rgba(108,62,184,0.3)" />
                    </TouchableOpacity>

                    {/* ══ STATUT COMMANDE ══ */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Statut de la commande</Text>
                            {savingStatus && <ActivityIndicator size="small" color={P.primary} />}
                        </View>

                        {/* Badge statut courant */}
                        <View style={[styles.statusBadge, { backgroundColor: currentStatusMeta.bg }]}>
                            <Feather name={currentStatusMeta.icon} size={16} color={currentStatusMeta.color} />
                            <Text style={[styles.statusBadgeText, { color: currentStatusMeta.color }]}>
                                {currentStatusMeta.label}
                            </Text>
                        </View>

                        {/* Barre de progression */}
                        {order.orderStatus !== 'cancelled' && (
                            <View style={styles.progressWrap}>
                                {ORDER_STATUS_FLOW.map((step, i) => {
                                    const done = i <= currentStepIndex;
                                    const meta = ORDER_STATUS_META[step];
                                    return (
                                        <React.Fragment key={step}>
                                            <View style={styles.progressStep}>
                                                <View style={[styles.progressDot, done && { backgroundColor: P.primary }]}>
                                                    {done && <Feather name="check" size={7} color="#fff" />}
                                                </View>
                                                <Text style={[styles.progressStepLabel, done && { color: P.primary }]}>
                                                    {meta.label}
                                                </Text>
                                            </View>
                                            {i < ORDER_STATUS_FLOW.length - 1 && (
                                                <View style={[styles.progressConnector, i < currentStepIndex && { backgroundColor: P.primary }]} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </View>
                        )}

                        {/* Boutons action */}
                        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                            <View style={styles.statusActions}>
                                {currentStepIndex < ORDER_STATUS_FLOW.length - 1 && (
                                    <TouchableOpacity
                                        style={styles.advanceBtn}
                                        onPress={() => handleStatusChange(ORDER_STATUS_FLOW[currentStepIndex + 1])}
                                        disabled={savingStatus}
                                        activeOpacity={0.85}
                                    >
                                        <Feather name="arrow-right-circle" size={15} color="#fff" />
                                        <Text style={styles.advanceBtnText}>
                                            Passer à : {ORDER_STATUS_META[ORDER_STATUS_FLOW[currentStepIndex + 1]].label}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={handleCancelOrder}
                                    disabled={savingStatus}
                                    activeOpacity={0.8}
                                >
                                    <Feather name="x" size={13} color={P.error} />
                                    <Text style={styles.cancelBtnText}>Annuler la commande</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* ══ INFORMATIONS ══ */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Informations</Text>
                        <View style={styles.infoList}>
                            {order.numeroCommande && (
                                <InfoRow icon="hash" label="N° commande" value={order.numeroCommande} />
                            )}
                            <InfoRow icon="scissors"      label="Type de vêtement" value={CLOTHING_LABELS[order.clothingType] ?? order.clothingType} />
                            <InfoRow icon="calendar"      label="Date de livraison" value={formatDate(order.deliveryDate)} />
                            <InfoRow icon="alert-triangle" label="Urgence"          value={urgencyMeta.label} valueColor={urgencyMeta.color} />
                            <InfoRow icon="clock"         label="Créée le"          value={formatDate(order.createdAt)} />
                            {!!order.description && (
                                <InfoRow icon="file-text" label="Description" value={order.description} multiline />
                            )}
                        </View>
                    </View>

                    {/* ══ PHOTOS ══ */}
                    {order.orderItems && order.orderItems.length > 0 && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Photos</Text>
                            {(['fabric', 'inspiration'] as const).map(type => {
                                const photos = order.orderItems.filter(
                                    (p: any) => (p.itemType ?? p.item_type) === type
                                );
                                if (!photos.length) return null;
                                return (
                                    <View key={type} style={{ marginBottom: 12 }}>
                                        <Text style={styles.photoLabel}>
                                            {type === 'fabric' ? 'Tissus' : 'Inspirations'}
                                        </Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {photos.map((p: any) => (
                                                <Image
                                                    key={p.id}
                                                    source={{ uri: p.photoUrl ?? p.photo_url }}
                                                    style={styles.photoThumb}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* ══ RÉALISATION ASSOCIÉE (Module 7) ══ */}
                    {linkedRealisation && (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('RealisationDetails', {
                                realisationId: (linkedRealisation as any).id,
                                clientId:      (linkedRealisation as any).clientId,
                            })}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.cardTitle}>Réalisation associée</Text>
                                <Feather name="chevron-right" size={14} color="rgba(108,62,184,0.3)" />
                            </View>
                            <Text style={styles.clientSub}>
                                Statut : {String((linkedRealisation as any).statut).replace(/_/g, ' ')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* ══ PAIEMENT ══ */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Paiement</Text>
                            <View style={[styles.payBadge, { backgroundColor: currentPayMeta.bg }]}>
                                <Text style={[styles.payBadgeText, { color: currentPayMeta.color }]}>
                                    {currentPayMeta.label}
                                </Text>
                            </View>
                        </View>

                        {/* Résumé */}
                        <View style={styles.financeBlock}>
                            <FinanceLine label="Montant total"   value={order.totalPrice}    />
                            <View style={styles.financeDivider} />
                            <FinanceLine label="Acompte initial" value={order.advancePayment} sub />
                            <FinanceLine label="Payé au total"   value={totalPaid}           sub />
                            <View style={styles.financeDivider} />
                            <View style={styles.financeRemaining}>
                                <Text style={styles.financeRemainingLabel}>Reste à payer</Text>
                                <Text style={[styles.financeRemainingValue, remaining === 0 && { color: P.success }]}>
                                    {formatCurrency(remaining)}
                                </Text>
                            </View>
                        </View>

                        {/* Boutons paiement */}
                        {remaining > 0 && (
                            <>
                                <TouchableOpacity
                                    style={styles.payFullBtn}
                                    onPress={() => { setPayAmount(remaining.toString()); setPayModal(true); }}
                                    activeOpacity={0.85}
                                >
                                    <Feather name="check-circle" size={15} color="#fff" />
                                    <Text style={styles.payFullBtnText}>Encaisser le solde — {formatCurrency(remaining)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.payPartialBtn}
                                    onPress={() => { setPayAmount(''); setPayModal(true); }}
                                    activeOpacity={0.8}
                                >
                                    <Feather name="plus" size={13} color={P.primary} />
                                    <Text style={styles.payPartialBtnText}>Paiement partiel</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Historique */}
                        {loadingPayments ? (
                            <ActivityIndicator style={{ marginTop: 16 }} color={P.primary} />
                        ) : payments.length > 0 ? (
                            <View style={styles.historyWrap}>
                                <Text style={styles.historyTitle}>Historique</Text>
                                {payments.map((p, i) => (
                                    <View key={p.id}>
                                        <View style={styles.historyRow}>
                                            <View style={[styles.historyIcon, { backgroundColor: P.successBg }]}>
                                                <Feather
                                                    name={
                                                        p.paymentMethod === 'cash'          ? 'dollar-sign' :
                                                            p.paymentMethod === 'mobile_money'  ? 'smartphone'  :
                                                                p.paymentMethod === 'bank_transfer' ? 'credit-card' :
                                                                    'more-horizontal'
                                                    }
                                                    size={13}
                                                    color={P.success}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.historyAmount}>+{formatCurrency(p.amount)}</Text>
                                                {(p as any).typePaiement && (() => {
                                                    const tm = TYPE_PAIEMENT_META[(p as any).typePaiement as TypePaiement];
                                                    return tm ? (
                                                        <Text style={{ fontSize: 10, color: tm.color, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 1 }}>
                                                            {tm.label}
                                                        </Text>
                                                    ) : null;
                                                })()}
                                                <Text style={styles.historyDate}>{formatDate(p.paymentDate)}</Text>
                                                {p.notes ? <Text style={styles.historyNotes}>{p.notes}</Text> : null}
                                            </View>
                                        </View>
                                        {i < payments.length - 1 && <View style={styles.historyDivider} />}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyPay}>
                                <Text style={styles.emptyPayText}>Aucun paiement enregistré</Text>
                            </View>
                        )}
                    </View>

                </ScrollView>
            </View>

            {/* ══ MODAL PAIEMENT ══ */}
            <Modal
                visible={payModal}
                transparent
                animationType="slide"
                onRequestClose={() => setPayModal(false)}
                statusBarTranslucent
            >
                <Pressable style={styles.overlay} onPress={() => setPayModal(false)} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrap}
                >
                    <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Enregistrer un paiement</Text>
                        <Text style={styles.sheetSub}>Reste à payer : {formatCurrency(remaining)}</Text>

                        {/* Type de paiement */}
                        <Text style={styles.sheetLabel}>Type</Text>
                        <View style={styles.methodsWrap}>
                            {TYPES_PAIEMENT.map(t => {
                                const meta = TYPE_PAIEMENT_META[t as TypePaiement];
                                const active = payType === t;
                                return (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.methodChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}
                                        onPress={() => setPayType(t)}
                                        activeOpacity={0.8}
                                    >
                                        <Feather name={meta.icon} size={12} color={active ? '#fff' : P.sub} />
                                        <Text style={[styles.methodChipText, active && { color: '#fff' }]}>
                                            {meta.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Montant */}
                        <View style={styles.amountWrap}>
                            <TextInput
                                style={styles.amountInput}
                                value={payAmount}
                                onChangeText={setPayAmount}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor="rgba(26,16,51,0.2)"
                                autoFocus
                            />
                            <View style={styles.amountRight}>
                                <Text style={styles.amountCurrency}>FCFA</Text>
                                {remaining > 0 && (
                                    <TouchableOpacity
                                        style={styles.allBtn}
                                        onPress={() => setPayAmount(remaining.toString())}
                                    >
                                        <Text style={styles.allBtnText}>Tout</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Mode paiement */}
                        <Text style={styles.sheetLabel}>Mode de paiement</Text>
                        <View style={styles.methodsWrap}>
                            {PAYMENT_METHODS.map(m => (
                                <TouchableOpacity
                                    key={m.value}
                                    style={[styles.methodChip, payMethod === m.value && styles.methodChipActive]}
                                    onPress={() => setPayMethod(m.value)}
                                    activeOpacity={0.8}
                                >
                                    <Feather name={m.icon} size={13} color={payMethod === m.value ? '#fff' : P.sub} />
                                    <Text style={[styles.methodChipText, payMethod === m.value && { color: '#fff' }]}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Notes */}
                        <Text style={styles.sheetLabel}>Notes (optionnel)</Text>
                        <TextInput
                            style={styles.notesInput}
                            value={payNotes}
                            onChangeText={setPayNotes}
                            placeholder="Ex : 2ème versement, solde..."
                            placeholderTextColor="rgba(26,16,51,0.2)"
                            multiline
                        />

                        {/* Valider */}
                        <TouchableOpacity
                            style={[styles.submitBtn, (!payAmount || savingPay) && { opacity: 0.45 }]}
                            onPress={handleAddPayment}
                            disabled={savingPay || !payAmount}
                            activeOpacity={0.85}
                        >
                            {savingPay
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <>
                                    <Feather name="check" size={15} color="#fff" />
                                    <Text style={styles.submitBtnText}>Confirmer le paiement</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

// ──────────────────────────────────────────
// SUB-COMPOSANTS
// ──────────────────────────────────────────

const InfoRow = ({
                     icon, label, value, valueColor, multiline,
                 }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    valueColor?: string;
    multiline?: boolean;
}) => (
    <View style={[ir.row, multiline && { alignItems: 'flex-start' }]}>
        <View style={ir.icon}>
            <Feather name={icon} size={13} color={P.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={ir.label}>{label}</Text>
            <Text style={[ir.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
        </View>
    </View>
);

const ir = StyleSheet.create({
    row:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    icon: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(108,62,184,0.07)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    label:{ fontSize: 10, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 1 },
    value:{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
});

const FinanceLine = ({ label, value, sub }: { label: string; value: number; sub?: boolean }) => (
    <View style={fl.row}>
        <Text style={[fl.label, sub && fl.labelSub]}>{label}</Text>
        <Text style={[fl.value, sub && fl.valueSub]}>{formatCurrency(value)}</Text>
    </View>
);

const fl = StyleSheet.create({
    row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    label:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    labelSub: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },
    value:    { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    valueSub: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
});

// ──────────────────────────────────────────
// STYLES — Aucune ombre
// ──────────────────────────────────────────

const styles = StyleSheet.create({
    root:    { flex: 1, backgroundColor: P.pageBg },
    notFound:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    notFoundText:   { fontSize: 15, color: P.text, fontFamily: 'PlusJakartaSans_600SemiBold' },
    notFoundBtn:    { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: P.primary, borderRadius: 10 },
    notFoundBtnText:{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },

    // ── Header ──
    header: {
        backgroundColor: P.surface,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: P.borderHard,
        gap: 8,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: P.pageBg,
        borderWidth: 0.5, borderColor: P.borderHard,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { flex: 1, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, textAlign: 'center' },

    // ── Fil d'Ariane projet ──
    projectBreadcrumb: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: P.surface,
        paddingHorizontal: SPACING.md, paddingVertical: 8,
        borderBottomWidth: 0.5, borderBottomColor: P.borderHard,
    },
    projectBreadcrumbText: {
        flex: 1, fontSize: 12.5, color: P.primary,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    clientBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: 'rgba(108,62,184,0.07)',
        borderWidth: 0.5, borderColor: P.border,
    },
    clientBtnText: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },

    // ── Scroll ──
    scroll:        { flex: 1 },
    scrollContent: { padding: SPACING.md, gap: SPACING.sm + 2 },

    // ── Client card ──
    clientCard: {
        backgroundColor: P.surface,
        borderRadius: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
        flexDirection: 'row', alignItems: 'center',
        padding: SPACING.md, gap: SPACING.sm,
    },
    clientAvatar: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: P.bg,
        alignItems: 'center', justifyContent: 'center',
    },
    clientAvatarText: { fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
    clientName:       { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    clientSub:        { fontSize: 11, color: P.primary, marginTop: 1 },

    // ── Card ──
    card: {
        backgroundColor: P.surface,
        borderRadius: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
        padding: SPACING.md,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    cardTitle:     { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },

    // ── Statut ──
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        padding: SPACING.sm + 2, borderRadius: 10,
        marginBottom: SPACING.md,
    },
    statusBadgeText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },

    // Progression
    progressWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
    progressStep: { alignItems: 'center', flex: 1 },
    progressDot: {
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    progressStepLabel: { fontSize: 9, color: 'rgba(0,0,0,0.3)', fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' },
    progressConnector: { flex: 1, height: 1.5, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 7, marginHorizontal: -4 },

    // Actions statut
    statusActions: { gap: 8 },
    advanceBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: P.primary, borderRadius: 12,
        paddingVertical: 13, paddingHorizontal: 16, justifyContent: 'center',
    },
    advanceBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center',
        borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)',
        backgroundColor: P.errorBg,
    },
    cancelBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.error },

    // ── Infos ──
    infoList: { gap: 0 },

    // ── Photos ──
    photoLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 8 },
    photoThumb: { width: 96, height: 96, borderRadius: 10, marginRight: 8, backgroundColor: P.border },

    // ── Paiement ──
    payBadge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
    payBadgeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },

    financeBlock: {
        backgroundColor: P.pageBg,
        borderRadius: 10, padding: SPACING.md,
        borderWidth: 0.5, borderColor: P.border,
        marginBottom: SPACING.sm,
    },
    financeDivider: { height: 0.5, backgroundColor: P.border, marginVertical: 6 },
    financeRemaining: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 },
    financeRemainingLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    financeRemainingValue: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.error },

    payFullBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: P.success, borderRadius: 12,
        paddingVertical: 13, paddingHorizontal: 16, justifyContent: 'center',
        marginBottom: 7,
    },
    payFullBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
    payPartialBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center',
        borderWidth: 0.5, borderColor: P.border,
        backgroundColor: 'rgba(108,62,184,0.05)',
        marginBottom: 4,
    },
    payPartialBtnText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },

    historyWrap:   { marginTop: SPACING.md },
    historyTitle:  { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 6 },
    historyRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
    historyIcon:   { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    historyAmount: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.success },
    historyDate:   { fontSize: 11, color: P.sub, marginTop: 1 },
    historyNotes:  { fontSize: 11, color: P.sub, fontStyle: 'italic', marginTop: 1 },
    historyDivider:{ height: 0.5, backgroundColor: P.border, marginLeft: 40 },

    emptyPay:     { alignItems: 'center', paddingVertical: SPACING.md },
    emptyPayText: { fontSize: 12, color: P.sub },

    // ── Modal ──
    overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,18,58,0.4)' },
    sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    sheet: {
        backgroundColor: P.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: SPACING.lg,
        borderTopWidth: 0.5, borderColor: P.borderHard,
    },
    sheetHandle: {
        width: 36, height: 3.5, borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignSelf: 'center', marginBottom: 16,
    },
    sheetTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, marginBottom: 2 },
    sheetSub:   { fontSize: 12, color: P.sub, marginBottom: SPACING.md },
    sheetLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 6, marginTop: SPACING.sm },

    amountWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: 1.5, borderBottomColor: P.primary,
        marginBottom: SPACING.sm, paddingBottom: 6,
    },
    amountInput:    { flex: 1, fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    amountRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    amountCurrency: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
    allBtn: {
        paddingHorizontal: 10, paddingVertical: 5,
        backgroundColor: P.primary, borderRadius: 8,
    },
    allBtnText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },

    methodsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
    methodChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 7,
        borderRadius: 8, borderWidth: 0.5, borderColor: P.borderHard,
        backgroundColor: P.pageBg,
    },
    methodChipActive:    { backgroundColor: P.primary, borderColor: P.primary },
    methodChipText:      { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },

    notesInput: {
        backgroundColor: P.pageBg, borderRadius: 10,
        borderWidth: 0.5, borderColor: P.borderHard,
        padding: SPACING.sm, fontSize: 13, color: P.text,
        minHeight: 54, textAlignVertical: 'top',
        marginBottom: SPACING.md,
    },

    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
        backgroundColor: P.success, borderRadius: 14,
        paddingVertical: 15,
    },
    submitBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});