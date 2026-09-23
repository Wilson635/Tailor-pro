-- ==========================================
-- Migration 023 — Lien compte client ↔ fiche atelier
-- + RLS lecture pour le rôle client
-- ==========================================

-- ── Colonnes sur clients ─────────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Un code d'invitation unique parmi les fiches actives
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_invite_code_active
  ON clients (upper(invite_code))
  WHERE invite_code IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_client_user_id
  ON clients (client_user_id)
  WHERE client_user_id IS NOT NULL;

-- Remplir les codes manquants pour les fiches existantes
UPDATE clients
SET invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE invite_code IS NULL AND deleted_at IS NULL;

-- ── Helpers (SECURITY DEFINER) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_linked_client_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM clients
  WHERE client_user_id = auth.uid()
    AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_linked_client(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM clients
    WHERE id = p_client_id
      AND client_user_id = auth.uid()
      AND deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.my_linked_client_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_linked_client_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.is_linked_client(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_linked_client(UUID) TO authenticated;

-- ── RPC : lier un compte client via code d'invitation ────────────────
CREATE OR REPLACE FUNCTION public.link_client_by_invite(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT := upper(trim(p_code));
  v_client_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF v_code IS NULL OR length(v_code) < 4 THEN
    RAISE EXCEPTION 'Code d''invitation invalide';
  END IF;

  SELECT id INTO v_client_id
  FROM clients
  WHERE upper(invite_code) = v_code
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Code introuvable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM clients
    WHERE id = v_client_id
      AND client_user_id IS NOT NULL
      AND client_user_id <> v_uid
  ) THEN
    RAISE EXCEPTION 'Cette fiche est déjà liée à un autre compte';
  END IF;

  UPDATE clients
  SET client_user_id = v_uid,
      updated_at = NOW()
  WHERE id = v_client_id;

  RETURN v_client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_client_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_client_by_invite(TEXT) TO authenticated;

-- ── RPC : revendiquer une fiche par téléphone (auto-lien) ────────────
CREATE OR REPLACE FUNCTION public.claim_client_by_phone(p_phone TEXT)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_norm TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  v_norm := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  IF length(v_norm) < 8 THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE clients
  SET client_user_id = v_uid,
      updated_at = NOW()
  WHERE deleted_at IS NULL
    AND client_user_id IS NULL
    AND regexp_replace(coalesce(telephone, ''), '[^0-9+]', '', 'g') = v_norm
  RETURNING id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_client_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_client_by_phone(TEXT) TO authenticated;

-- ── RPC : régénérer le code (couturier propriétaire) ─────────────────
CREATE OR REPLACE FUNCTION public.regenerate_client_invite(p_client_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id
      AND couturier_id = v_uid
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Fiche introuvable';
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  UPDATE clients
  SET invite_code = v_code,
      updated_at = NOW()
  WHERE id = p_client_id;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.regenerate_client_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_client_invite(UUID) TO authenticated;

-- ── RLS : clients — lecture par le compte lié ────────────────────────
DROP POLICY IF EXISTS clients_select_linked_policy ON clients;
CREATE POLICY clients_select_linked_policy ON clients
  FOR SELECT
  USING (
    client_user_id = auth.uid()
    AND deleted_at IS NULL
  );

-- ── RLS : orders — lecture client lié ────────────────────────────────
DROP POLICY IF EXISTS orders_select_client_policy ON orders;
CREATE POLICY orders_select_client_policy ON orders
  FOR SELECT
  USING (public.is_linked_client(client_id));

-- ── RLS : payments — lecture client lié ──────────────────────────────
DROP POLICY IF EXISTS payments_select_client_policy ON payments;
CREATE POLICY payments_select_client_policy ON payments
  FOR SELECT
  USING (public.is_linked_client(client_id));

-- ── RLS : activities — lecture client lié ────────────────────────────
DROP POLICY IF EXISTS activities_select_client_policy ON activities;
CREATE POLICY activities_select_client_policy ON activities
  FOR SELECT
  USING (
    client_id IS NOT NULL
    AND public.is_linked_client(client_id)
  );

-- ── RLS : fiches_mensuration — lecture client lié ────────────────────
DROP POLICY IF EXISTS fiches_select_client_policy ON fiches_mensuration;
CREATE POLICY fiches_select_client_policy ON fiches_mensuration
  FOR SELECT
  USING (public.is_linked_client(client_id));

-- ── RLS : historique_statuts_commande — lecture via commande liée ────
DROP POLICY IF EXISTS historique_select_client_policy ON historique_statuts_commande;
CREATE POLICY historique_select_client_policy ON historique_statuts_commande
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = historique_statuts_commande.commande_id
        AND public.is_linked_client(o.client_id)
    )
  );
