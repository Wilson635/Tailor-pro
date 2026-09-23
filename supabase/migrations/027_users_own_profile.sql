-- ==========================================
-- 027 — Lecture de son propre profil + rôle client
-- Sans SELECT own, un client ne lit pas users → l’app tombe
-- sur l’UI couturier vide (role par défaut).
-- ==========================================

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

UPDATE users u
SET role = 'client'
FROM auth.users au
WHERE u.id = au.id
  AND coalesce(u.role, '') IS DISTINCT FROM 'client'
  AND coalesce(au.raw_user_meta_data->>'role', '') = 'client';
