// ──────────────────────────────────────────────────────────
// RecuScreen — Module 8
// Reçu de paiement (visualisation + partage texte)
// ──────────────────────────────────────────────────────────
import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatCurrency, formatDate } from '@utils/formatters';
import { TYPE_PAIEMENT_META, MODE_PAIEMENT_META, TypePaiement, ModePaiement } from '@constants/paiementConstants';
import { useAppStore } from '@store/useAppStore';

// ── Palette ──────────────────────────────────────────────
const P = {
    bg:      '#16123A',
    pageBg:  '#F5F4FB',
    surface: '#FFFFFF',
    text:    '#1A1033',
    sub:     '#7C6FA8',
    primary: '#6C3EB8',
    gold:    '#D4AF37',
    goldBg:  'rgba(212,175,55,0.10)',
    border:  'rgba(108,62,184,0.10)',
};

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Recu'>;

// ── Ligne d'info ─────────────────────────────────────────
const RecuRow = ({ label, value, bold, accent }: {
    label: string; value: string; bold?: boolean; accent?: boolean;
}) => (
    <View style={recuStyles.recuRow}>
        <Text style={recuStyles.recuLabel}>{label}</Text>
        <Text style={[
            recuStyles.recuValue,
            bold   && { fontWeight: '700' },
            accent && { color: '#059669', fontWeight: '700' },
        ]}>
            {value}
        </Text>
    </View>
);

// ──────────────────────────────────────────────────────────
export function RecuScreen() {
    const navigation = useNavigation<Nav>();
    const route      = useRoute<Route>();
    const { profile } = useAppStore();

    const {
        amount, typePaiement, modePaiement, date,
        notes, clientName, commandeNumero,
        totalAmount, paidAmount, remaining,
    } = route.params;

    const typeMeta = TYPE_PAIEMENT_META[typePaiement as TypePaiement] ?? TYPE_PAIEMENT_META.acompte;
    const modeMeta = MODE_PAIEMENT_META[modePaiement as ModePaiement] ?? MODE_PAIEMENT_META.cash;
    const dateObj  = new Date(date);

    const atelierName = (profile as any)?.nomAtelier ?? (profile as any)?.nom ?? 'Mon Atelier';

    // ── Génère le texte du reçu ───────────────────────────
    const buildTextReceipt = () => {
        const line = '─'.repeat(38);
        return [
            '',
            `         ${atelierName.toUpperCase()}`,
            `            REÇU DE PAIEMENT`,
            line,
            commandeNumero ? `  N° Commande  : ${commandeNumero}` : '',
            `  Client       : ${clientName}`,
            line,
            `  Montant payé : ${formatCurrency(amount)}`,
            `  Type         : ${typeMeta.label}`,
            `  Mode         : ${modeMeta.label}`,
            `  Date         : ${formatDate(dateObj)}`,
            notes ? `  Notes        : ${notes}` : '',
            line,
            `  Prix total   : ${formatCurrency(totalAmount)}`,
            `  Déjà payé    : ${formatCurrency(paidAmount)}`,
            `  Solde restant: ${formatCurrency(remaining)}`,
            line,
            '   Merci pour votre confiance !',
            '',
        ].filter(l => l !== undefined).join('\n');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: buildTextReceipt(),
                title:   `Reçu paiement — ${clientName}`,
            });
        } catch (e) { /* ignored */ }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reçu de paiement</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Feather name="share-2" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Carte reçu */}
                <View style={styles.receipt}>
                    {/* En-tête atelier */}
                    <View style={styles.receiptHeader}>
                        <View style={styles.receiptLogoWrap}>
                            <Feather name="scissors" size={22} color={P.primary} />
                        </View>
                        <Text style={styles.atelierName}>{atelierName}</Text>
                        <Text style={styles.receiptTitle}>REÇU DE PAIEMENT</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Informations commande */}
                    {commandeNumero && (
                        <RecuRow label="N° commande" value={commandeNumero} bold />
                    )}
                    <RecuRow label="Client" value={clientName} bold />

                    <View style={styles.dividerLight} />

                    {/* Paiement */}
                    <View style={styles.amountBlock}>
                        <Text style={styles.amountLabel}>Montant encaissé</Text>
                        <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
                    </View>

                    {/* Badge type */}
                    <View style={[styles.typeBadge, { backgroundColor: typeMeta.bgColor }]}>
                        <Feather name={typeMeta.icon} size={13} color={typeMeta.color} style={{ marginRight: 6 }} />
                        <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>
                            {typeMeta.label}
                        </Text>
                    </View>

                    <View style={styles.dividerLight} />

                    <RecuRow label="Mode de paiement" value={modeMeta.label} />
                    <RecuRow label="Date" value={formatDate(dateObj)} />
                    {notes ? <RecuRow label="Notes" value={notes} /> : null}

                    <View style={styles.divider} />

                    {/* Récapitulatif solde */}
                    <RecuRow label="Prix total"    value={formatCurrency(totalAmount)} />
                    <RecuRow label="Total encaissé" value={formatCurrency(paidAmount)} />
                    <RecuRow
                        label="Solde restant"
                        value={formatCurrency(remaining)}
                        bold
                        accent={remaining === 0}
                    />

                    <View style={styles.dividerLight} />
                    <Text style={styles.thankYou}>Merci pour votre confiance 🙏</Text>
                </View>

                {/* Bouton partager */}
                <TouchableOpacity style={styles.shareFullBtn} onPress={handleShare} activeOpacity={0.85}>
                    <Feather name="share-2" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.shareFullBtnText}>Partager le reçu</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles reçu ───────────────────────────────────────────
const recuStyles = StyleSheet.create({
    recuRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 6,
    },
    recuLabel: { fontSize: 13, color: P.sub, flex: 1 },
    recuValue: { fontSize: 13, color: P.text, textAlign: 'right', flex: 1 },
});

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: P.pageBg },
    header: {
        backgroundColor: P.bg,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 12 },
    shareBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },

    receipt: {
        backgroundColor: P.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 0.5,
        borderColor: P.borderHard,
    },
    receiptHeader: { alignItems: 'center', paddingBottom: 16 },
    receiptLogoWrap: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: P.goldBg,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    atelierName:  { fontSize: 16, fontWeight: '800', color: P.text, letterSpacing: 0.5 },
    receiptTitle: { fontSize: 11, color: P.sub, letterSpacing: 1.5, marginTop: 2, textTransform: 'uppercase' },

    divider:      { height: 1, backgroundColor: P.border, marginVertical: 12 },
    dividerLight: { height: 1, backgroundColor: 'rgba(108,62,184,0.05)', marginVertical: 10 },

    amountBlock:  { alignItems: 'center', paddingVertical: 12 },
    amountLabel:  { fontSize: 12, color: P.sub, marginBottom: 4 },
    amountValue:  { fontSize: 32, fontWeight: '800', color: P.primary },

    typeBadge: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, marginBottom: 8,
    },
    typeBadgeText: { fontSize: 12, fontWeight: '600' },

    thankYou: {
        textAlign: 'center', fontSize: 13, color: P.sub,
        fontStyle: 'italic', marginTop: 4,
    },

    shareFullBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: P.primary,
        borderRadius: 12, paddingVertical: 14,
        marginTop: 16,
    },
    shareFullBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
