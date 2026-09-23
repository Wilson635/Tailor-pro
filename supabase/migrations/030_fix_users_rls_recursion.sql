-- ==========================================
-- 030 — Couper la récursion RLS sur users
-- catalog ↛ users ↛ catalog
-- + mise à jour profil (avatar) hors RLS
-- Idempotent
-- ==========================================

-- Catalogue public : ne plus interroger users
DROP POLICY IF EXISTS catalog_select_public_browse ON catalog;
CREATE POLICY catalog_select_public_browse ON catalog
  FOR SELECT
  USING (statut = 'public' AND deleted_at IS NULL);

-- Ateliers publics : ne plus interroger catalog (source de la boucle)
DROP POLICY IF EXISTS users_select_public_atelier ON users;
CREATE POLICY users_select_public_atelier ON users
  FOR SELECT
  USING (role = 'tailor' AND statut_catalogue = 'public');

DROP POLICY IF EXISTS users_select_linked_atelier ON users;
CREATE POLICY users_select_linked_atelier ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.couturier_id = users.id
        AND c.client_user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT to_jsonb(u)
  FROM users u
  WHERE u.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

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
