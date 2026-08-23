// app/api/devoirs/route.ts
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
    date: row.date,
    matiere: row.matiere,
    classes: row.classes || [],
    heureDebut: row.heure_debut,
    heureFin: row.heure_fin,
    professeur: row.professeur,
    trimestre: row.trimestre,
    anneeId: row.annee_id,
    type: row.type,
    note: row.note,
  }
}

// ── GET /api/devoirs — lister le programme des devoirs de l'école ─────────────
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant', 'eleve'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const { data, error } = await supabase.from('devoirs').select('*').eq('ecole_id', ecoleId).order('date')
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(shape) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

async function validerClasses(classes: string[], ecoleId: string) {
  if (!classes.length) return null
  const { data } = await supabase.from('classes').select('id').eq('ecole_id', ecoleId).in('id', classes)
  if ((data || []).length !== classes.length) {
    return NextResponse.json({ error: 'Une ou plusieurs classes n\'appartiennent pas à cette école' }, { status: 403 })
  }
  return null
}

// ── POST /api/devoirs — ajouter une épreuve au programme ──────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const body = await request.json()
    const { date, matiere, classes, heureDebut, heureFin, professeur, trimestre, anneeId, type, note } = body
    if (!date || !matiere || !Array.isArray(classes) || classes.length === 0) {
      return NextResponse.json({ error: 'Date, matière et classe(s) requis' }, { status: 400 })
    }

    const erreur = await validerClasses(classes, ecoleId)
    if (erreur) return erreur

    const { data, error } = await supabase
      .from('devoirs')
      .insert({
        ecole_id: ecoleId, date, matiere, classes,
        heure_debut: heureDebut || null, heure_fin: heureFin || null,
        professeur: professeur || null, trimestre: trimestre || null,
        annee_id: anneeId || null, type: type || 'devoir', note: note || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: shape(data) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/devoirs — modifier une épreuve ──────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const body = await request.json()
    const { id, date, matiere, classes, heureDebut, heureFin, professeur, trimestre, anneeId, type, note } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('devoirs').select('ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== ecoleId) {
      return NextResponse.json({ error: 'Devoir introuvable' }, { status: 404 })
    }

    if (classes !== undefined) {
      const erreur = await validerClasses(classes, ecoleId)
      if (erreur) return erreur
    }

    const updates: any = {}
    if (date !== undefined) updates.date = date
    if (matiere !== undefined) updates.matiere = matiere
    if (classes !== undefined) updates.classes = classes
    if (heureDebut !== undefined) updates.heure_debut = heureDebut
    if (heureFin !== undefined) updates.heure_fin = heureFin
    if (professeur !== undefined) updates.professeur = professeur
    if (trimestre !== undefined) updates.trimestre = trimestre
    if (anneeId !== undefined) updates.annee_id = anneeId
    if (type !== undefined) updates.type = type
    if (note !== undefined) updates.note = note

    const { data, error } = await supabase.from('devoirs').update(updates).eq('id', id).select('*').single()
    if (error) throw error
    return NextResponse.json({ success: true, data: shape(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── DELETE /api/devoirs — supprimer une épreuve ────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('devoirs').select('ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== ecoleId) {
      return NextResponse.json({ error: 'Devoir introuvable' }, { status: 404 })
    }

    const { error } = await supabase.from('devoirs').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
