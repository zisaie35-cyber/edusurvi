// app/api/sanctions/route.ts
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
    surveillantId: row.surveillant_id,
    type: row.type,
    motif: row.motif,
    description: row.description,
    dateDebut: row.date_debut,
    dateFin: row.date_fin,
  }
}

// ── GET /api/sanctions — sanctions de l'école (?eleveId= pour filtrer) ────────
// Un élève ne voit que ses propres sanctions.
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

    let query = supabase.from('sanctions').select('*, eleves!inner(ecole_id)').eq('eleves.ecole_id', ecoleId)
    if (eleveId) query = query.eq('eleve_id', eleveId)

    const { data, error } = await query.order('date_debut', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(shape) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/sanctions — enregistrer une sanction (surveillant/admin) ────────
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'surveillant'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const { eleveId, type, motif, description, dateDebut, dateFin } = await request.json()
    if (!eleveId || !type || !motif || !dateDebut) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data: eleve } = await supabase.from('eleves').select('id').eq('id', eleveId).eq('ecole_id', ecoleId).single()
    if (!eleve) return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 })

    const { data, error } = await supabase
      .from('sanctions')
      .insert({ eleve_id: eleveId, surveillant_id: session.sub, type, motif, description: description || null, date_debut: dateDebut, date_fin: dateFin || null })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: shape(data) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
