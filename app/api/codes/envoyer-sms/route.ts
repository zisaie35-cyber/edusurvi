// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Brevo attend un numéro international SANS le "+" (ex: 22670000000)
function formatTelBrevo(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('226') ? digits : `226${digits}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Brevo) ───────
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
    if (!codeParent.parent_tel) {
      return NextResponse.json({ error: 'Aucun numéro de téléphone renseigné' }, { status: 400 })
    }

    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: process.env.BREVO_SMS_SENDER || 'EduSuivi',
        recipient: formatTelBrevo(codeParent.parent_tel),
        content: `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`,
        type: 'transactional',
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Échec de l'envoi (Brevo ${res.status})`)
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
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
