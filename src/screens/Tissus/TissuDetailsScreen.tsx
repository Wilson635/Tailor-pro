// ==========================================
// ÉCRAN DÉTAILS TISSU — TailorPro (Module 6)
// ==========================================

import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import {
  TYPE_TISSU_LABELS, TYPE_TISSU_COLORS, TYPE_TISSU_ICONS,
} from '@constants/tissuConstants';
import { STATUT_REALISATION_LABELS, STATUT_REALISATION_COLORS } from '@constants/realisationConstants';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TissuDetails'>;

const C = {
  purple900: '#1A0033', purple600: '#534AB7', purple100: '#EEEDFE',
  gold: '#D4AF37', bg: '#FFFFFF', surface: '#F7F6F4', border: '#EBEBEB',
  text: '#0E0B14', textSec: '#7A7787', textTer: '#B0ACBA', error: '#EF4444',
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={infoS.row}>
    <Ionicons name={icon as any} size={15} color={C.purple600} />
    <View style={{ flex: 1 }}>
      <Text style={infoS.label}>{label}</Text>
      <Text style={infoS.value}>{value}</Text>
    </View>
  </View>
);
const infoS = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'flex-start' },
  label: { fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: C.text, fontWeight: '500', marginTop: 1 },
});

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================
export const TissuDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { tissuId } = route.params;

  const { getTissuById, getTissusByFournisseur, getRealisationsByTissu, deleteTissu } = useAppStore();
  const tissu = getTissuById(tissuId);

  const realisationsLiees  = useMemo(() => getRealisationsByTissu(tissuId), [tissuId]);
  const histoFournisseur   = useMemo(
    () => tissu?.fournisseur ? getTissusByFournisseur(tissu.fournisseur).filter(t => t.id !== tissuId) : [],
    [tissu, tissuId]
  );

  if (!tissu) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textTer} />
        <Text style={{ color: C.textSec, marginTop: 12 }}>Tissu introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: C.purple600, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = TYPE_TISSU_COLORS[tissu.typeTissu] ?? C.textSec;
  const typeLabel = TYPE_TISSU_LABELS[tissu.typeTissu] ?? tissu.typeTissu;

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le tissu',
      realisationsLiees.length > 0
        ? `Ce tissu est utilisé dans ${realisationsLiees.length} réalisation(s). Continuer ?`
        : 'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTissu(tissuId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tissu.nomCommercial}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('EditTissu', { tissuId })}
          >
            <Ionicons name="create-outline" size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo / Hero */}
        {tissu.photo ? (
          <Image source={{ uri: tissu.photo }} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: typeColor + '22' }]}>
            <Ionicons name={TYPE_TISSU_ICONS[tissu.typeTissu] as any ?? 'layers-outline'} size={72} color={typeColor} />
            <View style={[styles.typePill, { backgroundColor: typeColor + '33' }]}>
              <Text style={[styles.typePillText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
          </View>
        )}

        <View style={styles.body}>
          {/* Fiche tissu */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fiche tissu</Text>
            <InfoRow icon="layers-outline"    label="Type"        value={typeLabel} />
            {tissu.couleur && (
              <InfoRow icon="color-palette-outline" label="Couleur"    value={tissu.couleur} />
            )}
            {tissu.fournisseur && (
              <InfoRow icon="storefront-outline" label="Fournisseur" value={tissu.fournisseur} />
            )}
            <InfoRow icon="pricetag-outline"  label="Prix unitaire"
              value={`${tissu.prixUnitaire.toFixed(0)} F CFA / m`} />
            {tissu.quantiteUtilisee > 0 && (
              <InfoRow icon="cut-outline" label="Quantité utilisée"
                value={`${tissu.quantiteUtilisee} m`} />
            )}
            <InfoRow icon="calendar-outline" label="Ajouté le"
              value={tissu.createdAt.toLocaleDateString('fr-FR')} />
          </View>

          {/* Réalisations liées */}
          {realisationsLiees.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Réalisations utilisant ce tissu ({realisationsLiees.length})
              </Text>
              {realisationsLiees.map(r => {
                const sc = STATUT_REALISATION_COLORS[r.statut];
                const sl = STATUT_REALISATION_LABELS[r.statut];
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.realItem}
                    onPress={() => navigation.navigate('RealisationDetails', {
                      realisationId: r.id,
                      clientId: r.clientId,
                    })}
                  >
                    {r.photos[0] ? (
                      <Image source={{ uri: r.photos[0] }} style={styles.realThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.realThumb, styles.realThumbEmpty]}>
                        <Ionicons name="shirt-outline" size={18} color={C.textTer} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.realName} numberOfLines={1}>
                        {r.tissuLabel ?? r.couleur ?? 'Réalisation'}
                      </Text>
                      <Text style={styles.realDate}>
                        {new Date(r.dateCreation).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <View style={[styles.statutBadge, { backgroundColor: sc + '22' }]}>
                      <Text style={[styles.statutText, { color: sc }]}>{sl}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.textTer} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Historique fournisseur */}
          {tissu.fournisseur && histoFournisseur.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Autres tissus de « {tissu.fournisseur} » ({histoFournisseur.length})
              </Text>
              {histoFournisseur.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.histoItem}
                  onPress={() => navigation.navigate('TissuDetails', { tissuId: t.id })}
                >
                  <View style={[styles.histoDot, {
                    backgroundColor: TYPE_TISSU_COLORS[t.typeTissu] ?? C.textTer,
                  }]} />
                  <Text style={styles.histoName} numberOfLines={1}>{t.nomCommercial}</Text>
                  <Text style={styles.histoType}>
                    {TYPE_TISSU_LABELS[t.typeTissu] ?? t.typeTissu}
                  </Text>
                  <Text style={styles.histoPrix}>{t.prixUnitaire.toFixed(0)} F/m</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textTer} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => navigation.navigate('EditTissu', { tissuId })}
        >
          <Ionicons name="create-outline" size={18} color={C.gold} />
          <Text style={styles.footerBtnText}>Modifier ce tissu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: C.text },
  headerActions:{ flexDirection: 'row', gap: 4 },
  iconBtn:      { padding: 6, borderRadius: 8, backgroundColor: C.surface },

  heroImg:      { width: '100%', height: 220 },
  heroPlaceholder: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  typePill:     { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  typePillText: { fontSize: 14, fontWeight: '700' },

  body:         { padding: 16, gap: 12 },
  card:         { backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: C.textSec, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 8 },

  realItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: C.border },
  realThumb:    { width: 44, height: 44, borderRadius: 10 },
  realThumbEmpty: { backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  realName:     { fontSize: 14, fontWeight: '600', color: C.text },
  realDate:     { fontSize: 12, color: C.textSec },
  statutBadge:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statutText:   { fontSize: 11, fontWeight: '600' },

  histoItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: C.border },
  histoDot:     { width: 10, height: 10, borderRadius: 5 },
  histoName:    { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  histoType:    { fontSize: 12, color: C.textSec },
  histoPrix:    { fontSize: 12, color: C.textSec, marginLeft: 4 },

  footer:       { borderTopWidth: 1, borderTopColor: C.border, padding: 16, backgroundColor: C.bg },
  footerBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple900, borderRadius: 14, paddingVertical: 14 },
  footerBtnText:{ fontSize: 16, fontWeight: '700', color: C.gold },
});
