// ==========================================
// CHOIX DES MENSURATIONS POUR UN VÊTEMENT — TailorPro
// Module 13 — besoins n°5, 6 et 15 du cahier des charges :
//   "Une fiche de mensuration récente existe. Voulez-vous l'utiliser ?"
//   → Utiliser cette fiche / Prendre de nouvelles mesures / Voir les anciennes mesures
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useThemedStyles, type Palette } from '@/src/theme';
import { ficheService, mapFiche } from '@services/supabaseService';
import { DynamicMeasurementForm } from './DynamicMeasurementForm';
import type { FicheMensuration, MeasurementChoiceResult, TypeVetement } from '../../types';

interface Props {
    visible: boolean;
    /** Peut être vide pour une personne temporaire pas encore promue en client :
     *  dans ce cas, aucune fiche existante n'est recherchée, on saisit directement de nouvelles mesures. */
    clientId?: string;
    typeVetement: TypeVetement;
    onClose: () => void;
    onChoice: (choice: MeasurementChoiceResult) => void;
}

type ViewState = 'loading' | 'propose' | 'preview' | 'new_form';

export const MeasurementPickerModal: React.FC<Props> = ({ visible, clientId, typeVetement, onClose, onChoice }) => {
    const { colors: P, styles } = useThemedStyles(makeStyles);
    const [view, setView] = useState<ViewState>('loading');
    const [existingFiche, setExistingFiche] = useState<FicheMensuration | null>(null);

    useEffect(() => {
        if (!visible) return;
        setView('loading');
        setExistingFiche(null);

        if (!clientId) {
            // Personne pas encore rattachée à un client : pas de fiche à chercher.
            setView('new_form');
            return;
        }

        (async () => {
            const { data } = await ficheService.getActiveForType(clientId, typeVetement);
            if (data) {
                setExistingFiche(mapFiche(data as Record<string, unknown>));
                setView('propose');
            } else {
                setView('new_form');
            }
        })();
    }, [visible, clientId, typeVetement]);

    const handleUseExisting = () => {
        if (!existingFiche) return;
        onChoice({ mode: 'use_existing', sourceFicheId: existingFiche.id });
        onClose();
    };

    const handleNewMeasurements = (mesures: Record<string, number>, unite: 'cm' | 'pouces') => {
        onChoice({ mode: 'new_measurements', mesures, unite });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.headRow}>
                        <Text style={styles.title}>Mensurations</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={20} color={P.sub} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                        {view === 'loading' && (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator color={P.primary} />
                            </View>
                        )}

                        {view === 'propose' && existingFiche && (
                            <View style={{ gap: 12 }}>
                                <View style={styles.noticeBox}>
                                    <Feather name="info" size={16} color={P.primary} />
                                    <Text style={styles.noticeText}>
                                        Une fiche récente existe, prise le {existingFiche.datePrise.toLocaleDateString('fr-FR')}.
                                        Voulez-vous l'utiliser ?
                                    </Text>
                                </View>

                                <TouchableOpacity style={styles.primaryBtn} onPress={handleUseExisting}>
                                    <Feather name="check-circle" size={16} color="#fff" />
                                    <Text style={styles.primaryBtnText}>Utiliser cette fiche</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setView('new_form')}>
                                    <Feather name="edit-3" size={16} color={P.primary} />
                                    <Text style={styles.secondaryBtnText}>Prendre de nouvelles mesures</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.tertiaryBtn} onPress={() => setView('preview')}>
                                    <Feather name="eye" size={15} color={P.sub} />
                                    <Text style={styles.tertiaryBtnText}>Voir les anciennes mesures</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {view === 'preview' && existingFiche && (
                            <View style={{ gap: 10 }}>
                                <Text style={styles.previewSub}>
                                    Fiche du {existingFiche.datePrise.toLocaleDateString('fr-FR')} — {existingFiche.unite}
                                </Text>
                                {Object.entries(existingFiche.mesures).map(([key, val]) => (
                                    <View key={key} style={styles.previewRow}>
                                        <Text style={styles.previewLabel}>{key.replace(/_/g, ' ')}</Text>
                                        <Text style={styles.previewValue}>{val} {existingFiche.unite}</Text>
                                    </View>
                                ))}

                                <View style={styles.actionsRow}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setView('propose')}>
                                        <Text style={styles.cancelBtnText}>Retour</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleUseExisting}>
                                        <Text style={styles.primaryBtnText}>Utiliser cette fiche</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {view === 'new_form' && (
                            <View>
                                {!existingFiche && (
                                    <View style={styles.noticeBox}>
                                        <Feather name="info" size={16} color={P.primary} />
                                        <Text style={styles.noticeText}>
                                            Aucune fiche récente pour ce type de vêtement. Renseigne les mesures ci-dessous.
                                        </Text>
                                    </View>
                                )}
                                <DynamicMeasurementForm
                                    typeVetement={typeVetement}
                                    onSubmit={handleNewMeasurements}
                                    onCancel={existingFiche ? () => setView('propose') : onClose}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const makeStyles = (P: Palette) => ({
    overlay: { flex: 1, backgroundColor: P.overlay, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: P.surface, borderRadius: 20, padding: 18, borderWidth: 0.5, borderColor: P.borderHard },
    headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    title: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },

    loadingBox: { paddingVertical: 32, alignItems: 'center' },

    noticeBox: {
        flexDirection: 'row', gap: 8, backgroundColor: P.goldBg,
        borderRadius: 12, padding: 12, alignItems: 'flex-start',
    },
    noticeText: { flex: 1, fontSize: 12.5, color: P.text, fontFamily: 'PlusJakartaSans_500Medium', lineHeight: 18 },

    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: P.bg, borderRadius: 16, paddingVertical: 13,
        borderWidth: 1, borderColor: P.goldRim,
    },
    primaryBtnText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5 },

    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: P.goldBg, borderRadius: 10, paddingVertical: 13,
    },
    secondaryBtnText: { color: P.primary, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5 },

    tertiaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    tertiaryBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5 },

    previewSub: { fontSize: 12, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 4 },
    previewRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: P.border,
    },
    previewLabel: { fontSize: 13, color: P.text, fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'capitalize' },
    previewValue: { fontSize: 13, color: P.text, fontFamily: 'PlusJakartaSans_700Bold' },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    cancelBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 10, backgroundColor: P.pageBg, alignItems: 'center' },
    cancelBtnText: { color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' },
});
