// app/api/classes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET /api/classes — lister les classes de l'école ──────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('ecole_id', session.ecoleId)
      .order('nom')

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/classes — créer une classe ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { nom, niveau } = await request.json()
    if (!nom || !niveau) {
      return NextResponse.json({ error: 'Nom et niveau requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({ nom, niveau, ecole_id: session.ecoleId })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/classes — modifier une classe ───────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { id, nom, niveau } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('classes').select('ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== session.ecoleId) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const updates: any = {}
    if (nom !== undefined) updates.nom = nom
    if (niveau !== undefined) updates.niveau = niveau

    const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── DELETE /api/classes — supprimer une classe ─────────────────────────────────
// Les élèves de la classe deviennent "sans classe" (classe_id remis à null).
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('classes').select('ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== session.ecoleId) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    await supabase.from('eleves').update({ classe_id: null }).eq('classe_id', id)
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
