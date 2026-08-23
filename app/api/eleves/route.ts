// app/api/eleves/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function shape(row: any) {
  return {
    id: row.id,
    nom: row.users?.nom,
    prenom: row.users?.prenom,
    email: row.users?.email,
    matricule: row.matricule,
    dateNaissance: row.date_naissance,
    adresse: row.adresse,
    nationalite: row.nationalite,
    classeId: row.classe_id,
  }
}

// ── GET /api/eleves — lister les élèves de l'école (filtre ?classeId=) ────────
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classeId = searchParams.get('classeId')

    let query = supabase
      .from('eleves')
      .select('*, users(nom, prenom, email)')
      .eq('ecole_id', session.ecoleId)
    if (classeId) query = query.eq('classe_id', classeId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: (data || []).map(shape) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/eleves — ajouter un élève ────────────────────────────────────────
// Crée aussi un compte "users" (role eleve) car eleves.user_id est requis par
// le schéma — mot de passe aléatoire, non communiqué : l'élève/parent n'utilise
// pas ce compte pour se connecter (accès via le code parent), sauf si l'admin
// lui attribue des identifiants plus tard.
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const body = await request.json()
    const { nom, prenom, matricule, dateNaissance, email, nationalite, adresse, classeId } = body
    if (!nom || !prenom || !matricule) {
      return NextResponse.json({ error: 'Nom, prénom et matricule requis' }, { status: 400 })
    }

    const emailFinal = email || `eleve-${matricule.replace(/\W+/g, '-')}@${session.ecoleId}.local`
    const password = await bcrypt.hash(randomUUID(), 10)

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ nom, prenom, email: emailFinal, password, role: 'eleve', ecole_id: session.ecoleId, actif: true })
      .select('id')
      .single()

    if (userError) {
      if (userError.code === '23505') {
        return NextResponse.json({ error: 'Cet email ou ce matricule est déjà utilisé' }, { status: 409 })
      }
      throw userError
    }

    const { data: eleve, error: eleveError } = await supabase
      .from('eleves')
      .insert({
        user_id: user.id,
        matricule,
        date_naissance: dateNaissance || null,
        adresse: adresse || null,
        nationalite: nationalite || 'Burkinabè',
        classe_id: classeId || null,
        ecole_id: session.ecoleId,
      })
      .select('*, users(nom, prenom, email)')
      .single()

    if (eleveError) {
      // Nettoyage si l'insertion élève échoue après création du user.
      await supabase.from('users').delete().eq('id', user.id)
      if (eleveError.code === '23505') {
        return NextResponse.json({ error: 'Ce matricule est déjà utilisé' }, { status: 409 })
      }
      throw eleveError
    }

    return NextResponse.json({ success: true, data: shape(eleve) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/eleves — modifier un élève ──────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const body = await request.json()
    const { id, nom, prenom, email, matricule, dateNaissance, adresse, nationalite, classeId } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('eleves').select('user_id, ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== session.ecoleId) {
      return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 })
    }

    const userUpdates: any = {}
    if (nom !== undefined) userUpdates.nom = nom
    if (prenom !== undefined) userUpdates.prenom = prenom
    if (email !== undefined) userUpdates.email = email
    if (Object.keys(userUpdates).length) {
      const { error } = await supabase.from('users').update(userUpdates).eq('id', cible.user_id)
      if (error) throw error
    }

    const eleveUpdates: any = {}
    if (matricule !== undefined) eleveUpdates.matricule = matricule
    if (dateNaissance !== undefined) eleveUpdates.date_naissance = dateNaissance || null
    if (adresse !== undefined) eleveUpdates.adresse = adresse
    if (nationalite !== undefined) eleveUpdates.nationalite = nationalite
    if (classeId !== undefined) eleveUpdates.classe_id = classeId || null

    const { data, error } = await supabase
      .from('eleves')
      .update(eleveUpdates)
      .eq('id', id)
      .select('*, users(nom, prenom, email)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data: shape(data) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── DELETE /api/eleves — supprimer un élève ────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])
    if (!session.ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: cible } = await supabase.from('eleves').select('user_id, ecole_id').eq('id', id).single()
    if (!cible || cible.ecole_id !== session.ecoleId) {
      return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 })
    }

    const { error } = await supabase.from('eleves').delete().eq('id', id)
    if (error) throw error
    await supabase.from('users').delete().eq('id', cible.user_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
