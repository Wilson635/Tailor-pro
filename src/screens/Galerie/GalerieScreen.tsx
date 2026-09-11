// ──────────────────────────────────────────────────────────
// GalerieScreen — Module 11
// Grille visuelle de toutes les photos de réalisations.
// ──────────────────────────────────────────────────────────
import React, {
    useState, useMemo, useCallback,
} from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
    View, Text, FlatList, Image,
    TouchableOpacity, Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';
import { Realisation, CatalogModel, Order } from '../../types';
import { useThemedStyles, type Palette } from '@/src/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: W } = Dimensions.get('window');
const GAP = 8;
const PAD = 20;
const N_COLS = 3;
const CELL_SIZE = (W - PAD * 2 - GAP * (N_COLS - 1)) / N_COLS;

type GalerieCategorie =
    | 'tout' | 'femme' | 'homme' | 'enfant'
    | 'mariage' | 'traditionnel' | 'costume' | 'robe' | 'pantalon';

const CATEGORIES: { id: GalerieCategorie; label: string }[] = [
    { id: 'tout',         label: 'Tout'          },
    { id: 'femme',        label: 'Femme'         },
    { id: 'homme',        label: 'Homme'         },
    { id: 'robe',         label: 'Robe'          },
    { id: 'mariage',      label: 'Mariage'       },
    { id: 'traditionnel', label: 'Traditionnel'  },
    { id: 'costume',      label: 'Costume'       },
    { id: 'pantalon',     label: 'Pantalon'      },
    { id: 'enfant',       label: 'Enfant'        },
];

const CLOTHING_TO_CAT: Record<string, GalerieCategorie> = {
    robe_longue:  'robe',
    robe_courte:  'robe',
    robe_mariage: 'mariage',
    costume:      'costume',
    chemise:      'homme',
    pantalon:     'pantalon',
    boubou:       'traditionnel',
    ensemble:     'femme',
    tenue_enfant: 'enfant',
};

const CATALOG_TO_CAT: Record<string, GalerieCategorie> = {
    femme:        'femme',
    homme:        'homme',
    enfant:       'enfant',
    mariage:      'mariage',
    traditionnel: 'traditionnel',
    costume:      'costume',
    robe:         'robe',
    chemise:      'homme',
};

interface PhotoItem {
    key:           string;
    uri:           string;
    realisationId: string;
    clientId:      string;
    modeleId?:     string;
    categorie:     GalerieCategorie;
    isPublished:   boolean;
}

function deriveCategorie(
    real: Realisation,
    catalog: CatalogModel[],
    orders: Order[],
): GalerieCategorie {
    if (real.modeleId) {
        const modele = catalog.find(m => m.id === real.modeleId);
        if (modele) return CATALOG_TO_CAT[modele.categorie] ?? 'tout';
    }
    if (real.commandeId) {
        const order = orders.find(o => o.id === real.commandeId);
        if (order) return CLOTHING_TO_CAT[order.clothingType] ?? 'tout';
    }
    return 'tout';
}

export function GalerieScreen() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();
    const { colors: P, styles } = useThemedStyles(makeStyles);

    const { realisations, catalog, orders, updateCatalogModel, loadCatalog } = useAppStore();

    const [categorie, setCategorie] = useState<GalerieCategorie>('tout');
    const [selecting,  setSelecting]  = useState(false);
    const [selected,   setSelected]   = useState<Set<string>>(new Set());
    const [publishing, setPublishing] = useState(false);

    const allPhotos = useMemo<PhotoItem[]>(() => {
        const items: PhotoItem[] = [];
        Object.entries(realisations).forEach(([clientId, reals]) => {
            reals.forEach(real => {
                if (!real.photos || real.photos.length === 0) return;
                const cat = deriveCategorie(real, catalog, orders);
                const modele = real.modeleId ? catalog.find(m => m.id === real.modeleId) : undefined;
                const isPublished = modele?.statut === 'public';
                real.photos.forEach((uri, i) => {
                    items.push({
                        key:           `${real.id}_${i}`,
                        uri,
                        realisationId: real.id,
                        clientId,
                        modeleId:      real.modeleId,
                        categorie:     cat,
                        isPublished,
                    });
                });
            });
        });
        return items;
    }, [realisations, catalog, orders]);

    const filtered = useMemo(() =>
        categorie === 'tout'
            ? allPhotos
            : allPhotos.filter(p => p.categorie === categorie),
        [allPhotos, categorie]
    );

    const toggleSelect = (key: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const openRealisation = useCallback((item: PhotoItem) => {
        if (selecting) {
            toggleSelect(item.key);
            return;
        }
        navigation.navigate('RealisationDetails', {
            realisationId: item.realisationId,
            clientId:      item.clientId,
        });
    }, [selecting, navigation]);

    const enterSelectMode = (key: string) => {
        setSelecting(true);
        setSelected(new Set([key]));
    };

    const exitSelectMode = () => {
        setSelecting(false);
        setSelected(new Set());
    };

    const handlePublish = async () => {
        if (selected.size === 0) return;
        const selectedPhotos = filtered.filter(p => selected.has(p.key));
        const realMap = new Map<string, PhotoItem>();
        selectedPhotos.forEach(p => { if (!realMap.has(p.realisationId)) realMap.set(p.realisationId, p); });
        const withModel    = [...realMap.values()].filter(p => p.modeleId);
        const withoutModel = [...realMap.values()].filter(p => !p.modeleId);
        const msg = withoutModel.length > 0
            ? `${withModel.length} photo(s) seront publiées.\n${withoutModel.length} réalisation(s) sans modèle catalogue ne peuvent pas être publiées.`
            : `Publier ${withModel.length} réalisation(s) dans la galerie publique ?`;

        showAlert('Publier dans la galerie', msg, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Publier',
                onPress: async () => {
                    setPublishing(true);
                    try {
                        await Promise.all(
                            withModel.map(p =>
                                updateCatalogModel(p.modeleId!, { statut: 'public' })
                            )
                        );
                        await loadCatalog();
                        showSuccess('Publié', `${withModel.length} modèle(s) visibles dans l'espace client.`);
                        exitSelectMode();
                    } catch {
                        showAlert('Erreur', 'Impossible de publier.');
                    } finally {
                        setPublishing(false);
                    }
                },
            },
        ]);
    };

    const handleUnpublish = async () => {
        if (selected.size === 0) return;
        const selectedPhotos = filtered.filter(p => selected.has(p.key));
        const realMap = new Map<string, PhotoItem>();
        selectedPhotos.forEach(p => { if (!realMap.has(p.realisationId)) realMap.set(p.realisationId, p); });
        const withModel = [...realMap.values()].filter(p => p.modeleId && p.isPublished);

        if (withModel.length === 0) {
            showAlert('Info', "Aucune des réalisations sélectionnées n'est publiée.");
            return;
        }

        showAlert('Dépublier', `Retirer ${withModel.length} modèle(s) de la galerie publique ?`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Dépublier',
                style: 'destructive',
                onPress: async () => {
                    setPublishing(true);
                    try {
                        await Promise.all(
                            withModel.map(p => updateCatalogModel(p.modeleId!, { statut: 'prive' }))
                        );
                        await loadCatalog();
                        exitSelectMode();
                        showSuccess('Retiré', `${withModel.length} modèle(s) ont quitté la galerie publique.`);
                    } finally {
                        setPublishing(false);
                    }
                },
            },
        ]);
    };

    const renderPhoto = useCallback(({ item }: { item: PhotoItem }) => {
        const isSelected = selected.has(item.key);
        return (
            <TouchableOpacity
                style={styles.cell}
                activeOpacity={0.88}
                onPress={() => openRealisation(item)}
                onLongPress={() => {
                    if (!selecting) enterSelectMode(item.key);
                    else toggleSelect(item.key);
                }}
                delayLongPress={350}
            >
                <Image source={{ uri: item.uri }} style={styles.cellImg} resizeMode="cover" />
                {selecting && (
                    <View style={[styles.selectOverlay, isSelected && styles.selectOverlayOn]}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                            {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                    </View>
                )}
                {item.isPublished && !selecting && (
                    <View style={styles.publicBadge}>
                        <Ionicons name="globe-outline" size={11} color={P.gold} />
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [selected, selecting, openRealisation, styles, P.gold]);

    const selectedPublished = filtered.filter(p => selected.has(p.key) && p.isPublished).length;
    const selectedCount     = selected.size;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={18} color={P.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Atelier</Text>
                    <Text style={styles.headerTitle}>Galerie</Text>
                    <Text style={styles.headerSub}>
                        {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
                        {selecting ? ` · ${selectedCount} sélectionnée${selectedCount !== 1 ? 's' : ''}` : ''}
                    </Text>
                </View>
                {selecting ? (
                    <TouchableOpacity style={styles.textBtn} onPress={exitSelectMode}>
                        <Text style={styles.textBtnLabel}>Annuler</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setSelecting(true)}>
                        <Ionicons name="checkmark" size={18} color={P.gold} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={CATEGORIES}
                keyExtractor={c => c.id}
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.chips}
                renderItem={({ item: c }) => {
                    const on = categorie === c.id;
                    return (
                        <TouchableOpacity
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => setCategorie(c.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {filtered.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="images-outline" size={26} color={P.gold} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {categorie === 'tout'
                            ? 'Aucune photo'
                            : `Rien en « ${CATEGORIES.find(c => c.id === categorie)?.label} »`}
                    </Text>
                    <Text style={styles.emptySub}>
                        Ajoutez des photos à vos réalisations pour les retrouver ici.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={p => p.key}
                    renderItem={renderPhoto}
                    numColumns={N_COLS}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={{
                        paddingHorizontal: PAD,
                        paddingBottom: selecting ? 110 + insets.bottom : 24 + insets.bottom,
                    }}
                    initialNumToRender={18}
                    maxToRenderPerBatch={12}
                    windowSize={5}
                />
            )}

            {selecting && (
                <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
                    <View style={styles.actionRow}>
                        {selectedPublished > 0 && (
                            <TouchableOpacity
                                style={styles.actionGhost}
                                onPress={handleUnpublish}
                                disabled={publishing}
                            >
                                <Ionicons name="eye-off-outline" size={15} color={P.primary} />
                                <Text style={styles.actionGhostText}>Dépublier</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.actionPrimary, (selectedCount === 0 || publishing) && { opacity: 0.5 }]}
                            onPress={handlePublish}
                            disabled={selectedCount === 0 || publishing}
                        >
                            {publishing
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Ionicons name="globe-outline" size={15} color={P.gold} />}
                            <Text style={styles.actionPrimaryText}>
                                {publishing ? 'Publication…' : `Publier (${selectedCount})`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
    addBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim, marginTop: 4,
    },
    textBtn: { marginTop: 10, paddingHorizontal: 8, paddingVertical: 6 },
    textBtnLabel: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary },
    kicker: {
        fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
        letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
    },
    headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
    headerSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 4 },
    chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    },
    chipOn: { backgroundColor: P.bg, borderColor: P.goldRim },
    chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
    chipTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
    row: { gap: GAP, marginBottom: GAP },
    cell: {
        width: CELL_SIZE, height: CELL_SIZE, borderRadius: 16, overflow: 'hidden' as const,
        backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    },
    cellImg: { width: '100%' as const, height: '100%' as const },
    selectOverlay: {
        position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0,
        backgroundColor: 'transparent',
    },
    selectOverlayOn: { backgroundColor: 'rgba(22,18,58,0.35)' },
    checkbox: {
        position: 'absolute' as const, top: 8, right: 8,
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 1.5, borderColor: '#fff',
        alignItems: 'center' as const, justifyContent: 'center' as const,
        backgroundColor: 'rgba(22,18,58,0.35)',
    },
    checkboxOn: { backgroundColor: P.bg, borderColor: P.goldRim },
    publicBadge: {
        position: 'absolute' as const, bottom: 6, right: 6,
        width: 22, height: 22, borderRadius: 8, backgroundColor: P.bg,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: P.goldRim,
    },
    empty: { alignItems: 'center' as const, paddingTop: 56, paddingHorizontal: 28 },
    emptyIcon: {
        width: 60, height: 60, borderRadius: 18, backgroundColor: P.bg, marginBottom: 14,
        alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
    },
    emptyTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
    emptySub: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, textAlign: 'center' as const, marginTop: 6 },
    actionBar: {
        position: 'absolute' as const, bottom: 0, left: 0, right: 0,
        backgroundColor: P.pageBg, borderTopWidth: 0.5, borderTopColor: P.borderHard,
        paddingTop: 12, paddingHorizontal: 20,
    },
    actionRow: { flexDirection: 'row' as const, gap: 10 },
    actionGhost: {
        flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6,
        paddingVertical: 14, borderRadius: 16, backgroundColor: P.surface,
        borderWidth: 0.5, borderColor: P.borderHard,
    },
    actionGhostText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.primary },
    actionPrimary: {
        flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6,
        paddingVertical: 14, borderRadius: 16, backgroundColor: P.bg,
        borderWidth: 1, borderColor: P.goldRim,
    },
    actionPrimaryText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
});
