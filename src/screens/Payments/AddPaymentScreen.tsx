// ==========================================
// ENREGISTRER UN PAIEMENT — TailorPro
// ==========================================

import React, { useMemo, useState } from 'react';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import {
  TYPES_PAIEMENT, TYPE_PAIEMENT_META, MODES_PAIEMENT, MODE_PAIEMENT_META,
  type TypePaiement, type ModePaiement,
} from '@constants/paiementConstants';
import { useThemedStyles, type Palette } from '@/src/theme';
import { Avatar } from '@components/ui';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPayment'>;

export const AddPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const { clientId, orderId } = route.params;

  const { getClientById, getOrdersByClient, addPayment } = useAppStore();
  const client = getClientById(clientId);
  const clientOrders = getOrdersByClient(clientId).filter(
    o => o.orderStatus !== 'cancelled' && o.orderStatus !== 'annulee',
  );

  const [selectedOrderId, setSelectedOrderId] = useState(orderId ?? clientOrders.find(o => o.remainingAmount > 0)?.id);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<ModePaiement>('cash');
  const [typePaiement, setTypePaiement] = useState<TypePaiement>('acompte');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedOrder = clientOrders.find(o => o.id === selectedOrderId);
  const remaining = selectedOrder?.remainingAmount ?? 0;

  const parsedAmount = useMemo(() => {
    const n = Number(amount.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const submit = async () => {
    if (!selectedOrderId || !selectedOrder) {
      showAlert('Commande', 'Choisissez une commande à solder.');
      return;
    }
    if (parsedAmount <= 0) {
      showAlert('Montant', 'Entrez un montant valide.');
      return;
    }
    const run = async () => {
      setSaving(true);
      const result = await addPayment({
        orderId: selectedOrderId,
        projectId: selectedOrder.projectId,
        clientId,
        amount: parsedAmount,
        method,
        typePaiement,
        notes: notes.trim() || undefined,
      });
      setSaving(false);
      if (!result) {
        showAlert('Erreur', "Impossible d'enregistrer le paiement.");
        return;
      }
      showSuccess('Paiement enregistré', `${formatCurrency(parsedAmount)} a été encaissé.`, () => navigation.goBack());
    };
    if (parsedAmount > remaining) {
      showAlert('Montant supérieur au reste', `Reste dû : ${formatCurrency(remaining)}. Continuer ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Enregistrer', onPress: run },
      ]);
      return;
    }
    await run();
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Atelier</Text>
          <Text style={styles.headerTitle}>Encaisser</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {client ? (
          <View style={styles.clientRow}>
            <Avatar source={client.photo} name={client.nom} size={44} />
            <View>
              <Text style={styles.clientName}>{client.nom}</Text>
              <Text style={styles.clientSub}>{client.telephone}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>Commande</Text>
        {clientOrders.length === 0 ? (
          <Text style={styles.emptyHint}>Aucune commande pour ce client.</Text>
        ) : (
          clientOrders.map((o) => {
            const on = o.id === selectedOrderId;
            return (
              <TouchableOpacity key={o.id} style={[styles.orderCard, on && styles.orderOn]} onPress={() => setSelectedOrderId(o.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderTitle, on && { color: '#fff' }]}>{o.numeroCommande ?? 'Commande'}</Text>
                  <Text style={[styles.orderSub, on && { color: 'rgba(255,255,255,0.7)' }]}>
                    Total {formatCurrency(o.totalPrice)} · reste {formatCurrency(o.remainingAmount)}
                  </Text>
                </View>
                {on ? <Ionicons name="checkmark" size={16} color={P.gold} /> : null}
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.section}>Montant</Text>
        <View style={styles.amountWrap}>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={P.muted}
            value={amount}
            onChangeText={setAmount}
          />
          {remaining > 0 && (
            <TouchableOpacity onPress={() => setAmount(String(remaining))}>
              <Text style={styles.soldeLink}>Solde {formatCurrency(remaining)}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.section}>Type</Text>
        <View style={styles.pills}>
          {TYPES_PAIEMENT.map((t) => {
            const on = typePaiement === t;
            return (
              <TouchableOpacity key={t} style={[styles.pill, on && styles.pillOn]} onPress={() => setTypePaiement(t)}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{TYPE_PAIEMENT_META[t].label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Mode</Text>
        <View style={styles.pills}>
          {MODES_PAIEMENT.map((m) => {
            const on = method === m;
            return (
              <TouchableOpacity key={m} style={[styles.pill, on && styles.pillOn]} onPress={() => setMethod(m)}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{MODE_PAIEMENT_META[m].label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Note (optionnel)</Text>
        <TextInput
          style={styles.note}
          value={notes}
          onChangeText={setNotes}
          placeholder="Référence, opérateur…"
          placeholderTextColor={P.muted}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={[styles.submit, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enregistrer le paiement</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: P.surface,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 0.5, borderColor: P.borderHard, marginTop: 4,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase' as const, marginBottom: 2,
  },
  headerTitle: { fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, letterSpacing: -0.6 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  clientRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: 8 },
  clientName: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  clientSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  section: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub,
    letterSpacing: 1.2, textTransform: 'uppercase' as const, marginTop: 18, marginBottom: 8,
  },
  emptyHint: { fontSize: 13, color: P.sub, fontFamily: 'PlusJakartaSans_500Medium' },
  orderCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: P.surface, borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  orderOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  orderTitle: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  orderSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub, marginTop: 2 },
  amountWrap: {
    backgroundColor: P.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  amountInput: { fontSize: 28, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text, paddingVertical: 6 },
  soldeLink: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.primary, marginBottom: 8 },
  pills: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
  },
  pillOn: { backgroundColor: P.bg, borderColor: P.goldRim },
  pillText: { fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: P.sub },
  pillTextOn: { color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold' },
  note: {
    backgroundColor: P.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: P.text,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: P.borderHard, backgroundColor: P.pageBg },
  submit: {
    backgroundColor: P.bg, borderRadius: 16, paddingVertical: 16, alignItems: 'center' as const,
    borderWidth: 1, borderColor: P.goldRim,
  },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});

export default AddPaymentScreen;
