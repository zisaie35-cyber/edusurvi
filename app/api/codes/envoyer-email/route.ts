// app/api/codes/envoyer-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/codes/envoyer-email — envoie le code parent par email (Brevo) ───
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin'])

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: codeParent, error: fetchError } = await supabase
      .from('codes_parents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !codeParent || codeParent.ecole_id !== session.ecoleId) {
      return NextResponse.json({ error: 'Code introuvable' }, { status: 404 })
    }
    if (!codeParent.parent_email) {
      return NextResponse.json({ error: 'Aucun email renseigné' }, { status: 400 })
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_FROM_NAME || 'EduSuivi',
          email: process.env.BREVO_FROM_EMAIL,
        },
        to: [{ email: codeParent.parent_email, name: `${codeParent.parent_prenom} ${codeParent.parent_nom}` }],
        subject: `Votre code d'accès EduSuivi — ${codeParent.eleve_prenom} ${codeParent.eleve_nom}`,
        htmlContent: `
          <p>Bonjour ${codeParent.parent_prenom} ${codeParent.parent_nom},</p>
          <p>Voici votre code d'accès à l'Espace Parents EduSuivi pour le suivi de <strong>${codeParent.eleve_prenom} ${codeParent.eleve_nom}</strong> :</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${codeParent.code}</p>
          <p>Ce code est valable jusqu'au ${codeParent.date_expiration}.</p>
          <p>Connectez-vous sur la page « Espace Parents » de l'application avec ce code.</p>
        `,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Échec de l'envoi (Brevo ${res.status})`)
    }

    const { data, error } = await supabase
      .from('codes_parents')
      .update({ email_sent: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
