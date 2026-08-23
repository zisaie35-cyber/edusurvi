// app/api/codes/envoyer-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/codes/envoyer-email — envoie le code parent par email (Resend) ──
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data: codeParent, error: fetchError } = await supabase
      .from('codes_parents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !codeParent) {
      return NextResponse.json({ error: 'Code introuvable' }, { status: 404 })
    }
    if (!codeParent.parent_email) {
      return NextResponse.json({ error: 'Aucun email renseigné' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'EduSuivi <onboarding@resend.dev>',
      to: codeParent.parent_email,
      subject: `Votre code d'accès EduSuivi — ${codeParent.eleve_prenom} ${codeParent.eleve_nom}`,
      html: `
        <p>Bonjour ${codeParent.parent_prenom} ${codeParent.parent_nom},</p>
        <p>Voici votre code d'accès à l'Espace Parents EduSuivi pour le suivi de <strong>${codeParent.eleve_prenom} ${codeParent.eleve_nom}</strong> :</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${codeParent.code}</p>
        <p>Ce code est valable jusqu'au ${codeParent.date_expiration}.</p>
        <p>Connectez-vous sur la page « Espace Parents » de l'application avec ce code.</p>
      `,
    })

    if (sendError) throw new Error(sendError.message)

    const { data, error } = await supabase
      .from('codes_parents')
      .update({ email_sent: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
