// app/api/admins/route.ts
// Gestion des comptes administrateur d'école, réservée au super_admin.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET /api/admins — lister les administrateurs de toutes les écoles ─────────
export async function GET(request: NextRequest) {
  try {
    await requireSession(request, ['super_admin'])

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, prenom, email, actif, ecole_id, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── POST /api/admins — créer l'administrateur d'une école ─────────────────────
export async function POST(request: NextRequest) {
  try {
    await requireSession(request, ['super_admin'])

    const body = await request.json()
    const { nom, prenom, email, password, ecoleId } = body

    if (!nom || !prenom || !email || !password || !ecoleId) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum' }, { status: 400 })
    }

    const { data: ecole } = await supabase.from('ecoles').select('id').eq('id', ecoleId).single()
    if (!ecole) {
      return NextResponse.json({ error: 'École introuvable' }, { status: 404 })
    }

    const hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({ nom, prenom, email, password: hash, role: 'admin', ecole_id: ecoleId, actif: true })
      .select('id, nom, prenom, email, ecole_id, actif')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
      throw error
    }

    // Un barème de points par défaut est nécessaire pour que le module Points
    // fonctionne dans la nouvelle école (id explicite : le défaut de la colonne
    // est la valeur littérale 'default', qui entrerait en conflit entre écoles).
    await supabase.from('points_config').upsert({ id: ecoleId, ecole_id: ecoleId }, { onConflict: 'ecole_id' })

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

// ── PATCH /api/admins — activer/désactiver un administrateur ─────────────────
export async function PATCH(request: NextRequest) {
  try {
    await requireSession(request, ['super_admin'])

    const body = await request.json()
    const { id, actif } = body
    if (!id || actif === undefined) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ actif })
      .eq('id', id)
      .eq('role', 'admin')
      .select('id, nom, prenom, email, ecole_id, actif')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
