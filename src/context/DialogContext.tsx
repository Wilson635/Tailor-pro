import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Pressable, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type DialogState = {
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type ShowAlert = (title: string, message?: string, buttons?: DialogButton[]) => void;

let presenter: ShowAlert | null = null;
const pending: Array<Parameters<ShowAlert>> = [];

function flushNext() {
  if (!presenter || pending.length === 0) return;
  const next = pending.shift();
  if (next) presenter(...next);
}

/** Remplace Alert.alert — popup animée, file d’attente si plusieurs messages. */
export const showAlert: ShowAlert = (title, message, buttons) => {
  if (!presenter) {
    pending.push([title, message, buttons]);
    return;
  }
  presenter(title, message, buttons);
};

/** Popup de signalement après un ajout / une modification / une suppression. */
export const showSuccess = (title: string, message?: string, onOk?: () => void) => {
  showAlert(title, message, [{ text: 'OK', onPress: onOk }]);
};

const inferTone = (title: string, buttons: DialogButton[]): 'info' | 'success' | 'error' | 'warning' => {
  const t = title.toLowerCase();
  if (buttons.some((b) => b.style === 'destructive')) return 'warning';
  if (t.includes('erreur') || t.includes('impossible') || t.includes('refusé') || t.includes('invalide')) return 'error';
  if (t.includes('succès') || t.includes('succes') || t.includes('enregistr') || t.includes('ajouté') || t.includes('publié') || t.includes('envoyé') || t.includes('activé') || t.includes('modifi') || t.includes('mis à jour') || t.includes('créé') || t.includes('archivé') || t.includes('retiré') || t.includes('supprimé')) return 'success';
  return 'info';
};

const TONE = {
  info:    { icon: 'information-circle' as const, color: '#6C3EB8', bg: 'rgba(108,62,184,0.12)' },
  success: { icon: 'checkmark-circle' as const,    color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  error:   { icon: 'close-circle' as const,        color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  warning: { icon: 'alert-circle' as const,        color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [visible, setVisible] = useState(false);
  const overlay = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(28)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const iconPop = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const animateOut = useCallback((after?: () => void) => {
    Animated.parallel([
      Animated.timing(overlay, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(cardY, { toValue: 16, duration: 180, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.94, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setDialog(null);
      busy.current = false;
      after?.();
      if (!busy.current) requestAnimationFrame(flushNext);
    });
  }, [overlay, cardY, cardScale]);

  const animateIn = useCallback(() => {
    overlay.setValue(0);
    cardY.setValue(32);
    cardScale.setValue(0.9);
    iconPop.setValue(0);
    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(90),
      Animated.spring(iconPop, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
    ]).start();
  }, [overlay, cardY, cardScale, iconPop]);

  const present = useCallback<ShowAlert>((title, message, buttons) => {
    const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
    const open = () => {
      busy.current = true;
      setDialog({ title, message, buttons: list });
      setVisible(true);
    };
    if (busy.current) {
      pending.push([title, message, buttons]);
      return;
    }
    open();
  }, []);

  useEffect(() => {
    presenter = present;
    flushNext();
    return () => { presenter = null; };
  }, [present]);

  useEffect(() => {
    if (visible && dialog) animateIn();
  }, [visible, dialog, animateIn]);

  const onButton = (btn: DialogButton) => {
    animateOut(() => btn.onPress?.());
  };

  const tone = dialog ? inferTone(dialog.title, dialog.buttons) : 'info';
  const meta = TONE[tone];
  const stacked = (dialog?.buttons.length ?? 0) > 2;

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => {
        const cancel = dialog?.buttons.find((b) => b.style === 'cancel') ?? dialog?.buttons[0];
        if (cancel) onButton(cancel);
      }}>
        <View style={styles.root}>
          <Animated.View style={[styles.backdrop, { opacity: overlay }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => {
              const cancel = dialog?.buttons.find((b) => b.style === 'cancel');
              if (cancel) onButton(cancel);
            }} />
          </Animated.View>

          {dialog && (
            <Animated.View
              style={[
                styles.card,
                { opacity: overlay, transform: [{ translateY: cardY }, { scale: cardScale }] },
              ]}
            >
              <Animated.View style={[styles.iconWrap, { backgroundColor: meta.bg, transform: [{ scale: iconPop }] }]}>
                <Ionicons name={meta.icon} size={26} color={meta.color} />
              </Animated.View>
              <Text style={styles.title}>{dialog.title}</Text>
              {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}

              <View style={[styles.actions, stacked && styles.actionsCol]}>
                {dialog.buttons.map((btn, i) => {
                  const kind = btn.style ?? (i === dialog.buttons.length - 1 && dialog.buttons.length > 1 && !dialog.buttons.some(b => b.style === 'destructive') ? 'default' : 'default');
                  const isPrimary = kind !== 'cancel' && kind !== 'destructive' && (stacked || i === dialog.buttons.length - 1);
                  const isDestructive = kind === 'destructive';
                  const isCancel = kind === 'cancel';
                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${i}`}
                      activeOpacity={0.85}
                      onPress={() => onButton(btn)}
                      style={[
                        styles.btn,
                        stacked && styles.btnFull,
                        !stacked && dialog.buttons.length === 2 && styles.btnHalf,
                        isPrimary && styles.btnPrimary,
                        isDestructive && styles.btnDestructive,
                        isCancel && styles.btnGhost,
                      ]}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          isPrimary && styles.btnTextPrimary,
                          isDestructive && styles.btnTextDestructive,
                          isCancel && styles.btnTextGhost,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
};
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,18,58,0.52)' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 14,
  },
  title: {
    fontSize: 18, fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#1A1033',
    textAlign: 'center', letterSpacing: -0.3,
  },
  message: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: '#7C6FA8',
    textAlign: 'center', lineHeight: 21, marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionsCol: { flexDirection: 'column' },
  btn: {
    flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#F5F4FB', borderWidth: 0.5, borderColor: 'rgba(108,62,184,0.15)',
  },
  btnFull: { flex: 0, width: '100%' },
  btnHalf: { flex: 1 },
  btnPrimary: { backgroundColor: '#16123A', borderColor: 'rgba(212,175,55,0.35)', borderWidth: 1 },
  btnDestructive: { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.25)' },
  btnGhost: { backgroundColor: '#F5F4FB' },
  btnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1033' },
  btnTextPrimary: { color: '#fff' },
  btnTextDestructive: { color: '#DC2626' },
  btnTextGhost: { color: '#7C6FA8' },
});
