// app/api/codes/demander/route.ts
// Demande d'accès parent en libre-service, payée par Orange Money.
// Le paiement n'est PAS vérifié automatiquement (pas d'API marchande Orange
// Money) : la demande est créée inactive, en attente de confirmation manuelle
// par l'administration. Une alerte email + SMS est envoyée immédiatement à
// l'administration pour accélérer la vérification.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'zisaie35@yahoo.fr'
const ADMIN_ALERT_TEL = process.env.ADMIN_ALERT_TEL || '76260715'

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

function formatTelBrevo(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('226') ? digits : `226${digits}`
}

// Alerte admin best-effort : ne doit jamais faire échouer la demande du parent.
async function alerterAdmin(params: { eleveNom: string; elevePrenom: string; eleveMatricule: string; eleveClasse: string; montant: number; parentTel: string }) {
  const texte = `EduSuivi : nouvelle demande de code parent — ${params.elevePrenom} ${params.eleveNom} (matricule ${params.eleveMatricule}, ${params.eleveClasse}). Montant annoncé : ${params.montant} FCFA. Tél. payeur : ${params.parentTel}. Vérifiez Orange Money et confirmez dans l'admin.`

  if (process.env.BREVO_API_KEY) {
    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: process.env.BREVO_FROM_NAME || 'EduSuivi', email: process.env.BREVO_FROM_EMAIL },
          to: [{ email: ADMIN_ALERT_EMAIL }],
          subject: `Nouvelle demande de code parent — ${params.elevePrenom} ${params.eleveNom}`,
          htmlContent: `<p>${texte}</p>`,
        }),
      })
    } catch { /* best-effort */ }

    try {
      await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': process.env.BREVO_API_KEY },
        body: JSON.stringify({
          sender: process.env.BREVO_SMS_SENDER || 'EduSuivi',
          recipient: formatTelBrevo(ADMIN_ALERT_TEL),
          content: texte,
          type: 'transactional',
        }),
      })
    } catch { /* best-effort */ }
  }
}

// ── POST /api/codes/demander — demande de code parent via paiement Orange Money ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eleveMatricule, eleveNom, elevePrenom, eleveClasse, parentTel, parentEmail, validite } = body

    if (!eleveMatricule || !eleveNom || !elevePrenom || !eleveClasse) {
      return NextResponse.json({ error: 'Matricule, classe, nom et prénom de l\'élève requis' }, { status: 400 })
    }
    if (!parentTel) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
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
        eleve_classe: eleveClasse,
        parent_nom: null,
        parent_prenom: null,
        parent_email: parentEmail || null,
        parent_tel: parentTel,
        validite,
        date_expiration: addDays(tarif.jours),
        actif: false,
        sms_sent: false,
        email_sent: false,
        statut_paiement: 'en_attente',
        operateur_paiement: 'orange_money',
        telephone_expediteur: parentTel,
        montant: tarif.prix,
      })
      .select()
      .single()

    if (error) throw error

    await alerterAdmin({
      eleveNom, elevePrenom, eleveMatricule, eleveClasse,
      montant: tarif.prix, parentTel,
    })

    return NextResponse.json({ success: true, data: { id: data.id, montant: tarif.prix } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
