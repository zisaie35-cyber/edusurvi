// prisma/seed.ts
// Exécuter : npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Hachage des mots de passe
  const hashAdmin  = await bcrypt.hash('admin123', 10)
  const hashProf   = await bcrypt.hash('prof123', 10)
  const hashSurv   = await bcrypt.hash('surv123', 10)
  const hashEleve  = await bcrypt.hash('eleve123', 10)

  // ── Année scolaire ──────────────────────────────────────────
  const annee = await prisma.anneeScolaire.upsert({
    where: { id: 'annee-2025' },
    update: {},
    create: {
      id: 'annee-2025',
      libelle: '2024-2025',
      dateDebut: new Date('2024-10-01'),
      dateFin: new Date('2025-07-15'),
      actif: true,
    },
  })

  // ── Matières ────────────────────────────────────────────────
  const matieres = await Promise.all([
    prisma.matiere.upsert({ where:{id:'mat-maths'},    update:{}, create:{id:'mat-maths',    nom:'Mathématiques',   coefficient:3, couleur:'#2563eb'} }),
    prisma.matiere.upsert({ where:{id:'mat-francais'}, update:{}, create:{id:'mat-francais', nom:'Français',        coefficient:3, couleur:'#7c3aed'} }),
    prisma.matiere.upsert({ where:{id:'mat-svt'},      update:{}, create:{id:'mat-svt',      nom:'SVT',             coefficient:2, couleur:'#059669'} }),
    prisma.matiere.upsert({ where:{id:'mat-hg'},       update:{}, create:{id:'mat-hg',       nom:'Histoire-Géo',    coefficient:2, couleur:'#d97706'} }),
    prisma.matiere.upsert({ where:{id:'mat-pc'},       update:{}, create:{id:'mat-pc',       nom:'Physique-Chimie', coefficient:2, couleur:'#dc2626'} }),
    prisma.matiere.upsert({ where:{id:'mat-anglais'},  update:{}, create:{id:'mat-anglais',  nom:'Anglais',         coefficient:2, couleur:'#0891b2'} }),
  ])

  // ── Classes ─────────────────────────────────────────────────
  const classes = await Promise.all([
    prisma.classe.upsert({ where:{id:'classe-3a'}, update:{}, create:{id:'classe-3a', nom:'3ème A', niveau:'3ème', anneeId:annee.id} }),
    prisma.classe.upsert({ where:{id:'classe-4b'}, update:{}, create:{id:'classe-4b', nom:'4ème B', niveau:'4ème', anneeId:annee.id} }),
    prisma.classe.upsert({ where:{id:'classe-5a'}, update:{}, create:{id:'classe-5a', nom:'5ème A', niveau:'5ème', anneeId:annee.id} }),
  ])

  // ── Utilisateurs ────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecole.bf' },
    update: {},
    create: { id:'user-admin', nom:'Diallo', prenom:'Mamadou', email:'admin@ecole.bf', password:hashAdmin, role:'admin' },
  })

  const prof1 = await prisma.user.upsert({
    where: { email: 'prof1@ecole.bf' },
    update: {},
    create: { id:'user-prof1', nom:'Ouédraogo', prenom:'Safi', email:'prof1@ecole.bf', password:hashProf, role:'professeur' },
  })

  const prof2 = await prisma.user.upsert({
    where: { email: 'prof2@ecole.bf' },
    update: {},
    create: { id:'user-prof2', nom:'Sawadogo', prenom:'Ismaël', email:'prof2@ecole.bf', password:hashProf, role:'professeur' },
  })

  const surv = await prisma.user.upsert({
    where: { email: 'surv@ecole.bf' },
    update: {},
    create: { id:'user-surv', nom:'Kaboré', prenom:'Adèle', email:'surv@ecole.bf', password:hashSurv, role:'surveillant' },
  })

  // ── Classe-Matières (assignation profs) ─────────────────────
  await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId:'classe-3a', matiereId:'mat-maths' } },
    update: {},
    create: { classeId:'classe-3a', matiereId:'mat-maths',    professeurId:prof1.id },
  })
  await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId:'classe-3a', matiereId:'mat-francais' } },
    update: {},
    create: { classeId:'classe-3a', matiereId:'mat-francais', professeurId:prof1.id },
  })
  await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId:'classe-3a', matiereId:'mat-svt' } },
    update: {},
    create: { classeId:'classe-3a', matiereId:'mat-svt',      professeurId:prof2.id },
  })

  // ── Élèves (10 élèves) ──────────────────────────────────────
  const elevesData = [
    { nom:'Traoré',    prenom:'Aïcha',    email:'eleve1@ecole.bf',  matricule:'2024-001', classeId:'classe-3a' },
    { nom:'Compaoré',  prenom:'Théo',     email:'eleve2@ecole.bf',  matricule:'2024-002', classeId:'classe-3a' },
    { nom:'Zongo',     prenom:'Fatima',   email:'eleve3@ecole.bf',  matricule:'2024-003', classeId:'classe-4b' },
    { nom:'Ouédraogo', prenom:'Brice',    email:'eleve4@ecole.bf',  matricule:'2024-004', classeId:'classe-3a' },
    { nom:'Sawadogo',  prenom:'Mariam',   email:'eleve5@ecole.bf',  matricule:'2024-005', classeId:'classe-4b' },
    { nom:'Kaboré',    prenom:'Luc',      email:'eleve6@ecole.bf',  matricule:'2024-006', classeId:'classe-5a' },
    { nom:'Diallo',    prenom:'Salimata', email:'eleve7@ecole.bf',  matricule:'2024-007', classeId:'classe-3a' },
    { nom:'Nikiema',   prenom:'Joël',     email:'eleve8@ecole.bf',  matricule:'2024-008', classeId:'classe-4b' },
    { nom:'Tapsoba',   prenom:'Reine',    email:'eleve9@ecole.bf',  matricule:'2024-009', classeId:'classe-5a' },
    { nom:'Ouattara',  prenom:'Issa',     email:'eleve10@ecole.bf', matricule:'2024-010', classeId:'classe-3a' },
  ]

  for (const d of elevesData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { nom:d.nom, prenom:d.prenom, email:d.email, password:hashEleve, role:'eleve' },
    })
    const eleve = await prisma.eleve.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId:user.id, matricule:d.matricule, nationalite:'Burkinabè' },
    })
    await prisma.inscription.upsert({
      where: { eleveId_anneeId: { eleveId:eleve.id, anneeId:annee.id } },
      update: {},
      create: { eleveId:eleve.id, classeId:d.classeId, anneeId:annee.id },
    })
  }

  console.log('✅ Seed terminé avec succès !')
  console.log('  admin@ecole.bf     / admin123')
  console.log('  prof1@ecole.bf     / prof123')
  console.log('  surv@ecole.bf      / surv123')
  console.log('  eleve1@ecole.bf    / eleve123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
