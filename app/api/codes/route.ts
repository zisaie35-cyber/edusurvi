// app/api/codes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const VALIDITES: Record<string, number> = {
  semaine: 7,
  mois: 30,
  trimestre: 90,
  annee: 365,
}

// ── GET /api/codes — lister tous les codes (admin) ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('codes_parents')
      .select('*')
      .order('date_creation', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST /api/codes — créer un code (admin) ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eleveId, eleveNom, elevePrenom, eleveMatricule, eleveClasse,
      parentNom, parentPrenom, parentEmail, parentTel, validite
    } = body

    if (!eleveId || !parentNom || !parentPrenom || !validite) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    if (!parentEmail && !parentTel) {
      return NextResponse.json({ error: 'Email ou téléphone requis' }, { status: 400 })
    }

    const jours = VALIDITES[validite]
    if (!jours) {
      return NextResponse.json({ error: 'Durée de validité invalide' }, { status: 400 })
    }

    // Générer un code unique
    let code = genCode()
    let tentatives = 0
    while (tentatives < 10) {
      const { data: existing } = await supabase
        .from('codes_parents')
        .select('id')
        .eq('code', code)
        .single()
      if (!existing) break
      code = genCode()
      tentatives++
    }

    const { data, error } = await supabase
      .from('codes_parents')
      .insert({
        code,
        eleve_id: eleveId,
        eleve_nom: eleveNom,
        eleve_prenom: elevePrenom,
        eleve_matricule: eleveMatricule,
        eleve_classe: eleveClasse,
        parent_nom: parentNom,
        parent_prenom: parentPrenom,
        parent_email: parentEmail || null,
        parent_tel: parentTel || null,
        validite,
        date_expiration: addDays(jours),
        actif: true,
        sms_sent: false,
        email_sent: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH /api/codes — activer/désactiver un code ─────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, actif, smsSent, emailSent, dateExpiration } = body

    const updates: any = {}
    if (actif !== undefined) updates.actif = actif
    if (smsSent !== undefined) updates.sms_sent = smsSent
    if (emailSent !== undefined) updates.email_sent = emailSent
    if (dateExpiration !== undefined) updates.date_expiration = dateExpiration

    const { data, error } = await supabase
      .from('codes_parents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE /api/codes — supprimer un code ─────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { error } = await supabase
      .from('codes_parents')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
