// app/api/matieres/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession, resolveEcoleId } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAUT = [
  { nom: 'Mathématiques', coefficient: 3, couleur: '#2563eb' },
  { nom: 'Français', coefficient: 3, couleur: '#7c3aed' },
  { nom: 'SVT', coefficient: 2, couleur: '#059669' },
  { nom: 'Histoire-Géo', coefficient: 2, couleur: '#d97706' },
  { nom: 'Physique-Chimie', coefficient: 2, couleur: '#dc2626' },
  { nom: 'Anglais', coefficient: 2, couleur: '#0891b2' },
]

function shape(row: any) {
  return { id: row.id, nom: row.nom, coefficient: row.coefficient, couleur: row.couleur }
}

// ── GET /api/matieres — lister les matières de l'école (créées par défaut au premier accès) ──
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant', 'eleve'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    let { data, error } = await supabase.from('matieres').select('*').eq('ecole_id', ecoleId).order('nom')
    if (error) throw error

    if (!data || data.length === 0) {
      const { data: inserted, error: seedError } = await supabase
        .from('matieres')
        .insert(DEFAUT.map(m => ({ ...m, ecole_id: ecoleId })))
        .select('*')
      if (seedError) throw seedError
      data = inserted
    }

    return NextResponse.json({ success: true, data: (data || []).map(shape) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
