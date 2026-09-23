-- ==========================================
-- 028 — Liaison client persistante + photos Découvrir
-- SECURITY DEFINER : contourne le RLS qui masque
-- les fiches liées et les catalog_photos aux clients
-- ==========================================

DROP POLICY IF EXISTS clients_select_linked_policy ON clients;
CREATE POLICY clients_select_linked_policy ON clients
  FOR SELECT
  USING (client_user_id = auth.uid() AND deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.my_linked_clients()
RETURNS SETOF clients
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM clients
  WHERE client_user_id = auth.uid()
    AND deleted_at IS NULL
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.my_linked_clients() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_linked_clients() TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_catalog_photos(p_ids UUID[] DEFAULT NULL)
RETURNS TABLE (catalog_id UUID, photo_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.catalog_id, p.photo_url
  FROM catalog_photos p
  INNER JOIN catalog c ON c.id = p.catalog_id
  WHERE c.deleted_at IS NULL
    AND c.statut = 'public'
    AND (p_ids IS NULL OR p.catalog_id = ANY (p_ids));
$$;

REVOKE ALL ON FUNCTION public.browse_catalog_photos(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_catalog_photos(UUID[]) TO authenticated;
