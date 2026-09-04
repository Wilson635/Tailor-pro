// ==========================================
// ÉCRAN MODIFIER UN MODÈLE — TailorPro
// ==========================================

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import {
    CATALOG_MODEL_CATEGORIES,
    CATALOG_CATEGORY_LABELS,
    DIFFICULTE_LABELS,
    DIFFICULTE_COLORS,
    TISSUS_COMMUNS,
    ACCESSOIRES_COMMUNS,
} from '@constants/catalogConstants';
import { catalogService } from '@services/supabaseService';
import type { CatalogCategory } from '../../types';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditCatalogModel'>;
type Difficulte = 'facile' | 'moyen' | 'difficile';

// ── PALETTE ──────────────────────────────────────────────────────
const C = {
    purple900: '#1A0033',
    purple600: '#534AB7',
    purple100: '#EEEDFE',
    purple50:  '#F7F5FF',
    gold:      '#D4AF37',
    teal:      '#1D9E75',
    bg:        '#FFFFFF',
    surface:   '#F7F6F4',
    border:    '#EBEBEB',
    text:      '#0E0B14',
    textSec:   '#7A7787',
    textTer:   '#B0ACBA',
    error:     '#EF4444',
};

// ── SOUS-COMPOSANTS (identiques à AddCatalogModel) ────────────────

const SectionCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <View style={cardStyles.card}>
        <View style={cardStyles.header}>
            <View style={cardStyles.iconWrap}>
                <Ionicons name={icon} size={15} color={C.purple600} />
            </View>
            <Text style={cardStyles.title}>{title}</Text>
        </View>
        {children}
    </View>
);
const cardStyles = StyleSheet.create({
    card:    { backgroundColor: C.bg, borderRadius: 20, padding: 18, marginBottom: 12,
        borderWidth: 0.5, borderColor: C.border },
    header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    iconWrap:{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.purple100,
        alignItems: 'center', justifyContent: 'center' },
    title:   { fontSize: 14, fontWeight: '600', color: C.text, letterSpacing: -0.1 },
});

const TagInput = ({
    tags, suggestions, onAdd, onRemove, placeholder,
}: {
    tags: string[]; suggestions: string[];
    onAdd: (t: string) => void; onRemove: (i: number) => void;
    placeholder: string;
}) => {
    const [input, setInput] = useState('');
    const remaining = suggestions.filter(s => !tags.includes(s)).slice(0, 6);
    const handleAdd = () => {
        const trimmed = input.trim();
        if (trimmed && !tags.includes(trimmed)) { onAdd(trimmed); setInput(''); }
    };
    return (
        <View>
            <View style={tiStyles.inputRow}>
                <TextInput
                    style={tiStyles.input} value={input} onChangeText={setInput}
                    onSubmitEditing={handleAdd} placeholder={placeholder}
                    placeholderTextColor={C.textTer} returnKeyType="done"
                />
                <TouchableOpacity style={tiStyles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
                    <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
            {remaining.length > 0 && (
                <View style={tiStyles.suggestions}>
                    {remaining.map(s => (
                        <TouchableOpacity key={s} style={tiStyles.suggestion} onPress={() => onAdd(s)}>
                            <Text style={tiStyles.suggestionText}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {tags.length > 0 && (
                <View style={tiStyles.chips}>
                    {tags.map((t, i) => (
                        <View key={i} style={tiStyles.chip}>
                            <Text style={tiStyles.chipText}>{t}</Text>
                            <TouchableOpacity onPress={() => onRemove(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Ionicons name="close" size={13} color={C.purple600} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};
const tiStyles = StyleSheet.create({
    inputRow:   { flexDirection: 'row', gap: 8 },
    input:      { flex: 1, height: 42, backgroundColor: C.surface, borderRadius: 12,
        borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 14, fontSize: 14, color: C.text },
    addBtn:     { width: 42, height: 42, borderRadius: 12, backgroundColor: C.purple600,
        alignItems: 'center', justifyContent: 'center' },
    suggestions:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    suggestion: { backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 0.5, borderColor: C.border },
    suggestionText: { fontSize: 12, color: C.textSec },
    chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    chip:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.purple100,
        borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
    chipText:   { fontSize: 12, color: C.purple600, fontWeight: '500' },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const EditCatalogModelScreen: React.FC<Props> = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { modelId } = route.params;
    const { getModelById, updateCatalogModel, archiveCatalogModel } = useAppStore();
    const model = getModelById(modelId);

    if (!model) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.center}>
                    <Text style={{ fontSize: 16, color: C.textSec }}>Modèle introuvable</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={{ fontSize: 15, color: C.purple600, fontWeight: '600' }}>Retour</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Initialiser le formulaire avec les données existantes
    const [nom, setNom]               = useState(model.nom);
    const [categorie, setCategorie]   = useState<CatalogCategory>(model.categorie);
    const [prix, setPrix]             = useState(model.prixIndicatif > 0 ? String(model.prixIndicatif) : '');
    const [description, setDescription] = useState(model.description ?? '');
    const [photos, setPhotos]         = useState<string[]>([...model.photos]);
    const [difficulte, setDifficulte] = useState<Difficulte>(model.difficulte);
    const [tempsRealisation, setTemps] = useState(model.tempsMoyenRealisation ? String(model.tempsMoyenRealisation) : '');
    const [tissus, setTissus]         = useState<string[]>([...model.tissusRecommandes]);
    const [accessoires, setAccessoires] = useState<string[]>([...model.accessoiresNecessaires]);
    const [statut, setStatut]         = useState<'public' | 'prive'>(model.statut);
    const [isLoading, setIsLoading]   = useState(false);

    // ── Photos ──
    const pickPhotos = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
        });
        if (!result.canceled) setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra.'); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 5));
    };

    const handlePickSource = () =>
        Alert.alert('Modifier les photos', 'Choisissez une source', [
            { text: 'Galerie', onPress: pickPhotos },
            { text: 'Caméra',  onPress: takePhoto  },
            { text: 'Annuler', style: 'cancel'     },
        ]);

    // ── Enregistrer ──
    const handleSave = async () => {
        if (!nom.trim()) { Alert.alert('Champ requis', 'Veuillez saisir un nom pour le modèle.'); return; }
        setIsLoading(true);
        try {
            // Upload les nouvelles photos (URI locales seulement)
            const finalPhotos: string[] = [];
            for (const uri of photos) {
                if (uri.startsWith('http')) {
                    finalPhotos.push(uri);
                } else {
                    const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
                    const url = await catalogService.uploadPhoto(uri, fileName);
                    if (url) finalPhotos.push(url);
                }
            }

            await updateCatalogModel(modelId, {
                nom:                    nom.trim(),
                categorie,
                prixIndicatif:          prix ? parseFloat(prix.replace(/\s/g, '')) : 0,
                description:            description.trim() || undefined,
                photos:                 finalPhotos,
                difficulte,
                tempsMoyenRealisation:  tempsRealisation ? parseInt(tempsRealisation) : null,
                tissusRecommandes:      tissus,
                accessoiresNecessaires: accessoires,
                statut,
            });
            navigation.goBack();
        } catch (error: any) {
            console.error('Erreur lors de la modification du modèle:', error);
            Alert.alert('Erreur', error?.message || 'Impossible de modifier le modèle.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Archiver ──
    const handleArchive = () => {
        Alert.alert(
            'Archiver ce modèle ?',
            `"${model.nom}" sera archivé. S'il est lié à des commandes, l'historique reste intact.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Archiver',
                    style: 'destructive',
                    onPress: async () => {
                        await archiveCatalogModel(modelId);
                        navigation.popToTop();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={18} color={C.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.headerTitle}>Modifier le modèle</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{model.nom}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Statut toggle */}
                    <TouchableOpacity
                        style={[styles.statutToggle, statut === 'public' ? styles.statutPublic : styles.statutPriv]}
                        onPress={() => setStatut(p => p === 'public' ? 'prive' : 'public')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={statut === 'public' ? 'globe-outline' : 'lock-closed'} size={13}
                            color={statut === 'public' ? C.teal : '#92400E'} />
                        <Text style={[styles.statutText, { color: statut === 'public' ? C.teal : '#92400E' }]}>
                            {statut === 'public' ? 'Public' : 'Privé'}
                        </Text>
                    </TouchableOpacity>
                    {/* Archiver */}
                    <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive} activeOpacity={0.8}>
                        <Ionicons name="archive-outline" size={16} color={C.error} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.divider} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Photos ── */}
                <SectionCard icon="camera-outline" title="Photos du modèle">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
                        {photos.length < 5 && (
                            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickSource} activeOpacity={0.7}>
                                <Ionicons name="camera-outline" size={26} color={C.purple600} />
                                <Text style={styles.addPhotoText}>Ajouter</Text>
                            </TouchableOpacity>
                        )}
                        {photos.map((uri, idx) => (
                            <View key={idx} style={styles.photoPreview}>
                                <Image source={{ uri }} style={styles.photoImg} />
                                {idx === 0 && (
                                    <View style={styles.mainBadge}>
                                        <Text style={styles.mainBadgeText}>Principale</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.removePhoto}
                                    onPress={() => setPhotos(p => p.filter((_, i) => i !== idx))}
                                >
                                    <Ionicons name="close" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </SectionCard>

                {/* ── Informations ── */}
                <SectionCard icon="information-circle-outline" title="Informations">
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Nom du modèle <Text style={styles.req}>*</Text></Text>
                        <TextInput
                            style={styles.input} value={nom} onChangeText={setNom}
                            placeholder="ex : Robe princesse brodée"
                            placeholderTextColor={C.textTer} autoCapitalize="sentences"
                        />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Prix indicatif <Text style={styles.opt}>(optionnel)</Text></Text>
                        <TextInput
                            style={styles.input} value={prix}
                            onChangeText={v => setPrix(v.replace(/[^0-9.]/g, ''))}
                            placeholder="0" placeholderTextColor={C.textTer} keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Description <Text style={styles.opt}>(optionnel)</Text></Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={description} onChangeText={setDescription}
                            placeholder="Décrivez les détails, la coupe, le style…"
                            placeholderTextColor={C.textTer} multiline numberOfLines={4} textAlignVertical="top"
                        />
                    </View>
                </SectionCard>

                {/* ── Catégorie ── */}
                <SectionCard icon="grid-outline" title="Catégorie">
                    <View style={styles.categoriesGrid}>
                        {CATALOG_MODEL_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catChip, categorie === cat && styles.catChipActive]}
                                onPress={() => setCategorie(cat)} activeOpacity={0.7}
                            >
                                <Text style={[styles.catChipText, categorie === cat && styles.catChipTextActive]}>
                                    {CATALOG_CATEGORY_LABELS[cat]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </SectionCard>

                {/* ── Difficulté ── */}
                <SectionCard icon="speedometer-outline" title="Difficulté & temps">
                    <View style={styles.segmented}>
                        {(['facile', 'moyen', 'difficile'] as Difficulte[]).map(d => {
                            const active = difficulte === d;
                            const col = DIFFICULTE_COLORS[d];
                            return (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.segItem, active && { backgroundColor: col.bg }]}
                                    onPress={() => setDifficulte(d)} activeOpacity={0.85}
                                >
                                    <Text style={[styles.segText, active && { color: col.text, fontWeight: '700' }]}>
                                        {DIFFICULTE_LABELS[d]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={[styles.field, { marginTop: 12 }]}>
                        <Text style={styles.fieldLabel}>Temps de réalisation <Text style={styles.opt}>(jours)</Text></Text>
                        <TextInput
                            style={styles.input} value={tempsRealisation}
                            onChangeText={v => setTemps(v.replace(/\D/g, ''))}
                            placeholder="ex : 5" placeholderTextColor={C.textTer} keyboardType="number-pad"
                        />
                    </View>
                </SectionCard>

                {/* ── Tissus ── */}
                <SectionCard icon="layers-outline" title="Tissus recommandés">
                    <TagInput
                        tags={tissus} suggestions={TISSUS_COMMUNS}
                        onAdd={t => setTissus(p => [...p, t])}
                        onRemove={i => setTissus(p => p.filter((_, j) => j !== i))}
                        placeholder="Satin, Bazin, Wax…"
                    />
                </SectionCard>

                {/* ── Accessoires ── */}
                <SectionCard icon="construct-outline" title="Accessoires nécessaires">
                    <TagInput
                        tags={accessoires} suggestions={ACCESSOIRES_COMMUNS}
                        onAdd={a => setAccessoires(p => [...p, a])}
                        onRemove={i => setAccessoires(p => p.filter((_, j) => j !== i))}
                        placeholder="Fermeture éclair, boutons…"
                    />
                </SectionCard>
            </ScrollView>

            {/* ── Footer ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleSave} disabled={isLoading} activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>Enregistrer les modifications</Text>
                            <Ionicons name="checkmark" size={18} color={C.gold} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ── STYLES ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: C.surface },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg },
    headerBtn:   { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
    headerSub:   { fontSize: 12, color: C.textSec, marginTop: 1 },
    statutToggle:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statutPublic:{ backgroundColor: '#D1FAE5' },
    statutPriv:  { backgroundColor: '#FEF3C7' },
    statutText:  { fontSize: 12, fontWeight: '600' },
    archiveBtn:  { width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: '#FEE2E2',
        backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center' },
    divider:     { height: 0.5, backgroundColor: C.border },
    scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

    field:       { gap: 6, marginBottom: 12 },
    fieldLabel:  { fontSize: 11, fontWeight: '600', color: C.textSec, letterSpacing: 0.3, textTransform: 'uppercase' },
    req:         { color: C.error, fontWeight: '700' },
    opt:         { color: C.textTer, fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
    input:       { borderWidth: 0.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 12, fontSize: 14, color: C.text, backgroundColor: C.surface, height: 46 },
    inputMultiline: { height: 100, paddingTop: 12 },
    photosRow:    { flexDirection: 'row', gap: 10, paddingVertical: 4 },
    addPhotoBtn:  { width: 90, height: 110, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: C.purple600, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.purple50 },
    addPhotoText: { fontSize: 11, color: C.purple600, fontWeight: '500' },
    photoPreview: { width: 90, height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    photoImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
    mainBadge:    { position: 'absolute', bottom: 4, left: 4, backgroundColor: C.purple600,
        borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
    mainBadgeText:{ fontSize: 9, color: '#fff', fontWeight: '600' },
    removePhoto:  { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip:      { borderWidth: 0.5, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14,
        paddingVertical: 7, backgroundColor: C.surface },
    catChipActive:{ backgroundColor: C.purple600, borderColor: C.purple600 },
    catChipText:  { fontSize: 13, color: C.textSec },
    catChipTextActive: { color: '#fff', fontWeight: '600' },
    segmented:    { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 3, gap: 3 },
    segItem:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    segText:      { fontSize: 13, color: C.textSec, fontWeight: '500' },
    footer:       { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
        backgroundColor: C.bg, borderTopWidth: 0.5, borderTopColor: C.border },
    submitBtn:    { height: 52, borderRadius: 16, backgroundColor: C.purple900,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
});
