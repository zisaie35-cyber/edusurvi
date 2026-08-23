// app/api/ecoles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET /api/ecoles ────────────────────────────────────────────────────────────
// Sans session (ou session non super_admin) : liste publique des écoles actives
// (id + nom uniquement — utilisé par le sélecteur du portail parents).
// Avec une session super_admin : liste complète (toutes écoles, tous champs).
export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get('authorization')
    let estSuperAdmin = false
    if (header) {
      try {
        const session = await requireSession(request, ['super_admin'])
        estSuperAdmin = !!session
      } catch {
        estSuperAdmin = false
      }
    }

    if (estSuperAdmin) {
      const { data, error } = await supabase.from('ecoles').select('*').order('created_at', { ascending: false })
      if (error) throw error

      const { data: eleves } = await supabase.from('eleves').select('ecole_id')
      const counts: Record<string, number> = {}
      for (const el of eleves || []) {
        counts[el.ecole_id] = (counts[el.ecole_id] || 0) + 1
      }
      const enrichi = (data || []).map((e: any) => ({ ...e, nb_eleves: counts[e.id] || 0 }))

      return NextResponse.json({ success: true, data: enrichi })
    }

    const { data, error } = await supabase
      .from('ecoles')
      .select('id, nom, ville')
      .eq('actif', true)
      .order('nom')
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/ecoles — créer une école (super_admin) ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    await requireSession(request, ['super_admin'])

    const body = await request.json()
    const { nom, ville, pays, telephone, email, emailAlerte, telephoneAlerte } = body
    if (!nom) {
      return NextResponse.json({ error: 'Nom de l\'école requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ecoles')
      .insert({
        nom, ville: ville || null, pays: pays || 'Burkina Faso', telephone: telephone || null, email: email || null,
        email_alerte: emailAlerte || null, telephone_alerte: telephoneAlerte || null,
        actif: true,
      })
      .select()
      .single()

    if (error) throw error

    // Barème de points par défaut, nécessaire pour que le module Points
    // fonctionne dès la création de l'école (id explicite : le défaut de la
    // colonne id est la valeur littérale 'default', qui entrerait en conflit).
    await supabase.from('points_config').upsert({ id: data.id, ecole_id: data.id }, { onConflict: 'ecole_id' })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/ecoles — modifier / activer / désactiver une école (super_admin) ──
export async function PATCH(request: NextRequest) {
  try {
    await requireSession(request, ['super_admin'])

    const body = await request.json()
    const { id, nom, ville, pays, telephone, email, emailAlerte, telephoneAlerte, actif } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: any = {}
    if (nom !== undefined) updates.nom = nom
    if (ville !== undefined) updates.ville = ville
    if (pays !== undefined) updates.pays = pays
    if (telephone !== undefined) updates.telephone = telephone
    if (email !== undefined) updates.email = email
    if (emailAlerte !== undefined) updates.email_alerte = emailAlerte
    if (telephoneAlerte !== undefined) updates.telephone_alerte = telephoneAlerte
    if (actif !== undefined) updates.actif = actif

    const { data, error } = await supabase
      .from('ecoles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
