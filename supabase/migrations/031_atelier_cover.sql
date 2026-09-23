-- ==========================================
-- 031 — Bannière (couverture) page atelier
-- Idempotent
-- ==========================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE OR REPLACE FUNCTION public.update_my_profile(p_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec users;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE users SET
    avatar_url = CASE WHEN p_patch ? 'avatar_url' THEN p_patch->>'avatar_url' ELSE avatar_url END,
    cover_url = CASE WHEN p_patch ? 'cover_url' THEN p_patch->>'cover_url' ELSE cover_url END,
    display_name = CASE WHEN p_patch ? 'display_name' THEN p_patch->>'display_name' ELSE display_name END,
    atelier_name = CASE WHEN p_patch ? 'atelier_name' THEN p_patch->>'atelier_name' ELSE atelier_name END,
    phone = CASE WHEN p_patch ? 'phone' THEN p_patch->>'phone' ELSE phone END,
    whatsapp = CASE WHEN p_patch ? 'whatsapp' THEN p_patch->>'whatsapp' ELSE whatsapp END,
    city = CASE WHEN p_patch ? 'city' THEN p_patch->>'city' ELSE city END,
    adresse = CASE WHEN p_patch ? 'adresse' THEN p_patch->>'adresse' ELSE adresse END,
    description = CASE WHEN p_patch ? 'description' THEN p_patch->>'description' ELSE description END,
    statut_catalogue = CASE WHEN p_patch ? 'statut_catalogue' THEN p_patch->>'statut_catalogue' ELSE statut_catalogue END,
    devise = CASE WHEN p_patch ? 'devise' THEN p_patch->>'devise' ELSE devise END,
    langue = CASE WHEN p_patch ? 'langue' THEN p_patch->>'langue' ELSE langue END,
    unite_mesure = CASE WHEN p_patch ? 'unite_mesure' THEN p_patch->>'unite_mesure' ELSE unite_mesure END,
    reseaux_sociaux = CASE WHEN p_patch ? 'reseaux_sociaux' THEN COALESCE(p_patch->'reseaux_sociaux', '{}'::jsonb) ELSE reseaux_sociaux END,
    horaires = CASE WHEN p_patch ? 'horaires' THEN p_patch->'horaires' ELSE horaires END
  WHERE id = auth.uid()
  RETURNING * INTO rec;

  IF rec.id IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  RETURN to_jsonb(rec);
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_public_ateliers()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  atelier_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  description TEXT,
  adresse TEXT,
  specialities TEXT[],
  horaires JSONB,
  reseaux_sociaux JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    u.id,
    u.display_name,
    u.atelier_name,
    u.phone,
    u.whatsapp,
    u.city,
    u.avatar_url,
    u.cover_url,
    u.description,
    u.adresse,
    u.specialities,
    u.horaires,
    u.reseaux_sociaux
  FROM users u
  WHERE u.role = 'tailor'
    AND (
      u.statut_catalogue = 'public'
      OR EXISTS (
        SELECT 1 FROM catalog c
        WHERE c.couturier_id = u.id
          AND c.statut = 'public'
          AND c.deleted_at IS NULL
      )
    )
  ORDER BY COALESCE(u.atelier_name, u.display_name);
$$;

REVOKE ALL ON FUNCTION public.browse_public_ateliers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_public_ateliers() TO authenticated;
