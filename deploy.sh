#!/bin/bash
# ============================================================
# deploy.sh — Script de déploiement EduSuivi sur Vercel+Supabase
# Usage : bash deploy.sh
# ============================================================

set -e  # Arrêter si une commande échoue

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🏫 DÉPLOIEMENT EDUSURVI                ║"
echo "║   Vercel + Supabase                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Vérifications préalables ──────────────────────────────────
echo "📋 Vérification des outils requis..."
command -v node  >/dev/null 2>&1 || { echo "❌ Node.js requis. Installer: https://nodejs.org"; exit 1; }
command -v git   >/dev/null 2>&1 || { echo "❌ Git requis."; exit 1; }
echo "✅ Node $(node -v) détecté"

# ── Étape 1 : Installer les dépendances ──────────────────────
echo ""
echo "📦 Installation des dépendances..."
npm install

# ── Étape 2 : Vérifier .env.local ────────────────────────────
echo ""
echo "🔑 Vérification des variables d'environnement..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Fichier .env.local manquant."
    echo "   Copier .env.example et remplir les valeurs :"
    echo "   cp .env.example .env.local"
    echo ""
    echo "   Variables requises :"
    echo "   - DATABASE_URL       (depuis Supabase > Settings > Database)"
    echo "   - DIRECT_URL         (depuis Supabase > Settings > Database)"
    echo "   - JWT_SECRET         (générer: node -e \"require('crypto').randomBytes(64).toString('hex')\")"
    echo "   - REFRESH_TOKEN_SECRET"
    exit 1
fi
echo "✅ .env.local trouvé"

# ── Étape 3 : Générer le client Prisma ───────────────────────
echo ""
echo "🔧 Génération du client Prisma..."
npx prisma generate
echo "✅ Client Prisma généré"

# ── Étape 4 : Pousser le schéma sur Supabase ─────────────────
echo ""
echo "🗄️  Migration de la base de données..."
read -p "Pousser le schéma sur Supabase ? (o/N) " CONFIRM
if [[ $CONFIRM =~ ^[Oo]$ ]]; then
    npx prisma db push --accept-data-loss
    echo "✅ Schéma poussé"
else
    echo "⏭️  Migration ignorée"
fi

# ── Étape 5 : Seed ───────────────────────────────────────────
echo ""
read -p "Insérer les données de test (seed) ? (o/N) " CONFIRM_SEED
if [[ $CONFIRM_SEED =~ ^[Oo]$ ]]; then
    npx prisma db seed
    echo "✅ Données de test insérées"
fi

# ── Étape 6 : Build local ────────────────────────────────────
echo ""
echo "🏗️  Build Next.js en cours..."
npm run build
echo "✅ Build réussi"

# ── Étape 7 : Git ────────────────────────────────────────────
echo ""
echo "📤 Préparation Git..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Dépôt Git initialisé"
fi

# Créer/vérifier .gitignore
if [ ! -f ".gitignore" ]; then
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/

# Env files (TRÈS IMPORTANT)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Prisma
prisma/dev.db

# Misc
.DS_Store
*.pem
npm-debug.log*
EOF
    echo "✅ .gitignore créé"
fi

git add -A
git commit -m "🚀 Deploy EduSuivi — $(date '+%Y-%m-%d %H:%M')" || echo "   (rien à committer)"

# ── Étape 8 : Déployer sur Vercel ────────────────────────────
echo ""
echo "🌐 Déploiement sur Vercel..."
if ! command -v vercel &> /dev/null; then
    echo "   Installation de Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "⚠️  IMPORTANT : Configurer ces variables dans Vercel avant de déployer :"
echo "   vercel env add DATABASE_URL"
echo "   vercel env add DIRECT_URL"
echo "   vercel env add JWT_SECRET"
echo "   vercel env add REFRESH_TOKEN_SECRET"
echo ""
read -p "Déployer sur Vercel maintenant ? (o/N) " CONFIRM_VERCEL
if [[ $CONFIRM_VERCEL =~ ^[Oo]$ ]]; then
    vercel --prod
else
    echo "   Pour déployer manuellement : vercel --prod"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ DÉPLOIEMENT TERMINÉ                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "📱 Accès : https://votre-projet.vercel.app"
echo ""
echo "Comptes de démonstration :"
echo "  admin@ecole.bf   / admin123"
echo "  prof1@ecole.bf   / prof123"
echo "  surv@ecole.bf    / surv123"
echo "  eleve1@ecole.bf  / eleve123"
