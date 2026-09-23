-- ==========================================
-- 029 — Découvrir : tous les catalogues publics
-- + noms d’atelier (SECURITY DEFINER, hors RLS)
-- Idempotent
-- ==========================================

CREATE OR REPLACE FUNCTION public.browse_public_catalog()
RETURNS SETOF catalog
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT *
  FROM catalog
  WHERE statut = 'public' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.browse_public_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_public_catalog() TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_atelier_labels(p_ids UUID[] DEFAULT NULL)
RETURNS TABLE (id UUID, atelier_name TEXT, display_name TEXT, city TEXT, avatar_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.atelier_name, u.display_name, u.city, u.avatar_url
  FROM users u
  WHERE u.role = 'tailor'
    AND (
      (p_ids IS NOT NULL AND u.id = ANY (p_ids))
      OR (
        p_ids IS NULL
        AND (
          u.statut_catalogue = 'public'
          OR EXISTS (
            SELECT 1 FROM catalog c
            WHERE c.couturier_id = u.id
              AND c.statut = 'public'
              AND c.deleted_at IS NULL
          )
        )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.browse_atelier_labels(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_atelier_labels(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.browse_public_ateliers()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  atelier_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  avatar_url TEXT,
  description TEXT,
  adresse TEXT
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
    u.description,
    u.adresse
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
