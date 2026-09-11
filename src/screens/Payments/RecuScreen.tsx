// ──────────────────────────────────────────────────────────
// RecuScreen — Reçu de paiement (partage image + PDF)
// ──────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatCurrency, formatDate } from '@utils/formatters';
import { TYPE_PAIEMENT_META, MODE_PAIEMENT_META, TypePaiement, ModePaiement } from '@constants/paiementConstants';
import { useAppStore } from '@store/useAppStore';
import { useThemedStyles, type Palette } from '@/src/theme';
import { showAlert } from '@/src/context/DialogContext';
import { shareHtmlAsPdf, shareLocalFile, escapeHtml } from '@utils/exportFiles';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Recu'>;

const PAPER = {
    bg: '#FFFFFF',
    text: '#1A1033',
    sub: '#7C6FA8',
    primary: '#6C3EB8',
    gold: '#D4AF37',
    goldBg: 'rgba(212,175,55,0.12)',
    line: 'rgba(108,62,184,0.14)',
    lineSoft: 'rgba(108,62,184,0.07)',
};

const RecuRow = ({ label, value, bold, accent }: {
    label: string; value: string; bold?: boolean; accent?: boolean;
}) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
        <Text style={{ fontSize: 13, color: PAPER.sub, flex: 1, fontFamily: 'PlusJakartaSans_500Medium' }}>{label}</Text>
        <Text style={{
            fontSize: 13, color: accent ? '#059669' : PAPER.text, textAlign: 'right', flex: 1,
            fontFamily: bold || accent ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
        }}>
            {value}
        </Text>
    </View>
);

export function RecuScreen() {
    const navigation = useNavigation<Nav>();
    const route      = useRoute<Route>();
    const insets     = useSafeAreaInsets();
    const { colors: C, styles } = useThemedStyles(makeStyles);
    const { profile } = useAppStore();
    const shotRef = useRef<View>(null);
    const [busy, setBusy] = useState<'image' | 'pdf' | null>(null);

    const {
        amount, typePaiement, modePaiement, date,
        notes, clientName, commandeNumero,
        totalAmount, paidAmount, remaining,
    } = route.params;

    const typeMeta = TYPE_PAIEMENT_META[typePaiement as TypePaiement] ?? TYPE_PAIEMENT_META.acompte;
    const modeMeta = MODE_PAIEMENT_META[modePaiement as ModePaiement] ?? MODE_PAIEMENT_META.cash;
    const dateObj  = new Date(date);

    const atelierName = profile?.atelier_name?.trim() || profile?.display_name?.trim() || 'TailorPro';
    const atelierCity = profile?.city?.trim();
    const atelierPhone = profile?.whatsapp?.trim() || profile?.phone?.trim();
    const avatarUrl = profile?.avatar_url;
    const fileBase = `recu_${(commandeNumero || clientName || 'paiement').replace(/[^\w-]+/g, '_')}_${Date.now()}`;

    const buildHtml = () => `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: sans-serif; background: #F5F4FB; padding: 24px; color: #1A1033; }
  .card { background: #fff; border-radius: 16px; padding: 28px; max-width: 420px; margin: 0 auto; }
  .center { text-align: center; }
  .name { font-size: 20px; font-weight: 800; margin: 8px 0 2px; }
  .kicker { font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: #7C6FA8; }
  .muted { color: #7C6FA8; font-size: 12px; }
  .hr { height: 1px; background: rgba(108,62,184,0.14); margin: 14px 0; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .lab { color: #7C6FA8; }
  .amt { font-size: 32px; font-weight: 800; color: #6C3EB8; }
  .badge { display: inline-block; background: ${typeMeta.bgColor}; color: ${typeMeta.color}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .gold { color: #D4AF37; }
</style></head>
<body>
  <div class="card">
    <div class="center">
      <div class="kicker">Atelier</div>
      <div class="name">${escapeHtml(atelierName)}</div>
      ${atelierCity ? `<div class="muted">${escapeHtml(atelierCity)}</div>` : ''}
      ${atelierPhone ? `<div class="muted">${escapeHtml(atelierPhone)}</div>` : ''}
      <div class="kicker" style="margin-top:10px">Reçu de paiement</div>
    </div>
    <div class="hr"></div>
    ${commandeNumero ? `<div class="row"><span class="lab">N° commande</span><strong>${escapeHtml(commandeNumero)}</strong></div>` : ''}
    <div class="row"><span class="lab">Client</span><strong>${escapeHtml(clientName)}</strong></div>
    <div class="hr"></div>
    <div class="center">
      <div class="muted">Montant encaissé</div>
      <div class="amt">${escapeHtml(formatCurrency(amount))}</div>
      <div style="margin-top:10px"><span class="badge">${escapeHtml(typeMeta.label)}</span></div>
    </div>
    <div class="hr"></div>
    <div class="row"><span class="lab">Mode</span><span>${escapeHtml(modeMeta.label)}</span></div>
    <div class="row"><span class="lab">Date</span><span>${escapeHtml(formatDate(dateObj))}</span></div>
    ${notes ? `<div class="row"><span class="lab">Notes</span><span>${escapeHtml(notes)}</span></div>` : ''}
    <div class="hr"></div>
    <div class="row"><span class="lab">Prix total</span><span>${escapeHtml(formatCurrency(totalAmount))}</span></div>
    <div class="row"><span class="lab">Total encaissé</span><span>${escapeHtml(formatCurrency(paidAmount))}</span></div>
    <div class="row"><span class="lab">Solde restant</span><strong>${escapeHtml(formatCurrency(remaining))}</strong></div>
    <p class="center muted" style="margin-top:18px">Merci pour votre confiance</p>
  </div>
</body></html>`;

    const shareImage = async () => {
        if (busy || !shotRef.current) return;
        setBusy('image');
        try {
            const uri = await captureRef(shotRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });
            const destName = `${fileBase}.png`;
            await shareLocalFile(uri, 'image/png', destName);
        } catch {
            showAlert('Erreur', 'Impossible de générer l’image du reçu.');
        } finally {
            setBusy(null);
        }
    };

    const sharePdf = async () => {
        if (busy) return;
        setBusy('pdf');
        try {
            await shareHtmlAsPdf(`${fileBase}.pdf`, buildHtml());
        } finally {
            setBusy(null);
        }
    };

    return (
        <View style={[styles.safe, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Reçu</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    ref={shotRef}
                    collapsable={false}
                    style={styles.receipt}
                >
                    <View style={styles.receiptHeader}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.logoImg} />
                        ) : (
                            <View style={styles.receiptLogoWrap}>
                                <Feather name="scissors" size={22} color={PAPER.gold} />
                            </View>
                        )}
                        <Text style={styles.atelierName}>{atelierName}</Text>
                        {!!atelierCity && <Text style={styles.atelierMeta}>{atelierCity}</Text>}
                        {!!atelierPhone && <Text style={styles.atelierMeta}>{atelierPhone}</Text>}
                        <Text style={styles.receiptTitle}>REÇU DE PAIEMENT</Text>
                    </View>

                    <View style={styles.divider} />

                    {commandeNumero ? <RecuRow label="N° commande" value={commandeNumero} bold /> : null}
                    <RecuRow label="Client" value={clientName} bold />

                    <View style={styles.dividerLight} />

                    <View style={styles.amountBlock}>
                        <Text style={styles.amountLabel}>Montant encaissé</Text>
                        <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
                    </View>

                    <View style={[styles.typeBadge, { backgroundColor: typeMeta.bgColor }]}>
                        <Feather name={typeMeta.icon} size={13} color={typeMeta.color} />
                        <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
                    </View>

                    <View style={styles.dividerLight} />

                    <RecuRow label="Mode de paiement" value={modeMeta.label} />
                    <RecuRow label="Date" value={formatDate(dateObj)} />
                    {notes ? <RecuRow label="Notes" value={notes} /> : null}

                    <View style={styles.divider} />

                    <RecuRow label="Prix total" value={formatCurrency(totalAmount)} />
                    <RecuRow label="Total encaissé" value={formatCurrency(paidAmount)} />
                    <RecuRow
                        label="Solde restant"
                        value={formatCurrency(remaining)}
                        bold
                        accent={remaining === 0}
                    />

                    <View style={styles.dividerLight} />
                    <Text style={styles.thankYou}>Merci pour votre confiance</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={shareImage}
                        disabled={!!busy}
                        activeOpacity={0.85}
                    >
                        {busy === 'image'
                            ? <ActivityIndicator color={C.gold} />
                            : <Feather name="image" size={16} color={C.gold} />}
                        <Text style={styles.actionBtnText}>Partager en image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={sharePdf}
                        disabled={!!busy}
                        activeOpacity={0.85}
                    >
                        {busy === 'pdf'
                            ? <ActivityIndicator color={C.gold} />
                            : <Feather name="file-text" size={16} color={C.gold} />}
                        <Text style={styles.actionBtnText}>Partager en PDF</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const makeStyles = (P: Palette) => ({
    safe: { flex: 1, backgroundColor: P.pageBg },
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-start' as const,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard,
        alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },

    receipt: {
        backgroundColor: PAPER.bg,
        borderRadius: 16,
        padding: 20,
        borderWidth: 0.5,
        borderColor: P.borderHard,
    },
    receiptHeader: { alignItems: 'center' as const, paddingBottom: 16 },
    receiptLogoWrap: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: PAPER.goldBg,
        justifyContent: 'center' as const, alignItems: 'center' as const,
        marginBottom: 8,
        borderWidth: 0.5, borderColor: PAPER.gold,
    },
    logoImg: { width: 56, height: 56, borderRadius: 16, marginBottom: 8 },
    atelierName: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: PAPER.text, letterSpacing: 0.3 },
    atelierMeta: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: PAPER.sub, marginTop: 2 },
    receiptTitle: {
        fontSize: 11, color: PAPER.sub, letterSpacing: 1.5, marginTop: 8,
        textTransform: 'uppercase' as const, fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    divider: { height: 1, backgroundColor: PAPER.line, marginVertical: 12 },
    dividerLight: { height: 1, backgroundColor: PAPER.lineSoft, marginVertical: 10 },
    amountBlock: { alignItems: 'center' as const, paddingVertical: 12 },
    amountLabel: { fontSize: 12, color: PAPER.sub, marginBottom: 4, fontFamily: 'PlusJakartaSans_500Medium' },
    amountValue: { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', color: PAPER.primary },
    typeBadge: {
        flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'center' as const,
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8, gap: 6,
    },
    typeBadgeText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' },
    thankYou: {
        textAlign: 'center' as const, fontSize: 13, color: PAPER.sub,
        fontFamily: 'PlusJakartaSans_500Medium', marginTop: 4,
    },
    actions: { marginTop: 16, gap: 10 },
    actionBtn: {
        flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
        backgroundColor: P.bg, borderRadius: 12, paddingVertical: 14, gap: 8,
        borderWidth: 1, borderColor: P.goldRim,
    },
    actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});
