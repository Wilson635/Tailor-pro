// ==========================================
// Codes d'invitation fiche client ↔ compte app
// ==========================================

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Génère un code court (8 caractères) sans I/O/0/1 pour limiter les confusions */
export function generateInviteCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function normalizePhone(raw?: string | null): string {
  return (raw ?? '').replace(/[^0-9+]/g, '');
}
