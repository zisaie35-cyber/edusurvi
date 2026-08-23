// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Termii attend un numéro international SANS le "+" (ex: 22670000000)
function formatTelTermii(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('226') ? digits : `226${digits}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Termii) ──────
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

    const res = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to: formatTelTermii(codeParent.parent_tel),
        from: process.env.TERMII_SENDER_ID || 'Termii',
        sms: `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`,
        type: 'plain',
        channel: 'generic',
      }),
    })

    const body = await res.json().catch(() => ({}))
    if (!res.ok || !body.message_id) {
      throw new Error(body.message || `Échec de l'envoi (Termii ${res.status})`)
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
