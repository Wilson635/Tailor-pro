// ==========================================
// ÉCRAN PAIEMENTS - TailorPro
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
import { Header, Card, Badge, Button } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatDate } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '@constants/theme';
import { PAYMENT_STATUS_LABELS } from '@constants/theme';

interface PaymentsScreenProps {
  clientId: string;
  onBack?: () => void;
  onAddPayment?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  clientId,
  onBack,
  onAddPayment,
}) => {
  const { getClientById, getOrdersByClient, getPaymentsByClient } = useAppStore();
  const client = getClientById(clientId);
  const orders = getOrdersByClient(clientId);
  const payments = getPaymentsByClient(clientId);

  // Calculate totals
  const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  
  const paymentStatus = remainingAmount === 0 ? 'paid' : 
                        totalPaid > 0 ? 'partial' : 'unpaid';

  return (
    <View style={styles.container}>
      <Header
        title="Paiements"
        showBack
        onBackPress={onBack}
        rightIcon="add"
        onRightPress={onAddPayment}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Montant total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Payé</Text>
              <Text style={styles.summaryItemValue}>{formatCurrency(totalPaid)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Reste à payer</Text>
              <Text style={[styles.summaryItemValue, styles.remainingAmount]}>
                {formatCurrency(remainingAmount)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Statut</Text>
            <Badge
              label={PAYMENT_STATUS_LABELS[paymentStatus]}
              variant={
                paymentStatus === 'paid' ? 'success' :
                paymentStatus === 'partial' ? 'warning' : 'error'
              }
              size="md"
            />
          </View>
        </Card>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des paiements</Text>
          
          {payments.length > 0 ? (
            <Card padding="none">
              {payments.map((payment, index) => (
                <View key={payment.id}>
                  <TouchableOpacity style={styles.paymentItem}>
                    <View style={styles.paymentDate}>
                      <Text style={styles.paymentDateText}>
                        {formatDate(payment.date)}
                      </Text>
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentLabel}>Avance</Text>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {index < payments.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.gray300} />
              <Text style={styles.emptyText}>Aucun paiement enregistré</Text>
            </View>
          )}
        </View>

        {/* Add Payment Button */}
        <Button
          title="+ Enregistrer un paiement"
          onPress={onAddPayment || (() => {})}
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
  
  // Summary Card
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryItemLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  summaryItemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  remainingAmount: {
    color: COLORS.error,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  
  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  
  // Payment Item
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  paymentDate: {
    flex: 1,
  },
  paymentDateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  paymentLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray400,
  },
  paymentAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: SPACING.lg,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
    marginTop: SPACING.md,
  },
  
  // Add Button
  addButton: {
    marginTop: SPACING.md,
  },
});
