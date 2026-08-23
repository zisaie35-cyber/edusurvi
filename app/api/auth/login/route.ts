import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { signSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('actif', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const valide = await bcrypt.compare(password, user.password)
    if (!valide) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    // Pour un élève, résoudre son identifiant élève réel (table eleves).
    // eleveMatricule sert de clé stable pour l'affichage démo côté MainApp,
    // qui n'est pas encore branché sur les vraies tables élèves/classes.
    let eleveId: string | undefined
    let eleveMatricule: string | undefined
    if (user.role === 'eleve') {
      const { data: eleve } = await supabase
        .from('eleves')
        .select('id, matricule')
        .eq('user_id', user.id)
        .single()
      eleveId = eleve?.id
      eleveMatricule = eleve?.matricule
    }

    const accessToken = await signSession({
      sub: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      ecoleId: user.ecole_id,
    })

    return NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        ecoleId: user.ecole_id,
        ...(eleveId ? { eleveId, eleveMatricule } : {}),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
