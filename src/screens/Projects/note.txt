// ==========================================
// FORMULAIRE DE MENSURATIONS DYNAMIQUE — TailorPro
// Module 13 — les champs viennent de `garment_measurement_fields`
// (configurables par type de vêtement, cf. besoin n°16 du cahier des charges)
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppStore } from '@store/useAppStore';
import type { TypeVetement } from '../../types';

const P = {
    primary: '#6C3EB8', pageBg: '#F5F4FB', surface: '#FFFFFF',
    text: '#1A1033', sub: '#7C6FA8',
    border: 'rgba(108,62,184,0.10)', borderHard: 'rgba(108,62,184,0.15)',
};

interface Props {
    typeVetement: TypeVetement;
    initialValues?: Record<string, number>;
    initialUnite?: 'cm' | 'pouces';
    onSubmit: (mesures: Record<string, number>, unite: 'cm' | 'pouces') => void;
    onCancel?: () => void;
    submitLabel?: string;
}

/** Mesures de secours si `garment_measurement_fields` n'est pas encore chargé/seedé pour ce type */
const FALLBACK_FIELDS: Record<string, { key: string; label: string }[]> = {
    robe: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'tour_bassin', label: 'Tour de bassin' },
        { key: 'longueur_robe', label: 'Longueur robe' },
        { key: 'longueur_manche', label: 'Longueur manche' },
    ],
    costume: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'carrure', label: 'Carrure' },
        { key: 'longueur_veste', label: 'Longueur veste' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        { key: 'longueur_pantalon', label: 'Longueur pantalon' },
    ],
    chemise: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_cou', label: 'Tour de cou' },
        { key: 'longueur_manche', label: 'Longueur manche' },
        { key: 'longueur_chemise', label: 'Longueur chemise' },
    ],
    pantalon: [
        { key: 'tour_taille', label: 'Tour de taille' },
        { key: 'tour_bassin', label: 'Tour de bassin' },
        { key: 'longueur_pantalon', label: 'Longueur pantalon' },
    ],
    boubou: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'longueur_boubou', label: 'Longueur boubou' },
        { key: 'longueur_manche', label: 'Longueur manche' },
    ],
    autre: [
        { key: 'tour_poitrine', label: 'Tour de poitrine' },
        { key: 'tour_taille', label: 'Tour de taille' },
    ],
};

export const DynamicMeasurementForm: React.FC<Props> = ({
    typeVetement, initialValues, initialUnite, onSubmit, onCancel, submitLabel,
}) => {
    const { getMeasurementFields, loadMeasurementFields } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [unite, setUnite] = useState<'cm' | 'pouces'>(initialUnite ?? 'cm');
    const [values, setValues] = useState<Record<string, string>>(
        () => Object.fromEntries(
            Object.entries(initialValues ?? {}).map(([k, v]) => [k, String(v)])
        )
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            await loadMeasurementFields(typeVetement);
            if (mounted) setLoading(false);
        })();
        return () => { mounted = false; };
    }, [typeVetement]);

    const configuredFields = getMeasurementFields(typeVetement);
    const fields = configuredFields.length > 0
        ? configuredFields.map(f => ({ key: f.fieldKey, label: f.label }))
        : (FALLBACK_FIELDS[typeVetement] ?? FALLBACK_FIELDS.autre);

    const handleChange = (key: string, text: string) => {
        setValues(prev => ({ ...prev, [key]: text }));
    };

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
                        <Text style={styles.fieldLabel}>{f.label}</Text>
                        <TextInput
                            style={styles.fieldInput}
                            keyboardType="decimal-pad"
                            placeholder="—"
                            placeholderTextColor={P.sub}
                            value={values[f.key] ?? ''}
                            onChangeText={t => handleChange(f.key, t)}
                        />
                        <Text style={styles.fieldUnit}>{unite}</Text>
                    </View>
                ))}
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

const styles = StyleSheet.create({
    loadingBox: { paddingVertical: 24, alignItems: 'center' },

    uniteRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    uniteChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: P.pageBg, borderWidth: 0.5, borderColor: P.borderHard },
    uniteChipActive: { backgroundColor: P.primary, borderColor: P.primary },
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

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: P.pageBg, alignItems: 'center' },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: P.primary, borderRadius: 10, paddingVertical: 12,
    },
    submitBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
});
