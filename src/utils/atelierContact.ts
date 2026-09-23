import { Linking } from 'react-native';
import { showAlert } from '@/src/context/DialogContext';
import type { PublicAtelier } from '@/src/types';

/** Numéros du profil atelier uniquement — jamais la fiche CRM client. */
export const atelierPhone = (atelier?: Pick<PublicAtelier, 'phone' | 'whatsapp'> | null) =>
  atelier?.phone?.trim() || atelier?.whatsapp?.trim() || null;

export const atelierWhatsApp = (atelier?: Pick<PublicAtelier, 'phone' | 'whatsapp'> | null) =>
  atelier?.whatsapp?.trim() || atelier?.phone?.trim() || null;

export const openWhatsApp = (phone?: string | null, message?: string) => {
  if (!phone) {
    showAlert('Contact indisponible', 'Aucun numéro WhatsApp renseigné pour cet atelier.');
    return;
  }
  const cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  const url = message
    ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${cleaned}`;
  Linking.openURL(url);
};

export const openTel = (phone?: string | null) => {
  if (!phone) {
    showAlert('Contact indisponible', 'Aucun numéro renseigné pour cet atelier.');
    return;
  }
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
};

export const confectionRequestMessage = (opts: {
  atelierName?: string | null;
  modelName?: string | null;
}) => {
  const atelier = opts.atelierName ? ` ${opts.atelierName}` : '';
  if (opts.modelName) {
    return `Bonjour${atelier}, je suis intéressé(e) par le modèle « ${opts.modelName} » vu sur TailorPro. Pouvez-vous me faire un devis ?`;
  }
  return `Bonjour${atelier}, je souhaite demander une confection via TailorPro.`;
};
