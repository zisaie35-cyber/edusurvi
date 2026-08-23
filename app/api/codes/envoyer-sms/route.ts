// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Africa's Talking attend un numéro international AVEC le "+" (ex: +22670000000)
function formatTelAfricasTalking(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return `+${digits.startsWith('226') ? digits : `226${digits}`}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Africa's Talking) ──
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

    const params = new URLSearchParams({
      username: process.env.AT_USERNAME!,
      to: formatTelAfricasTalking(codeParent.parent_tel),
      message: `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`,
    })
    if (process.env.AT_SENDER_ID) params.set('from', process.env.AT_SENDER_ID)

    const baseUrl = process.env.AT_USERNAME === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging'

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        apiKey: process.env.AT_API_KEY!,
      },
      body: params.toString(),
    })

    const body = await res.json().catch(() => ({}))
    const recipient = body.SMSMessageData?.Recipients?.[0]
    if (!res.ok || !recipient || recipient.status !== 'Success') {
      throw new Error(recipient?.status || body.SMSMessageData?.Message || `Échec de l'envoi (Africa's Talking ${res.status})`)
    }

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
