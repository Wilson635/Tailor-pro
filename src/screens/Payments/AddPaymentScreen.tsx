import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { COLORS, Typography, SPACING } from '@constants/theme';
import { Card, Button, Input, Header } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Payment } from '../../types';

type AddPaymentRouteProp = RouteProp<{ AddPayment: { clientId: string; orderId?: string } }, 'AddPayment'>;

const AddPaymentScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AddPaymentRouteProp>();
  const { clientId, orderId } = route.params;

  const { clients, orders, addPayment } = useAppStore();
  const client = clients.find((c) => c.id === clientId);
  const clientOrders = orders.filter((o) => o.clientId === clientId);

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(orderId);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOrder = clientOrders.find((o) => o.id === selectedOrderId);
  const remainingAmount = selectedOrder 
    ? selectedOrder.totalAmount - selectedOrder.paidAmount 
    : 0;

  const paymentMethods: { value: Payment['method']; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { value: 'cash', label: 'Especes', icon: 'dollar-sign' },
    { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
    { value: 'bank_transfer', label: 'Virement', icon: 'credit-card' },
    //{ value: 'card', label: 'Carte', icon: 'credit-card' },
    { value: 'other', label: 'Autre', icon: 'more-horizontal' },
  ];

  const handleSubmit = async () => {
    if (!selectedOrderId) {
      Alert.alert('Erreur', 'Veuillez selectionner une commande');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (amountValue > remainingAmount) {
      Alert.alert(
        'Attention',
        `Le montant depasse le reste a payer (${formatCurrency(remainingAmount)}). Voulez-vous continuer?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: () => submitPayment(amountValue) },
        ]
      );
      return;
    }

    submitPayment(amountValue);
  };

  const submitPayment = async (amountValue: number) => {
    setIsSubmitting(true);
    try {
      const newPayment: Payment = {
        id: `payment_${Date.now()}`,
        orderId: selectedOrderId!,
        clientId,
        amount: amountValue,
        date: new Date(),
        method: paymentMethod,
        notes: notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addPayment(newPayment);
      Alert.alert('Succes', 'Paiement enregistre avec succes', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFullAmount = () => {
    setAmount(remainingAmount.toString());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Enregistrer un paiement"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Info */}
          {client && (
            <Card style={styles.clientCard}>
              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientInitial}>
                    {client.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientPhone}>{client.phone}</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Order Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commande</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.ordersScroll}
            >
              {clientOrders.map((order) => {
                const remaining = order.totalAmount - order.paidAmount;
                const isSelected = selectedOrderId === order.id;
                
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[
                      styles.orderCard,
                      isSelected && styles.orderCardSelected,
                    ]}
                    onPress={() => setSelectedOrderId(order.id)}
                  >
                    <Text style={[
                      styles.orderTitle,
                      isSelected && styles.orderTitleSelected,
                    ]}>
                      {order.garmentType}
                    </Text>
                    <Text style={[
                      styles.orderAmount,
                      isSelected && styles.orderAmountSelected,
                    ]}>
                      Reste: {formatCurrency(remaining)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Montant</Text>
              {selectedOrder && remainingAmount > 0 && (
                <TouchableOpacity onPress={setFullAmount}>
                  <Text style={styles.fullAmountLink}>
                    Payer tout ({formatCurrency(remainingAmount)})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Input
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              rightIcon={<Text style={styles.currencyLabel}>FCFA</Text>}
            />
            {selectedOrder && (
              <Text style={styles.remainingText}>
                Reste a payer: {formatCurrency(remainingAmount)}
              </Text>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode de paiement</Text>
            <View style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    paymentMethod === method.value && styles.methodButtonSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Feather
                    name={method.icon}
                    size={20}
                    color={paymentMethod === method.value ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text style={[
                    styles.methodLabel,
                    paymentMethod === method.value && styles.methodLabelSelected,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
            <Input
              placeholder="Ajouter une note..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            title="Enregistrer le paiement"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedOrderId || !amount}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  clientCard: {
    marginBottom: SPACING.md,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInitial: {
    ...Typography.h3,
    color: COLORS.white,
  },
  clientDetails: {
    marginLeft: SPACING.md,
  },
  clientName: {
    ...Typography.h4,
    color: COLORS.text,
  },
  clientPhone: {
    ...Typography.bodySmall,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ordersScroll: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    minWidth: 140,
  },
  orderCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  orderTitle: {
    ...Typography.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  orderTitleSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  orderAmount: {
    ...Typography.bodySmall,
    color: COLORS.textSecondary,
  },
  orderAmountSelected: {
    color: COLORS.primary,
  },
  fullAmountLink: {
    ...Typography.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  currencyLabel: {
    ...Typography.body,
    color: COLORS.textSecondary,
  },
  remainingText: {
    ...Typography.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  methodLabel: {
    ...Typography.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  methodLabelSelected: {
    color: COLORS.white,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default AddPaymentScreen;
