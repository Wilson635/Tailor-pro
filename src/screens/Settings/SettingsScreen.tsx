// ==========================================
// PARAMÈTRES GÉNÉRAUX — TailorPro
// Apparence · Devise · Langue · Unité de mesure
// ==========================================

import React from 'react';
import { showAlert } from '@/src/context/DialogContext';
import {
    View, Text, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator,
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

const LANGUES: { value: AppLangue; flag: string }[] = [
    { value: 'fr', flag: '🇫🇷' },
    { value: 'en', flag: '🇬🇧' },
];

const THEMES: { value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', icon: 'sunny-outline' },
    { value: 'dark', icon: 'moon-outline' },
    { value: 'system', icon: 'phone-portrait-outline' },
];

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
            showAlert(t('common.error'), e.message ?? t('settings.saveError'));
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
                    <Ionicons name="arrow-back" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                </View>
                {savingKey ? <ActivityIndicator size="small" color={P.gold} /> : null}
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
                <View style={styles.pills}>
                    {THEMES.map((item) => {
                        const on = scheme === item.value;
                        return (
                            <TouchableOpacity
                                key={item.value}
                                style={[styles.pill, on && styles.pillOn]}
                                onPress={() => run('theme', () => setScheme(item.value))}
                                activeOpacity={0.85}
                            >
                                <Ionicons name={item.icon} size={16} color={on ? P.gold : P.sub} />
                                <Text style={[styles.pillText, on && styles.pillTextOn]}>
                                    {t(`settings.theme${item.value === 'light' ? 'Light' : item.value === 'dark' ? 'Dark' : 'System'}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                <View style={styles.pills}>
                    {LANGUES.map((l) => {
                        const on = langue === l.value;
                        return (
                            <TouchableOpacity
                                key={l.value}
                                style={[styles.pill, on && styles.pillOn]}
                                onPress={() => run('langue', () => setLangue(l.value))}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.flag}>{l.flag}</Text>
                                <Text style={[styles.pillText, on && styles.pillTextOn]}>
                                    {l.value === 'fr' ? t('settings.langFr') : t('settings.langEn')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.units')}</Text>
                <View style={styles.pills}>
                    {(['cm', 'pouces'] as UniteMesure[]).map((u) => {
                        const on = uniteMesure === u;
                        return (
                            <TouchableOpacity
                                key={u}
                                style={[styles.pill, on && styles.pillOn]}
                                onPress={() => run('unite', () => setUniteMesure(u))}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="resize-outline" size={16} color={on ? P.gold : P.sub} />
                                <Text style={[styles.pillText, on && styles.pillTextOn]}>
                                    {u === 'cm' ? t('settings.cm') : t('settings.inches')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>{t('settings.currency')}</Text>
                <View style={styles.card}>
                    {DEVISES.map((d, i) => {
                        const on = d.value === devise;
                        return (
                            <React.Fragment key={d.value}>
                                <TouchableOpacity
                                    style={[styles.currencyRow, on && styles.currencyOn]}
                                    onPress={() => run('devise', () => setDevise(d.value as DeviseCode))}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.flag}>{d.flag}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.currencyLabel}>{langue === 'en' ? d.labelEn : d.labelFr}</Text>
                                        <Text style={styles.currencySub}>{d.symbol}</Text>
                                    </View>
                                    {on ? (
                                        <Ionicons name="checkmark" size={16} color={P.gold} />
                                    ) : null}
                                </TouchableOpacity>
                                {i < DEVISES.length - 1 && <View style={styles.divider} />}
                            </React.Fragment>
                        );
                    })}
                </View>

                {currentDevise && (
                    <>
                        <Text style={styles.sectionTitle}>{t('settings.summary')}</Text>
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.theme')}</Text>
                                <Text style={styles.summaryVal}>
                                    {scheme === 'dark' ? t('settings.themeDark') : scheme === 'system' ? t('settings.themeSystem') : t('settings.themeLight')}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.currency')}</Text>
                                <Text style={styles.summaryVal}>{currentDevise.flag}  {currentDevise.symbol}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>{t('settings.language')}</Text>
                                <Text style={styles.summaryVal}>{langue === 'fr' ? t('settings.langFr') : t('settings.langEn')}</Text>
                            </View>
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
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    headerTitle: { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.5 },
    scroll: { paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub,
        letterSpacing: 1.3, textTransform: 'uppercase' as const,
        marginTop: 22, marginBottom: 10,
    },
    pills: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
    pill: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    },
    pillOn: { backgroundColor: P.bg, borderColor: P.goldRim },
    pillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    pillTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
    flag: { fontSize: 16 },
    card: {
        backgroundColor: P.surface, borderRadius: 18, overflow: 'hidden' as const,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    currencyRow: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
    },
    currencyOn: { backgroundColor: P.goldBg },
    currencyLabel: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.text },
    currencySub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 1 },
    divider: { height: 0.5, backgroundColor: P.border, marginLeft: 48 },
    summaryCard: {
        backgroundColor: P.surface, borderRadius: 18, padding: 16, gap: 12,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    summaryRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    summaryKey: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    summaryVal: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
});
