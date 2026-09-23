-- ==========================================
-- 025 — Accès client (codes) + demandes devis/RDV
-- Idempotent : peut être relancé même si 023/024 sont absents
-- ==========================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS invite_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_invite_code_active
  ON clients (upper(invite_code))
  WHERE invite_code IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_client_user_id
  ON clients (client_user_id)
  WHERE client_user_id IS NOT NULL;

UPDATE clients
SET invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE invite_code IS NULL AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.my_linked_client_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM clients
  WHERE client_user_id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_linked_client(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE id = p_client_id AND client_user_id = auth.uid() AND deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.my_linked_client_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_linked_client_ids() TO authenticated;
REVOKE ALL ON FUNCTION public.is_linked_client(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_linked_client(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_client_by_invite(p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT := upper(regexp_replace(trim(p_code), '[^A-Z0-9]', '', 'g'));
  v_client_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF v_code IS NULL OR length(v_code) < 4 THEN RAISE EXCEPTION 'Code d''invitation invalide'; END IF;

  SELECT id INTO v_client_id
  FROM clients
  WHERE upper(regexp_replace(coalesce(invite_code, ''), '[^A-Z0-9]', '', 'g')) = v_code
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_client_id IS NULL THEN RAISE EXCEPTION 'Code introuvable'; END IF;

  IF EXISTS (
    SELECT 1 FROM clients
    WHERE id = v_client_id AND client_user_id IS NOT NULL AND client_user_id <> v_uid
  ) THEN
    RAISE EXCEPTION 'Cette fiche est déjà liée à un autre compte';
  END IF;

  UPDATE clients SET client_user_id = v_uid, updated_at = NOW() WHERE id = v_client_id;
  RETURN v_client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_client_by_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_client_by_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_client_by_phone(p_phone TEXT)
RETURNS SETOF UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_norm TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  v_norm := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  IF length(v_norm) < 8 THEN RETURN; END IF;
  RETURN QUERY
  UPDATE clients
  SET client_user_id = v_uid, updated_at = NOW()
  WHERE deleted_at IS NULL AND client_user_id IS NULL
    AND regexp_replace(coalesce(telephone, ''), '[^0-9+]', '', 'g') = v_norm
  RETURNING id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_client_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_client_by_phone(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.regenerate_client_invite(p_client_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM clients WHERE id = p_client_id AND couturier_id = v_uid AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Fiche introuvable';
  END IF;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  UPDATE clients SET invite_code = v_code, updated_at = NOW() WHERE id = p_client_id;
  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.regenerate_client_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_client_invite(UUID) TO authenticated;

DROP POLICY IF EXISTS clients_select_linked_policy ON clients;
CREATE POLICY clients_select_linked_policy ON clients
  FOR SELECT USING (client_user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS orders_select_client_policy ON orders;
CREATE POLICY orders_select_client_policy ON orders
  FOR SELECT USING (public.is_linked_client(client_id));

DROP POLICY IF EXISTS payments_select_client_policy ON payments;
CREATE POLICY payments_select_client_policy ON payments
  FOR SELECT USING (public.is_linked_client(client_id));

DROP POLICY IF EXISTS activities_select_client_policy ON activities;
CREATE POLICY activities_select_client_policy ON activities
  FOR SELECT USING (client_id IS NOT NULL AND public.is_linked_client(client_id));

DROP POLICY IF EXISTS fiches_select_client_policy ON fiches_mensuration;
CREATE POLICY fiches_select_client_policy ON fiches_mensuration
  FOR SELECT USING (public.is_linked_client(client_id));

-- ── Demandes devis / RDV ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couturier_id UUID NOT NULL,
  client_id UUID,
  kind TEXT NOT NULL CHECK (kind IN ('devis', 'rdv')),
  message TEXT,
  model_id UUID,
  preferred_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_requests_tailor ON client_requests (couturier_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_requests_user ON client_requests (client_user_id, created_at DESC);

ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_requests_select ON client_requests;
CREATE POLICY client_requests_select ON client_requests
  FOR SELECT USING (client_user_id = auth.uid() OR couturier_id = auth.uid());

DROP POLICY IF EXISTS client_requests_insert ON client_requests;
CREATE POLICY client_requests_insert ON client_requests
  FOR INSERT WITH CHECK (client_user_id = auth.uid());

DROP POLICY IF EXISTS client_requests_update ON client_requests;
CREATE POLICY client_requests_update ON client_requests
  FOR UPDATE USING (couturier_id = auth.uid() OR client_user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON client_requests TO authenticated;
