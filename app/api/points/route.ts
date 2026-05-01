// app/api/points/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET /api/points ───────────────────────────────────────────────────────────
// ?type=config              → configuration barème
// ?type=transactions&userId → transactions d'un user
// ?type=solde&userId        → solde total d'un user
// ?type=classement          → classement tous les users
// ?type=retraits            → tous les retraits (admin)
// ?type=mes_retraits&userId → retraits d'un user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const userId = searchParams.get('userId')
  const annee = searchParams.get('annee') || '2024-2025'

  try {
    // ── Config barème ──────────────────────────────────────────
    if (type === 'config') {
      const { data, error } = await supabase
        .from('points_config')
        .select('*')
        .eq('id', 'default')
        .single()
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // ── Transactions d'un user ─────────────────────────────────
    if (type === 'transactions' && userId) {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('annee_scolaire', annee)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // ── Solde d'un user ────────────────────────────────────────
    if (type === 'solde' && userId) {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('points')
        .eq('user_id', userId)
        .eq('annee_scolaire', annee)
      if (error) throw error
      const total = (data || []).reduce((s: number, t: any) => s + t.points, 0)

      // Déduire les points déjà retirés (validés ou payés)
      const { data: retraits } = await supabase
        .from('points_retraits')
        .select('points, statut')
        .eq('user_id', userId)
        .in('statut', ['valide_ecole', 'valide_central', 'paye'])
      const retires = (retraits || []).reduce((s: number, r: any) => s + r.points, 0)

      return NextResponse.json({ success: true, data: { total, retires, disponible: total - retires } })
    }

    // ── Classement ─────────────────────────────────────────────
    if (type === 'classement') {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('user_id, user_nom, user_prenom, user_role, points')
        .eq('annee_scolaire', annee)
      if (error) throw error

      // Agréger par user
      const map: Record<string, any> = {}
      for (const t of data || []) {
        if (!map[t.user_id]) {
          map[t.user_id] = {
            user_id: t.user_id,
            user_nom: t.user_nom,
            user_prenom: t.user_prenom,
            user_role: t.user_role,
            total: 0,
          }
        }
        map[t.user_id].total += t.points
      }
      const classement = Object.values(map).sort((a: any, b: any) => b.total - a.total)
      return NextResponse.json({ success: true, data: classement })
    }

    // ── Tous les retraits (admin) ──────────────────────────────
    if (type === 'retraits') {
      const statut = searchParams.get('statut')
      let query = supabase.from('points_retraits').select('*').order('created_at', { ascending: false })
      if (statut) query = query.eq('statut', statut)
      const { data, error } = await query
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // ── Retraits d'un user ─────────────────────────────────────
    if (type === 'mes_retraits' && userId) {
      const { data, error } = await supabase
        .from('points_retraits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Type de requête invalide' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST /api/points ──────────────────────────────────────────────────────────
// Enregistrer une transaction de points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userNom, userPrenom, userRole, action, description, points, annee } = body

    if (!userId || !action || !points) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        user_nom: userNom,
        user_prenom: userPrenom,
        user_role: userRole,
        action,
        description,
        points,
        annee_scolaire: annee || '2024-2025',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH /api/points ─────────────────────────────────────────────────────────
// Mettre à jour la configuration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('points_config')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', 'default')
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
