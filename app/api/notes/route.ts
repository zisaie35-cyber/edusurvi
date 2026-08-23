// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession, resolveEcoleId } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function shape(row: any) {
  return {
    id: row.id,
    eleveId: row.eleve_id,
    matiereId: row.matiere_id,
    professeurId: row.professeur_id,
    valeur: row.valeur,
    typeEval: row.type_eval,
    trimestre: row.trimestre,
    commentaire: row.commentaire,
  }
}

// ── GET /api/notes — notes de l'école (?eleveId= pour filtrer) ────────────────
// Un élève ne voit que ses propres notes, quel que soit le eleveId demandé.
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request)
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    let eleveId = new URL(request.url).searchParams.get('eleveId')

    if (session.role === 'eleve') {
      const { data: eleve } = await supabase.from('eleves').select('id').eq('user_id', session.sub).eq('ecole_id', ecoleId).single()
      if (!eleve) return NextResponse.json({ success: true, data: [] })
      eleveId = eleve.id
    }

    let query = supabase.from('notes').select('*, eleves!inner(ecole_id)').eq('eleves.ecole_id', ecoleId)
    if (eleveId) query = query.eq('eleve_id', eleveId)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(shape) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/notes — enregistrer un lot de notes (professeur/admin) ──────────
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const body = await request.json()
    const entries: any[] = body.entries
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Aucune note à enregistrer' }, { status: 400 })
    }

    const eleveIds = [...new Set(entries.map(e => e.eleveId))]
    const { data: eleves } = await supabase.from('eleves').select('id').eq('ecole_id', ecoleId).in('id', eleveIds)
    const idsValides = new Set((eleves || []).map(e => e.id))
    if (eleveIds.some(id => !idsValides.has(id))) {
      return NextResponse.json({ error: 'Un ou plusieurs élèves n\'appartiennent pas à cette école' }, { status: 403 })
    }

    const rows = entries.map(e => ({
      eleve_id: e.eleveId,
      matiere_id: e.matiereId,
      professeur_id: session.sub,
      valeur: e.valeur,
      type_eval: e.typeEval,
      trimestre: e.trimestre,
      commentaire: e.commentaire || null,
    }))

    const { data, error } = await supabase.from('notes').insert(rows).select('*')
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(shape) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
