// ==========================================
// ÉCRAN AJOUTER DES MESURES - TailorPro
// ==========================================
// ==========================================
// ÉCRAN AJOUTER / MODIFIER DES MESURES - TailorPro
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Input, Button, Card } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MeasurementsFormData } from '../../types';
import { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMeasurements'>;

// ==========================================
// SOUS-COMPOSANT : champ de saisie
// ==========================================

interface MeasurementInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

const MeasurementInput: React.FC<MeasurementInputProps> = ({
                                                             icon,
                                                             label,
                                                             value,
                                                             onChangeText,
                                                           }) => (
    <View style={styles.measurementInput}>
      <View style={styles.measurementLeft}>
        <View style={styles.measurementIcon}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.measurementLabel}>{label}</Text>
      </View>
      <View style={styles.inputContainer}>
        <Input
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholder="0"
            suffix="cm"
            style={styles.input}
        />
      </View>
    </View>
);

// ==========================================
// ÉCRAN PRINCIPAL
// ==========================================

export const AddMeasurementsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const { saveMeasurements, getMeasurementsByClient, loadMeasurements } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  // Pré-remplit le formulaire si des mesures existent déjà
  const existing = getMeasurementsByClient(clientId);

  const [formData, setFormData] = useState<MeasurementsFormData>({
    chestCircumference:  existing?.chestCircumference  ? String(existing.chestCircumference)  : '',
    waistCircumference:  existing?.waistCircumference  ? String(existing.waistCircumference)  : '',
    hipCircumference:    existing?.hipCircumference    ? String(existing.hipCircumference)    : '',
    backWidth:           existing?.backWidth           ? String(existing.backWidth)           : '',
    shoulderWidth:       existing?.shoulderWidth       ? String(existing.shoulderWidth)       : '',
    sleeveLength:        existing?.sleeveLength        ? String(existing.sleeveLength)        : '',
    armCircumference:    existing?.armCircumference    ? String(existing.armCircumference)    : '',
    neckCircumference:   existing?.neckCircumference   ? String(existing.neckCircumference)   : '',
    dressLength:         existing?.dressLength         ? String(existing.dressLength)         : '',
    bustHeight:          existing?.bustHeight          ? String(existing.bustHeight)          : '',
    thighCircumference:  existing?.thighCircumference  ? String(existing.thighCircumference)  : '',
  });

  // Charge depuis Supabase si pas encore en store, puis pré-remplit
  useEffect(() => {
    if (!existing) {
      loadMeasurements(clientId).then(() => {
        const loaded = getMeasurementsByClient(clientId);
        if (loaded) {
          setFormData({
            chestCircumference:  loaded.chestCircumference  ? String(loaded.chestCircumference)  : '',
            waistCircumference:  loaded.waistCircumference  ? String(loaded.waistCircumference)  : '',
            hipCircumference:    loaded.hipCircumference    ? String(loaded.hipCircumference)    : '',
            backWidth:           loaded.backWidth           ? String(loaded.backWidth)           : '',
            shoulderWidth:       loaded.shoulderWidth       ? String(loaded.shoulderWidth)       : '',
            sleeveLength:        loaded.sleeveLength        ? String(loaded.sleeveLength)        : '',
            armCircumference:    loaded.armCircumference    ? String(loaded.armCircumference)    : '',
            neckCircumference:   loaded.neckCircumference   ? String(loaded.neckCircumference)   : '',
            dressLength:         loaded.dressLength         ? String(loaded.dressLength)         : '',
            bustHeight:          loaded.bustHeight          ? String(loaded.bustHeight)          : '',
            thighCircumference:  loaded.thighCircumference  ? String(loaded.thighCircumference)  : '',
          });
        }
      });
    }
  }, [clientId]);

  const measurementFields: Array<{
    key: keyof MeasurementsFormData;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }> = [
    { key: 'chestCircumference',  icon: 'body-outline',             label: 'Tour de poitrine' },
    { key: 'waistCircumference',  icon: 'resize-outline',           label: 'Tour de taille'   },
    { key: 'hipCircumference',    icon: 'ellipse-outline',          label: 'Tour de hanches'  },
    { key: 'backWidth',           icon: 'swap-horizontal-outline',  label: 'Largeur dos'      },
    { key: 'shoulderWidth',       icon: 'remove-outline',           label: 'Longueur épaule'  },
    { key: 'sleeveLength',        icon: 'arrow-forward-outline',    label: 'Longueur manche'  },
    { key: 'armCircumference',    icon: 'radio-button-off-outline', label: 'Tour de bras'     },
    { key: 'neckCircumference',   icon: 'ellipse-outline',          label: 'Tour de cou'      },
    { key: 'dressLength',         icon: 'resize-outline',           label: 'Longueur robe'    },
    { key: 'bustHeight',          icon: 'arrow-up-outline',         label: 'Hauteur buste'    },
    { key: 'thighCircumference',  icon: 'ellipse-outline',          label: 'Tour de cuisse'   },
  ];

  const updateField = (key: keyof MeasurementsFormData, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [key]: numericValue }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await saveMeasurements(clientId, {
        recordedAt: new Date(),
        chestCircumference: formData.chestCircumference ? parseInt(formData.chestCircumference) : undefined,
        waistCircumference: formData.waistCircumference ? parseInt(formData.waistCircumference) : undefined,
        hipCircumference:   formData.hipCircumference   ? parseInt(formData.hipCircumference)   : undefined,
        backWidth:          formData.backWidth          ? parseInt(formData.backWidth)          : undefined,
        shoulderWidth:      formData.shoulderWidth      ? parseInt(formData.shoulderWidth)      : undefined,
        sleeveLength:       formData.sleeveLength       ? parseInt(formData.sleeveLength)       : undefined,
        armCircumference:   formData.armCircumference   ? parseInt(formData.armCircumference)   : undefined,
        neckCircumference:  formData.neckCircumference  ? parseInt(formData.neckCircumference)  : undefined,
        dressLength:        formData.dressLength        ? parseInt(formData.dressLength)        : undefined,
        bustHeight:         formData.bustHeight         ? parseInt(formData.bustHeight)         : undefined,
        thighCircumference: formData.thighCircumference ? parseInt(formData.thighCircumference) : undefined,
      });

      if (result) {
        Alert.alert(
            'Mesures enregistrées',
            'Les mesures ont bien été sauvegardées.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les mesures. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <Header
            title={existing ? 'Modifier les mesures' : 'Ajouter des mesures'}
            variant="primary"
            showBack
            onBackPress={() => navigation.goBack()}
        />

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            {measurementFields.map((field, index) => (
                <View key={field.key}>
                  <MeasurementInput
                      icon={field.icon}
                      label={field.label}
                      value={formData[field.key] || ''}
                      onChangeText={(value) => updateField(field.key, value)}
                  />
                  {index < measurementFields.length - 1 && (
                      <View style={styles.divider} />
                  )}
                </View>
            ))}
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
              title={isLoading ? 'Enregistrement...' : 'Enregistrer les mesures'}
              onPress={handleSubmit}
              fullWidth
              loading={isLoading}
          />
        </View>
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
  card: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  measurementInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
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
    flex: 1,
  },
  inputContainer: {
    width: 100,
  },
  input: {
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 64,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});



/********
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Input, Button, Card } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import type { MeasurementsFormData } from '../../types';

interface AddMeasurementsScreenProps {
  clientId: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

interface MeasurementInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

const MeasurementInput: React.FC<MeasurementInputProps> = ({
  icon,
  label,
  value,
  onChangeText,
}) => (
  <View style={styles.measurementInput}>
    <View style={styles.measurementLeft}>
      <View style={styles.measurementIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.measurementLabel}>{label}</Text>
    </View>
    <View style={styles.inputContainer}>
      <Input
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        suffix="cm"
        style={styles.input}
      />
    </View>
  </View>
);

export const AddMeasurementsScreen: React.FC<AddMeasurementsScreenProps> = ({
  clientId,
  onBack,
  onSuccess,
}) => {
  const { setMeasurements } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MeasurementsFormData>({
    chestCircumference: '',
    waistCircumference: '',
    hipCircumference: '',
    backWidth: '',
    shoulderWidth: '',
    sleeveLength: '',
    armCircumference: '',
    neckCircumference: '',
    dressLength: '',
    bustHeight: '',
    thighCircumference: '',
  });

  const measurementFields: Array<{
    key: keyof MeasurementsFormData;
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
  ];

  const updateField = (key: keyof MeasurementsFormData, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [key]: numericValue }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const measurements = {
        id: Date.now().toString(),
        clientId,
        recordedAt: new Date(),
        chestCircumference: formData.chestCircumference ? parseInt(formData.chestCircumference) : undefined,
        waistCircumference: formData.waistCircumference ? parseInt(formData.waistCircumference) : undefined,
        hipCircumference: formData.hipCircumference ? parseInt(formData.hipCircumference) : undefined,
        backWidth: formData.backWidth ? parseInt(formData.backWidth) : undefined,
        shoulderWidth: formData.shoulderWidth ? parseInt(formData.shoulderWidth) : undefined,
        sleeveLength: formData.sleeveLength ? parseInt(formData.sleeveLength) : undefined,
        armCircumference: formData.armCircumference ? parseInt(formData.armCircumference) : undefined,
        neckCircumference: formData.neckCircumference ? parseInt(formData.neckCircumference) : undefined,
        dressLength: formData.dressLength ? parseInt(formData.dressLength) : undefined,
        bustHeight: formData.bustHeight ? parseInt(formData.bustHeight) : undefined,
        thighCircumference: formData.thighCircumference ? parseInt(formData.thighCircumference) : undefined,
      };
      
      setMeasurements(clientId, measurements);
      onSuccess?.();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les mesures');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Ajouter des mesures"
        variant="primary"
        showBack
        onBackPress={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          {measurementFields.map((field, index) => (
            <View key={field.key}>
              <MeasurementInput
                icon={field.icon}
                label={field.label}
                value={formData[field.key] || ''}
                onChangeText={(value) => updateField(field.key, value)}
              />
              {index < measurementFields.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Submit Button
      <View style={styles.footer}>
        <Button
          title="Enregistrer les mesures"
          onPress={handleSubmit}
          fullWidth
          loading={isLoading}
        />
      </View>
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
  card: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  measurementInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
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
    flex: 1,
  },
  inputContainer: {
    width: 100,
  },
  input: {
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 64,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});*/
