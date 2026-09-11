import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@/src/theme';
import {
  CATALOG_MODEL_CATEGORIES,
  CATALOG_CATEGORY_LABELS,
  DIFFICULTE_LABELS,
  TISSUS_COMMUNS,
  ACCESSOIRES_COMMUNS,
  type Difficulte,
} from '@constants/catalogConstants';
import type { CatalogCategory } from '../../types';

export const CatalogSection = ({
  icon,
  title,
  sub,
  colors,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  colors: Palette;
  children: React.ReactNode;
}) => (
  <View style={[sec.card, { backgroundColor: colors.surface, borderColor: colors.borderHard }]}>
    <View style={sec.head}>
      <View style={[sec.icon, { backgroundColor: colors.goldBg, borderColor: colors.goldRim }]}>
        <Ionicons name={icon} size={15} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sec.title, { color: colors.text }]}>{title}</Text>
        {sub ? <Text style={[sec.sub, { color: colors.sub }]}>{sub}</Text> : null}
      </View>
    </View>
    {children}
  </View>
);

const sec = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, borderWidth: 0.5, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  title: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  sub: { fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 1 },
});

export const CatalogFieldLabel = ({
  label,
  required,
  optional,
  colors,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  colors: Palette;
}) => (
  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: colors.sub, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
    {label}
    {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    {optional ? <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', textTransform: 'none', letterSpacing: 0 }}>  optionnel</Text> : null}
  </Text>
);

export const CatalogInput = ({
  colors,
  multiline,
  style,
  ...props
}: React.ComponentProps<typeof TextInput> & { colors: Palette; multiline?: boolean }) => (
  <TextInput
    {...props}
    multiline={multiline}
    placeholderTextColor={colors.muted}
    style={[
      {
        borderWidth: 0.5,
        borderColor: colors.borderHard,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: colors.text,
        backgroundColor: colors.pageBg,
        height: multiline ? 100 : 46,
      },
      style,
    ]}
    textAlignVertical={multiline ? 'top' : 'center'}
  />
);

export const CatalogPhotoStrip = ({
  photos,
  colors,
  onAdd,
  onRemove,
}: {
  photos: string[];
  colors: Palette;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
    {photos.length < 5 && (
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.8}
        style={{
          width: 92, height: 118, borderRadius: 14,
          borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.goldRim,
          backgroundColor: colors.goldBg, alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Ionicons name="camera-outline" size={22} color={colors.gold} />
        <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.gold }}>Ajouter</Text>
        <Text style={{ fontSize: 9, color: colors.sub }}>{photos.length}/5</Text>
      </TouchableOpacity>
    )}
    {photos.map((uri, idx) => (
      <View key={`${uri}-${idx}`} style={{ width: 92, height: 118, borderRadius: 14, overflow: 'hidden' }}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        {idx === 0 && (
          <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: colors.bg }}>Principale</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onRemove(idx)}
          style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(14,11,20,0.62)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
);

export const CatalogCategoryPills = ({
  value,
  onChange,
  colors,
}: {
  value: CatalogCategory;
  onChange: (c: CatalogCategory) => void;
  colors: Palette;
}) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {CATALOG_MODEL_CATEGORIES.map((cat) => {
      const active = value === cat;
      return (
        <TouchableOpacity
          key={cat}
          onPress={() => onChange(cat)}
          activeOpacity={0.8}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: active ? colors.primary : colors.pageBg,
            borderWidth: 0.5, borderColor: active ? colors.primary : colors.borderHard,
          }}
        >
          <Text style={{
            fontSize: 13,
            fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
            color: active ? '#fff' : colors.sub,
          }}>
            {CATALOG_CATEGORY_LABELS[cat]}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const CatalogDifficulteRow = ({
  value,
  onChange,
  colors,
}: {
  value: Difficulte;
  onChange: (d: Difficulte) => void;
  colors: Palette;
}) => (
  <View style={{ flexDirection: 'row', backgroundColor: colors.pageBg, borderRadius: 14, padding: 4, gap: 4 }}>
    {(['facile', 'moyen', 'difficile'] as Difficulte[]).map((d) => {
      const active = value === d;
      return (
        <TouchableOpacity
          key={d}
          onPress={() => onChange(d)}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
            backgroundColor: active ? colors.surface : 'transparent',
            borderWidth: active ? 0.5 : 0,
            borderColor: colors.goldRim,
          }}
        >
          <Text style={{
            fontSize: 13,
            fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
            color: active ? colors.text : colors.sub,
          }}>
            {DIFFICULTE_LABELS[d]}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const CatalogTagInput = ({
  tags,
  onAdd,
  onRemove,
  placeholder,
  colors,
  suggestions,
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
  placeholder: string;
  colors: Palette;
  suggestions?: string[];
}) => {
  const [input, setInput] = useState('');
  const remaining = (suggestions ?? []).filter((s) => !tags.includes(s)).slice(0, 6);
  const handleAdd = (value?: string) => {
    const trimmed = (value ?? input).trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CatalogInput
          colors={colors}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleAdd()}
          placeholder={placeholder}
          returnKeyType="done"
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          onPress={() => handleAdd()}
          style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.goldRim }}
        >
          <Ionicons name="add" size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>
      {remaining.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {remaining.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleAdd(s)}
              style={{ backgroundColor: colors.pageBg, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: colors.border }}
            >
              <Text style={{ fontSize: 12, color: colors.sub, fontFamily: 'PlusJakartaSans_500Medium' }}>+ {s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {tags.map((t, i) => (
            <View key={`${t}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryBg, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 0.5, borderColor: colors.borderHard }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t}</Text>
              <TouchableOpacity onPress={() => onRemove(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const CatalogStatutCards = ({
  value,
  onChange,
  colors,
}: {
  value: 'public' | 'prive';
  onChange: (v: 'public' | 'prive') => void;
  colors: Palette;
}) => (
  <View style={{ gap: 8 }}>
    {([
      { value: 'prive' as const, icon: 'lock-closed-outline' as const, label: 'Privé', sub: 'Visible seulement dans l’atelier' },
      { value: 'public' as const, icon: 'globe-outline' as const, label: 'Public', sub: 'Visible sur votre catalogue en ligne' },
    ]).map((opt) => {
      const active = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            padding: 14, borderRadius: 14,
            borderWidth: 0.5,
            borderColor: active ? colors.goldRim : colors.borderHard,
            backgroundColor: active ? colors.goldBg : colors.pageBg,
          }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: active ? colors.bg : colors.surface,
          }}>
            <Ionicons name={opt.icon} size={16} color={active ? colors.gold : colors.sub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text }}>{opt.label}</Text>
            <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>{opt.sub}</Text>
          </View>
          <View style={{
            width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
            borderColor: active ? colors.gold : colors.muted, alignItems: 'center', justifyContent: 'center',
          }}>
            {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold }} /> : null}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

export { TISSUS_COMMUNS, ACCESSOIRES_COMMUNS };
