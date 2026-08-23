// app/api/professeurs/route.ts
// Liste des comptes professeur de l'école (lecture seule pour l'instant).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireSession, resolveEcoleId } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request, ['admin', 'super_admin', 'professeur', 'surveillant'])
    const ecoleId = resolveEcoleId(session, request)
    if (!ecoleId) {
      return NextResponse.json({ error: 'Compte non rattaché à une école (sélectionnez une école)' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, nom, prenom, email, actif')
      .eq('role', 'professeur')
      .eq('ecole_id', ecoleId)
      .order('nom')

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
