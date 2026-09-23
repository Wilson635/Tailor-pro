// ==========================================
// REÇU DE PAIEMENT — TailorPro
// Papier ivoire, or, marine — image + PDF
// ==========================================

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
import { AtelierIcon } from '@/src/components/ui';
import { shareHtmlAsPdf, shareLocalFile, escapeHtml } from '@utils/exportFiles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Recu'>;

const IVORY = '#FBF8F2';
const NAVY = '#16123A';
const GOLD = '#D4AF37';
const INK = '#2A2438';
const MUTED = '#8A7F9A';
const HAIR = 'rgba(212,175,55,0.35)';
const HAIR_SOFT = 'rgba(22,18,58,0.08)';

const RecuRow = ({ label, value, emphasis }: {
    label: string; value: string; emphasis?: 'gold' | 'navy' | 'ok';
}) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, gap: 16 }}>
        <Text style={{ fontSize: 12, color: MUTED, flex: 1, fontFamily: 'PlusJakartaSans_500Medium', letterSpacing: 0.2 }}>
            {label}
        </Text>
        <Text style={{
            fontSize: 13,
            color: emphasis === 'gold' ? GOLD : emphasis === 'ok' ? '#1B7A4E' : INK,
            textAlign: 'right',
            flex: 1.2,
            fontFamily: emphasis ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
        }}>
            {value}
        </Text>
    </View>
);

export function RecuScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<Route>();
    const insets = useSafeAreaInsets();
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
    const dateObj = new Date(date);
    const settled = remaining <= 0;

    const atelierName = profile?.atelier_name?.trim() || profile?.display_name?.trim() || 'TailorPro';
    const atelierCity = profile?.city?.trim();
    const atelierPhone = profile?.whatsapp?.trim() || profile?.phone?.trim();
    const avatarUrl = profile?.avatar_url;
    const recuRef = `TP-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}-${String(Math.abs(amount).toFixed(0)).slice(-4).padStart(4, '0')}`;
    const fileBase = `recu_${(commandeNumero || clientName || 'paiement').replace(/[^\w-]+/g, '_')}_${Date.now()}`;

    const buildHtml = () => `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; background: #F5F4FB; margin: 0; color: ${INK}; }
  .sheet { background: ${IVORY}; max-width: 440px; margin: 0 auto; padding: 0 0 28px; border: 1px solid ${HAIR}; }
  .goldbar { height: 4px; background: linear-gradient(90deg, ${NAVY}, ${GOLD}, ${NAVY}); }
  .pad { padding: 28px 32px 0; }
  .center { text-align: center; }
  .mark { width: 56px; height: 56px; border-radius: 18px; margin: 0 auto 12px; background: ${NAVY}; color: ${GOLD}; line-height: 56px; font-size: 11px; letter-spacing: 1px; }
  .atelier { font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin: 0; }
  .meta { color: ${MUTED}; font-size: 12px; margin: 4px 0 0; }
  .kicker { font-size: 10px; letter-spacing: 2.4px; text-transform: uppercase; color: ${GOLD}; font-weight: 700; margin: 18px 0 4px; }
  .ref { font-size: 11px; color: ${MUTED}; letter-spacing: 0.4px; }
  .rule { height: 1px; background: ${HAIR}; margin: 18px 32px; }
  .rule-soft { height: 1px; background: ${HAIR_SOFT}; margin: 10px 32px; }
  .block { padding: 0 32px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; gap: 16px; }
  .lab { color: ${MUTED}; }
  .val { font-weight: 600; text-align: right; }
  .amt-lab { font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: ${MUTED}; }
  .amt { font-size: 34px; font-weight: 800; color: ${NAVY}; letter-spacing: -1px; margin: 6px 0 10px; }
  .pill { display: inline-block; border: 1px solid ${HAIR}; color: ${GOLD}; padding: 5px 12px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; }
  .sold { color: #1B7A4E; border-color: rgba(27,122,78,0.3); }
  .thanks { text-align: center; color: ${MUTED}; font-size: 12px; font-style: italic; margin: 8px 32px 0; }
  .foot { text-align: center; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; color: ${GOLD}; margin-top: 16px; }
</style></head>
<body>
  <div class="sheet">
    <div class="goldbar"></div>
    <div class="pad center">
      <div class="mark">TP</div>
      <p class="atelier">${escapeHtml(atelierName)}</p>
      ${atelierCity ? `<p class="meta">${escapeHtml(atelierCity)}</p>` : ''}
      ${atelierPhone ? `<p class="meta">${escapeHtml(atelierPhone)}</p>` : ''}
      <div class="kicker">Reçu de paiement</div>
      <div class="ref">${escapeHtml(recuRef)}</div>
    </div>
    <div class="rule"></div>
    <div class="block">
      ${commandeNumero ? `<div class="row"><span class="lab">Commande</span><span class="val">${escapeHtml(commandeNumero)}</span></div>` : ''}
      <div class="row"><span class="lab">Client</span><span class="val">${escapeHtml(clientName)}</span></div>
    </div>
    <div class="rule-soft"></div>
    <div class="block center" style="padding-top:8px;padding-bottom:8px">
      <div class="amt-lab">Montant encaissé</div>
      <div class="amt">${escapeHtml(formatCurrency(amount))}</div>
      <span class="pill">${escapeHtml(typeMeta.label)}</span>
      ${settled ? '<span class="pill sold" style="margin-left:6px">Soldé</span>' : ''}
    </div>
    <div class="rule-soft"></div>
    <div class="block">
      <div class="row"><span class="lab">Règlement</span><span class="val">${escapeHtml(modeMeta.label)}</span></div>
      <div class="row"><span class="lab">Date</span><span class="val">${escapeHtml(formatDate(dateObj))}</span></div>
      ${notes ? `<div class="row"><span class="lab">Note</span><span class="val">${escapeHtml(notes)}</span></div>` : ''}
    </div>
    <div class="rule"></div>
    <div class="block">
      <div class="row"><span class="lab">Prix total</span><span class="val">${escapeHtml(formatCurrency(totalAmount))}</span></div>
      <div class="row"><span class="lab">Déjà encaissé</span><span class="val">${escapeHtml(formatCurrency(paidAmount))}</span></div>
      <div class="row"><span class="lab">Reste dû</span><span class="val" style="color:${settled ? '#1B7A4E' : GOLD}">${escapeHtml(formatCurrency(remaining))}</span></div>
    </div>
    <p class="thanks">Merci pour votre confiance.</p>
    <div class="foot">TailorPro</div>
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
                pixelRatio: 2,
            });
            await shareLocalFile(uri, 'image/png', `${fileBase}.png`);
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
                contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 36 }}
                showsVerticalScrollIndicator={false}
            >
                <View ref={shotRef} collapsable={false} style={styles.receipt}>
                    <View style={styles.goldBar} />

                    <View style={styles.receiptInner}>
                        <View style={styles.receiptHeader}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.logoImg} />
                            ) : (
                                <View style={styles.logoMark}>
                                    <AtelierIcon size={22} color={GOLD} />
                                </View>
                            )}
                            <Text style={styles.atelierName}>{atelierName}</Text>
                            {!!atelierCity && <Text style={styles.atelierMeta}>{atelierCity}</Text>}
                            {!!atelierPhone && <Text style={styles.atelierMeta}>{atelierPhone}</Text>}
                            <Text style={styles.receiptKicker}>Reçu de paiement</Text>
                            <Text style={styles.receiptRef}>{recuRef}</Text>
                        </View>

                        <View style={styles.hairGold} />

                        {commandeNumero ? <RecuRow label="Commande" value={commandeNumero} emphasis="navy" /> : null}
                        <RecuRow label="Client" value={clientName} emphasis="navy" />

                        <View style={styles.hairSoft} />

                        <View style={styles.amountBlock}>
                            <Text style={styles.amountLabel}>Montant encaissé</Text>
                            <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
                            <View style={styles.pills}>
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>{typeMeta.label}</Text>
                                </View>
                                {settled ? (
                                    <View style={[styles.pill, styles.pillOk]}>
                                        <Text style={[styles.pillText, { color: '#1B7A4E' }]}>Soldé</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.hairSoft} />

                        <RecuRow label="Règlement" value={modeMeta.label} />
                        <RecuRow label="Date" value={formatDate(dateObj)} />
                        {notes ? <RecuRow label="Note" value={notes} /> : null}

                        <View style={styles.hairGold} />

                        <RecuRow label="Prix total" value={formatCurrency(totalAmount)} />
                        <RecuRow label="Déjà encaissé" value={formatCurrency(paidAmount)} />
                        <RecuRow
                            label="Reste dû"
                            value={formatCurrency(remaining)}
                            emphasis={settled ? 'ok' : 'gold'}
                        />

                        <Text style={styles.thankYou}>Merci pour votre confiance.</Text>
                        <Text style={styles.brandFoot}>TailorPro</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionPrimary}
                        onPress={shareImage}
                        disabled={!!busy}
                        activeOpacity={0.88}
                    >
                        {busy === 'image'
                            ? <ActivityIndicator color={GOLD} />
                            : <Feather name="image" size={16} color={GOLD} />}
                        <Text style={styles.actionPrimaryText}>Partager en image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionGhost}
                        onPress={sharePdf}
                        disabled={!!busy}
                        activeOpacity={0.88}
                    >
                        {busy === 'pdf'
                            ? <ActivityIndicator color={C.text} />
                            : <Feather name="file-text" size={16} color={C.text} />}
                        <Text style={styles.actionGhostText}>Exporter en PDF</Text>
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
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 12,
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
        backgroundColor: IVORY,
        borderRadius: 20,
        overflow: 'hidden' as const,
        borderWidth: 0.5,
        borderColor: HAIR,
    },
    goldBar: { height: 4, backgroundColor: GOLD },
    receiptInner: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 22 },
    receiptHeader: { alignItems: 'center' as const, paddingBottom: 4 },
    logoMark: {
        width: 56, height: 56, borderRadius: 18,
        backgroundColor: NAVY,
        justifyContent: 'center' as const, alignItems: 'center' as const,
        marginBottom: 12,
    },
    logoImg: { width: 56, height: 56, borderRadius: 18, marginBottom: 12 },
    atelierName: {
        fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: INK, letterSpacing: -0.3, textAlign: 'center' as const,
    },
    atelierMeta: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: MUTED, marginTop: 3 },
    receiptKicker: {
        fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: GOLD,
        letterSpacing: 2.2, textTransform: 'uppercase' as const, marginTop: 16,
    },
    receiptRef: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: MUTED, marginTop: 4, letterSpacing: 0.4 },
    hairGold: { height: 1, backgroundColor: HAIR, marginVertical: 14 },
    hairSoft: { height: 1, backgroundColor: HAIR_SOFT, marginVertical: 10 },
    amountBlock: { alignItems: 'center' as const, paddingVertical: 8 },
    amountLabel: {
        fontSize: 10, color: MUTED, letterSpacing: 1.6, textTransform: 'uppercase' as const,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    amountValue: {
        fontSize: 34, fontFamily: 'PlusJakartaSans_800ExtraBold', color: NAVY, letterSpacing: -1, marginTop: 4,
    },
    pills: { flexDirection: 'row' as const, gap: 8, marginTop: 12 },
    pill: {
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
        borderWidth: 1, borderColor: HAIR,
    },
    pillOk: { borderColor: 'rgba(27,122,78,0.28)' },
    pillText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: GOLD, letterSpacing: 1, textTransform: 'uppercase' as const },
    thankYou: {
        textAlign: 'center' as const, fontSize: 13, color: MUTED, fontStyle: 'italic' as const,
        fontFamily: 'PlusJakartaSans_500Medium', marginTop: 16,
    },
    brandFoot: {
        textAlign: 'center' as const, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold',
        color: GOLD, letterSpacing: 2, textTransform: 'uppercase' as const, marginTop: 10,
    },
    actions: { marginTop: 18, gap: 10 },
    actionPrimary: {
        height: 52, borderRadius: 16, backgroundColor: NAVY,
        flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    },
    actionPrimaryText: { color: GOLD, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
    actionGhost: {
        height: 52, borderRadius: 16, backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard,
        flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8,
    },
    actionGhostText: { color: P.text, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
