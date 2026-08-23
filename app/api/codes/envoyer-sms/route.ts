// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatTelBurkinabe(tel: string): string {
  if (tel.startsWith('+')) return tel
  return `+226${tel.replace(/\D/g, '')}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Twilio) ──────
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
    if (!codeParent.parent_tel) {
      return NextResponse.json({ error: 'Aucun numéro de téléphone renseigné' }, { status: 400 })
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    const to = formatTelBurkinabe(codeParent.parent_tel)

    await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
      body: `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`,
    })

    const { data, error } = await supabase
      .from('codes_parents')
      .update({ sms_sent: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
