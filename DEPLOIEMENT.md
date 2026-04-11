# 🏫 EduSuivi — Guide de déploiement complet

## Architecture

```
Frontend (React/Next.js)  →  Vercel  (CDN mondial, HTTPS auto)
Backend  (API Routes)     →  Vercel  (Serverless functions)
Base de données           →  Supabase  (PostgreSQL managé)
Fichiers (photos, PDF)    →  Supabase Storage
```

---

## ÉTAPE 1 — Créer le projet Supabase

1. Aller sur **[supabase.com](https://supabase.com)** → "Start your project"
2. Cliquer **"New project"**
3. Remplir :
   - **Name** : `edusurvi`
   - **Database Password** : générer un mot de passe fort (le noter !)
   - **Region** : `West EU (Ireland)` (le plus proche de l'Afrique de l'Ouest)
4. Attendre ~2 minutes que le projet démarre

### Récupérer les credentials

Dans Supabase > **Settings** > **API** :
```
NEXT_PUBLIC_SUPABASE_URL = https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...   ← GARDER SECRET
```

Dans Supabase > **Settings** > **Database** > **Connection string** :
```
DATABASE_URL (mode Transaction, port 6543) :
postgresql://postgres.XXXX:MOT_DE_PASSE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

DIRECT_URL (mode Session, port 5432) :
postgresql://postgres.XXXX:MOT_DE_PASSE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

---

## ÉTAPE 2 — Configurer le projet en local

```bash
# Cloner ou créer le projet
git clone https://github.com/votre-compte/edusurvi.git
cd edusurvi

# Installer les dépendances
npm install

# Copier le fichier de configuration
cp .env.example .env.local
```

Éditer `.env.local` avec les valeurs Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres.XXXX:PWD@...pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.XXXX:PWD@...pooler.supabase.com:5432/postgres
```

Générer les secrets JWT :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copier la sortie dans JWT_SECRET
# Relancer et copier dans REFRESH_TOKEN_SECRET
```

---

## ÉTAPE 3 — Initialiser la base de données

```bash
# Option A : Via Prisma (recommandée)
npx prisma generate        # Générer le client Prisma
npx prisma db push         # Créer les tables sur Supabase
npx prisma db seed         # Insérer les données de test

# Option B : Via SQL Editor dans Supabase
# Copier le contenu de prisma/schema.sql dans Supabase > SQL Editor > New Query
```

Vérifier dans **Supabase > Table Editor** que les tables sont créées.

---

## ÉTAPE 4 — Tester en local

```bash
npm run dev
# Ouvrir http://localhost:3000
```

Tester les comptes :
- `admin@ecole.bf` / `admin123`
- `prof1@ecole.bf` / `prof123`
- `surv@ecole.bf` / `surv123`
- `eleve1@ecole.bf` / `eleve123`

---

## ÉTAPE 5 — Créer le dépôt GitHub

```bash
git init
git add -A
git commit -m "Initial commit — EduSuivi"

# Sur github.com > New repository > "edusurvi"
git remote add origin https://github.com/VOTRE_COMPTE/edusurvi.git
git branch -M main
git push -u origin main
```

⚠️ **Ne jamais committer `.env.local`** (déjà dans `.gitignore`)

---

## ÉTAPE 6 — Déployer sur Vercel

### Option A : Via l'interface web (recommandé)

1. Aller sur **[vercel.com](https://vercel.com)** → "Add New Project"
2. **Import Git Repository** → sélectionner `edusurvi`
3. Dans **Environment Variables**, ajouter toutes les variables de `.env.local`
4. Cliquer **Deploy**

### Option B : Via CLI

```bash
npm install -g vercel
vercel login

# Ajouter les variables d'environnement
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add JWT_SECRET
vercel env add REFRESH_TOKEN_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Déployer
vercel --prod
```

---

## ÉTAPE 7 — Configurer le domaine personnalisé (optionnel)

Dans **Vercel > votre projet > Settings > Domains** :
```
edusurvi.bf          → CNAME → cname.vercel-dns.com
www.edusurvi.bf      → CNAME → cname.vercel-dns.com
```

Certificat SSL Let's Encrypt **automatique**.

---

## ÉTAPE 8 — Script automatique (tout en un)

```bash
chmod +x deploy.sh
bash deploy.sh
```

---

## Variables d'environnement résumé

| Variable | Où la trouver | Obligatoire |
|----------|--------------|-------------|
| `DATABASE_URL` | Supabase > Settings > Database (Transaction) | ✅ |
| `DIRECT_URL` | Supabase > Settings > Database (Session) | ✅ |
| `JWT_SECRET` | Générer soi-même (64 chars) | ✅ |
| `REFRESH_TOKEN_SECRET` | Générer soi-même (64 chars) | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API | ✅ |

---

## Dépannage fréquent

### "Connection refused" sur Prisma
→ Vérifier que `DATABASE_URL` utilise le port **6543** (pooler) et `DIRECT_URL` le port **5432**

### "JWT malformed" ou token invalide
→ Vérifier que `JWT_SECRET` est identique en local et sur Vercel

### Tables non créées
→ Relancer `npx prisma db push --accept-data-loss` avec `DIRECT_URL`

### Erreur 500 sur Vercel
→ Voir les logs : Vercel > votre projet > Deployments > Functions > View logs

---

## Coûts estimés

| Service | Plan gratuit | Plan payant |
|---------|-------------|-------------|
| Vercel | 100 GB bandwidth, deploy illimités | ~$20/mois |
| Supabase | 500 MB DB, 1 GB storage, 2 projets | ~$25/mois |
| **Total école ~100 élèves** | **Gratuit** | — |
