// app/api/codes/verifier/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/codes/verifier — vérifier un code parent ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Code invalide — 6 chiffres requis' },
        { status: 400 }
      )
    }

    // Chercher le code dans Supabase
    const { data, error } = await supabase
      .from('codes_parents')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Code invalide. Vérifiez votre code ou contactez l\'administration.' },
        { status: 404 }
      )
    }

    // Vérifier que le code est actif
    if (!data.actif) {
      return NextResponse.json(
        { error: 'Ce code a été désactivé. Contactez l\'administration.' },
        { status: 403 }
      )
    }

    // Vérifier que le code n'est pas expiré
    const today = new Date().toISOString().split('T')[0]
    if (data.date_expiration < today) {
      return NextResponse.json(
        { error: 'Ce code a expiré. Contactez l\'administration pour le renouveler.' },
        { status: 403 }
      )
    }

    // Retourner les infos de l'élève (sans données sensibles)
    return NextResponse.json({
      success: true,
      eleve: {
        id: data.eleve_id,
        nom: data.eleve_nom,
        prenom: data.eleve_prenom,
        matricule: data.eleve_matricule,
        classe: data.eleve_classe,
        parentNom: data.parent_nom,
        parentPrenom: data.parent_prenom,
        validite: data.validite,
        dateExpiration: data.date_expiration,
      }
    })

  } catch (error: any) {
    console.error('Erreur vérification code:', error)
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez.' },
      { status: 500 }
    )
  }
}
