-- ==========================================
-- 026 — Découvrir : modèles publics visibles
-- Un modèle catalog.statut = public doit apparaître
-- même si l’atelier n’a pas activé statut_catalogue = public
-- Idempotent
-- ==========================================

DROP POLICY IF EXISTS catalog_select_public_browse ON catalog;
CREATE POLICY catalog_select_public_browse ON catalog
  FOR SELECT
  USING (
    statut = 'public'
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS catalog_photos_select_public ON catalog_photos;
CREATE POLICY catalog_photos_select_public ON catalog_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM catalog c
      WHERE c.id = catalog_photos.catalog_id
        AND c.statut = 'public'
        AND c.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS users_select_public_atelier ON users;
CREATE POLICY users_select_public_atelier ON users
  FOR SELECT
  USING (
    role = 'tailor'
    AND (
      statut_catalogue = 'public'
      OR EXISTS (
        SELECT 1 FROM catalog cat
        WHERE cat.couturier_id = users.id
          AND cat.statut = 'public'
          AND cat.deleted_at IS NULL
      )
      OR EXISTS (
        SELECT 1 FROM clients c
        WHERE c.couturier_id = users.id
          AND c.client_user_id = auth.uid()
          AND c.deleted_at IS NULL
      )
    )
  );

CREATE OR REPLACE FUNCTION public.browse_public_catalog()
RETURNS SETOF catalog
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM catalog
  WHERE statut = 'public' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 80;
$$;

REVOKE ALL ON FUNCTION public.browse_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_public_catalog() TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_public_atelier_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT couturier_id
  FROM catalog
  WHERE statut = 'public' AND deleted_at IS NULL AND couturier_id IS NOT NULL
  UNION
  SELECT id FROM users
  WHERE role = 'tailor' AND statut_catalogue = 'public';
$$;

REVOKE ALL ON FUNCTION public.browse_public_atelier_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_public_atelier_ids() TO authenticated;
