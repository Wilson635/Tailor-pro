-- ==========================================
-- 032 — Coordonnées publiques de l’atelier
-- (pas celles de la fiche CRM client)
-- SECURITY DEFINER : hors RLS users
-- Idempotent
-- ==========================================

DROP FUNCTION IF EXISTS public.browse_atelier_profiles(UUID[]);

CREATE FUNCTION public.browse_atelier_profiles(p_ids UUID[] DEFAULT NULL)
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
      (
        p_ids IS NOT NULL
        AND u.id = ANY (p_ids)
        AND (
          u.statut_catalogue = 'public'
          OR EXISTS (
            SELECT 1 FROM catalog c
            WHERE c.couturier_id = u.id
              AND c.statut = 'public'
              AND c.deleted_at IS NULL
          )
          OR EXISTS (
            SELECT 1 FROM clients cl
            WHERE cl.couturier_id = u.id
              AND cl.client_user_id = auth.uid()
              AND cl.deleted_at IS NULL
          )
        )
      )
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

REVOKE ALL ON FUNCTION public.browse_atelier_profiles(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.browse_atelier_profiles(UUID[]) TO authenticated;
