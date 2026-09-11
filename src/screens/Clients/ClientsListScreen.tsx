// ==========================================
// LISTE DES CLIENTS — TailorPro
// ==========================================

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@store/useAppStore';
import { formatCurrencyShort, formatPhone } from '@utils/formatters';
import type { Client, RootStackParamList } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Palette } from '@/src/theme';
import { Avatar } from '@components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;
type FilterType = 'all' | 'recent' | 'favorite';

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'recent', label: 'Récents' },
    { key: 'favorite', label: 'Fidèles' },
];

const isNewClient = (createdAt: Date): boolean =>
    Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;

export const ClientsListScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { clients, searchQuery, setSearchQuery, orders } = useAppStore();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchFocused, setSearchFocused] = useState(false);

    const orderCountByClient = useMemo(() => {
        const map: Record<string, number> = {};
        for (const o of orders) map[o.clientId] = (map[o.clientId] ?? 0) + 1;
        return map;
    }, [orders]);

    const isFidele = (clientId: string) => (orderCountByClient[clientId] ?? 0) > 2;

    const totalClients = clients.length;
    const clientsWithBalance = clients.filter((c) => c.balance > 0);
    const totalUnpaid = clientsWithBalance.reduce((s, c) => s + c.balance, 0);

    const filteredClients = useMemo(() => {
        let result = [...clients];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    (c.nom ?? '').toLowerCase().includes(q) ||
                    (c.telephone ?? '').includes(q) ||
                    (c.adresse ?? '').toLowerCase().includes(q),
            );
        }
        switch (activeFilter) {
            case 'recent':
                result.sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                );
                break;
            case 'favorite':
                result = result.filter((c) => isFidele(c.id));
                break;
        }
        return result;
    }, [clients, searchQuery, activeFilter, orderCountByClient]);

    const renderClient = ({ item }: { item: Client }) => {
        const isNew = isNewClient(item.createdAt);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
                activeOpacity={0.82}
            >
                <Avatar source={item.photo} name={item.nom} size={44} />
                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>{item.nom}</Text>
                        {isFidele(item.id) && (
                            <View style={styles.badgeGold}>
                                <Text style={styles.badgeGoldText}>Fidèle</Text>
                            </View>
                        )}
                        {isNew && !isFidele(item.id) && (
                            <View style={styles.badgeNew}>
                                <Text style={styles.badgeNewText}>Nouveau</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.phone}>{formatPhone(item.telephone)}</Text>
                    {!!item.adresse && (
                        <View style={styles.locRow}>
                            <Ionicons name="location-outline" size={11} color={P.sub} />
                            <Text style={styles.loc} numberOfLines={1}>{item.adresse}</Text>
                        </View>
                    )}
                </View>
                {item.balance > 0 ? (
                    <Text style={styles.due}>{formatCurrencyShort(item.balance)}</Text>
                ) : (
                    <Text style={styles.sold}>Soldé</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.title}>Clients</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddClient')}>
                    <Ionicons name="add" size={18} color={P.gold} />
                </TouchableOpacity>
            </View>

            <View style={[styles.search, searchFocused && styles.searchOn]}>
                <Ionicons name="search-outline" size={16} color={P.sub} />
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher un client…"
                    placeholderTextColor={P.muted}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={P.sub} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                renderItem={renderClient}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                ListHeaderComponent={
                    <>
                        <View style={styles.chips}>
                            {FILTERS.map((f) => {
                                const on = activeFilter === f.key;
                                return (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[styles.chip, on && styles.chipOn]}
                                        onPress={() => setActiveFilter(f.key)}
                                    >
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.stats}>
                            <View style={styles.stat}>
                                <Text style={styles.statLbl}>Carnet</Text>
                                <Text style={styles.statVal}>{totalClients}</Text>
                                <Text style={styles.statSub}>clients</Text>
                            </View>
                            <View style={[styles.stat, styles.statGold]}>
                                <Text style={styles.statLbl}>À encaisser</Text>
                                <Text style={[styles.statVal, { color: P.gold }]}>{formatCurrencyShort(totalUnpaid)}</Text>
                                <Text style={styles.statSub}>{clientsWithBalance.length} solde{clientsWithBalance.length !== 1 ? 's' : ''}</Text>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="people-outline" size={26} color={P.gold} />
                        </View>
                        <Text style={styles.emptyTitle}>Aucun client</Text>
                        <Text style={styles.emptySub}>Ajoutez une fiche pour retrouver photo, mesures et commandes.</Text>
                    </View>
                }
            />
        </View>
    );
};

const makeStyles = (P: Palette) => ({
    container: { flex: 1, backgroundColor: P.pageBg },
    header: {
        flexDirection: 'row' as const, alignItems: 'flex-end' as const,
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    title: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    addBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim, marginBottom: 2,
    },
    search: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
        marginHorizontal: 20, marginBottom: 8, height: 44, paddingHorizontal: 14,
        backgroundColor: P.surface, borderRadius: 14, borderWidth: 0.5, borderColor: P.borderHard,
    },
    searchOn: { borderColor: P.primary },
    searchInput: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text },
    chips: { flexDirection: 'row' as const, gap: 8, marginBottom: 14 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    },
    chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
    chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
    list: { paddingHorizontal: 20, paddingBottom: 40 },
    stats: { flexDirection: 'row' as const, gap: 10, marginBottom: 14 },
    stat: {
        flex: 1, backgroundColor: P.surface, borderRadius: 16, padding: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    statGold: { borderColor: P.goldRim, backgroundColor: P.goldBg },
    statLbl: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 4 },
    statVal: { fontSize: 20, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    statSub: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
    card: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
        backgroundColor: P.surface, borderRadius: 18, padding: 14,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    info: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 2 },
    name: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text, flexShrink: 1 },
    phone: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    locRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3, marginTop: 3 },
    loc: { fontSize: 11, color: P.sub, flexShrink: 1, fontFamily: 'PlusJakartaSans_500Medium' },
    badgeGold: { backgroundColor: P.goldBg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 0.5, borderColor: P.goldRim },
    badgeGoldText: { fontSize: 10, color: P.gold, fontFamily: 'PlusJakartaSans_700Bold' },
    badgeNew: { backgroundColor: P.primaryBg, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    badgeNewText: { fontSize: 10, color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' },
    due: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.error },
    sold: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.success },
    empty: { alignItems: 'center' as const, paddingTop: 48, paddingHorizontal: 28 },
    emptyIcon: {
        width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
        alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
    },
    emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
});
