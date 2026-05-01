// app/api/points/retraits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/points/retraits — Demander un retrait ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userNom, userPrenom, userRole, points, montantFcfa, operateur, telephone } = body

    if (!userId || !points || !operateur || !telephone) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Vérifier que l'utilisateur a assez de points disponibles
    const { data: transactions } = await supabase
      .from('points_transactions')
      .select('points')
      .eq('user_id', userId)
    const total = (transactions || []).reduce((s: number, t: any) => s + t.points, 0)

    const { data: retraits } = await supabase
      .from('points_retraits')
      .select('points, statut')
      .eq('user_id', userId)
      .in('statut', ['en_attente', 'valide_ecole', 'valide_central', 'paye'])
    const retires = (retraits || []).reduce((s: number, r: any) => s + r.points, 0)

    const disponible = total - retires
    if (points > disponible) {
      return NextResponse.json(
        { error: `Points insuffisants. Disponible : ${disponible} pts` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('points_retraits')
      .insert({
        user_id: userId,
        user_nom: userNom,
        user_prenom: userPrenom,
        user_role: userRole,
        points,
        montant_fcfa: montantFcfa,
        operateur,
        telephone,
        statut: 'en_attente',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH /api/points/retraits — Valider/Refuser un retrait ───────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, motif } = body
    // action: 'valider_ecole' | 'valider_central' | 'payer' | 'refuser'

    const updates: any = {}
    if (action === 'valider_ecole') {
      updates.statut = 'valide_ecole'
      updates.valide_ecole_at = new Date().toISOString()
    } else if (action === 'valider_central') {
      updates.statut = 'valide_central'
      updates.valide_central_at = new Date().toISOString()
    } else if (action === 'payer') {
      updates.statut = 'paye'
      updates.paye_at = new Date().toISOString()
    } else if (action === 'refuser') {
      updates.statut = 'refuse'
      updates.refuse_at = new Date().toISOString()
      updates.refuse_motif = motif || 'Demande refusée'
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('points_retraits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
