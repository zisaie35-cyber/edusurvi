// app/api/codes/envoyer-sms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Format international avec "+" (ex: +22670000000). Ajustez si votre
// passerelle Kannel/SMSC attend un format différent (sans "+", 00...).
function formatTelKannel(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return `+${digits.startsWith('226') ? digits : `226${digits}`}`
}

// ── POST /api/codes/envoyer-sms — envoie le code parent par SMS (Kannel) ──────
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

    const message = `EduSuivi : votre code d'accès parent pour ${codeParent.eleve_prenom} ${codeParent.eleve_nom} est ${codeParent.code}. Valable jusqu'au ${codeParent.date_expiration}.`

    const url = new URL(process.env.KANNEL_URL!) // ex: https://votre-serveur.tld:13013/cgi-bin/sendsms
    url.searchParams.set('username', process.env.KANNEL_USERNAME!)
    url.searchParams.set('password', process.env.KANNEL_PASSWORD!)
    url.searchParams.set('to', formatTelKannel(codeParent.parent_tel))
    url.searchParams.set('text', message)
    if (process.env.KANNEL_FROM) url.searchParams.set('from', process.env.KANNEL_FROM)

    const res = await fetch(url.toString(), { method: 'GET' })
    const responseText = (await res.text()).trim()

    // Kannel répond en texte brut, ex: "0: Accepted for delivery" en cas de succès.
    if (!res.ok || !responseText.startsWith('0:')) {
      throw new Error(responseText || `Échec de l'envoi (Kannel ${res.status})`)
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
