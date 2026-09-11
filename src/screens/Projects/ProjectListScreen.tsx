// ==========================================
// LISTE DES PROJETS / COMMANDES GROUPÉES — TailorPro
// Module 13
// ==========================================

import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatDate } from '@utils/formatters';
import { SPACING } from '@constants/theme';
import { useThemedStyles, type Palette } from '@/src/theme';
import { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ProjectStatut } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectList'>;

const projectStatusMeta = (P: Palette): Record<ProjectStatut, { label: string; color: string; bg: string }> => ({
    brouillon:              { label: 'Brouillon',            color: P.sub,     bg: P.border },
    confirme:               { label: 'Confirmé',             color: P.primary, bg: P.goldBg },
    en_preparation:         { label: 'En préparation',       color: P.warning, bg: P.warningBg },
    en_confection:          { label: 'En confection',        color: P.warning, bg: P.warningBg },
    essayage:               { label: 'Essayage',             color: P.primary, bg: P.goldBg },
    retouches:              { label: 'Retouches',            color: P.warning, bg: P.warningBg },
    partiellement_termine:  { label: 'Partiellement terminé',color: P.warning, bg: P.warningBg },
    termine:                { label: 'Terminé',               color: P.success, bg: P.successBg },
    livre:                  { label: 'Livré',                 color: P.success, bg: P.successBg },
    annule:                 { label: 'Annulé',                color: P.error,   bg: P.errorBg },
});

export const ProjectListScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const PROJECT_STATUS_META = projectStatusMeta(P);
    const { projects, projectRecaps, loadProjects, isLoading } = useAppStore();
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { loadProjects(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProjects();
        setRefreshing(false);
    };

    const filtered = useMemo(
        () => projects.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())),
        [projects, search]
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* ══ HEADER ══ */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Projets</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProject')}>
                    <Feather name="plus" size={20} color={P.gold} />
                </TouchableOpacity>
            </View>

            {/* ══ RECHERCHE ══ */}
            <View style={styles.searchWrap}>
                <Feather name="search" size={16} color={P.sub} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un projet…"
                    placeholderTextColor={P.sub}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {isLoading && projects.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={P.primary} />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Feather name="folder" size={36} color={P.sub} />
                    <Text style={styles.emptyTitle}>Aucun projet</Text>
                    <Text style={styles.emptySub}>
                        Regroupe un mariage, une cérémonie ou une commande de groupe en un seul projet.
                    </Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddProject')}>
                        <Feather name="plus" size={16} color={P.gold} />
                        <Text style={styles.emptyBtnText}>Créer un projet</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 24, gap: 12 }}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    renderItem={({ item }) => {
                        const recap = projectRecaps[item.id];
                        const meta = PROJECT_STATUS_META[item.statut] ?? PROJECT_STATUS_META.brouillon;
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
                            >
                                <View style={styles.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.nom}</Text>
                                        {item.dateEvenement && (
                                            <Text style={styles.cardDate}>
                                                <Feather name="calendar" size={11} color={P.sub} /> {formatDate(item.dateEvenement)}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                                        <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
                                    </View>
                                </View>

                                {recap && (
                                    <View style={styles.cardStats}>
                                        <View style={styles.statItem}>
                                            <Feather name="users" size={13} color={P.sub} />
                                            <Text style={styles.statText}>{recap.nbPersonnes} personne{recap.nbPersonnes > 1 ? 's' : ''}</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Feather name="scissors" size={13} color={P.sub} />
                                            <Text style={styles.statText}>
                                                {recap.nbVetementsTermines}/{recap.nbVetements} vêtements
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {recap && recap.montantTotal > 0 && (
                                    <View style={styles.cardFooter}>
                                        <View>
                                            <Text style={styles.amountLabel}>Total</Text>
                                            <Text style={styles.amountValue}>{formatCurrency(recap.montantTotal)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.amountLabel}>Reste à payer</Text>
                                            <Text style={[styles.amountValue, { color: recap.resteAPayer > 0 ? P.warning : P.success }]}>
                                                {formatCurrency(recap.resteAPayer)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
};

const makeStyles = (P: Palette) => ({
    root: { flex: 1, backgroundColor: P.pageBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },

    header: {
        backgroundColor: P.pageBg,
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
        alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    addBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: P.goldRim, marginTop: 4,
    },

    searchWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 20, marginBottom: 8,
        backgroundColor: P.surface, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    searchInput: { flex: 1, fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },

    emptyTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    emptySub: { fontSize: 13, color: P.sub, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: P.bg, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, marginTop: 8,
        borderWidth: 1, borderColor: P.goldRim,
    },
    emptyBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },

    card: {
        backgroundColor: P.surface, borderRadius: 18, padding: 14,
        borderWidth: 0.5, borderColor: P.borderHard, gap: 10,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    cardTitle: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
    cardDate: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusBadgeText: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },

    cardStats: { flexDirection: 'row', gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statText: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },

    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingTop: 10, borderTopWidth: 0.5, borderTopColor: P.borderHard,
    },
    amountLabel: { fontSize: 11, color: P.sub, fontFamily: 'PlusJakartaSans_400Regular' },
    amountValue: { fontSize: 14, color: P.text, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 2 },
});
