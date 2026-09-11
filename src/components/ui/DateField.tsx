import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '@/src/theme';

export const toDisplayDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseDateValue = (value: string): Date | null => {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fr) {
    const d = new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** `fr` → JJ/MM/AAAA · `iso` → AAAA-MM-JJ */
  output?: 'fr' | 'iso';
  placeholder?: string;
};

export const DateField: React.FC<Props> = ({
  label,
  value,
  onChange,
  output = 'fr',
  placeholder = 'Choisir une date',
}) => {
  const P = usePalette();
  const [open, setOpen] = useState(false);
  const current = useMemo(() => parseDateValue(value) ?? new Date(), [value]);

  const commit = (d: Date) => {
    onChange(output === 'iso' ? toIsoDate(d) : toDisplayDate(d));
  };

  const onPicker = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'dismissed') return;
    }
    if (date) commit(date);
  };

  const display = value
    ? (parseDateValue(value)?.toLocaleDateString('fr-FR') ?? value)
    : placeholder;

  return (
    <View style={{ marginBottom: 4 }}>
      {label ? (
        <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub, marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: P.surface,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: P.borderHard,
          paddingHorizontal: 14,
          height: 48,
        }}
      >
        <Ionicons name="calendar-outline" size={16} color={P.gold} />
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: value ? P.text : P.muted,
          }}
        >
          {display}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={P.sub} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={P.sub} />
        )}
      </TouchableOpacity>

      {open && Platform.OS !== 'ios' && (
        <DateTimePicker value={current} mode="date" display="default" onChange={onPicker} />
      )}

      {open && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <TouchableOpacity style={ios.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={[ios.sheet, { backgroundColor: P.surface }]}>
            <View style={ios.bar}>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={{ color: P.sub, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { commit(current); setOpen(false); }}>
                <Text style={{ color: P.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>Valider</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={current}
              mode="date"
              display="spinner"
              onChange={(_, d) => { if (d) commit(d); }}
              locale="fr-FR"
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const ios = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(22,18,58,0.35)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 },
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
});
