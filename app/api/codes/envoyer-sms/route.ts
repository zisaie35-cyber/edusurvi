// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vonage attend un numéro international SANS le "+" (ex: 22670000000)
function formatTelVonage(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('226') ? digits : `226${digits}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Vonage) ──────
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
      api_key: process.env.VONAGE_API_KEY!,
      api_secret: process.env.VONAGE_API_SECRET!,
      to: formatTelVonage(codeParent.parent_tel),
      from: process.env.VONAGE_FROM || 'EduSuivi',
      text: `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`,
    })

    const res = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const body = await res.json().catch(() => ({}))
    const result = body.messages?.[0]
    if (!res.ok || !result || result.status !== '0') {
      throw new Error(result?.['error-text'] || `Échec de l'envoi (Vonage ${res.status})`)
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
