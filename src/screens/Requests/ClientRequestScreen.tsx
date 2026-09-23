// ==========================================
// DEMANDE DEVIS / RDV — vue client
// ==========================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '@store/useAppStore';
import type { RootStackParamList } from '@/src/navigation/AppNavigator';
import type { ClientRequestKind } from '@/src/types';
import { useThemedStyles, type Palette } from '@/src/theme';
import { showAlert, showSuccess } from '@/src/context/DialogContext';
import { t } from '@/src/i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientRequest'>;

const KINDS: { key: ClientRequestKind; label: string; hint: string }[] = [
  { key: 'devis', label: 'Devis', hint: 'Prix et délai pour une confection' },
  { key: 'rdv', label: 'Rendez-vous', hint: 'Prise de mesures ou essayage' },
];

export const ClientRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tailorId, kind: initialKind, modelId, modelName } = route.params;
  const insets = useSafeAreaInsets();
  const { colors: P, styles } = useThemedStyles(makeStyles);
  const atelier = useAppStore(s => s.getAtelierById(tailorId));
  const createClientRequest = useAppStore(s => s.createClientRequest);

  const [kind, setKind] = useState<ClientRequestKind>(initialKind ?? 'devis');
  const [message, setMessage] = useState(
    modelName ? `Je suis intéressé(e) par « ${modelName} ».` : '',
  );
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);

  const atelierLabel = atelier?.atelierName || atelier?.displayName || 'Atelier';

  const canSend = useMemo(() => message.trim().length >= 8, [message]);

  const submit = async () => {
    if (!canSend) {
      showAlert('Message requis', 'Décrivez un peu votre besoin (au moins 8 caractères).');
      return;
    }
    setBusy(true);
    const preferredAt = when.trim() ? new Date(when) : null;
    const result = await createClientRequest({
      couturierId: tailorId,
      kind,
      message: message.trim(),
      modelId: modelId ?? null,
      preferredAt: preferredAt && !Number.isNaN(preferredAt.getTime()) ? preferredAt : null,
    });
    setBusy(false);
    if (!result.ok) {
      showAlert('Envoi impossible', result.error ?? t('requests.sendError'));
      return;
    }
    showSuccess(t('requests.sentTitle'), t('requests.sentBody'));
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={P.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{atelierLabel}</Text>
          <Text style={styles.title}>{t('requests.new')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.kindRow}>
          {KINDS.map(k => {
            const on = kind === k.key;
            return (
              <TouchableOpacity
                key={k.key}
                style={[styles.kindCard, on && styles.kindCardOn]}
                onPress={() => setKind(k.key)}
              >
                <Text style={[styles.kindLabel, on && styles.kindLabelOn]}>{k.label}</Text>
                <Text style={styles.kindHint}>{k.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!modelName && (
          <View style={styles.modelChip}>
            <Feather name="shopping-bag" size={14} color={P.gold} />
            <Text style={styles.modelChipText}>{modelName}</Text>
          </View>
        )}

        <Text style={styles.label}>{t('requests.message')}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tissu, occasion, délai souhaité…"
          placeholderTextColor={P.muted}
          style={styles.input}
          multiline
        />

        {kind === 'rdv' && (
          <>
            <Text style={styles.label}>{t('requests.when')}</Text>
            <TextInput
              value={when}
              onChangeText={setWhen}
              placeholder="2026-09-28 10:00"
              placeholderTextColor={P.muted}
              style={styles.inputSingle}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submit, !canSend && { opacity: 0.5 }]}
          onPress={submit}
          disabled={busy || !canSend}
        >
          {busy ? (
            <ActivityIndicator color={P.gold} />
          ) : (
            <Text style={styles.submitText}>{t('requests.send')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const makeStyles = (P: Palette) => ({
  root: { flex: 1, backgroundColor: P.pageBg },
  header: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: P.surface,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.2, textTransform: 'uppercase' as const,
  },
  title: { fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  content: { paddingHorizontal: 20, gap: 12 },
  kindRow: { flexDirection: 'row' as const, gap: 10 },
  kindCard: {
    flex: 1, padding: 14, borderRadius: 16, backgroundColor: P.surface,
    borderWidth: 0.5, borderColor: P.borderHard, gap: 4,
  },
  kindCardOn: { borderColor: P.gold, backgroundColor: P.goldBg },
  kindLabel: { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: P.text },
  kindLabelOn: { color: P.gold },
  kindHint: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', color: P.muted },
  modelChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
    alignSelf: 'flex-start' as const, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#16123A',
  },
  modelChipText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold },
  label: { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub, marginTop: 4 },
  input: {
    minHeight: 120, textAlignVertical: 'top' as const, padding: 14, borderRadius: 16,
    backgroundColor: P.surface, borderWidth: 0.5, borderColor: P.borderHard,
    color: P.text, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14,
  },
  inputSingle: {
    padding: 14, borderRadius: 16, backgroundColor: P.surface,
    borderWidth: 0.5, borderColor: P.borderHard, color: P.text,
    fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14,
  },
  submit: {
    marginTop: 8, height: 54, borderRadius: 16, backgroundColor: '#16123A',
    alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: P.goldRim,
  },
  submitText: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.gold },
});
