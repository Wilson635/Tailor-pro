// ==========================================
// ÉCRAN AJOUT MODÈLE CATALOGUE - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '@constants/theme';
import {
    CATALOG_MODEL_CATEGORIES,
    CATALOG_CATEGORY_LABELS,
} from '@constants/catalogConstants';
import { catalogService } from '@services/supabaseService';
import type { CatalogCategory } from '../../types';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

// ==========================================
// TYPES
// ==========================================

type Props = NativeStackScreenProps<RootStackParamList, 'AddCatalogModel'>;

// CATALOG_MODEL_CATEGORIES importé depuis @constants/catalogConstants

// ==========================================
// SOUS-COMPOSANTS
// ==========================================

const SectionLabel = ({ text }: { text: string }) => (
    <Text style={styles.sectionLabel}>{text}</Text>
);

const StyledInput = ({
                         placeholder,
                         value,
                         onChangeText,
                         keyboardType,
                         multiline,
                         numberOfLines,
                     }: {
    placeholder: string;
    value: string;
    onChangeText: (v: string) => void;
    keyboardType?: 'default' | 'numeric';
    multiline?: boolean;
    numberOfLines?: number;
}) => (
    <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray400}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
    />
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const AddCatalogModelScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { addCatalogModel } = useAppStore();

    // ── Formulaire ──
    const [name, setName] = useState('');
    const [category, setCategory] = useState<CatalogCategory>('robes');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]); // URI locales sélectionnées
    const [isLoading, setIsLoading] = useState(false);

    // ──────────────────────────────────────
    // Sélection des photos
    // ──────────────────────────────────────

    const pickPhotos = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission refusée',
                'Autorisez l\'accès à la galerie dans les paramètres pour ajouter des photos.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 5,
        });

        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setPhotos((prev) => [...prev, ...uris].slice(0, 5));
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra dans les paramètres.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePickSource = () => {
        Alert.alert('Ajouter des photos', 'Choisissez une source', [
            { text: 'Galerie', onPress: pickPhotos },
            { text: 'Caméra', onPress: takePhoto },
            { text: 'Annuler', style: 'cancel' },
        ]);
    };

    // ──────────────────────────────────────
    // Soumission
    // ──────────────────────────────────────

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Champ requis', 'Veuillez saisir un nom pour le modèle.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Upload les photos vers Supabase Storage
            const uploadedUrls: string[] = [];
            for (const uri of photos) {
                const fileName = uri.split('/').pop() ?? `photo_${Date.now()}.jpg`;
                const url = await catalogService.uploadPhoto(uri, fileName);
                if (url) uploadedUrls.push(url);
            }

            // 2. Créer le modèle dans le catalogue
            const result = await addCatalogModel({
                name: name.trim(),
                category,
                price: price ? parseFloat(price.replace(/\s/g, '')) : 0,
                description: description.trim() || undefined,
                photos: uploadedUrls,
                isFavorite: false,
            });

            if (result) {
                Alert.alert('Modèle ajouté', `"${result.name}" a été ajouté à votre catalogue.`, [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Erreur', 'Impossible d\'ajouter le modèle. Réessayez.');
            }
        } catch {
            Alert.alert('Erreur', 'Une erreur inattendue s\'est produite.');
        } finally {
            setIsLoading(false);
        }
    };

    // ──────────────────────────────────────
    // Rendu
    // ──────────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau modèle</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ── Photos ── */}
                <View style={styles.card}>
                    <SectionLabel text="Photos du modèle" />
                    <Text style={styles.sectionSub}>Ajoutez jusqu'à 5 photos (galerie ou caméra)</Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.photosRow}
                    >
                        {/* Bouton ajouter */}
                        {photos.length < 5 && (
                            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickSource} activeOpacity={0.7}>
                                <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
                                <Text style={styles.addPhotoText}>Ajouter</Text>
                            </TouchableOpacity>
                        )}

                        {/* Aperçus */}
                        {photos.map((uri, index) => (
                            <View key={index} style={styles.photoPreview}>
                                <Image source={{ uri }} style={styles.photoImg} />
                                {index === 0 && (
                                    <View style={styles.mainPhotoBadge}>
                                        <Text style={styles.mainPhotoBadgeText}>Principale</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.removePhotoBtn}
                                    onPress={() => removePhoto(index)}
                                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                                >
                                    <Ionicons name="close" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Informations ── */}
                <View style={styles.card}>
                    <SectionLabel text="Informations" />

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Nom du modèle *</Text>
                        <StyledInput
                            placeholder="ex: Robe princesse brodée"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Prix indicatif (optionnel)</Text>
                        <StyledInput
                            placeholder="0"
                            value={price}
                            onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                        <StyledInput
                            placeholder="Décrivez les détails du modèle…"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                {/* ── Catégorie ── */}
                <View style={styles.card}>
                    <SectionLabel text="Catégorie" />
                    <View style={styles.categoriesGrid}>
                        {CATALOG_MODEL_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.catChip, category === cat && styles.catChipActive]}
                                onPress={() => setCategory(cat)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                                    {CATALOG_CATEGORY_LABELS[cat]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* ── Footer ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.submitBtnText}>Ajouter au catalogue</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // ── Header ──
    header: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        color: '#fff',
    },

    scroll: { flex: 1 },
    scrollContent: {
        padding: SPACING.lg,
        gap: SPACING.md,
        paddingBottom: SPACING.xxxl,
    },

    // ── Card ──
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.text,
    },
    sectionSub: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: -SPACING.sm,
    },

    // ── Photos ──
    photosRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    addPhotoBtn: {
        width: 90,
        height: 110,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: '#F5F0FF',
    },
    addPhotoText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHTS.medium,
    },
    photoPreview: {
        width: 90,
        height: 110,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        position: 'relative',
    },
    photoImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    mainPhotoBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    mainPhotoBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: FONT_WEIGHTS.semibold,
    },
    removePhotoBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Champs ──
    field: {
        gap: SPACING.xs,
    },
    fieldLabel: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
        color: COLORS.text,
    },
    input: {
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        height: 46,
    },
    inputMultiline: {
        height: 100,
        paddingTop: SPACING.md,
    },

    // ── Catégories ──
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    catChip: {
        borderWidth: 0.5,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.background,
    },
    catChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    catChipText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    catChipTextActive: {
        color: '#fff',
        fontWeight: FONT_WEIGHTS.semibold,
    },

    // ── Footer ──
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.white,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.border,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        height: 52,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        color: '#fff',
    },
});
