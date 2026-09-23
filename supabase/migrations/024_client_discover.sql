-- ==========================================
-- Migration 024 — Découverte client
-- Lecture publique des ateliers (catalogue public)
-- et des modèles catalog.statut = public
-- ==========================================

-- Profil atelier visible si catalogue public ou déjà lié au client
DROP POLICY IF EXISTS users_select_public_atelier ON users;
CREATE POLICY users_select_public_atelier ON users
  FOR SELECT
  USING (
    role = 'tailor'
    AND (
      statut_catalogue = 'public'
      OR EXISTS (
        SELECT 1 FROM clients c
        WHERE c.couturier_id = users.id
          AND c.client_user_id = auth.uid()
          AND c.deleted_at IS NULL
      )
    )
  );

-- Modèles publics d'un atelier public, ou de l'atelier déjà lié
DROP POLICY IF EXISTS catalog_select_public_browse ON catalog;
CREATE POLICY catalog_select_public_browse ON catalog
  FOR SELECT
  USING (
    statut = 'public'
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = catalog.couturier_id
        AND u.role = 'tailor'
        AND (
          u.statut_catalogue = 'public'
          OR EXISTS (
            SELECT 1 FROM clients c
            WHERE c.couturier_id = u.id
              AND c.client_user_id = auth.uid()
              AND c.deleted_at IS NULL
          )
        )
    )
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
