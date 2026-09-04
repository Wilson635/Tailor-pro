// ==========================================
// PARAMÈTRES GÉNÉRAUX — Module 0 — TailorPro
// Devise · Langue · Unité de mesure
// ==========================================

import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { useProfile } from '@hooks/useProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// ── PALETTE ──────────────────────────────────────────────────────
const P = {
    bg:         '#16123A',
    primary:    '#6C3EB8',
    primaryBg:  'rgba(108,62,184,0.08)',
    primaryMid: 'rgba(108,62,184,0.15)',
    pageBg:     '#F5F4FB',
    surface:    '#FFFFFF',
    text:       '#1A1033',
    sub:        '#7C6FA8',
    muted:      'rgba(124,111,168,0.55)',
    border:     'rgba(108,62,184,0.10)',
    borderHard: 'rgba(108,62,184,0.18)',
    gold:       '#D4AF37',
    goldBg:     'rgba(212,175,55,0.10)',
    goldRim:    'rgba(212,175,55,0.28)',
    success:    '#16A34A',
    successBg:  'rgba(22,163,74,0.10)',
};

// ── OPTIONS ───────────────────────────────────────────────────────
type Devise = 'XAF' | 'EUR' | 'USD' | 'GBP' | 'GHS' | 'NGN' | 'KES';
type Langue = 'fr' | 'en';
type UniteMesure = 'cm' | 'pouces';

const DEVISES: { value: Devise; label: string; symbol: string; flag: string }[] = [
    { value: 'XAF', label: 'Franc CFA (FCFA)',   symbol: 'FCFA', flag: '🇨🇲' },
    { value: 'EUR', label: 'Euro',                symbol: '€',    flag: '🇪🇺' },
    { value: 'USD', label: 'Dollar américain',    symbol: '$',    flag: '🇺🇸' },
    { value: 'GBP', label: 'Livre sterling',      symbol: '£',    flag: '🇬🇧' },
    { value: 'GHS', label: 'Cedi ghanéen',        symbol: '₵',    flag: '🇬🇭' },
    { value: 'NGN', label: 'Naira nigérian',      symbol: '₦',    flag: '🇳🇬' },
    { value: 'KES', label: 'Shilling kényan',     symbol: 'KSh',  flag: '🇰🇪' },
];

const LANGUES: { value: Langue; label: string; sub: string; flag: string }[] = [
    { value: 'fr', label: 'Français',  sub: 'Interface et notifications en français', flag: '🇫🇷' },
    { value: 'en', label: 'English',   sub: 'Interface in English (coming soon)',     flag: '🇬🇧' },
];

// ── SOUS-COMPOSANTS ───────────────────────────────────────────────
const SectionTitle = ({ title }: { title: string }) => (
    <Text style={ss.sectionTitle}>{title}</Text>
);

const Divider = () => <View style={ss.divider} />;

const OptionRow = <T extends string>({
    value, current, onSelect, flag, label, sub, disabled,
}: {
    value: T; current: T; onSelect: (v: T) => void;
    flag: string; label: string; sub?: string; disabled?: boolean;
}) => {
    const selected = value === current;
    return (
        <TouchableOpacity
            style={[ss.optionRow, selected && ss.optionRowActive]}
            onPress={() => !disabled && onSelect(value)}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <Text style={ss.optionFlag}>{flag}</Text>
            <View style={ss.optionContent}>
                <Text style={[ss.optionLabel, disabled && { color: P.muted }]}>{label}</Text>
                {sub && <Text style={[ss.optionSub, disabled && { color: P.muted }]}>{sub}</Text>}
            </View>
            {disabled
                ? <View style={ss.comingSoon}><Text style={ss.comingSoonText}>Bientôt</Text></View>
                : (
                    <View style={[ss.radio, selected && ss.radioActive]}>
                        {selected && <View style={ss.radioInner} />}
                    </View>
                )
            }
        </TouchableOpacity>
    );
};

const ss = StyleSheet.create({
    sectionTitle: { fontSize: 10, fontWeight: '700', color: P.sub, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10, paddingHorizontal: 2 },
    divider:      { height: 0.5, backgroundColor: P.border, marginLeft: 56 },
    optionRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, backgroundColor: P.surface },
    optionRowActive: { backgroundColor: P.primaryBg },
    optionFlag:   { fontSize: 22, width: 32, textAlign: 'center' },
    optionContent:{ flex: 1 },
    optionLabel:  { fontSize: 14, fontWeight: '600', color: P.text },
    optionSub:    { fontSize: 12, color: P.sub, marginTop: 2 },
    radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: P.muted, alignItems: 'center', justifyContent: 'center' },
    radioActive:  { borderColor: P.primary },
    radioInner:   { width: 10, height: 10, borderRadius: 5, backgroundColor: P.primary },
    comingSoon:   { backgroundColor: P.goldBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: P.goldRim },
    comingSoonText:{ fontSize: 10, fontWeight: '700', color: P.gold },
});

// ── ÉCRAN PRINCIPAL ───────────────────────────────────────────────
export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { profile, updateProfile } = useProfile();

    const [devise, setDevise]           = useState<Devise>('XAF');
    const [langue, setLangue]           = useState<Langue>('fr');
    const [uniteMesure, setUniteMesure] = useState<UniteMesure>('cm');
    const [isSaving, setIsSaving]       = useState(false);
    const [isDirty, setIsDirty]         = useState(false);

    // Init depuis profil
    useEffect(() => {
        if (!profile) return;
        setDevise((profile.devise as Devise) ?? 'XAF');
        setLangue((profile.langue as Langue) ?? 'fr');
        setUniteMesure((profile.unite_mesure as UniteMesure) ?? 'cm');
    }, [profile]);

    const markDirty = () => setIsDirty(true);

    const handleDevisePick = (v: Devise) => { setDevise(v); markDirty(); };
    const handleLanguePick = (v: Langue) => { if (v === 'en') return; setLangue(v); markDirty(); };
    const handleUnitePick  = (v: UniteMesure) => { setUniteMesure(v); markDirty(); };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await updateProfile({ devise, langue, unite_mesure: uniteMesure });
            if (error) throw error;
            setIsDirty(false);
            Alert.alert('Enregistré ✓', 'Vos paramètres ont été mis à jour.');
        } catch (e: any) {
            Alert.alert('Erreur', e.message ?? 'Impossible de sauvegarder.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentDevise = DEVISES.find(d => d.value === devise);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres généraux</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── DEVISE ── */}
                <SectionTitle title="Devise" />
                <View style={styles.card}>
                    {DEVISES.map((d, i) => (
                        <React.Fragment key={d.value}>
                            <OptionRow
                                value={d.value} current={devise} onSelect={handleDevisePick}
                                flag={d.flag} label={d.label} sub={d.symbol}
                            />
                            {i < DEVISES.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </View>

                {/* ── LANGUE ── */}
                <SectionTitle title="Langue de l'interface" />
                <View style={styles.card}>
                    {LANGUES.map((l, i) => (
                        <React.Fragment key={l.value}>
                            <OptionRow
                                value={l.value} current={langue} onSelect={handleLanguePick}
                                flag={l.flag} label={l.label} sub={l.sub}
                                disabled={l.value === 'en'}
                            />
                            {i < LANGUES.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </View>

                {/* ── UNITÉ DE MESURE ── */}
                <SectionTitle title="Unité de mesure" />
                <View style={styles.card}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleIconWrap}>
                            <Ionicons name="resize-outline" size={18} color={P.gold} />
                        </View>
                        <View style={styles.toggleContent}>
                            <Text style={styles.toggleLabel}>Centimètres (cm)</Text>
                            <Text style={styles.toggleSub}>
                                {uniteMesure === 'cm' ? '✓ Actif — mesures en cm' : 'Mesures en pouces (in)'}
                            </Text>
                        </View>
                        <Switch
                            value={uniteMesure === 'cm'}
                            onValueChange={v => handleUnitePick(v ? 'cm' : 'pouces')}
                            trackColor={{ false: P.primary, true: P.gold }}
                            thumbColor="#fff"
                        />
                    </View>
                    <Divider />
                    <View style={styles.toggleRow}>
                        <View style={[styles.toggleIconWrap, { backgroundColor: P.primaryBg }]}>
                            <Ionicons name="swap-horizontal-outline" size={18} color={P.primary} />
                        </View>
                        <View style={styles.toggleContent}>
                            <Text style={styles.toggleLabel}>Pouces (in)</Text>
                            <Text style={styles.toggleSub}>
                                {uniteMesure === 'pouces' ? '✓ Actif — mesures en pouces' : '1 pouce = 2.54 cm'}
                            </Text>
                        </View>
                        <Switch
                            value={uniteMesure === 'pouces'}
                            onValueChange={v => handleUnitePick(v ? 'pouces' : 'cm')}
                            trackColor={{ false: P.primaryBg, true: P.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* ── RÉCAP ── */}
                {currentDevise && (
                    <>
                        <SectionTitle title="Résumé" />
                        <View style={[styles.card, styles.summaryCard]}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>Devise</Text>
                                <Text style={styles.summaryVal}>{currentDevise.flag} {currentDevise.symbol} — {currentDevise.label}</Text>
                            </View>
                            <View style={[styles.sumDivider]} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>Langue</Text>
                                <Text style={styles.summaryVal}>{langue === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}</Text>
                            </View>
                            <View style={[styles.sumDivider]} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>Mesures</Text>
                                <Text style={styles.summaryVal}>{uniteMesure === 'cm' ? '📐 Centimètres (cm)' : '📐 Pouces (in)'}</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* ── BOUTON SAVE ── */}
                {isDirty && (
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.65 }]}
                        onPress={handleSave} disabled={isSaving}
                    >
                        {isSaving
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><Ionicons name="checkmark-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer les paramètres</Text></>
                        }
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: P.pageBg },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: P.pageBg, borderBottomWidth: 0.5, borderBottomColor: P.border },
    backBtn:     { width: 38, height: 38, borderRadius: 11, backgroundColor: P.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: P.borderHard },
    headerTitle: { fontSize: 16, fontWeight: '700', color: P.text },
    scroll:      { paddingHorizontal: 20, paddingTop: 8 },
    card:        { backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, overflow: 'hidden', marginBottom: 4 },

    toggleRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    toggleIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: P.goldBg, alignItems: 'center', justifyContent: 'center' },
    toggleContent:  { flex: 1 },
    toggleLabel:    { fontSize: 14, fontWeight: '600', color: P.text },
    toggleSub:      { fontSize: 12, color: P.sub, marginTop: 2 },

    summaryCard:  { padding: 16 },
    summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    summaryKey:   { fontSize: 12, fontWeight: '600', color: P.sub },
    summaryVal:   { fontSize: 13, fontWeight: '700', color: P.text },
    sumDivider:   { height: 0.5, backgroundColor: P.border },

    saveBtn:     { backgroundColor: '#6C3EB8', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
