-- ============================================================
-- SCHEMA SQL — EduSuivi
-- À coller dans : Supabase > SQL Editor > New query
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE role_enum AS ENUM ('admin', 'professeur', 'surveillant', 'eleve');
CREATE TYPE sanction_type AS ENUM ('avertissement', 'retenue', 'exclusion_temp', 'exclusion_def');

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE users (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nom         TEXT NOT NULL,
  prenom      TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,  -- bcrypt hash
  role        role_enum NOT NULL,
  actif       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── ANNEES SCOLAIRES ──────────────────────────────────────────
CREATE TABLE annees_scolaires (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  libelle     TEXT NOT NULL,
  date_debut  DATE NOT NULL,
  date_fin    DATE NOT NULL,
  actif       BOOLEAN DEFAULT false
);

-- ── CLASSES ───────────────────────────────────────────────────
CREATE TABLE classes (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nom         TEXT NOT NULL,
  niveau      TEXT NOT NULL,
  annee_id    TEXT NOT NULL REFERENCES annees_scolaires(id)
);

-- ── MATIERES ──────────────────────────────────────────────────
CREATE TABLE matieres (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nom         TEXT NOT NULL,
  coefficient INTEGER DEFAULT 1,
  couleur     TEXT DEFAULT '#2563eb'
);

-- ── CLASSE_MATIERES ───────────────────────────────────────────
CREATE TABLE classe_matieres (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  classe_id     TEXT NOT NULL REFERENCES classes(id),
  matiere_id    TEXT NOT NULL REFERENCES matieres(id),
  professeur_id TEXT NOT NULL REFERENCES users(id),
  UNIQUE(classe_id, matiere_id)
);

-- ── ELEVES ────────────────────────────────────────────────────
CREATE TABLE eleves (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id        TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  matricule      TEXT NOT NULL UNIQUE,
  date_naissance DATE,
  photo          TEXT,
  adresse        TEXT,
  nationalite    TEXT DEFAULT 'Burkinabè'
);

-- ── PARENTS ───────────────────────────────────────────────────
CREATE TABLE parents (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id  TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  nom       TEXT NOT NULL,
  prenom    TEXT NOT NULL,
  telephone TEXT,
  email     TEXT,
  relation  TEXT NOT NULL
);

-- ── INSCRIPTIONS ──────────────────────────────────────────────
CREATE TABLE inscriptions (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id         TEXT NOT NULL REFERENCES eleves(id),
  classe_id        TEXT NOT NULL REFERENCES classes(id),
  annee_id         TEXT NOT NULL REFERENCES annees_scolaires(id),
  date_inscription TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eleve_id, annee_id)
);

-- ── NOTES ─────────────────────────────────────────────────────
CREATE TABLE notes (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id      TEXT NOT NULL REFERENCES eleves(id),
  matiere_id    TEXT NOT NULL REFERENCES matieres(id),
  professeur_id TEXT NOT NULL REFERENCES users(id),
  valeur        DECIMAL(5,2) NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
  type_eval     TEXT NOT NULL,
  trimestre     INTEGER NOT NULL CHECK (trimestre IN (1,2,3)),
  commentaire   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── SANCTIONS ─────────────────────────────────────────────────
CREATE TABLE sanctions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id       TEXT NOT NULL REFERENCES eleves(id),
  surveillant_id TEXT NOT NULL REFERENCES users(id),
  type           sanction_type NOT NULL,
  motif          TEXT NOT NULL,
  description    TEXT,
  date_debut     DATE NOT NULL,
  date_fin       DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── RETARDS ───────────────────────────────────────────────────
CREATE TABLE retards (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id       TEXT NOT NULL REFERENCES eleves(id),
  surveillant_id TEXT NOT NULL REFERENCES users(id),
  date           DATE NOT NULL,
  heure_arrivee  TEXT NOT NULL,
  motif          TEXT,
  justifie       BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── ABSENCES ──────────────────────────────────────────────────
CREATE TABLE absences (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  eleve_id       TEXT NOT NULL REFERENCES eleves(id),
  surveillant_id TEXT NOT NULL REFERENCES users(id),
  date_debut     DATE NOT NULL,
  date_fin       DATE NOT NULL,
  motif          TEXT,
  justifiee      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleves     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE retards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences   ENABLE ROW LEVEL SECURITY;

-- Politique : admin voit tout
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Politique : un élève ne voit que son profil
CREATE POLICY "eleve_own_profile" ON eleves
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) IN ('admin', 'professeur', 'surveillant')
  );

-- Politique : notes — les profs voient leurs notes, l'admin tout
CREATE POLICY "notes_access" ON notes
  FOR SELECT USING (
    professeur_id = auth.uid()::text OR
    eleve_id IN (SELECT id FROM eleves WHERE user_id = auth.uid()::text) OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- ============================================================
-- DONNÉES DE TEST (SEED)
-- ============================================================

-- Année scolaire
INSERT INTO annees_scolaires (id, libelle, date_debut, date_fin, actif) VALUES
  ('annee-2025', '2024-2025', '2024-10-01', '2025-07-15', true);

-- Matières
INSERT INTO matieres (id, nom, coefficient, couleur) VALUES
  ('mat-maths',    'Mathématiques',    3, '#2563eb'),
  ('mat-francais', 'Français',         3, '#7c3aed'),
  ('mat-svt',      'SVT',              2, '#059669'),
  ('mat-hg',       'Histoire-Géo',     2, '#d97706'),
  ('mat-pc',       'Physique-Chimie',  2, '#dc2626'),
  ('mat-anglais',  'Anglais',          2, '#0891b2');

-- Classes
INSERT INTO classes (id, nom, niveau, annee_id) VALUES
  ('classe-3a', '3ème A', '3ème', 'annee-2025'),
  ('classe-4b', '4ème B', '4ème', 'annee-2025'),
  ('classe-5a', '5ème A', '5ème', 'annee-2025');

-- Users (passwords = bcrypt de "admin123", "prof123", etc.)
-- IMPORTANT: En production, utiliser de vrais hash bcrypt
INSERT INTO users (id, nom, prenom, email, password, role) VALUES
  ('user-admin',  'Diallo',    'Mamadou', 'admin@ecole.bf',  '$2b$10$placeholder_hash_admin',  'admin'),
  ('user-prof1',  'Ouédraogo', 'Safi',    'prof1@ecole.bf',  '$2b$10$placeholder_hash_prof',   'professeur'),
  ('user-prof2',  'Sawadogo',  'Ismaël',  'prof2@ecole.bf',  '$2b$10$placeholder_hash_prof2',  'professeur'),
  ('user-surv',   'Kaboré',    'Adèle',   'surv@ecole.bf',   '$2b$10$placeholder_hash_surv',   'surveillant'),
  ('user-eleve1', 'Traoré',    'Aïcha',   'eleve1@ecole.bf', '$2b$10$placeholder_hash_eleve1', 'eleve'),
  ('user-eleve2', 'Compaoré',  'Théo',    'eleve2@ecole.bf', '$2b$10$placeholder_hash_eleve2', 'eleve');

-- Élèves
INSERT INTO eleves (id, user_id, matricule, nationalite) VALUES
  ('eleve-1', 'user-eleve1', '2024-001', 'Burkinabè'),
  ('eleve-2', 'user-eleve2', '2024-002', 'Burkinabè');

-- Inscription en classe
INSERT INTO inscriptions (eleve_id, classe_id, annee_id) VALUES
  ('eleve-1', 'classe-3a', 'annee-2025'),
  ('eleve-2', 'classe-3a', 'annee-2025');
