
import { NextRequest, NextResponse } from 'next/server'

// Comptes de démonstration intégrés directement
// (pas besoin de base de données pour commencer)
const DEMO_USERS = [
  {
    id: 1,
    nom: "Diallo",
    prenom: "Mamadou",
    email: "admin@ecole.bf",
    password: "admin123",
    role: "admin",
    actif: true,
  },
  {
    id: 2,
    nom: "Ouédraogo",
    prenom: "Safi",
    email: "prof1@ecole.bf",
    password: "prof123",
    role: "professeur",
    actif: true,
  },
  {
    id: 3,
    nom: "Sawadogo",
    prenom: "Ismaël",
    email: "prof2@ecole.bf",
    password: "prof123",
    role: "professeur",
    actif: true,
  },
  {
    id: 4,
    nom: "Kaboré",
    prenom: "Adèle",
    email: "surv@ecole.bf",
    password: "surv123",
    role: "surveillant",
    actif: true,
  },
  {
    id: 5,
    nom: "Traoré",
    prenom: "Aïcha",
    email: "eleve1@ecole.bf",
    password: "eleve123",
    role: "eleve",
    actif: true,
    eleveId: 1,
  },
  {
    id: 6,
    nom: "Compaoré",
    prenom: "Théo",
    email: "eleve2@ecole.bf",
    password: "eleve123",
    role: "eleve",
    actif: true,
    eleveId: 2,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Chercher l'utilisateur
    const user = DEMO_USERS.find(
      u => u.email === email && u.password === password && u.actif
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      accessToken: `demo-token-${user.id}-${Date.now()}`,
      user: userWithoutPassword,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
