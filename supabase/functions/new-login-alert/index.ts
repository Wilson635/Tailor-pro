// supabase/functions/new-login-alert/index.ts
// Déployer : `supabase functions deploy new-login-alert`
// Optionnel : secret RESEND_API_KEY pour envoyer l’e-mail.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { email, deviceName, os, when } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_email' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_mailer' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TailorPro <beth.t@example.com>',
        to: [email],
        subject: 'Nouvelle connexion à votre compte TailorPro',
        text:
          `L’application a détecté une nouvelle connexion à votre compte.\n\n` +
          `Appareil : ${deviceName ?? 'inconnu'}\n` +
          `Système : ${os ?? ''}\n` +
          `Date : ${when ?? ''}\n\n` +
          `Si ce n’est pas vous, changez votre mot de passe et retirez l’appareil dans Profil → Appareils enregistrés.`,
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 502,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
