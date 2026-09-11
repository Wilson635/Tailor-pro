// ──────────────────────────────────────────────────────────
// RechercheScreen — Module 10
// Recherche globale transversale sur les Réalisations.
// ──────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, FlatList,
    TouchableOpacity, ActivityIndicator, Keyboard,
    Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { rechercheService, ResultatRecherche } from '@services/supabaseService';
import { formatDate } from '@utils/formatters';
import {
    STATUT_REALISATION_LABELS,
    STATUT_REALISATION_COLORS,
    STATUT_REALISATION_LIST,
} from '@constants/realisationConstants';
import { StatutRealisation } from '../../types';
import { DateField } from '@components/ui';
import { useThemedStyles, type Palette } from '@/src/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RechercheScreen() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);

    const [query,     setQuery]     = useState('');
    const [statut,    setStatut]    = useState<StatutRealisation | null>(null);
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');
    const [results,   setResults]   = useState<ResultatRecherche[]>([]);
    const [loading,   setLoading]   = useState(false);
    const [searched,  setSearched]  = useState(false);
    const [showAdv,   setShowAdv]   = useState(false);
    const [searchOn,  setSearchOn]  = useState(false);

    const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const advHeight = useRef(new Animated.Value(0)).current;

    const toggleAdv = () => {
        const next = !showAdv;
        setShowAdv(next);
        Animated.timing(advHeight, {
            toValue: next ? 1 : 0,
            duration: 220,
            useNativeDriver: false,
        }).start();
    };

    const doSearch = useCallback(async (
        q: string,
        s: StatutRealisation | null,
        from: string,
        to: string,
    ) => {
        setLoading(true);
        setSearched(true);
        const { data } = await rechercheService.search({
            query:    q.trim() || undefined,
            statut:   s ?? undefined,
            dateFrom: from || undefined,
            dateTo:   to   || undefined,
        });
        setResults(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            doSearch(query, statut, dateFrom, dateTo);
        }, 380);
        return () => clearTimeout(debounce.current);
    }, [query, statut, dateFrom, dateTo, doSearch]);

    const openRealisation = (item: ResultatRecherche) => {
        navigation.navigate('RealisationDetails', {
            realisationId: item.realisationId,
            clientId:      item.clientId,
        });
    };

    const hasFilters   = !!statut || !!dateFrom || !!dateTo;
    const activeCount  = results.length;
    const hasQuery     = query.trim().length > 0 || hasFilters;

    const summaryText = !searched
        ? 'Tapez un nom, un tissu ou un N° de commande'
        : loading
          ? 'Recherche en cours…'
          : activeCount === 0
            ? 'Aucun résultat'
            : `${activeCount} résultat${activeCount > 1 ? 's' : ''}${query.trim() ? ` · « ${query.trim()} »` : ''}`;

    const renderCard = ({ item }: { item: ResultatRecherche }) => {
        const st = item.statut as StatutRealisation;
        const statutLabel = STATUT_REALISATION_LABELS[st] ?? item.statut;
        const statutColor = STATUT_REALISATION_COLORS[st] ?? P.primary;
        const initials = (item.clientNom ?? '?')
            .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
            <TouchableOpacity style={styles.card} onPress={() => openRealisation(item)} activeOpacity={0.82}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.topRow}>
                        <Text style={styles.name} numberOfLines={1}>{item.clientNom}</Text>
                        <View style={[styles.statutPill, { backgroundColor: `${statutColor}18`, borderColor: `${statutColor}44` }]}>
                            <Text style={[styles.statutText, { color: statutColor }]}>{statutLabel}</Text>
                        </View>
                    </View>
                    {(item.tissuLabel || item.couleur) ? (
                        <Text style={styles.meta} numberOfLines={1}>
                            {[item.tissuLabel, item.couleur].filter(Boolean).join(' · ')}
                        </Text>
                    ) : null}
                    <Text style={styles.meta}>
                        {item.dateCreation ? formatDate(new Date(item.dateCreation)) : '—'}
                        {item.numeroCommande ? `  ·  ${item.numeroCommande}` : ''}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Recherche</Text>
                </View>
            </View>

            <View style={[styles.search, searchOn && styles.searchOn]}>
                <Ionicons name="search-outline" size={16} color={P.sub} />
                <TextInput
                    style={styles.searchInput}
                    placeholder='Client, tissu, CMD-…'
                    placeholderTextColor={P.muted}
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onFocus={() => setSearchOn(true)}
                    onBlur={() => setSearchOn(false)}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={16} color={P.sub} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.advBtn, (hasFilters || showAdv) && styles.advBtnOn]}
                    onPress={toggleAdv}
                >
                    <Ionicons name="options-outline" size={16} color={(hasFilters || showAdv) ? P.gold : P.sub} />
                </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[null, ...STATUT_REALISATION_LIST] as (StatutRealisation | null)[]}
                keyExtractor={(s, i) => s ?? `all_${i}`}
                contentContainerStyle={styles.chips}
                style={{ flexGrow: 0 }}
                renderItem={({ item: s }) => {
                    const on = statut === s;
                    const label = s ? (STATUT_REALISATION_LABELS[s] ?? s) : 'Tous';
                    return (
                        <TouchableOpacity
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => setStatut(prev => prev === s ? null : s)}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            <Animated.View style={[
                styles.advPanel,
                {
                    maxHeight: advHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 220] }),
                    opacity: advHeight,
                    overflow: 'hidden',
                },
            ]}>
                <View style={styles.advInner}>
                    <DateField label="Du" value={dateFrom} onChange={setDateFrom} output="iso" placeholder="Date de début" />
                    <DateField label="Au" value={dateTo} onChange={setDateTo} output="iso" placeholder="Date de fin" />
                    {hasFilters && (
                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={() => { setStatut(null); setDateFrom(''); setDateTo(''); }}
                        >
                            <Text style={styles.clearText}>Effacer les filtres</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{summaryText}</Text>
                {loading && <ActivityIndicator size="small" color={P.primary} />}
            </View>

            <FlatList
                data={results}
                keyExtractor={r => r.realisationId}
                renderItem={renderCard}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                ListEmptyComponent={
                    !loading && searched ? (
                        <View style={styles.empty}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="search-outline" size={26} color={P.gold} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {hasQuery ? 'Aucun résultat' : 'Lancez une recherche'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {hasQuery
                                    ? 'Essayez un autre mot-clé ou retirez un filtre.'
                                    : 'Cherchez par client, tissu, couleur ou numéro de commande.'}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const makeStyles = (P: Palette) => ({
    root: { flex: 1, backgroundColor: P.pageBg },
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
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
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    search: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
        marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, height: 46,
        backgroundColor: P.surface, borderRadius: 16, borderWidth: 0.5, borderColor: P.borderHard,
    },
    searchOn: { borderColor: P.goldRim },
    searchInput: {
        flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    },
    advBtn: {
        width: 32, height: 32, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    advBtnOn: { backgroundColor: P.bg },
    chips: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    },
    chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
    chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
    advPanel: { marginHorizontal: 20, marginBottom: 4 },
    advInner: { backgroundColor: P.surface, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: P.borderHard },
    advRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    advLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
    advInput: {
        flex: 1, borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 12,
        paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: P.text, backgroundColor: P.pageBg,
    },
    clearBtn: { marginTop: 10, alignSelf: 'flex-start' as const },
    clearText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
    summaryRow: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
        paddingHorizontal: 20, paddingVertical: 8,
    },
    summaryText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, flex: 1 },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    card: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
        backgroundColor: P.surface, borderRadius: 18, padding: 12,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim,
    },
    avatarText: { fontSize: 13, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
    topRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 4 },
    name: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    statutPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 0.5 },
    statutText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' },
    meta: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
    empty: { alignItems: 'center' as const, paddingTop: 48, paddingHorizontal: 28 },
    emptyIcon: {
        width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
        alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
    },
    emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
});
