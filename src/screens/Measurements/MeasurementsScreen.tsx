// ==========================================
// ÉCRAN MESURES - TailorPro
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { formatDate } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { MEASUREMENT_LABELS } from '../../constants/theme';

interface MeasurementsScreenProps {
  clientId: string;
  onBack?: () => void;
  onEdit?: () => void;
  onAddNew?: () => void;
}

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
      <Text style={styles.measurementValue}>{value || '-'}</Text>
      <Text style={styles.measurementUnit}>cm</Text>
    </View>
  </View>
);

export const MeasurementsScreen: React.FC<MeasurementsScreenProps> = ({
  clientId,
  onBack,
  onEdit,
  onAddNew,
}) => {
  const { getMeasurementsByClient, getClientById } = useAppStore();
  const measurements = getMeasurementsByClient(clientId);
  const client = getClientById(clientId);

  const measurementItems: Array<{
    key: string;
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
        title="Mesures"
        showBack
        onBackPress={onBack}
        rightIcon="create-outline"
        onRightPress={onEdit}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        {measurements && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateLabel}>Mesures enregistrées</Text>
            <Text style={styles.dateValue}>{formatDate(measurements.recordedAt)}</Text>
          </View>
        )}

        {/* Measurements Card */}
        <Card style={styles.measurementsCard}>
          {measurementItems.map((item, index) => (
            <React.Fragment key={item.key}>
              <MeasurementRow
                icon={item.icon}
                label={item.label}
                value={measurements?.[item.key as keyof typeof measurements] as number | undefined}
              />
              {index < measurementItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* Add New Button */}
        <Button
          title="+ Ajouter de nouvelles mesures"
          onPress={onAddNew || (() => {})}
          fullWidth
          style={styles.addButton}
        />
      </ScrollView>
    </View>
  );
};

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
  
  // Date Header
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  
  // Measurements Card
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
  measurementUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 64,
  },
  
  // Add Button
  addButton: {
    marginTop: SPACING.xl,
  },
});
