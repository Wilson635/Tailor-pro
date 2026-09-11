# TailorPro — Application de gestion pour couturiers

Application mobile **React Native / Expo** connectée à **Supabase** pour gérer les clients, fiches de mensuration, commandes, réalisations, tissus, paiements et statistiques d'un atelier de couture.

---

## Stack technique


| Couche      | Technologie                                   |
| ----------- | --------------------------------------------- |
| Mobile      | React Native 0.79 + Expo SDK 54               |
| Langage     | TypeScript strict                             |
| Navigation  | React Navigation (bottom tabs + native stack) |
| État global | Zustand                                       |
| Backend     | Supabase (Auth + PostgreSQL + Storage)        |
| Graphiques  | react-native-chart-kit + react-native-svg     |


---

## Modules implémentés


| #   | Module                  | Description                                                          |
| --- | ----------------------- | -------------------------------------------------------------------- |
| 0   | Auth & Profil couturier | OTP par téléphone, profil atelier, paramètres devise/langue/unité    |
| 1   | Tableau de bord         | KPIs temps réel, livraisons du jour, retards, filtres période        |
| 2   | Gestion des clients     | CRUD clients, soft delete, fiche agrégée                             |
| 3   | Fiches de mensuration   | JSON versionnées par type de vêtement                                |
| 4   | Catalogue de modèles    | Modèles publics/privés, photos, difficulté                           |
| 5   | Réalisations            | 1-N par commande, photos Supabase Storage                            |
| 6   | Tissus                  | Catalogue tissus de l'atelier, photos                                |
| 7   | Commandes               | Cycle de vie complet, Kanban, numérotation CMD-YYYY-NNNN             |
| 8   | Paiements               | Types acompte/intermédiaire/solde, reçu PDF partageable              |
| 9   | Comptabilité            | Agrégation pure (revenus, encaissements, débiteurs), export CSV      |
| 10  | Recherche globale       | Full-Text Search PostgreSQL, filtres statut + dates                  |
| 11  | Galerie                 | Grille photos par catégorie, publication catalogue                   |
| 12  | Statistiques            | Graphiques BarChart + PieChart, top clients, top modèles, export CSV |


---



## Lancer l'application

```bash
npm install
npx expo start --tunnel --port 5000   # tunnel = preview Replit
```

Le workflow **Start application** démarre automatiquement ce commande.

---



## Configuration Supabase

L'URL et la clé publique sont dans `src/lib/supabase.ts`.  
Toutes les migrations ci-dessous se collent dans **Supabase → SQL Editor → New query**.

---



## Schéma complet — tables, colonnes, types



### Vue d'ensemble des tables

```
users                        ← profil couturier (étend auth.users)
clients                      ← clients de l'atelier
orders                       ← commandes
payments                     ← paiements liés aux commandes
catalog                      ← modèles du catalogue
activities                   ← journal d'activité (tableau de bord)
measurements                 ← mesures brutes legacy (non utilisé activement)
fiches_mensuration           ← fiches JSON versionnées par type de vêtement
realisations                 ← réalisations (productions physiques)
tissus                       ← catalogue de tissus de l'atelier
historique_statuts_commande  ← traçabilité des changements de statut

Buckets Storage :
  realisation-photos         ← photos des réalisations
  tissu-photos               ← photos des tissus
```

---



### Table : `users` (profil couturier)

> Étend la table `users` déjà créée par Supabase Auth.  
> **Ne pas recréer** — utiliser uniquement les `ALTER TABLE` des migrations 001 et 002.


| Colonne          | Type   | Contrainte                          | Note                         |
| ---------------- | ------ | ----------------------------------- | ---------------------------- |
| id               | UUID   | PK, FK auth.users                   | Géré par Supabase Auth       |
| phone            | TEXT   | UNIQUE (index partiel)              | Numéro de connexion OTP      |
| whatsapp         | TEXT   |                                     | Peut différer du téléphone   |
| adresse          | TEXT   |                                     | Adresse de l'atelier         |
| horaires         | JSONB  | DEFAULT '{}'                        | `{lundi:"8h-18h", ...}`      |
| reseaux_sociaux  | JSONB  | DEFAULT '{}'                        | `{facebook, instagram, ...}` |
| description      | TEXT   |                                     | Bio de l'atelier             |
| statut_catalogue | TEXT   | CHECK (public/prive)                | DEFAULT 'prive'              |
| plan_abonnement  | TEXT   | CHECK (gratuit/pro/business)        | DEFAULT 'gratuit'            |
| city             | TEXT   |                                     | Ville de l'atelier           |
| district         | TEXT   |                                     | Quartier                     |
| specialities     | TEXT[] | DEFAULT '{}'                        | Spécialités du couturier     |
| avatar_url       | TEXT   |                                     | Photo de profil              |
| devise           | TEXT   | CHECK (XAF/EUR/USD/GBP/GHS/NGN/KES) | DEFAULT 'XAF'                |
| langue           | TEXT   | CHECK (fr/en)                       | DEFAULT 'fr'                 |
| unite_mesure     | TEXT   | CHECK (cm/pouces)                   | DEFAULT 'cm'                 |


---



### Table : `clients`

> Table pré-existante modifiée par la migration 003.


| Colonne        | Type        | Contrainte                   | Note                          |
| -------------- | ----------- | ---------------------------- | ----------------------------- |
| id             | UUID        | PK DEFAULT gen_random_uuid() |                               |
| couturier_id   | UUID        | FK auth.users                | était `user_id`               |
| nom            | TEXT        | NOT NULL                     | était `full_name`             |
| telephone      | TEXT        | NOT NULL                     |                               |
| whatsapp       | TEXT        |                              |                               |
| email          | TEXT        |                              |                               |
| adresse        | TEXT        |                              | était `neighborhood`          |
| sexe           | TEXT        | CHECK (homme/femme/autre)    | était `gender` en anglais     |
| date_naissance | DATE        |                              |                               |
| photo_url      | TEXT        |                              |                               |
| notes_internes | TEXT        |                              | Privées, non visibles clients |
| is_favorite    | BOOLEAN     | DEFAULT false                |                               |
| balance        | NUMERIC     | DEFAULT 0                    |                               |
| deleted_at     | TIMESTAMPTZ |                              | NULL = actif (soft delete)    |
| created_at     | TIMESTAMPTZ | DEFAULT NOW()                |                               |
| updated_at     | TIMESTAMPTZ | DEFAULT NOW()                |                               |


---



### Table : `catalog`

> Table pré-existante modifiée par la migration 004.


| Colonne                 | Type        | Contrainte                     | Note                           |
| ----------------------- | ----------- | ------------------------------ | ------------------------------ |
| id                      | UUID        | PK DEFAULT gen_random_uuid()   |                                |
| couturier_id            | UUID        | FK auth.users                  | était `user_id`                |
| name                    | TEXT        | NOT NULL                       | Nom du modèle                  |
| category                | TEXT        | NOT NULL                       | femme/homme/enfant/mariage/... |
| description             | TEXT        |                                |                                |
| photos                  | TEXT[]      | DEFAULT '{}'                   | URLs Supabase Storage          |
| price                   | NUMERIC     | DEFAULT 0                      | Prix indicatif                 |
| is_favorite             | BOOLEAN     | DEFAULT false                  |                                |
| difficulte              | TEXT        | CHECK (facile/moyen/difficile) | DEFAULT 'moyen'                |
| temps_moyen_realisation | INTEGER     |                                | En heures                      |
| tissus_recommandes      | TEXT[]      | DEFAULT '{}'                   |                                |
| accessoires_necessaires | TEXT[]      | DEFAULT '{}'                   |                                |
| statut                  | TEXT        | CHECK (public/prive)           | DEFAULT 'prive'                |
| deleted_at              | TIMESTAMPTZ |                                | Soft delete                    |
| created_at              | TIMESTAMPTZ | DEFAULT NOW()                  |                                |


---



### Table : `orders`

> Table pré-existante modifiée par la migration 008.


| Colonne               | Type        | Contrainte                   | Note                                                           |
| --------------------- | ----------- | ---------------------------- | -------------------------------------------------------------- |
| id                    | UUID        | PK DEFAULT gen_random_uuid() |                                                                |
| client_id             | UUID        | FK clients                   |                                                                |
| client_name           | TEXT        |                              | Dénormalisé pour performance                                   |
| clothing_type         | TEXT        |                              | Type de vêtement                                               |
| description           | TEXT        |                              |                                                                |
| delivery_date         | DATE        |                              | Date livraison prévue                                          |
| urgency_level         | TEXT        |                              | low/medium/high                                                |
| total_price           | NUMERIC     | DEFAULT 0                    | Montant total                                                  |
| advance_payment       | NUMERIC     | DEFAULT 0                    | Acompte initial                                                |
| remaining_amount      | NUMERIC     | DEFAULT 0                    | Solde restant                                                  |
| payment_status        | TEXT        |                              | unpaid/partial/paid                                            |
| order_status          | TEXT        |                              | creee/en_confection/essayage/retouches/terminee/livree/annulee |
| numero_commande       | TEXT        |                              | CMD-YYYY-NNNN (auto, migration 008)                            |
| date_livraison_reelle | DATE        |                              | Date effective de livraison (migration 008)                    |
| created_at            | TIMESTAMPTZ | DEFAULT NOW()                |                                                                |
| updated_at            | TIMESTAMPTZ | DEFAULT NOW()                |                                                                |


---



### Table : `payments`

> Table pré-existante modifiée par la migration 009.


| Colonne    | Type        | Contrainte                                         | Note                                 |
| ---------- | ----------- | -------------------------------------------------- | ------------------------------------ |
| id         | UUID        | PK DEFAULT gen_random_uuid()                       |                                      |
| order_id   | UUID        | FK orders                                          |                                      |
| client_id  | UUID        | FK clients                                         |                                      |
| amount     | NUMERIC     | NOT NULL                                           | Montant du paiement                  |
| date       | DATE        | DEFAULT CURRENT_DATE                               |                                      |
| method     | TEXT        |                                                    | cash/mobile_money/bank_transfer/card |
| notes      | TEXT        |                                                    |                                      |
| type       | TEXT        | CHECK (acompte/paiement_intermediaire/solde_final) | DEFAULT 'acompte'                    |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                                      |                                      |


---



### Table : `activities`

> Utilisée par le tableau de bord pour les activités récentes.


| Colonne       | Type        | Note                                                  |
| ------------- | ----------- | ----------------------------------------------------- |
| id            | UUID        | PK                                                    |
| activity_type | TEXT        | new_order/payment_received/order_completed/new_client |
| title         | TEXT        |                                                       |
| subtitle      | TEXT        |                                                       |
| amount        | NUMERIC     |                                                       |
| client_id     | UUID        |                                                       |
| order_id      | UUID        |                                                       |
| created_at    | TIMESTAMPTZ |                                                       |


---



### Table : `fiches_mensuration` *(créée par migration 005)*


| Colonne       | Type        | Contrainte                                 | Note                           |
| ------------- | ----------- | ------------------------------------------ | ------------------------------ |
| id            | UUID        | PK DEFAULT gen_random_uuid()               |                                |
| client_id     | UUID        | FK clients ON DELETE CASCADE               |                                |
| couturier_id  | UUID        | FK auth.users ON DELETE CASCADE            | ⚠️ voir note ci-dessous        |
| type_vetement | ENUM        | robe/costume/chemise/pantalon/boubou/autre |                                |
| date_prise    | DATE        | DEFAULT CURRENT_DATE                       |                                |
| mesures       | JSONB       | NOT NULL DEFAULT '{}'                      | Toutes les mesures             |
| unite         | ENUM        | cm / pouces                                | DEFAULT 'cm'                   |
| notes         | TEXT        |                                            |                                |
| is_active     | BOOLEAN     | DEFAULT false                              | 1 seule active par client/type |
| created_at    | TIMESTAMPTZ | DEFAULT NOW()                              |                                |


> ⚠️ **Note migration 005** : la FK `REFERENCES couturiers(id)` dans le fichier de migration suppose qu'une table `couturiers` existe. Si ce n'est pas le cas dans votre projet, remplacer par `REFERENCES auth.users(id)` avant d'exécuter.

---



### Table : `realisations` *(créée par migration 006)*


| Colonne              | Type        | Contrainte                                    | Note                              |
| -------------------- | ----------- | --------------------------------------------- | --------------------------------- |
| id                   | UUID        | PK DEFAULT gen_random_uuid()                  |                                   |
| couturier_id         | UUID        | FK auth.users ON DELETE CASCADE               |                                   |
| client_id            | UUID        | FK clients ON DELETE CASCADE                  |                                   |
| commande_id          | UUID        | FK orders ON DELETE SET NULL                  | Ajouté par migration 008          |
| modele_id            | UUID        | FK catalog ON DELETE SET NULL                 |                                   |
| fiche_mensuration_id | UUID        | FK fiches_mensuration ON DELETE SET NULL      |                                   |
| tissu_id             | UUID        | FK tissus ON DELETE SET NULL                  | Ajouté par migration 007          |
| tissu_label          | TEXT        |                                               | Libellé temporaire avant Module 6 |
| couleur              | TEXT        | DEFAULT ''                                    |                                   |
| accessoires          | TEXT[]      | DEFAULT '{}'                                  |                                   |
| photos               | TEXT[]      | DEFAULT '{}'                                  | URLs bucket `realisation-photos`  |
| observations         | TEXT        |                                               |                                   |
| statut               | ENUM        | en_cours/essayage/corrections/terminee/livree | DEFAULT 'en_cours'                |
| date_creation        | DATE        | DEFAULT CURRENT_DATE                          |                                   |
| date_essayage        | DATE        |                                               |                                   |
| date_livraison       | DATE        |                                               |                                   |
| search_vector        | TSVECTOR    | GENERATED ALWAYS AS … STORED                  | FTS (migration 010)               |
| created_at           | TIMESTAMPTZ | DEFAULT NOW()                                 |                                   |


---



### Table : `tissus` *(créée par migration 007)*


| Colonne           | Type          | Contrainte                      | Note                        |
| ----------------- | ------------- | ------------------------------- | --------------------------- |
| id                | UUID          | PK DEFAULT gen_random_uuid()    |                             |
| couturier_id      | UUID          | FK auth.users ON DELETE CASCADE |                             |
| type_tissu        | TEXT          | NOT NULL                        | bazin/wax/satin/...         |
| nom_commercial    | TEXT          | NOT NULL                        | Nom du tissu                |
| couleur           | TEXT          | DEFAULT ''                      |                             |
| fournisseur       | TEXT          |                                 |                             |
| prix_unitaire     | NUMERIC(10,2) | DEFAULT 0                       | Par mètre                   |
| quantite_utilisee | NUMERIC(10,2) | DEFAULT 0                       | Mètres consommés            |
| photo             | TEXT          |                                 | URL bucket `tissu-photos`   |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                   |                             |
| updated_at        | TIMESTAMPTZ   | DEFAULT NOW()                   | Auto-mis à jour par trigger |


---



### Table : `historique_statuts_commande` *(créée par migration 008)*


| Colonne        | Type        | Note                                |
| -------------- | ----------- | ----------------------------------- |
| id             | UUID        | PK                                  |
| commande_id    | UUID        | FK orders ON DELETE CASCADE         |
| couturier_id   | UUID        | FK auth.users ON DELETE CASCADE     |
| ancien_statut  | TEXT        | Statut précédent (NULL si création) |
| nouveau_statut | TEXT        | NOT NULL                            |
| commentaire    | TEXT        | Note libre du couturier             |
| created_at     | TIMESTAMPTZ | DEFAULT NOW()                       |


---



### Vue : `vue_solde_commande` *(créée par migration 009)*

```sql
-- Accès : SELECT * FROM vue_solde_commande WHERE order_id = '...'
-- Colonnes : order_id, client_id, total_amount, advance_payment,
--            total_paye, solde_restant, statut_paiement
```

---



### Fonction : `rechercher_realisations()` *(créée par migration 010)*

```sql
-- Full-Text Search via websearch_to_tsquery('french', ...)
SELECT * FROM rechercher_realisations(
  p_query     => 'bazin rouge',   -- NULL = tous
  p_couturier => NULL,            -- NULL = auth.uid() du JWT
  p_statut    => 'terminee',      -- NULL = tous
  p_date_from => '2025-01-01',    -- NULL = sans limite
  p_date_to   => '2025-12-31'     -- NULL = sans limite
);
-- Retourne : realisation_id, client_id, client_nom, tissu_label,
--            couleur, statut, date_creation, commande_id,
--            numero_commande, rank (float)
-- LIMIT 100
```

---



## Migrations — SQL à exécuter dans l'ordre

> **Copier chaque bloc dans Supabase → SQL Editor → Run.**  
> Exécuter dans l'ordre numérique. Chaque migration est idempotente (`IF NOT EXISTS`, `IF EXISTS`).

---



### Migration 001 — Profil Couturier (colonnes `users`)

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp          TEXT,
  ADD COLUMN IF NOT EXISTS adresse           TEXT,
  ADD COLUMN IF NOT EXISTS horaires          JSONB    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reseaux_sociaux   JSONB    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS statut_catalogue  TEXT     DEFAULT 'prive'
      CHECK (statut_catalogue IN ('public', 'prive')),
  ADD COLUMN IF NOT EXISTS plan_abonnement   TEXT     DEFAULT 'gratuit'
      CHECK (plan_abonnement IN ('gratuit', 'pro', 'business')),
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS district          TEXT,
  ADD COLUMN IF NOT EXISTS specialities      TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT;

CREATE INDEX IF NOT EXISTS idx_users_statut_catalogue
  ON users (statut_catalogue)
  WHERE statut_catalogue = 'public';
```

---



### Migration 002 — Contraintes & Paramètres & RLS `users`

```sql
-- Unicité téléphone (index partiel pour ignorer les NULL)
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
  ON users (phone)
  WHERE phone IS NOT NULL;

-- Paramètres utilisateur (devise, langue, unité)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS devise       TEXT DEFAULT 'XAF'
      CHECK (devise IN ('XAF', 'EUR', 'USD', 'GBP', 'GHS', 'NGN', 'KES')),
  ADD COLUMN IF NOT EXISTS langue       TEXT DEFAULT 'fr'
      CHECK (langue IN ('fr', 'en')),
  ADD COLUMN IF NOT EXISTS unite_mesure TEXT DEFAULT 'cm'
      CHECK (unite_mesure IN ('cm', 'pouces'));

-- RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_profiles_are_viewable" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_delete_own_profile" ON users;
DROP POLICY IF EXISTS "users_select_policy"          ON users;
DROP POLICY IF EXISTS "users_insert_policy"          ON users;
DROP POLICY IF EXISTS "users_update_policy"          ON users;
DROP POLICY IF EXISTS "users_delete_policy"          ON users;

-- SELECT : son propre profil OU catalogues publics
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    auth.uid() = id OR statut_catalogue = 'public'
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE USING (auth.uid() = id);
```

---



### Migration 003 — Gestion des clients

```sql
-- Renommer les colonnes (seulement si les anciens noms existent encore)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='user_id')
  THEN ALTER TABLE clients RENAME COLUMN user_id TO couturier_id; END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='full_name')
  THEN ALTER TABLE clients RENAME COLUMN full_name TO nom; END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='neighborhood')
  THEN ALTER TABLE clients RENAME COLUMN neighborhood TO adresse; END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='gender')
  THEN ALTER TABLE clients RENAME COLUMN gender TO sexe; END IF;
END $$;

-- Nouvelles colonnes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp       TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email          TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes_internes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;

-- Migrer les valeurs anglaises de sexe
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_gender_check;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_sexe_check;
UPDATE clients SET sexe = 'femme' WHERE sexe = 'female';
UPDATE clients SET sexe = 'homme' WHERE sexe = 'male';
ALTER TABLE clients
  ADD CONSTRAINT clients_sexe_check
  CHECK (sexe IN ('homme', 'femme', 'autre'));

-- Index
CREATE INDEX IF NOT EXISTS idx_clients_couturier_id ON clients(couturier_id);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at   ON clients(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select_policy ON clients;
DROP POLICY IF EXISTS clients_insert_policy ON clients;
DROP POLICY IF EXISTS clients_update_policy ON clients;
DROP POLICY IF EXISTS clients_delete_policy ON clients;

-- SELECT : mes clients non supprimés uniquement
CREATE POLICY clients_select_policy ON clients
  FOR SELECT USING (auth.uid() = couturier_id AND deleted_at IS NULL);

CREATE POLICY clients_insert_policy ON clients
  FOR INSERT WITH CHECK (auth.uid() = couturier_id);

CREATE POLICY clients_update_policy ON clients
  FOR UPDATE USING (auth.uid() = couturier_id);

-- Soft delete uniquement, pas de DELETE physique
CREATE POLICY clients_delete_policy ON clients
  FOR DELETE USING (false);
```

---



### Migration 004 — Catalogue de modèles

```sql
-- Renommer user_id → couturier_id (si nécessaire)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog' AND column_name='user_id')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='catalog' AND column_name='couturier_id')
  THEN ALTER TABLE catalog RENAME COLUMN user_id TO couturier_id; END IF;
END $$;

-- Nouvelles colonnes
ALTER TABLE catalog
  ADD COLUMN IF NOT EXISTS difficulte TEXT NOT NULL DEFAULT 'moyen'
    CHECK (difficulte IN ('facile', 'moyen', 'difficile')),
  ADD COLUMN IF NOT EXISTS temps_moyen_realisation INTEGER,
  ADD COLUMN IF NOT EXISTS tissus_recommandes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accessoires_necessaires TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS statut TEXT NOT NULL DEFAULT 'prive'
    CHECK (statut IN ('public', 'prive')),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index
CREATE INDEX IF NOT EXISTS idx_catalog_couturier_id ON catalog(couturier_id);
CREATE INDEX IF NOT EXISTS idx_catalog_statut       ON catalog(statut);
CREATE INDEX IF NOT EXISTS idx_catalog_deleted_at   ON catalog(deleted_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_select_policy" ON catalog;
DROP POLICY IF EXISTS "catalog_insert_policy" ON catalog;
DROP POLICY IF EXISTS "catalog_update_policy" ON catalog;
DROP POLICY IF EXISTS "catalog_delete_policy" ON catalog;

-- SELECT : propriétaire voit tout ; visiteurs voient uniquement public d'un catalogue public
CREATE POLICY "catalog_select_policy" ON catalog
  FOR SELECT USING (
    deleted_at IS NULL AND (
      couturier_id = auth.uid()
      OR (
        statut = 'public' AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = catalog.couturier_id AND users.statut_catalogue = 'public'
        )
      )
    )
  );

CREATE POLICY "catalog_insert_policy" ON catalog
  FOR INSERT WITH CHECK (couturier_id = auth.uid());

CREATE POLICY "catalog_update_policy" ON catalog
  FOR UPDATE USING (couturier_id = auth.uid());

-- Soft delete via deleted_at, pas de DELETE physique
CREATE POLICY "catalog_delete_policy" ON catalog
  FOR DELETE USING (false);
```

---



### Migration 005 — Fiches de mensuration

> ⚠️ La FK `REFERENCES couturiers(id)` suppose qu'une table `couturiers` existe.  
> Si votre projet n'a pas cette table, remplacer par `REFERENCES auth.users(id)`.

```sql
-- Types ENUM
DO $$ BEGIN
  CREATE TYPE type_vetement AS ENUM ('robe','costume','chemise','pantalon','boubou','autre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unite_mesure AS ENUM ('cm','pouces');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS fiches_mensuration (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID          NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  couturier_id    UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_vetement   type_vetement NOT NULL,
  date_prise      DATE          NOT NULL DEFAULT CURRENT_DATE,
  mesures         JSONB         NOT NULL DEFAULT '{}',
  unite           unite_mesure  NOT NULL DEFAULT 'cm',
  notes           TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS fiches_mensuration_client_idx
  ON fiches_mensuration(client_id);
CREATE INDEX IF NOT EXISTS fiches_mensuration_couturier_idx
  ON fiches_mensuration(couturier_id);
CREATE INDEX IF NOT EXISTS fiches_mensuration_type_idx
  ON fiches_mensuration(client_id, type_vetement);

-- Une seule fiche active par client + type de vêtement
CREATE UNIQUE INDEX IF NOT EXISTS fiches_mensuration_active_unique_idx
  ON fiches_mensuration(client_id, type_vetement)
  WHERE is_active = true;

-- RLS
ALTER TABLE fiches_mensuration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couturier_fiches_select" ON fiches_mensuration;
DROP POLICY IF EXISTS "couturier_fiches_insert" ON fiches_mensuration;
DROP POLICY IF EXISTS "couturier_fiches_update" ON fiches_mensuration;
DROP POLICY IF EXISTS "couturier_fiches_delete" ON fiches_mensuration;

CREATE POLICY "couturier_fiches_select" ON fiches_mensuration
  FOR SELECT USING (couturier_id = auth.uid());
CREATE POLICY "couturier_fiches_insert" ON fiches_mensuration
  FOR INSERT WITH CHECK (couturier_id = auth.uid());
CREATE POLICY "couturier_fiches_update" ON fiches_mensuration
  FOR UPDATE USING (couturier_id = auth.uid());
CREATE POLICY "couturier_fiches_delete" ON fiches_mensuration
  FOR DELETE USING (couturier_id = auth.uid());
```

---



### Migration 006 — Réalisations + bucket Storage `realisation-photos`

```sql
-- Type ENUM statut réalisation
CREATE TYPE statut_realisation AS ENUM (
  'en_cours', 'essayage', 'corrections', 'terminee', 'livree'
);

-- Table
CREATE TABLE IF NOT EXISTS realisations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id            uuid NOT NULL REFERENCES clients(id)    ON DELETE CASCADE,
  commande_id          uuid,                               -- FK ajoutée en migration 008
  modele_id            uuid REFERENCES catalog(id)         ON DELETE SET NULL,
  fiche_mensuration_id uuid REFERENCES fiches_mensuration(id) ON DELETE SET NULL,
  tissu_id             uuid,                               -- FK ajoutée en migration 007
  tissu_label          text,
  couleur              text              NOT NULL DEFAULT '',
  accessoires          text[]            NOT NULL DEFAULT '{}',
  photos               text[]            NOT NULL DEFAULT '{}',
  observations         text,
  statut               statut_realisation NOT NULL DEFAULT 'en_cours',
  date_creation        date              NOT NULL DEFAULT CURRENT_DATE,
  date_essayage        date,
  date_livraison       date,
  created_at           timestamptz       NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS realisations_couturier_idx ON realisations(couturier_id);
CREATE INDEX IF NOT EXISTS realisations_client_idx    ON realisations(client_id);
CREATE INDEX IF NOT EXISTS realisations_statut_idx    ON realisations(statut);

-- RLS
ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "couturier_voit_ses_realisations"
  ON realisations FOR ALL USING (couturier_id = auth.uid());

-- Bucket Storage (public, URLs opaques)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('realisation-photos', 'realisation-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "couturier_upload_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'realisation-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "lecture_publique_photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'realisation-photos');

CREATE POLICY "couturier_supprime_photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'realisation-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---



### Migration 007 — Tissus + bucket Storage `tissu-photos`

```sql
-- Table
CREATE TABLE IF NOT EXISTS tissus (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  couturier_id        uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_tissu          text          NOT NULL,
  nom_commercial      text          NOT NULL,
  couleur             text          NOT NULL DEFAULT '',
  fournisseur         text,
  prix_unitaire       numeric(10,2) NOT NULL DEFAULT 0,
  quantite_utilisee   numeric(10,2) NOT NULL DEFAULT 0,
  photo               text,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS tissus_updated_at ON tissus;
CREATE TRIGGER tissus_updated_at
  BEFORE UPDATE ON tissus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS tissus_couturier_idx   ON tissus(couturier_id);
CREATE INDEX IF NOT EXISTS tissus_type_idx         ON tissus(type_tissu);
CREATE INDEX IF NOT EXISTS tissus_fournisseur_idx  ON tissus(fournisseur);

-- RLS
ALTER TABLE tissus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "couturier_voit_ses_tissus"
  ON tissus FOR ALL USING (couturier_id = auth.uid());

-- FK manquante de migration 006 : realisations.tissu_id → tissus.id
ALTER TABLE realisations
  ADD CONSTRAINT fk_realisations_tissu
  FOREIGN KEY (tissu_id) REFERENCES tissus(id) ON DELETE SET NULL;

-- Bucket Storage photos tissus
INSERT INTO storage.buckets (id, name, public)
  VALUES ('tissu-photos', 'tissu-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "couturier_upload_tissu_photo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tissu-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "lecture_publique_tissu_photo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tissu-photos');

CREATE POLICY "couturier_supprime_tissu_photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tissu-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---



### Migration 008 — Commandes : numérotation + historique statuts

```sql
-- Séquence pour CMD-YYYY-NNNN
CREATE SEQUENCE IF NOT EXISTS commande_numero_seq
  START WITH 1 INCREMENT BY 1 NO CYCLE;

-- Nouvelles colonnes sur orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS numero_commande       text,
  ADD COLUMN IF NOT EXISTS date_livraison_reelle date;

-- Trigger : génère le numéro à l'insertion
CREATE OR REPLACE FUNCTION fn_generate_numero_commande()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_commande IS NULL OR NEW.numero_commande = '' THEN
    NEW.numero_commande := 'CMD-'
      || to_char(now(), 'YYYY') || '-'
      || LPAD(nextval('commande_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_numero_commande ON orders;
CREATE TRIGGER trig_numero_commande
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_generate_numero_commande();

-- Backfill des commandes existantes
DO $$
DECLARE rec RECORD; n INTEGER := 1;
BEGIN
  FOR rec IN
    SELECT id, created_at FROM orders WHERE numero_commande IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE orders
    SET numero_commande =
      'CMD-' || to_char(rec.created_at, 'YYYY') || '-' || LPAD(n::text, 4, '0')
    WHERE id = rec.id;
    n := n + 1;
  END LOOP;
  PERFORM setval('commande_numero_seq', GREATEST(n, 1));
END $$;

-- Table historique statuts
CREATE TABLE IF NOT EXISTS historique_statuts_commande (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  couturier_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ancien_statut  text,
  nouveau_statut text        NOT NULL,
  commentaire    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hist_statut_commande
  ON historique_statuts_commande(commande_id, created_at DESC);

ALTER TABLE historique_statuts_commande ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couturier_voit_son_historique"
  ON historique_statuts_commande FOR ALL
  USING (couturier_id = auth.uid());

-- FK manquante de migration 006 : realisations.commande_id → orders.id
DO $$ BEGIN
  ALTER TABLE realisations
    ADD CONSTRAINT fk_realisations_commande
    FOREIGN KEY (commande_id) REFERENCES orders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

---



### Migration 009 — Paiements : type + vue solde

```sql
-- Colonne type sur payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'acompte';

UPDATE payments SET type = 'acompte' WHERE type IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_type_check') THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_type_check
      CHECK (type IN ('acompte', 'paiement_intermediaire', 'solde_final'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Vue synthèse solde par commande
CREATE OR REPLACE VIEW vue_solde_commande AS
SELECT
  o.id                                          AS order_id,
  o.client_id,
  o.total_amount,
  o.advance_payment,
  COALESCE(SUM(p.amount), 0)                    AS total_paye,
  o.total_amount - COALESCE(SUM(p.amount), 0)   AS solde_restant,
  CASE
    WHEN COALESCE(SUM(p.amount), 0) = 0               THEN 'non_payee'
    WHEN COALESCE(SUM(p.amount), 0) >= o.total_amount  THEN 'payee'
    ELSE 'partiellement_payee'
  END                                            AS statut_paiement
FROM   orders o
LEFT   JOIN payments p ON p.order_id = o.id
GROUP  BY o.id, o.client_id, o.total_amount, o.advance_payment;
```

---



### Migration 010 — Recherche Full-Text Search (Module 10)

```sql
-- Colonne tsvector générée sur realisations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realisations' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE realisations
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('french',
          coalesce(tissu_label, '') || ' ' ||
          coalesce(couleur, '')     || ' ' ||
          coalesce(observations, '')
        )
      ) STORED;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_realisations_search_vector
  ON realisations USING GIN (search_vector);

-- Fonction de recherche principale
CREATE OR REPLACE FUNCTION rechercher_realisations(
  p_query      text DEFAULT NULL,
  p_couturier  uuid DEFAULT NULL,
  p_statut     text DEFAULT NULL,
  p_date_from  date DEFAULT NULL,
  p_date_to    date DEFAULT NULL
)
RETURNS TABLE (
  realisation_id  uuid,
  client_id       uuid,
  client_nom      text,
  tissu_label     text,
  couleur         text,
  statut          text,
  date_creation   date,
  commande_id     uuid,
  numero_commande text,
  rank            real
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  ts_query tsquery;
  v_uid    uuid;
BEGIN
  v_uid := COALESCE(p_couturier, auth.uid());

  IF p_query IS NOT NULL AND trim(p_query) <> '' THEN
    BEGIN
      ts_query := websearch_to_tsquery('french', p_query);
    EXCEPTION WHEN OTHERS THEN
      ts_query := plainto_tsquery('french', p_query);
    END;
  END IF;

  RETURN QUERY
  WITH joined AS (
    SELECT
      r.id, r.client_id,
      c.nom                                    AS client_nom,
      r.tissu_label, r.couleur, r.statut,
      r.date_creation::date                    AS date_creation,
      r.commande_id, o.numero_commande,
      to_tsvector('french',
        coalesce(c.nom, '')             || ' ' ||
        coalesce(r.tissu_label, '')     || ' ' ||
        coalesce(r.couleur, '')         || ' ' ||
        coalesce(r.observations, '')    || ' ' ||
        coalesce(o.numero_commande, '') || ' ' ||
        coalesce(cm.name, '')
      ) AS doc_vector
    FROM   realisations r
    JOIN   clients   c  ON c.id  = r.client_id
    LEFT   JOIN orders  o  ON o.id  = r.commande_id
    LEFT   JOIN catalog cm ON cm.id = r.modele_id
    WHERE  r.couturier_id = v_uid
      AND (p_statut    IS NULL OR r.statut        = p_statut)
      AND (p_date_from IS NULL OR r.date_creation >= p_date_from)
      AND (p_date_to   IS NULL OR r.date_creation <= p_date_to)
  )
  SELECT
    j.id, j.client_id, j.client_nom,
    j.tissu_label, j.couleur, j.statut,
    j.date_creation, j.commande_id, j.numero_commande,
    CASE
      WHEN ts_query IS NULL THEN 1.0::real
      ELSE ts_rank_cd(j.doc_vector, ts_query)
    END AS rank
  FROM joined j
  WHERE ts_query IS NULL OR j.doc_vector @@ ts_query
  ORDER BY rank DESC, j.date_creation DESC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION rechercher_realisations(text,uuid,text,date,date)
  TO authenticated;
```

---



## Résumé RLS (Row Level Security)


| Table                         | SELECT                                              | INSERT             | UPDATE             | DELETE                   |
| ----------------------------- | --------------------------------------------------- | ------------------ | ------------------ | ------------------------ |
| `users`                       | propre profil + profils publics                     | soi-même           | soi-même           | soi-même                 |
| `clients`                     | mes clients (deleted_at IS NULL)                    | couturier_id = uid | couturier_id = uid | **bloqué** (soft delete) |
| `catalog`                     | mes modèles + modèles publics de catalogues publics | couturier_id = uid | couturier_id = uid | **bloqué** (soft delete) |
| `fiches_mensuration`          | couturier_id = uid                                  | couturier_id = uid | couturier_id = uid | couturier_id = uid       |
| `realisations`                | couturier_id = uid                                  | couturier_id = uid | couturier_id = uid | couturier_id = uid       |
| `tissus`                      | couturier_id = uid                                  | couturier_id = uid | couturier_id = uid | couturier_id = uid       |
| `historique_statuts_commande` | couturier_id = uid                                  | couturier_id = uid | couturier_id = uid | couturier_id = uid       |


> Les tables `orders`, `payments`, `activities`, `measurements` conservent les politiques créées lors de la mise en place initiale de Supabase (non incluses dans ces migrations).

---



## Storage Buckets


| Bucket               | Visibilité | Chemin des objets  | Utilisé par             |
| -------------------- | ---------- | ------------------ | ----------------------- |
| `realisation-photos` | Public     | `{uid}/{filename}` | Module 5 — Réalisations |
| `tissu-photos`       | Public     | `{uid}/{filename}` | Module 6 — Tissus       |


> Les buckets sont créés par les migrations 006 et 007. Pas besoin de les créer manuellement dans le Dashboard Supabase.

---



## Structure du projet

```
src/
  components/
    dashboard/       TailorDashboard.tsx · ClientDashboard.tsx
    ui/              Button · Card · Input · Avatar · Header…
  constants/         theme.ts · colors
  navigation/        AppNavigator.tsx (Stack + bottom Tabs)
  screens/
    Dashboard/       DashboardScreen
    Clients/         ClientsListScreen · AddClientScreen · ClientDetailsScreen
    Measurements/    FichesListScreen · AddFicheScreen
    Orders/          CommandeKanbanScreen · AddOrderScreen · OrderDetailsScreen
    Payments/        PaymentsScreen · AddPaymentScreen · RecuScreen
    Catalog/         CatalogListScreen · AddCatalogModelScreen · EditCatalogModelScreen
    Realisations/    RealisationsListScreen · AddRealisationScreen · RealisationDetailsScreen
    Tissus/          TissusListScreen · AddTissuScreen
    Comptabilite/    ComptabiliteScreen
    Recherche/       RechercheScreen
    Galerie/         GalerieScreen
    Statistics/      StatisticsScreen
    Settings/        SettingsScreen
  services/
    supabaseService.ts   Tous les services DB (~1 200 lignes)
  store/
    useAppStore.ts       Store Zustand (3 instances create<>)
  lib/
    supabase.ts          Client Supabase
  types/
    index.ts             Tous les types TypeScript
  utils/
    formatters.ts        formatCurrency · formatRelativeTime
supabase/
  migrations/            001 → 010 (SQL idempotents)
```

---



## Préférences utilisateur

- Conserver la stack existante (pas de remplacement Firebase/Supabase)
- Pas de migrations auto — exécuter dans Supabase SQL Editor manuellement
- UI : palette violet foncé `#16123A` + or `#D4AF37` + fond clair `#F5F4FB`
- Langue : français partout (labels, commentaires, noms de colonnes)



## Table `users`



### Columns


| Name               | Type          | Constraints |
| ------------------ | ------------- | ----------- |
| `id`               | `uuid`        | Primary     |
| `phone`            | `text`        | Nullable    |
| `display_name`     | `text`        | Nullable    |
| `atelier_name`     | `text`        | Nullable    |
| `email`            | `text`        | Nullable    |
| `role`             | `text`        | Nullable    |
| `whatsapp`         | `text`        | Nullable    |
| `adresse`          | `text`        | Nullable    |
| `horaires`         | `jsonb`       | Nullable    |
| `reseaux_sociaux`  | `jsonb`       | Nullable    |
| `description`      | `text`        | Nullable    |
| `statut_catalogue` | `text`        | Nullable    |
| `plan_abonnement`  | `text`        | Nullable    |
| `city`             | `text`        | Nullable    |
| `district`         | `text`        | Nullable    |
| `specialities`     | `_text`       | Nullable    |
| `avatar_url`       | `text`        | Nullable    |
| `devise`           | `text`        | Nullable    |
| `langue`           | `text`        | Nullable    |
| `unite_mesure`     | `text`        | Nullable    |
| `created_at`       | `timestamptz` |             |




## Table `clients`



### Columns


| Name             | Type          | Constraints |
| ---------------- | ------------- | ----------- |
| `id`             | `uuid`        | Primary     |
| `couturier_id`   | `uuid`        |             |
| `nom`            | `text`        |             |
| `telephone`      | `text`        |             |
| `whatsapp`       | `text`        | Nullable    |
| `email`          | `text`        | Nullable    |
| `adresse`        | `text`        | Nullable    |
| `sexe`           | `text`        | Nullable    |
| `date_naissance` | `date`        | Nullable    |
| `photo_url`      | `text`        | Nullable    |
| `notes_internes` | `text`        | Nullable    |
| `is_favorite`    | `bool`        |             |
| `balance`        | `numeric`     |             |
| `deleted_at`     | `timestamptz` | Nullable    |
| `created_at`     | `timestamptz` |             |
| `updated_at`     | `timestamptz` |             |




## Table `catalog`



### Columns


| Name                      | Type          | Constraints |
| ------------------------- | ------------- | ----------- |
| `id`                      | `uuid`        | Primary     |
| `couturier_id`            | `uuid`        |             |
| `name`                    | `text`        |             |
| `category`                | `text`        |             |
| `description`             | `text`        | Nullable    |
| `photos`                  | `_text`       |             |
| `price`                   | `numeric`     |             |
| `is_favorite`             | `bool`        |             |
| `difficulte`              | `text`        |             |
| `temps_moyen_realisation` | `int4`        | Nullable    |
| `tissus_recommandes`      | `_text`       |             |
| `accessoires_necessaires` | `_text`       |             |
| `statut`                  | `text`        |             |
| `deleted_at`              | `timestamptz` | Nullable    |
| `created_at`              | `timestamptz` |             |
| `updated_at`              | `timestamptz` | Nullable    |




## Table `orders`



### Columns


| Name                    | Type          | Constraints |
| ----------------------- | ------------- | ----------- |
| `id`                    | `uuid`        | Primary     |
| `couturier_id`          | `uuid`        |             |
| `client_id`             | `uuid`        |             |
| `client_name`           | `text`        | Nullable    |
| `clothing_type`         | `text`        | Nullable    |
| `description`           | `text`        | Nullable    |
| `delivery_date`         | `date`        | Nullable    |
| `urgency_level`         | `text`        | Nullable    |
| `total_price`           | `numeric`     |             |
| `advance_payment`       | `numeric`     |             |
| `remaining_amount`      | `numeric`     |             |
| `payment_status`        | `text`        | Nullable    |
| `order_status`          | `text`        | Nullable    |
| `numero_commande`       | `text`        | Nullable    |
| `date_livraison_reelle` | `date`        | Nullable    |
| `created_at`            | `timestamptz` |             |
| `updated_at`            | `timestamptz` |             |
| `project_id`            | `uuid`        | Nullable    |
| `participant_id`        | `uuid`        | Nullable    |
| `fiche_mensuration_id`  | `uuid`        | Nullable    |
| `catalog_id`            | `uuid`        | Nullable    |




## Table `payments`



### Columns


| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `couturier_id` | `uuid`        |             |
| `order_id`     | `uuid`        | Nullable    |
| `client_id`    | `uuid`        |             |
| `amount`       | `numeric`     |             |
| `date`         | `date`        |             |
| `method`       | `text`        | Nullable    |
| `notes`        | `text`        | Nullable    |
| `type`         | `text`        | Nullable    |
| `created_at`   | `timestamptz` |             |
| `project_id`   | `uuid`        | Nullable    |




## Table `activities`



### Columns


| Name            | Type          | Constraints |
| --------------- | ------------- | ----------- |
| `id`            | `uuid`        | Primary     |
| `couturier_id`  | `uuid`        |             |
| `activity_type` | `text`        | Nullable    |
| `title`         | `text`        | Nullable    |
| `subtitle`      | `text`        | Nullable    |
| `amount`        | `numeric`     | Nullable    |
| `client_id`     | `uuid`        | Nullable    |
| `order_id`      | `uuid`        | Nullable    |
| `created_at`    | `timestamptz` |             |




## Table `fiches_mensuration`



### Columns


| Name              | Type                | Constraints |
| ----------------- | ------------------- | ----------- |
| `id`              | `uuid`              | Primary     |
| `client_id`       | `uuid`              |             |
| `couturier_id`    | `uuid`              |             |
| `type_vetement`   | `text`              |             |
| `date_prise`      | `date`              |             |
| `mesures`         | `jsonb`             |             |
| `unite`           | `unite_mesure_enum` |             |
| `notes`           | `text`              | Nullable    |
| `is_active`       | `bool`              |             |
| `created_at`      | `timestamptz`       |             |
| `order_id`        | `uuid`              | Nullable    |
| `source_fiche_id` | `uuid`              | Nullable    |
| `updated_at`      | `timestamptz`       | Nullable    |




## Table `tissus`



### Columns


| Name                | Type          | Constraints |
| ------------------- | ------------- | ----------- |
| `id`                | `uuid`        | Primary     |
| `couturier_id`      | `uuid`        |             |
| `type_tissu`        | `text`        |             |
| `nom_commercial`    | `text`        |             |
| `couleur`           | `text`        |             |
| `fournisseur`       | `text`        | Nullable    |
| `prix_unitaire`     | `numeric`     |             |
| `quantite_utilisee` | `numeric`     |             |
| `photo`             | `text`        | Nullable    |
| `created_at`        | `timestamptz` |             |
| `updated_at`        | `timestamptz` |             |




## Table `realisations`



### Columns


| Name                   | Type                 | Constraints |
| ---------------------- | -------------------- | ----------- |
| `id`                   | `uuid`               | Primary     |
| `couturier_id`         | `uuid`               |             |
| `client_id`            | `uuid`               |             |
| `commande_id`          | `uuid`               | Nullable    |
| `modele_id`            | `uuid`               | Nullable    |
| `fiche_mensuration_id` | `uuid`               | Nullable    |
| `tissu_id`             | `uuid`               | Nullable    |
| `tissu_label`          | `text`               | Nullable    |
| `couleur`              | `text`               |             |
| `accessoires`          | `_text`              |             |
| `photos`               | `_text`              |             |
| `observations`         | `text`               | Nullable    |
| `statut`               | `statut_realisation` |             |
| `date_creation`        | `date`               |             |
| `date_essayage`        | `date`               | Nullable    |
| `date_livraison`       | `date`               | Nullable    |
| `created_at`           | `timestamptz`        |             |
| `search_vector`        | `tsvector`           | Nullable    |




## Table `historique_statuts_commande`



### Columns


| Name             | Type          | Constraints |
| ---------------- | ------------- | ----------- |
| `id`             | `uuid`        | Primary     |
| `commande_id`    | `uuid`        |             |
| `couturier_id`   | `uuid`        |             |
| `ancien_statut`  | `text`        | Nullable    |
| `nouveau_statut` | `text`        |             |
| `commentaire`    | `text`        | Nullable    |
| `created_at`     | `timestamptz` |             |




## Table `catalog_photos`



### Columns


| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `catalog_id`   | `uuid`        |             |
| `couturier_id` | `uuid`        |             |
| `photo_url`    | `text`        |             |
| `created_at`   | `timestamptz` |             |
| `updated_at`   | `timestamptz` | Nullable    |




## Table `order_items`



### Columns


| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `order_id`     | `uuid`        |             |
| `couturier_id` | `uuid`        |             |
| `item_type`    | `text`        |             |
| `photo_url`    | `text`        |             |
| `created_at`   | `timestamptz` |             |
| `catalog_id`   | `uuid`        | Nullable    |




## Table `garment_measurement_fields`



### Columns


| Name            | Type          | Constraints |
| --------------- | ------------- | ----------- |
| `id`            | `uuid`        | Primary     |
| `couturier_id`  | `uuid`        | Nullable    |
| `type_vetement` | `text`        |             |
| `field_key`     | `text`        |             |
| `label`         | `text`        |             |
| `unite_defaut`  | `text`        |             |
| `sort_order`    | `int4`        |             |
| `created_at`    | `timestamptz` |             |




## Table `projects`



### Columns


| Name             | Type          | Constraints |
| ---------------- | ------------- | ----------- |
| `id`             | `uuid`        | Primary     |
| `couturier_id`   | `uuid`        |             |
| `client_id`      | `uuid`        |             |
| `nom`            | `text`        |             |
| `type_projet`    | `text`        | Nullable    |
| `statut`         | `text`        |             |
| `date_evenement` | `date`        | Nullable    |
| `notes`          | `text`        | Nullable    |
| `deleted_at`     | `timestamptz` | Nullable    |
| `created_at`     | `timestamptz` |             |
| `updated_at`     | `timestamptz` |             |




## Table `project_participants`



### Columns


| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `project_id`   | `uuid`        |             |
| `couturier_id` | `uuid`        |             |
| `client_id`    | `uuid`        | Nullable    |
| `nom`          | `text`        |             |
| `telephone`    | `text`        | Nullable    |
| `role`         | `text`        | Nullable    |
| `is_temporary` | `bool`        |             |
| `created_at`   | `timestamptz` |             |




## Custom Types / Enums



### `type_vetement`

`robe` | `costume` | `chemise` | `pantalon` | `boubou` | `autre`

### `unite_mesure_enum`

`cm` | `pouces`

### `statut_realisation`

`en_cours` | `essayage` | `corrections` | `terminee` | `livree`

## RLS Policies



### `users`


| Policy                | Command | Roles  | Action     | USING                                                        | WITH CHECK          |
| --------------------- | ------- | ------ | ---------- | ------------------------------------------------------------ | ------------------- |
| `users_select_policy` | SELECT  | public | PERMISSIVE | `((auth.uid() = id) OR (statut_catalogue = 'public'::text))` | —                   |
| `users_insert_policy` | INSERT  | public | PERMISSIVE | —                                                            | `(auth.uid() = id)` |
| `users_update_policy` | UPDATE  | public | PERMISSIVE | `(auth.uid() = id)`                                          | `(auth.uid() = id)` |
| `users_delete_policy` | DELETE  | public | PERMISSIVE | `(auth.uid() = id)`                                          | —                   |




### `clients`


| Policy                  | Command | Roles  | Action     | USING                                                    | WITH CHECK                    |
| ----------------------- | ------- | ------ | ---------- | -------------------------------------------------------- | ----------------------------- |
| `clients_select_policy` | SELECT  | public | PERMISSIVE | `((auth.uid() = couturier_id) AND (deleted_at IS NULL))` | —                             |
| `clients_insert_policy` | INSERT  | public | PERMISSIVE | —                                                        | `(auth.uid() = couturier_id)` |
| `clients_update_policy` | UPDATE  | public | PERMISSIVE | `(auth.uid() = couturier_id)`                            | —                             |
| `clients_delete_policy` | DELETE  | public | PERMISSIVE | `false`                                                  | —                             |




### `catalog`


| Policy                  | Command | Roles  | Action     | USING                                                                                                                                                                                                                 | WITH CHECK                    |
| ----------------------- | ------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `catalog_select_policy` | SELECT  | public | PERMISSIVE | `((deleted_at IS NULL) AND ((couturier_id = auth.uid()) OR ((statut = 'public'::text) AND (EXISTS ( SELECT 1 FROM users WHERE ((users.id = catalog.couturier_id) AND (users.statut_catalogue = 'public'::text)))))))` | —                             |
| `catalog_insert_policy` | INSERT  | public | PERMISSIVE | —                                                                                                                                                                                                                     | `(couturier_id = auth.uid())` |
| `catalog_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())`                                                                                                                                                                                         | —                             |
| `catalog_delete_policy` | DELETE  | public | PERMISSIVE | `false`                                                                                                                                                                                                               | —                             |




### `orders`


| Policy                 | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ---------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `orders_select_policy` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `orders_insert_policy` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `orders_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `orders_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |




### `payments`


| Policy                   | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ------------------------ | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `payments_select_policy` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `payments_insert_policy` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `payments_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `payments_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |




### `activities`


| Policy                  | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ----------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `activities_all_policy` | ALL     | public | PERMISSIVE | `(couturier_id = auth.uid())` | `(couturier_id = auth.uid())` |




### `fiches_mensuration`


| Policy                    | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `couturier_fiches_select` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `couturier_fiches_insert` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `couturier_fiches_update` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `couturier_fiches_delete` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |




### `realisations`


| Policy                            | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| --------------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `couturier_voit_ses_realisations` | ALL     | public | PERMISSIVE | `(couturier_id = auth.uid())` | `(couturier_id = auth.uid())` |




### `tissus`


| Policy                      | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| --------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `couturier_voit_ses_tissus` | ALL     | public | PERMISSIVE | `(couturier_id = auth.uid())` | `(couturier_id = auth.uid())` |




### `historique_statuts_commande`


| Policy                          | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ------------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `couturier_voit_son_historique` | ALL     | public | PERMISSIVE | `(couturier_id = auth.uid())` | `(couturier_id = auth.uid())` |




### `catalog_photos`


| Policy                         | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ------------------------------ | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `catalog_photos_select_policy` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `catalog_photos_insert_policy` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `catalog_photos_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |




### `garment_measurement_fields`


| Policy              | Command | Roles  | Action     | USING                                                     | WITH CHECK                    |
| ------------------- | ------- | ------ | ---------- | --------------------------------------------------------- | ----------------------------- |
| `gmf_select_policy` | SELECT  | public | PERMISSIVE | `((couturier_id IS NULL) OR (couturier_id = auth.uid()))` | —                             |
| `gmf_insert_policy` | INSERT  | public | PERMISSIVE | —                                                         | `(couturier_id = auth.uid())` |
| `gmf_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())`                             | —                             |
| `gmf_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())`                             | —                             |




### `projects`


| Policy                   | Command | Roles  | Action     | USING                                                    | WITH CHECK                    |
| ------------------------ | ------- | ------ | ---------- | -------------------------------------------------------- | ----------------------------- |
| `projects_select_policy` | SELECT  | public | PERMISSIVE | `((couturier_id = auth.uid()) AND (deleted_at IS NULL))` | —                             |
| `projects_insert_policy` | INSERT  | public | PERMISSIVE | —                                                        | `(couturier_id = auth.uid())` |
| `projects_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())`                            | —                             |
| `projects_delete_policy` | DELETE  | public | PERMISSIVE | `false`                                                  | —                             |




### `project_participants`


| Policy             | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| ------------------ | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `pp_select_policy` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `pp_insert_policy` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `pp_update_policy` | UPDATE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `pp_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |




### `order_items`


| Policy                      | Command | Roles  | Action     | USING                         | WITH CHECK                    |
| --------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------------------- |
| `order_items_select_policy` | SELECT  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |
| `order_items_insert_policy` | INSERT  | public | PERMISSIVE | —                             | `(couturier_id = auth.uid())` |
| `order_items_delete_policy` | DELETE  | public | PERMISSIVE | `(couturier_id = auth.uid())` | —                             |


