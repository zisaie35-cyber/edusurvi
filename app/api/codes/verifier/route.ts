// app/api/codes/verifier/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function shapeNote(row: any) {
  return {
    id: row.id,
    matiereNom: row.matieres?.nom || 'Matière',
    coefficient: row.matieres?.coefficient || 1,
    couleur: row.matieres?.couleur || '#2563eb',
    valeur: row.valeur,
    typeEval: row.type_eval,
    trimestre: row.trimestre,
  }
}

function shapeAbsence(row: any) {
  return { id: row.id, dateDebut: row.date_debut, dateFin: row.date_fin, motif: row.motif, justifiee: row.justifiee }
}

function shapeRetard(row: any) {
  return { id: row.id, date: row.date, heureArrivee: row.heure_arrivee, motif: row.motif, justifie: row.justifie }
}

function shapeDevoir(row: any) {
  return { id: row.id, date: row.date, matiere: row.matiere, heureDebut: row.heure_debut, heureFin: row.heure_fin, professeur: row.professeur, type: row.type, note: row.note }
}

// ── POST /api/codes/verifier — vérifier un code parent ────────────────────────
// Accès public (le code à 6 chiffres tient lieu d'identifiant) : pas de JWT.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Code invalide — 6 chiffres requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('codes_parents')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Code invalide. Vérifiez votre code ou contactez l\'administration.' },
        { status: 404 }
      )
    }

    if (!data.actif) {
      return NextResponse.json(
        { error: 'Ce code a été désactivé. Contactez l\'administration.' },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    if (data.date_expiration < today) {
      return NextResponse.json(
        { error: 'Ce code a expiré. Contactez l\'administration pour le renouveler.' },
        { status: 403 }
      )
    }

    // Résout le vrai élève (table eleves) via matricule + école — le champ
    // eleve_id de codes_parents est un reliquat de l'ancien schéma
    // (entier, sans lien fiable avec eleves.id) et n'est pas utilisé ici.
    let notes: any[] = []
    let absences: any[] = []
    let retards: any[] = []
    let devoirs: any[] = []
    let classeNom = data.eleve_classe

    const { data: eleveReel } = await supabase
      .from('eleves')
      .select('id, classe_id, classes(nom)')
      .eq('matricule', data.eleve_matricule)
      .eq('ecole_id', data.ecole_id)
      .single()

    if (eleveReel) {
      classeNom = (eleveReel as any).classes?.nom || classeNom

      const [rn, ra, rr] = await Promise.all([
        supabase.from('notes').select('*, matieres(nom, coefficient, couleur)').eq('eleve_id', eleveReel.id).order('created_at', { ascending: false }),
        supabase.from('absences').select('*').eq('eleve_id', eleveReel.id).order('date_debut', { ascending: false }),
        supabase.from('retards').select('*').eq('eleve_id', eleveReel.id).order('date', { ascending: false }),
      ])
      notes = (rn.data || []).map(shapeNote)
      absences = (ra.data || []).map(shapeAbsence)
      retards = (rr.data || []).map(shapeRetard)

      if (eleveReel.classe_id) {
        const { data: devoirsData } = await supabase
          .from('devoirs')
          .select('*')
          .eq('ecole_id', data.ecole_id)
          .contains('classes', [eleveReel.classe_id])
          .order('date')
        devoirs = (devoirsData || []).map(shapeDevoir)
      }
    }

    return NextResponse.json({
      success: true,
      eleve: {
        id: data.eleve_id,
        nom: data.eleve_nom,
        prenom: data.eleve_prenom,
        matricule: data.eleve_matricule,
        classe: classeNom,
        parentNom: data.parent_nom,
        parentPrenom: data.parent_prenom,
        validite: data.validite,
        dateExpiration: data.date_expiration,
      },
      notes,
      absences,
      retards,
      devoirs,
    })

  } catch (error: any) {
    console.error('Erreur vérification code:', error)
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez.' },
      { status: 500 }
    )
  }
}
