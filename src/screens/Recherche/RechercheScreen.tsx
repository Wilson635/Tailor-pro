// ──────────────────────────────────────────────────────────
// RechercheScreen — Module 10
// Recherche globale transversale sur les Réalisations.
// Full-text search via fonction PostgreSQL (pas de LIKE).
// ──────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, FlatList,
    TouchableOpacity, ActivityIndicator, Keyboard,
    Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

// ── Palette ──────────────────────────────────────────────
const P = {
    bg:      '#16123A',
    primary: '#6C3EB8',
    pageBg:  '#F5F4FB',
    surface: '#FFFFFF',
    text:    '#1A1033',
    sub:     '#7C6FA8',
    border:  'rgba(108,62,184,0.10)',
    gold:    '#D4AF37',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Composant carte résultat ──────────────────────────────
const ResultCard = ({
    item, onPress,
}: {
    item: ResultatRecherche;
    onPress: () => void;
}) => {
    const statut        = item.statut as StatutRealisation;
    const statutLabel   = STATUT_REALISATION_LABELS[statut] ?? item.statut;
    const statutColor   = STATUT_REALISATION_COLORS[statut] ?? P.primary;
    const initials      = (item.clientNom ?? '?')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.82}>
            {/* Avatar initiales */}
            <View style={[cardStyles.avatar, { backgroundColor: P.primary + '18' }]}>
                <Text style={cardStyles.avatarText}>{initials}</Text>
            </View>

            {/* Infos */}
            <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={cardStyles.topRow}>
                    <Text style={cardStyles.name} numberOfLines={1}>{item.clientNom}</Text>
                    <View style={[cardStyles.statutBadge, { backgroundColor: statutColor + '1A' }]}>
                        <Text style={[cardStyles.statutText, { color: statutColor }]}>
                            {statutLabel}
                        </Text>
                    </View>
                </View>

                {/* Tissu & couleur */}
                {(item.tissuLabel || item.couleur) && (
                    <View style={cardStyles.metaRow}>
                        <Feather name="layers" size={11} color={P.sub} style={{ marginRight: 4 }} />
                        <Text style={cardStyles.meta} numberOfLines={1}>
                            {[item.tissuLabel, item.couleur].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                )}

                {/* Date & N° commande */}
                <View style={cardStyles.metaRow}>
                    <Feather name="calendar" size={11} color={P.sub} style={{ marginRight: 4 }} />
                    <Text style={cardStyles.meta}>
                        {item.dateCreation
                            ? formatDate(new Date(item.dateCreation))
                            : '—'}
                    </Text>
                    {item.numeroCommande && (
                        <Text style={[cardStyles.meta, { marginLeft: 8, color: P.primary }]}>
                            {item.numeroCommande}
                        </Text>
                    )}
                </View>
            </View>

            <Feather name="chevron-right" size={16} color="rgba(108,62,184,0.25)" />
        </TouchableOpacity>
    );
};

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: P.surface, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center',
        padding: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '800', color: P.primary },
    topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    name:       { fontSize: 14, fontWeight: '700', color: P.text, flex: 1, marginRight: 8 },
    statutBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    statutText: { fontSize: 10, fontWeight: '700' },
    metaRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    meta:       { fontSize: 11, color: P.sub },
});

// ── Chip filtre statut ────────────────────────────────────
const StatutChip = ({
    statut, active, onPress,
}: {
    statut: StatutRealisation | null;
    active: boolean;
    onPress: () => void;
}) => {
    const label = statut ? (STATUT_REALISATION_LABELS[statut] ?? statut) : 'Tous';
    const color = statut ? STATUT_REALISATION_COLORS[statut] : P.primary;
    return (
        <TouchableOpacity
            style={[chipStyles.chip, active && { backgroundColor: color, borderColor: color }]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[chipStyles.text, active && { color: '#fff' }]}>{label}</Text>
        </TouchableOpacity>
    );
};

const chipStyles = StyleSheet.create({
    chip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1, borderColor: P.border,
        backgroundColor: P.surface, marginRight: 6,
    },
    text: { fontSize: 12, fontWeight: '600', color: P.sub },
});

// ──────────────────────────────────────────────────────────
// SCREEN
// ──────────────────────────────────────────────────────────
export function RechercheScreen() {
    const navigation = useNavigation<Nav>();

    // Champs de recherche
    const [query,     setQuery]     = useState('');
    const [statut,    setStatut]    = useState<StatutRealisation | null>(null);
    const [dateFrom,  setDateFrom]  = useState('');
    const [dateTo,    setDateTo]    = useState('');

    // États
    const [results,   setResults]   = useState<ResultatRecherche[]>([]);
    const [loading,   setLoading]   = useState(false);
    const [searched,  setSearched]  = useState(false);   // a-t-on déjà lancé une recherche ?
    const [showAdv,   setShowAdv]   = useState(false);

    // Debounce
    const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Animation avancée
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

    // ── Lancement de la recherche ───────────────────────
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

    // ── Debounce sur le texte ───────────────────────────
    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            doSearch(query, statut, dateFrom, dateTo);
        }, 380);
        return () => clearTimeout(debounce.current);
    }, [query, statut, dateFrom, dateTo, doSearch]);

    // ── Navigation vers fiche réalisation ───────────────
    const openRealisation = (item: ResultatRecherche) => {
        navigation.navigate('RealisationDetails', {
            realisationId: item.realisationId,
            clientId:      item.clientId,
        });
    };

    // ── Helpers texte ───────────────────────────────────
    const hasFilters   = !!statut || !!dateFrom || !!dateTo;
    const activeCount  = results.length;
    const hasQuery     = query.trim().length > 0 || hasFilters;

    const summaryText = !searched
        ? 'Tapez pour chercher ou choisissez un filtre'
        : loading
          ? 'Recherche en cours…'
          : activeCount === 0
            ? 'Aucun résultat'
            : `${activeCount} résultat${activeCount > 1 ? 's' : ''}${query.trim() ? ` pour "${query.trim()}"` : ''}`;

    // ──────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* ── Header ─────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Recherche globale</Text>
                    <Text style={styles.headerSub}>Réalisations, clients, tissus, commandes</Text>
                </View>
            </View>

            {/* ── Barre de recherche ─────────────────── */}
            <View style={styles.searchWrap}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={16} color={P.sub} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder='Ex : "bazin robe 2025", "CMD-2024-0001"…'
                        placeholderTextColor={P.sub}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => { Keyboard.dismiss(); }}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Feather name="x" size={15} color={P.sub} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bouton filtres avancés */}
                <TouchableOpacity
                    style={[styles.advBtn, (hasFilters || showAdv) && styles.advBtnActive]}
                    onPress={toggleAdv}
                    activeOpacity={0.8}
                >
                    <Feather
                        name="sliders"
                        size={15}
                        color={(hasFilters || showAdv) ? P.primary : P.sub}
                    />
                    {hasFilters && <View style={styles.filterDot} />}
                </TouchableOpacity>
            </View>

            {/* ── Chips statut ───────────────────────── */}
            <View style={styles.chipsWrap}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[null, ...STATUT_REALISATION_LIST]}
                    keyExtractor={(s, i) => s ?? `all_${i}`}
                    renderItem={({ item: s }) => (
                        <StatutChip
                            statut={s}
                            active={statut === s}
                            onPress={() => setStatut(prev => prev === s ? null : s)}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
                />
            </View>

            {/* ── Filtres avancés ────────────────────── */}
            <Animated.View style={[
                styles.advPanel,
                {
                    maxHeight: advHeight.interpolate({ inputRange: [0,1], outputRange: [0, 140] }),
                    opacity:   advHeight,
                    overflow:  'hidden',
                },
            ]}>
                <View style={styles.advInner}>
                    <View style={styles.advRow}>
                        <Text style={styles.advLabel}>De</Text>
                        <TextInput
                            style={styles.advInput}
                            placeholder="AAAA-MM-JJ"
                            placeholderTextColor={P.sub}
                            value={dateFrom}
                            onChangeText={setDateFrom}
                        />
                        <Text style={[styles.advLabel, { marginLeft: 8 }]}>à</Text>
                        <TextInput
                            style={styles.advInput}
                            placeholder="AAAA-MM-JJ"
                            placeholderTextColor={P.sub}
                            value={dateTo}
                            onChangeText={setDateTo}
                        />
                    </View>
                    {hasFilters && (
                        <TouchableOpacity
                            style={styles.clearFiltersBtn}
                            onPress={() => { setStatut(null); setDateFrom(''); setDateTo(''); }}
                        >
                            <Feather name="x-circle" size={13} color={P.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            {/* ── Résumé résultats ───────────────────── */}
            <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{summaryText}</Text>
                {loading && <ActivityIndicator size="small" color={P.primary} style={{ marginLeft: 8 }} />}
            </View>

            {/* ── Liste résultats ────────────────────── */}
            <FlatList
                data={results}
                keyExtractor={r => r.realisationId}
                renderItem={({ item }) => (
                    <ResultCard item={item} onPress={() => openRealisation(item)} />
                )}
                contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 10 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    !loading && searched ? (
                        <View style={styles.empty}>
                            <Feather name="search" size={36} color={P.sub} style={{ marginBottom: 10 }} />
                            <Text style={styles.emptyTitle}>
                                {hasQuery ? 'Aucun résultat' : 'Lancez une recherche'}
                            </Text>
                            <Text style={styles.emptySub}>
                                {hasQuery
                                    ? 'Essayez d\'autres mots-clés ou modifiez les filtres'
                                    : 'Recherche par client, tissu, couleur, N° commande…'
                                }
                            </Text>
                            {hasQuery && (
                                <View style={styles.tipsBox}>
                                    <Text style={styles.tipsTitle}>Conseils de recherche</Text>
                                    <Text style={styles.tipItem}>• Essayez des termes plus courts</Text>
                                    <Text style={styles.tipItem}>• Recherche en français uniquement</Text>
                                    <Text style={styles.tipItem}>• Le N° commande fonctionne exactement (ex : CMD-2024-0001)</Text>
                                </View>
                            )}
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: P.pageBg },

    header: {
        backgroundColor: P.bg,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    headerSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: P.surface,
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: P.border,
        gap: 8,
    },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: P.pageBg, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 7,
        borderWidth: 1, borderColor: P.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: P.text, padding: 0 },
    advBtn: {
        width: 38, height: 38, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: P.border,
        backgroundColor: P.pageBg,
    },
    advBtnActive: { borderColor: P.primary, backgroundColor: 'rgba(108,62,184,0.08)' },
    filterDot: {
        position: 'absolute', top: 7, right: 7,
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: P.primary,
    },

    chipsWrap: {
        backgroundColor: P.surface,
        borderBottomWidth: 1, borderBottomColor: P.border,
    },

    advPanel: { backgroundColor: P.surface, borderBottomWidth: 1, borderBottomColor: P.border },
    advInner: { paddingHorizontal: 16, paddingBottom: 12 },
    advRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    advLabel: { fontSize: 12, color: P.sub, minWidth: 16 },
    advInput: {
        flex: 1, borderWidth: 1, borderColor: P.border, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 7,
        fontSize: 13, color: P.text, backgroundColor: P.pageBg,
    },
    clearFiltersBtn: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start', marginTop: 10,
    },
    clearFiltersText: { fontSize: 12, color: P.primary, fontWeight: '600' },

    summaryRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8,
    },
    summaryText: { fontSize: 12, color: P.sub },

    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: P.text, textAlign: 'center' },
    emptySub:   { fontSize: 13, color: P.sub, textAlign: 'center', marginTop: 6, lineHeight: 19 },
    tipsBox: {
        backgroundColor: 'rgba(108,62,184,0.06)', borderRadius: 10,
        padding: 14, marginTop: 20, alignSelf: 'stretch',
    },
    tipsTitle: { fontSize: 12, fontWeight: '700', color: P.primary, marginBottom: 6 },
    tipItem:   { fontSize: 12, color: P.sub, lineHeight: 20 },
});
