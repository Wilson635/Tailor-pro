// ==========================================
// ÉCRAN MESURES - TailorPro
// ==========================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatDate } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {RootStackParamList} from "@/src/navigation/AppNavigator";
import {Measurements} from "@/src/types";

type Props = NativeStackScreenProps<RootStackParamList, 'Measurements'>;

// ==========================================
// SOUS-COMPOSANT : ligne de mesure
// ==========================================

interface MeasurementRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: number;
}

const MeasurementRow: React.FC<MeasurementRowProps> = ({ icon, label, value }) => (
    <View style={styles.measurementRow}>
      <View style={styles.measurementLeft}>
        <View style={styles.measurementIcon}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.measurementLabel}>{label}</Text>
      </View>
      <View style={styles.measurementRight}>
        <Text style={[styles.measurementValue, !value && styles.measurementValueEmpty]}>
          {value ?? '-'}
        </Text>
        {!!value && <Text style={styles.measurementUnit}>cm</Text>}
      </View>
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const MeasurementsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { getMeasurementsByClient, getClientById, loadMeasurements } = useAppStore();

  const measurements = getMeasurementsByClient(clientId);
  const client = getClientById(clientId);

  // Charge les mesures depuis Supabase au montage
  useEffect(() => {
    loadMeasurements(clientId);
  }, [clientId]);

  const measurementItems: Array<{
    key: keyof Measurements;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }> = [
    { key: 'chestCircumference', icon: 'body-outline', label: 'Tour de poitrine' },
    { key: 'waistCircumference', icon: 'resize-outline', label: 'Tour de taille' },
    { key: 'hipCircumference', icon: 'ellipse-outline', label: 'Tour de hanches' },
    { key: 'backWidth', icon: 'swap-horizontal-outline', label: 'Largeur dos' },
    { key: 'shoulderWidth', icon: 'remove-outline', label: 'Longueur épaule' },
    { key: 'sleeveLength', icon: 'arrow-forward-outline', label: 'Longueur manche' },
    { key: 'armCircumference', icon: 'radio-button-off-outline', label: 'Tour de bras' },
    { key: 'neckCircumference', icon: 'ellipse-outline', label: 'Tour de cou' },
    { key: 'dressLength', icon: 'resize-outline', label: 'Longueur robe' },
    { key: 'bustHeight', icon: 'arrow-up-outline', label: 'Hauteur buste' },
    { key: 'thighCircumference', icon: 'ellipse-outline', label: 'Tour de cuisse' },
  ];

  return (
      <View style={styles.container}>
        <Header
            title={`Mesures${client ? ` · ${client.fullName}` : ''}`}
            showBack
            onBackPress={() => navigation.goBack()}
            rightIcon="create-outline"
            onRightPress={() => navigation.navigate('AddMeasurements', { clientId })}
        />

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {/* Date d'enregistrement */}
          {measurements && (
              <View style={styles.dateHeader}>
                <View style={styles.dateLeft}>
                  <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
                  <Text style={styles.dateLabel}>Dernière mise à jour</Text>
                </View>
                <Text style={styles.dateValue}>{formatDate(measurements.recordedAt)}</Text>
              </View>
          )}

          {/* Carte des mesures */}
          <Card style={styles.measurementsCard}>
            {measurementItems.map((item, index) => (
                <React.Fragment key={item.key as string}>
                  <MeasurementRow
                      icon={item.icon}
                      label={item.label}
                      value={measurements?.[item.key] as number | undefined}
                  />
                  {index < measurementItems.length - 1 && (
                      <View style={styles.divider} />
                  )}
                </React.Fragment>
            ))}
          </Card>

          {/* Bouton mise à jour */}
          <Button
              title="Mettre à jour les mesures"
              onPress={() => navigation.navigate('AddMeasurements', { clientId })}
              fullWidth
              style={styles.updateButton}
          />
        </ScrollView>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // Date header
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  dateValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },

  // Measurements card
  measurementsCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  measurementIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  measurementRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  measurementValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  measurementValueEmpty: {
    color: COLORS.gray400,
    fontWeight: FONT_WEIGHTS.regular,
  },
  measurementUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 64,
  },

  // Update button
  updateButton: {
    marginTop: SPACING.xl,
  },
});
