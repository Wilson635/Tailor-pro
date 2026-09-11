// ==========================================
// FORMULAIRE DE MENSURATIONS DYNAMIQUE — TailorPro
// Module 13 — les champs viennent de `garment_measurement_fields`
// (configurables par type de vêtement, cf. besoin n°16 du cahier des charges)
// + champs personnalisés ajoutés à la volée (aucune limite de nombre de champs)
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppStore } from '@store/useAppStore';
import { useThemedStyles, type Palette } from '@/src/theme';
import type { TypeVetement } from '../../types';

interface Props {
    typeVetement: TypeVetement;
    initialValues?: Record<string, number>;
    initialUnite?: 'cm' | 'pouces';
    onSubmit: (mesures: Record<string, number>, unite: 'cm' | 'pouces') => void;
    onCancel?: () => void;
    submitLabel?: string;
}

/**
 * Mesures de secours si `garment_measurement_fields` n'est pas encore chargé/seedé
 * pour ce type. Reprend les abréviations d'une fiche de mensuration papier classique
 * (TP, TT, LTDUT, LTDOS, CDVT, CDOS, EP, ES, LC, DSS, LM, TM, TB, LR, LJ, LG, LP) —
 * renomme les labels si tu préfères des intitulés en toutes lettres.
 */
/**
 * Mesures de secours si `garment_measurement_fields` n'est pas encore chargé/seedé
 * pour ce type. Reprend la fiche papier "mesures générales" du couturier — chaque
 * champ garde son abréviation d'origine (repère visuel habituel) accompagnée de sa
 * désignation complète. Certaines désignations restent à confirmer (voir commentaires) :
 * si l'une d'elles est incorrecte, il suffit de changer le `label` ci-dessous.
 */
const FICHE_PAPIER_FIELDS: { key: string; label: string }[] = [
    { key: 'tp',     label: 'TP — Tour de poitrine' },
    { key: 'tt',     label: 'TT — Tour de taille' },
    { key: 'ltdvt',  label: 'LTDVT — Longueur taille devant' },
    { key: 'ltdos',  label: 'LTDOS — Longueur taille dos' },
    { key: 'cdvt',   label: 'CDVT — Carrure devant' },
    { key: 'cdos',   label: 'CDOS — Carrure dos' },
    { key: 'ep',     label: 'EP — Épaule' },
    { key: 'es',     label: 'ES — Emmanchure' },                    // à confirmer
    { key: 'lc',     label: 'LC — Longueur corsage' },               // à confirmer
    { key: 'dss',    label: 'DSS — Distance sein à sein' },          // à confirmer
    { key: 'lm',     label: 'LM — Longueur manche' },
    { key: 'tm',     label: 'TM — Tour de manche' },
    { key: 'tb',     label: 'TB — Tour de bassin' },
    { key: 'lr',     label: 'LR — Longueur robe' },
    { key: 'lj',     label: 'LJ — Longueur jupe' },
    { key: 'lg',     label: 'LG — Longueur gilet' },                 // à confirmer
    { key: 'lp',     label: 'LP — Longueur pantalon' },
    { key: 'tpg',    label: 'TPG — Tour de poignet' },
    { key: 'tour_pied', label: 'TP — Tour de pied' },                 // même abréviation "TP" que Tour de poitrine, clé différente pour ne pas les confondre
];

const FALLBACK_FIELDS: Record<string, { key: string; label: string }[]> = {
    // "Global" : la fiche générale de mesures du corps, indépendante d'un vêtement
    // précis — on y prend toutes les mesures de base du client une bonne fois,
    // à réutiliser ensuite pour n'importe quel type de vêtement.
    global: [...FICHE_PAPIER_FIELDS],
    robe: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'tour_bassin', label: 'Tour de bassin' },
        { key: 'longueur_robe', label: 'Longueur robe' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        ...FICHE_PAPIER_FIELDS,
    ],
    costume: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'carrure', label: 'Carrure' },
        { key: 'longueur_veste', label: 'Longueur veste' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        { key: 'longueur_pantalon', label: 'Longueur pantalon' },
        ...FICHE_PAPIER_FIELDS,
    ],
    chemise: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_cou', label: 'Tour de cou' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        { key: 'longueur_chemise', label: 'Longueur chemise' },
        ...FICHE_PAPIER_FIELDS,
    ],
    pantalon: [
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'tour_bassin', label: 'Tour de bassin' },
        { key: 'longueur_pantalon', label: 'Longueur pantalon' },
        ...FICHE_PAPIER_FIELDS,
    ],
    boubou: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'longueur_boubou', label: 'Longueur boubou' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        ...FICHE_PAPIER_FIELDS,
    ],
    autre: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
        ...FICHE_PAPIER_FIELDS,
    ],
};

/** Transforme un libellé libre en clé stable pour l'objet `mesures` (sans accents/espaces) */
const slugify = (label: string) =>
    label
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `champ_${Date.now()}`;

export const DynamicMeasurementForm: React.FC<Props> = ({
                                                            typeVetement, initialValues, initialUnite, onSubmit, onCancel, submitLabel,
                                                        }) => {
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const { getMeasurementFields, loadMeasurementFields } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [unite, setUnite] = useState<'cm' | 'pouces'>(initialUnite ?? 'cm');
    const [values, setValues] = useState<Record<string, string>>(
        () => Object.fromEntries(
            Object.entries(initialValues ?? {}).map(([k, v]) => [k, String(v)])
        )
    );

    // Champs ajoutés à la volée par le couturier (en plus des champs configurés/fallback)
    const [customFields, setCustomFields] = useState<{ key: string; label: string }[]>([]);
    const [newFieldLabel, setNewFieldLabel] = useState('');

    useEffect(() => {
        let mounted = true;
        (async () => {
            await loadMeasurementFields(typeVetement);
            if (mounted) setLoading(false);
        })();
        return () => { mounted = false; };
    }, [typeVetement]);

    const configuredFields = getMeasurementFields(typeVetement);
    const baseFields = configuredFields.length > 0
        ? configuredFields.map(f => ({ key: f.fieldKey, label: f.label }))
        : (FALLBACK_FIELDS[typeVetement] ?? FALLBACK_FIELDS.autre);

    // On combine les champs de base avec ceux déjà présents dans initialValues mais absents
    // du template (ex: fiche dupliquée / éditée qui avait des champs personnalisés), et avec
    // les champs ajoutés pendant cette session.
    const knownKeys = new Set(baseFields.map(f => f.key));
    const inheritedCustomFields = Object.keys(initialValues ?? {})
        .filter(k => !knownKeys.has(k))
        .map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));

    const fields = [...baseFields, ...inheritedCustomFields, ...customFields];

    const handleChange = (key: string, text: string) => {
        setValues(prev => ({ ...prev, [key]: text }));
    };

    const handleAddCustomField = () => {
        const label = newFieldLabel.trim();
        if (!label) return;
        let key = slugify(label);
        // Évite les collisions de clé si le même libellé (ou une variante) existe déjà
        const existingKeys = new Set(fields.map(f => f.key));
        let suffix = 2;
        while (existingKeys.has(key)) {
            key = `${slugify(label)}_${suffix}`;
            suffix += 1;
        }
        setCustomFields(prev => [...prev, { key, label }]);
        setNewFieldLabel('');
    };

    const handleRemoveCustomField = (key: string) => {
        setCustomFields(prev => prev.filter(f => f.key !== key));
        setValues(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const isCustom = (key: string) => customFields.some(f => f.key === key);

    const handleSubmit = () => {
        const mesures: Record<string, number> = {};
        for (const [key, val] of Object.entries(values)) {
            const num = parseFloat(val.replace(',', '.'));
            if (!isNaN(num)) mesures[key] = num;
        }
        onSubmit(mesures, unite);
    };

    if (loading) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator color={P.primary} />
            </View>
        );
    }

    return (
        <View>
            <View style={styles.uniteRow}>
                {(['cm', 'pouces'] as const).map(u => (
                    <TouchableOpacity
                        key={u}
                        style={[styles.uniteChip, unite === u && styles.uniteChipActive]}
                        onPress={() => setUnite(u)}
                    >
                        <Text style={[styles.uniteChipText, unite === u && styles.uniteChipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ gap: 10 }}>
                {fields.map(f => (
                    <View key={f.key} style={styles.fieldRow}>
                        <Text style={styles.fieldLabel} numberOfLines={1}>{f.label}</Text>
                        <TextInput
                            style={styles.fieldInput}
                            keyboardType="decimal-pad"
                            placeholder="—"
                            placeholderTextColor={P.sub}
                            value={values[f.key] ?? ''}
                            onChangeText={t => handleChange(f.key, t)}
                        />
                        <Text style={styles.fieldUnit}>{unite}</Text>
                        {isCustom(f.key) ? (
                            <TouchableOpacity
                                onPress={() => handleRemoveCustomField(f.key)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Feather name="x" size={16} color={P.error} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 16 }} />
                        )}
                    </View>
                ))}
            </View>

            {/* ── Ajouter un champ personnalisé ── */}
            <View style={styles.addFieldRow}>
                <TextInput
                    style={styles.addFieldInput}
                    placeholder="Ajouter un champ (ex: LTDUT, Emmanchure…)"
                    placeholderTextColor={P.sub}
                    value={newFieldLabel}
                    onChangeText={setNewFieldLabel}
                    onSubmitEditing={handleAddCustomField}
                    returnKeyType="done"
                />
                <TouchableOpacity style={styles.addFieldBtn} onPress={handleAddCustomField} activeOpacity={0.8}>
                    <Feather name="plus" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
                {onCancel && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                        <Text style={styles.cancelBtnText}>Annuler</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} onPress={handleSubmit}>
                    <Feather name="check" size={15} color="#fff" />
                    <Text style={styles.submitBtnText}>{submitLabel ?? 'Enregistrer les mesures'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const makeStyles = (P: Palette) => ({
    loadingBox: { paddingVertical: 24, alignItems: 'center' },

    uniteRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    uniteChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard },
    uniteChipActive: { backgroundColor: P.bg, borderColor: P.goldRim },
    uniteChipText: { fontSize: 12.5, color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    uniteChipTextActive: { color: '#fff' },

    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fieldLabel: { flex: 1, fontSize: 13, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
    fieldInput: {
        width: 84, borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: P.text,
        fontFamily: 'PlusJakartaSans_600SemiBold', backgroundColor: P.pageBg, textAlign: 'right',
    },
    fieldUnit: { fontSize: 11, color: P.sub, width: 40 },

    addFieldRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    addFieldInput: {
        flex: 1, borderWidth: 0.5, borderColor: P.borderHard, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: P.text,
        fontFamily: 'PlusJakartaSans_500Medium', backgroundColor: P.pageBg,
    },
    addFieldBtn: {
        width: 40, height: 40, borderRadius: 10, backgroundColor: P.bg,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.goldRim,
    },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: P.pageBg, alignItems: 'center' },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: P.bg, borderRadius: 16, paddingVertical: 12,
        borderWidth: 1, borderColor: P.goldRim,
    },
    submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
});