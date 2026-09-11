// ==========================================
// PARAMÈTRES GÉNÉRAUX — TailorPro
// Apparence · Devise · Langue · Unité de mesure
// ==========================================

import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import { usePreferences } from '@/src/context/PreferencesContext';
import { useTheme, useThemedStyles, type Palette } from '@/src/theme';
import { DEVISES, type DeviseCode } from '@constants/currencies';
import { t } from '@/src/i18n';
import type { AppLangue, UniteMesure } from '@/src/preferences/runtime';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type Langue = AppLangue;

const LANGUES: { value: Langue; flag: string }[] = [
    { value: 'fr', flag: '🇫🇷' },
    { value: 'en', flag: '🇬🇧' },
];

const THEMES: { value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', icon: 'sunny-outline' },
    { value: 'dark', icon: 'moon-outline' },
    { value: 'system', icon: 'phone-portrait-outline' },
];

const OptionRow = <T extends string>({
    value, current, onSelect, flag, label, sub, icon, colors,
}: {
    value: T; current: T; onSelect: (v: T) => void;
    flag?: string; label: string; sub?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    colors: Palette;
}) => {
    const selected = value === current;
    return (
        <TouchableOpacity
            style={[ss.optionRow, { backgroundColor: selected ? colors.primaryBg : colors.surface }]}
            onPress={() => onSelect(value)}
            activeOpacity={0.7}
        >
            {flag ? (
                <Text style={ss.optionFlag}>{flag}</Text>
            ) : (
                <View style={[ss.iconWrap, { backgroundColor: colors.goldBg }]}>
                    <Ionicons name={icon ?? 'ellipse-outline'} size={18} color={colors.gold} />
                </View>
            )}
            <View style={ss.optionContent}>
                <Text style={[ss.optionLabel, { color: colors.text }]}>{label}</Text>
                {sub && <Text style={[ss.optionSub, { color: colors.sub }]}>{sub}</Text>}
            </View>
            <View style={[ss.radio, { borderColor: selected ? colors.primary : colors.muted }]}>
                {selected && <View style={[ss.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
        </TouchableOpacity>
    );
};

const ss = StyleSheet.create({
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    optionFlag: { fontSize: 22, width: 32, textAlign: 'center' },
    optionContent: { flex: 1 },
    optionLabel: { fontSize: 14, fontWeight: '600' },
    optionSub: { fontSize: 12, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { langue, devise, uniteMesure, setLangue, setDevise, setUniteMesure } = usePreferences();
    const { scheme, setScheme, isDark } = useTheme();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const [savingKey, setSavingKey] = React.useState<string | null>(null);

    const run = async (key: string, fn: () => Promise<void>) => {
        setSavingKey(key);
        try {
            await fn();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message ?? t('settings.saveError'));
        } finally {
            setSavingKey(null);
        }
    };

    const currentDevise = DEVISES.find(d => d.value === devise);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={P.pageBg} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={P.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 38 }}>
                    {savingKey ? <ActivityIndicator size="small" color={P.primary} /> : null}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
                <View style={styles.card}>
                    {THEMES.map((item, i) => (
                        <React.Fragment key={item.value}>
                            <OptionRow
                                value={item.value}
                                current={scheme}
                                onSelect={(v) => run('theme', () => setScheme(v))}
                                icon={item.icon}
                                label={t(`settings.theme${item.value === 'light' ? 'Light' : item.value === 'dark' ? 'Dark' : 'System'}`)}
                                sub={t(`settings.theme${item.value === 'light' ? 'Light' : item.value === 'dark' ? 'Dark' : 'System'}Sub`)}
                                colors={P}
                            />
                            {i < THEMES.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
                <View style={styles.card}>
                    {DEVISES.map((d, i) => (
                        <React.Fragment key={d.value}>
                            <OptionRow
                                value={d.value}
                                current={devise}
                                onSelect={(v) => run('devise', () => setDevise(v as DeviseCode))}
                                flag={d.flag}
                                label={langue === 'en' ? d.labelEn : d.labelFr}
                                sub={d.symbol}
                                colors={P}
                            />
                            {i < DEVISES.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                <View style={styles.card}>
                    {LANGUES.map((l, i) => (
                        <React.Fragment key={l.value}>
                            <OptionRow
                                value={l.value}
                                current={langue}
                                onSelect={(v) => run('langue', () => setLangue(v))}
                                flag={l.flag}
                                label={l.value === 'fr' ? t('settings.langFr') : t('settings.langEn')}
                                sub={l.value === 'fr' ? t('settings.languageFrSub') : t('settings.languageEnSub')}
                                colors={P}
                            />
                            {i < LANGUES.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.units')}</Text>
                <View style={styles.card}>
                    <View style={styles.toggleRow}>
                        <View style={[styles.toggleIconWrap, { backgroundColor: P.goldBg }]}>
                            <Ionicons name="resize-outline" size={18} color={P.gold} />
                        </View>
                        <View style={styles.toggleContent}>
                            <Text style={styles.toggleLabel}>{t('settings.cm')}</Text>
                            <Text style={styles.toggleSub}>
                                {uniteMesure === 'cm' ? `✓ ${t('settings.cmActive')}` : t('settings.inches')}
                            </Text>
                        </View>
                        <Switch
                            value={uniteMesure === 'cm'}
                            onValueChange={v => run('unite', () => setUniteMesure((v ? 'cm' : 'pouces') as UniteMesure))}
                            trackColor={{ false: P.primary, true: P.gold }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.toggleRow}>
                        <View style={[styles.toggleIconWrap, { backgroundColor: P.primaryBg }]}>
                            <Ionicons name="swap-horizontal-outline" size={18} color={P.primary} />
                        </View>
                        <View style={styles.toggleContent}>
                            <Text style={styles.toggleLabel}>{t('settings.inches')}</Text>
                            <Text style={styles.toggleSub}>
                                {uniteMesure === 'pouces' ? `✓ ${t('settings.inchesActive')}` : t('settings.inchHint')}
                            </Text>
                        </View>
                        <Switch
                            value={uniteMesure === 'pouces'}
                            onValueChange={v => run('unite', () => setUniteMesure((v ? 'pouces' : 'cm') as UniteMesure))}
                            trackColor={{ false: P.primaryBg, true: P.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {currentDevise && (
                    <>
                        <Text style={styles.sectionTitle}>{t('settings.summary')}</Text>
                        <View style={[styles.card, styles.summaryCard]}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.theme')}</Text>
                                <Text style={styles.summaryVal}>
                                    {scheme === 'dark' ? t('settings.themeDark') : scheme === 'system' ? t('settings.themeSystem') : t('settings.themeLight')}
                                </Text>
                            </View>
                            <View style={styles.sumDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.currency')}</Text>
                                <Text style={styles.summaryVal}>{currentDevise.flag} {currentDevise.symbol}</Text>
                            </View>
                            <View style={styles.sumDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.language')}</Text>
                                <Text style={styles.summaryVal}>{langue === 'fr' ? `🇫🇷 ${t('settings.langFr')}` : `🇬🇧 ${t('settings.langEn')}`}</Text>
                            </View>
                            <View style={styles.sumDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.measurements')}</Text>
                                <Text style={styles.summaryVal}>{uniteMesure === 'cm' ? t('settings.cm') : t('settings.inches')}</Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const makeStyles = (P: Palette) => ({
    container: { flex: 1, backgroundColor: P.pageBg },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: P.pageBg, borderBottomWidth: 0.5, borderBottomColor: P.border },
    backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: P.surface, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 0.5, borderColor: P.borderHard },
    headerTitle: { fontSize: 16, fontWeight: '700' as const, color: P.text },
    scroll: { paddingHorizontal: 20, paddingTop: 8 },
    card: { backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard, overflow: 'hidden' as const, marginBottom: 4 },
    sectionTitle: { fontSize: 10, fontWeight: '700' as const, color: P.sub, letterSpacing: 1.4, textTransform: 'uppercase' as const, marginTop: 22, marginBottom: 10, paddingHorizontal: 2 },
    divider: { height: 0.5, backgroundColor: P.border, marginLeft: 56 },
    toggleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    toggleIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const },
    toggleContent: { flex: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '600' as const, color: P.text },
    toggleSub: { fontSize: 12, color: P.sub, marginTop: 2 },
    summaryCard: { padding: 16 },
    summaryRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingVertical: 6 },
    summaryKey: { fontSize: 12, fontWeight: '600' as const, color: P.sub },
    summaryVal: { fontSize: 13, fontWeight: '700' as const, color: P.text },
    sumDivider: { height: 0.5, backgroundColor: P.border },
});
