// ──────────────────────────────────────────────────────────
// GalerieScreen — Module 11
// Grille visuelle de toutes les photos de réalisations.
// Filtres par catégorie, sélection multiple, publication.
// ──────────────────────────────────────────────────────────
import React, {
    useState, useMemo, useCallback, useRef,
} from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    TouchableOpacity, TouchableHighlight, Dimensions,
    Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';
import { Realisation, CatalogModel, Order } from '../../types';

// ── Palette ──────────────────────────────────────────────
const P = {
    bg:       '#16123A',
    primary:  '#6C3EB8',
    pageBg:   '#0E0B1F',   // très sombre pour une galerie
    surface:  '#FFFFFF',
    text:     '#FFFFFF',
    sub:      'rgba(255,255,255,0.55)',
    gold:     '#D4AF37',
    success:  '#059669',
    successBg:'rgba(5,150,105,0.85)',
    border:   'rgba(255,255,255,0.10)',
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Constantes grille ─────────────────────────────────────
const { width: W } = Dimensions.get('window');
const GAP          = 2;
const N_COLS       = 3;
const CELL_SIZE    = (W - GAP * (N_COLS + 1)) / N_COLS;

// ── Catégories de la galerie ──────────────────────────────
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

// ── Mapping ClothingType → GalerieCategorie ───────────────
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

// ── Mapping CatalogCategory → GalerieCategorie ───────────
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

// ── PhotoItem ─────────────────────────────────────────────
interface PhotoItem {
    key:           string;        // realisationId + '_' + photoIndex
    uri:           string;
    realisationId: string;
    clientId:      string;
    modeleId?:     string;
    categorie:     GalerieCategorie;
    isPublished:   boolean;
}

// ── Dériver la catégorie d'une réalisation ────────────────
function deriveCategorie(
    real: Realisation,
    catalog: CatalogModel[],
    orders: Order[],
): GalerieCategorie {
    // 1. Via le modèle du catalogue
    if (real.modeleId) {
        const modele = catalog.find(m => m.id === real.modeleId);
        if (modele) return CATALOG_TO_CAT[modele.categorie] ?? 'tout';
    }
    // 2. Via la commande (clothingType)
    if (real.commandeId) {
        const order = orders.find(o => o.id === real.commandeId);
        if (order) return CLOTHING_TO_CAT[order.clothingType] ?? 'tout';
    }
    return 'tout';
}

// ──────────────────────────────────────────────────────────
// SCREEN
// ──────────────────────────────────────────────────────────
export function GalerieScreen() {
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();

    const { realisations, clients, catalog, orders, updateCatalogModel, loadCatalog } = useAppStore();

    // Filtres
    const [categorie, setCategorie] = useState<GalerieCategorie>('tout');

    // Mode sélection
    const [selecting,  setSelecting]  = useState(false);
    const [selected,   setSelected]   = useState<Set<string>>(new Set()); // clés PhotoItem
    const [publishing, setPublishing] = useState(false);

    // ── Construire la liste de photos ─────────────────────
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
        // Trier par réalisation la plus récente en premier (par position dans le store)
        return items;
    }, [realisations, catalog, orders]);

    // ── Filtrer ────────────────────────────────────────────
    const filtered = useMemo(() =>
        categorie === 'tout'
            ? allPhotos
            : allPhotos.filter(p => p.categorie === categorie),
        [allPhotos, categorie]
    );

    // ── Navigation ─────────────────────────────────────────
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

    // ── Gestion sélection ──────────────────────────────────
    const enterSelectMode = (key: string) => {
        setSelecting(true);
        setSelected(new Set([key]));
    };

    const toggleSelect = (key: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const exitSelectMode = () => {
        setSelecting(false);
        setSelected(new Set());
    };

    // ── Sélectionner par réalisation (toutes photos liées) ─
    const toggleRealisation = (realisationId: string) => {
        const realisationKeys = filtered
            .filter(p => p.realisationId === realisationId)
            .map(p => p.key);
        const allSelected = realisationKeys.every(k => selected.has(k));
        setSelected(prev => {
            const next = new Set(prev);
            realisationKeys.forEach(k => allSelected ? next.delete(k) : next.add(k));
            return next;
        });
    };

    // ── Publication ────────────────────────────────────────
    const handlePublish = async () => {
        if (selected.size === 0) return;

        // Trouver les réalisations sélectionnées
        const selectedPhotos = filtered.filter(p => selected.has(p.key));

        // Dédupliquer par realisationId
        const realMap = new Map<string, PhotoItem>();
        selectedPhotos.forEach(p => { if (!realMap.has(p.realisationId)) realMap.set(p.realisationId, p); });

        const withModel    = [...realMap.values()].filter(p => p.modeleId);
        const withoutModel = [...realMap.values()].filter(p => !p.modeleId);

        const msg = withoutModel.length > 0
            ? `${withModel.length} photo(s) seront publiées.\n${withoutModel.length} réalisation(s) sans modèle catalogue ne peuvent pas être publiées.`
            : `Publier ${withModel.length} réalisation(s) dans la galerie publique ?`;

        Alert.alert('Publier dans la galerie', msg, [
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
                        Alert.alert('✓ Publié', `${withModel.length} modèle(s) maintenant visibles dans l'espace client.`);
                        exitSelectMode();
                    } catch {
                        Alert.alert('Erreur', 'Impossible de publier.');
                    } finally {
                        setPublishing(false);
                    }
                },
            },
        ]);
    };

    // ── Dépublication ──────────────────────────────────────
    const handleUnpublish = async () => {
        if (selected.size === 0) return;
        const selectedPhotos = filtered.filter(p => selected.has(p.key));
        const realMap = new Map<string, PhotoItem>();
        selectedPhotos.forEach(p => { if (!realMap.has(p.realisationId)) realMap.set(p.realisationId, p); });
        const withModel = [...realMap.values()].filter(p => p.modeleId && p.isPublished);

        if (withModel.length === 0) {
            Alert.alert('Info', 'Aucune des réalisations sélectionnées n\'est publiée.');
            return;
        }

        Alert.alert('Dépublier', `Retirer ${withModel.length} modèle(s) de la galerie publique ?`, [
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
                    } finally {
                        setPublishing(false);
                    }
                },
            },
        ]);
    };

    // ── Rendu cellule photo ────────────────────────────────
    const renderPhoto = useCallback(({ item, index }: { item: PhotoItem; index: number }) => {
        const isSelected = selected.has(item.key);
        const col = index % N_COLS;
        const marginLeft  = col === 0 ? GAP : GAP / 2;
        const marginRight = col === N_COLS - 1 ? GAP : GAP / 2;

        return (
            <TouchableHighlight
                style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    marginTop: GAP, marginLeft, marginRight,
                }}
                underlayColor="rgba(0,0,0,0.3)"
                onPress={() => openRealisation(item)}
                onLongPress={() => {
                    if (!selecting) enterSelectMode(item.key);
                    else toggleSelect(item.key);
                }}
                delayLongPress={350}
            >
                <View style={{ flex: 1 }}>
                    <Image
                        source={{ uri: item.uri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />

                    {/* Overlay sélection */}
                    {selecting && (
                        <View style={[
                            styles.selectOverlay,
                            isSelected && styles.selectOverlayActive,
                        ]}>
                            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                {isSelected && (
                                    <Feather name="check" size={12} color="#fff" />
                                )}
                            </View>
                        </View>
                    )}

                    {/* Badge "PUBLIC" */}
                    {item.isPublished && !selecting && (
                        <View style={styles.publicBadge}>
                            <Feather name="globe" size={9} color="#fff" />
                        </View>
                    )}
                </View>
            </TouchableHighlight>
        );
    }, [selected, selecting, openRealisation]);

    const selectedPublished = filtered.filter(p => selected.has(p.key) && p.isPublished).length;
    const selectedCount     = selected.size;

    return (
        <View style={styles.root}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: P.bg }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>Galerie</Text>
                        <Text style={styles.headerSub}>
                            {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
                            {selecting ? ` · ${selectedCount} sélectionnée${selectedCount !== 1 ? 's' : ''}` : ''}
                        </Text>
                    </View>
                    {selecting ? (
                        <TouchableOpacity style={styles.cancelBtn} onPress={exitSelectMode}>
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.selectBtn}
                            onPress={() => setSelecting(true)}
                        >
                            <Feather name="check-square" size={18} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

            {/* Filtre catégories */}
            <View style={styles.filterBar}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={c => c.id}
                    renderItem={({ item: c }) => (
                        <TouchableOpacity
                            style={[styles.catChip, categorie === c.id && styles.catChipActive]}
                            onPress={() => setCategorie(c.id)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.catText, categorie === c.id && styles.catTextActive]}>
                                {c.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: GAP, paddingVertical: 10 }}
                />
            </View>

            {/* Grille photos */}
            {filtered.length === 0 ? (
                <View style={styles.empty}>
                    <Feather name="image" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>
                        {categorie === 'tout'
                            ? 'Aucune photo dans les réalisations'
                            : `Aucune photo en catégorie "${CATEGORIES.find(c => c.id === categorie)?.label}"`
                        }
                    </Text>
                    <Text style={styles.emptySub}>
                        Ajoutez des photos à vos réalisations pour les voir ici.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={p => p.key}
                    renderItem={renderPhoto}
                    numColumns={N_COLS}
                    columnWrapperStyle={{ marginHorizontal: 0 }}
                    contentContainerStyle={{
                        paddingBottom: selecting ? 110 + insets.bottom : 24 + insets.bottom,
                    }}
                    getItemLayout={(_, i) => ({
                        length: CELL_SIZE + GAP,
                        offset: (CELL_SIZE + GAP) * Math.floor(i / N_COLS),
                        index: i,
                    })}
                    initialNumToRender={18}
                    maxToRenderPerBatch={12}
                    windowSize={5}
                />
            )}

            {/* Barre d'action sélection */}
            {selecting && (
                <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
                    <View style={styles.actionBarInner}>
                        {/* Dépublier (si certaines déjà publiées) */}
                        {selectedPublished > 0 && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSecondary]}
                                onPress={handleUnpublish}
                                disabled={publishing}
                                activeOpacity={0.85}
                            >
                                <Feather name="eye-off" size={15} color={P.primary} style={{ marginRight: 6 }} />
                                <Text style={[styles.actionBtnText, { color: P.primary }]}>
                                    Dépublier ({selectedPublished})
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Publier */}
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                styles.actionBtnPrimary,
                                (selectedCount === 0 || publishing) && { opacity: 0.5 },
                            ]}
                            onPress={handlePublish}
                            disabled={selectedCount === 0 || publishing}
                            activeOpacity={0.85}
                        >
                            {publishing
                                ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                                : <Feather name="globe" size={15} color="#fff" style={{ marginRight: 6 }} />
                            }
                            <Text style={styles.actionBtnText}>
                                {publishing ? 'Publication…' : `Publier (${selectedCount})`}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Indication */}
                    <Text style={styles.actionHint}>
                        {selectedCount === 0
                            ? 'Appuyez sur les photos pour les sélectionner'
                            : `${selectedCount} photo${selectedCount > 1 ? 's' : ''} sélectionnée${selectedCount > 1 ? 's' : ''} · Appui long pour sélectionner`
                        }
                    </Text>
                </View>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: P.pageBg },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: P.bg,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    headerSub:   { color: P.sub, fontSize: 11, marginTop: 1 },
    selectBtn:   { padding: 6 },
    cancelBtn: {
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
    },
    cancelBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    filterBar: { backgroundColor: '#1A1640', borderBottomWidth: 1, borderBottomColor: P.border },
    catChip: {
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        marginRight: 6, backgroundColor: 'rgba(255,255,255,0.06)',
    },
    catChipActive: { backgroundColor: P.primary, borderColor: P.primary },
    catText:       { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.60)' },
    catTextActive: { color: '#fff' },

    selectOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    selectOverlayActive: { backgroundColor: 'rgba(108,62,184,0.35)' },
    checkbox: {
        position: 'absolute', top: 6, right: 6,
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#fff',
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: P.primary, borderColor: P.primary },

    publicBadge: {
        position: 'absolute', bottom: 5, right: 5,
        backgroundColor: P.successBg,
        borderRadius: 10, padding: 3,
    },

    empty: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32, gap: 12,
    },
    emptyTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700', textAlign: 'center' },
    emptySub:   { color: P.sub, fontSize: 13, textAlign: 'center', lineHeight: 19 },

    actionBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(22,18,58,0.97)',
        borderTopWidth: 1, borderTopColor: P.border,
        paddingTop: 12, paddingHorizontal: 16,
    },
    actionBarInner: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 13, borderRadius: 12,
    },
    actionBtnPrimary:   { backgroundColor: P.primary },
    actionBtnSecondary: { backgroundColor: 'rgba(108,62,184,0.12)', borderWidth: 1, borderColor: P.primary },
    actionBtnText:      { color: '#fff', fontSize: 14, fontWeight: '700' },
    actionHint: {
        textAlign: 'center', fontSize: 11, color: P.sub,
        marginTop: 8,
    },
});
