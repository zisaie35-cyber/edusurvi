// app/api/codes/demander/route.ts
// Demande d'accès parent en libre-service, payée par Orange Money.
// Le paiement n'est PAS vérifié automatiquement (pas d'API marchande Orange
// Money) : la demande est créée inactive, en attente de confirmation manuelle
// par l'administration (rapprochement avec la référence de transaction).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALIDITES: Record<string, { jours: number; prix: number }> = {
  semaine: { jours: 7, prix: 500 },
  mois: { jours: 30, prix: 1500 },
  trimestre: { jours: 90, prix: 3500 },
  annee: { jours: 365, prix: 10000 },
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── POST /api/codes/demander — demande de code parent via paiement Orange Money ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eleveMatricule, eleveNom, elevePrenom, eleveClasse,
      parentNom, parentPrenom, parentEmail, parentTel,
      validite, telephoneExpediteur, referencePaiement,
    } = body

    if (!eleveMatricule || !eleveNom || !elevePrenom || !parentNom || !parentPrenom || !parentTel) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (!referencePaiement || !telephoneExpediteur) {
      return NextResponse.json({ error: 'Référence de transaction et numéro expéditeur requis' }, { status: 400 })
    }

    const tarif = VALIDITES[validite]
    if (!tarif) {
      return NextResponse.json({ error: 'Durée de validité invalide' }, { status: 400 })
    }

    // Générer un code unique (restera inactif tant que le paiement n'est pas confirmé)
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
        eleve_id: 0,
        eleve_nom: eleveNom,
        eleve_prenom: elevePrenom,
        eleve_matricule: eleveMatricule,
        eleve_classe: eleveClasse || null,
        parent_nom: parentNom,
        parent_prenom: parentPrenom,
        parent_email: parentEmail || null,
        parent_tel: parentTel,
        validite,
        date_expiration: addDays(tarif.jours),
        actif: false,
        sms_sent: false,
        email_sent: false,
        statut_paiement: 'en_attente',
        operateur_paiement: 'orange_money',
        reference_paiement: referencePaiement,
        telephone_expediteur: telephoneExpediteur,
        montant: tarif.prix,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: { id: data.id, montant: tarif.prix } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
