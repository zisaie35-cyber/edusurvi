// app/api/professeurs/route.ts
// Gestion des comptes professeur d'une école, et de leurs affectations
// (matières enseignées × classes), réservée à l'admin de l'école / super_admin.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { requireSession, resolveEcoleId } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vérifie que tous les ids donnés appartiennent bien à l'école, et renvoie
// une erreur HTTP sinon.
async function validerAppartenance(table: 'classes' | 'matieres', ids: string[], ecoleId: string) {
  if (!ids.length) return null
  const { data } = await supabase.from(table).select('id').eq('ecole_id', ecoleId).in('id', ids)
  if ((data || []).length !== ids.length) {
    return NextResponse.json({ error: `Une ou plusieurs ${table === 'classes' ? 'classes' : 'matières'} n'appartiennent pas à cette école` }, { status: 403 })
  }
  return null
}

async function remplacerAffectations(professeurId: string, classes: string[], matieres: string[]) {
  // Un professeur appartient à une seule école, et ses affectations n'y sont
  // créées que via validerAppartenance() — un simple filtre par professeur_id
  // suffit donc à cibler uniquement ses propres lignes.
  await supabase.from('classe_matieres').delete().eq('professeur_id', professeurId)
  if (classes.length && matieres.length) {
    const rows = classes.flatMap(classeId => matieres.map(matiereId => ({ classe_id: classeId, matiere_id: matiereId, professeur_id: professeurId })))
    await supabase.from('classe_matieres').insert(rows)
  }
}

async function chargerAffectations(professeurIds: string[], ecoleId: string) {
  const map: Record<string, { matieres: Set<string>; classes: Set<string> }> = {}
  if (!professeurIds.length) return map
  const { data } = await supabase
    .from('classe_matieres')
    .select('classe_id, matiere_id, professeur_id, classes!inner(ecole_id)')
    .eq('classes.ecole_id', ecoleId)
    .in('professeur_id', professeurIds)
  for (const row of data || []) {
    if (!map[row.professeur_id]) map[row.professeur_id] = { matieres: new Set(), classes: new Set() }
    map[row.professeur_id].matieres.add(row.matiere_id)
    map[row.professeur_id].classes.add(row.classe_id)
  }
  return map
}

function shape(row: any, affectations?: { matieres: Set<string>; classes: Set<string> }) {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    actif: row.actif,
    matieres: affectations ? [...affectations.matieres] : [],
    classes: affectations ? [...affectations.classes] : [],
  }
}

// ── GET /api/professeurs — lister les professeurs de l'école ──────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, prenom, email, actif')
      .eq('role', 'professeur')
      .eq('ecole_id', ecoleId)
      .order('nom')
    if (error) throw error

    const affectations = await chargerAffectations((data || []).map(p => p.id), ecoleId)
    return NextResponse.json({ success: true, data: (data || []).map(p => shape(p, affectations[p.id])) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/professeurs — créer un professeur (admin/super_admin) ───────────
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const body = await request.json()
    const { nom, prenom, email, password, matieres = [], classes = [] } = body
    if (!nom || !prenom || !email || !password) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum' }, { status: 400 })
    }

    const erreurClasses = await validerAppartenance('classes', classes, ecoleId)
    if (erreurClasses) return erreurClasses
    const erreurMatieres = await validerAppartenance('matieres', matieres, ecoleId)
    if (erreurMatieres) return erreurMatieres

    const hash = await bcrypt.hash(password, 10)
    const { data, error } = await supabase
      .from('users')
      .insert({ nom, prenom, email, password: hash, role: 'professeur', ecole_id: ecoleId, actif: true })
      .select('id, nom, prenom, email, actif')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
      throw error
    }

    if (classes.length && matieres.length) {
      await remplacerAffectations(data.id, classes, matieres)
    }

    return NextResponse.json({ success: true, data: shape(data, { matieres: new Set(matieres), classes: new Set(classes) }) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/professeurs — modifier / (dés)activer un professeur ────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const body = await request.json()
    const { id, nom, prenom, email, actif, matieres, classes } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('users').select('id, ecole_id, role').eq('id', id).single()
    if (!cible || cible.role !== 'professeur' || cible.ecole_id !== ecoleId) {
      return NextResponse.json({ error: 'Professeur introuvable' }, { status: 404 })
    }

    const updates: any = {}
    if (nom !== undefined) updates.nom = nom
    if (prenom !== undefined) updates.prenom = prenom
    if (email !== undefined) updates.email = email
    if (actif !== undefined) updates.actif = actif

    let data: any = cible
    if (Object.keys(updates).length) {
      const { data: maj, error } = await supabase.from('users').update(updates).eq('id', id).select('id, nom, prenom, email, actif').single()
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
        }
        throw error
      }
      data = maj
    } else {
      const { data: complet } = await supabase.from('users').select('id, nom, prenom, email, actif').eq('id', id).single()
      data = complet
    }

    if (matieres !== undefined || classes !== undefined) {
      const nouvellesClasses: string[] = classes || []
      const nouvellesMatieres: string[] = matieres || []
      const erreurClasses = await validerAppartenance('classes', nouvellesClasses, ecoleId)
      if (erreurClasses) return erreurClasses
      const erreurMatieres = await validerAppartenance('matieres', nouvellesMatieres, ecoleId)
      if (erreurMatieres) return erreurMatieres
      await remplacerAffectations(id, nouvellesClasses, nouvellesMatieres)
    }

    const affectations = await chargerAffectations([id], ecoleId)
    return NextResponse.json({ success: true, data: shape(data, affectations[id]) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
