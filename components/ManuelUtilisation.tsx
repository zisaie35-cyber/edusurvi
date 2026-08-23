'use client'

// ─── Manuel d'utilisation ───────────────────────────────────────────────────
// Documentation intégrée de l'application EduSuivi, adaptée au rôle connecté.

import { useMemo, useState } from 'react'

type Role = 'admin' | 'professeur' | 'surveillant' | 'eleve' | 'parent'

type Section = {
  id: string
  icon: string
  titre: string
  roles: Role[]
  intro: string
  etapes: string[]
  astuce?: string
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrateur',
  professeur: 'Professeur',
  surveillant: 'Surveillant',
  eleve: 'Élève',
  parent: 'Parent',
}

const ROLE_COLOR: Record<Role, string> = {
  admin: '#7c3aed',
  professeur: '#2563eb',
  surveillant: '#d97706',
  eleve: '#059669',
  parent: '#16a34a',
}

const SECTIONS: Section[] = [
  {
    id: 'connexion',
    icon: '🔐',
    titre: 'Se connecter',
    roles: ['admin', 'professeur', 'surveillant', 'eleve', 'parent'],
    intro: "Chaque profil dispose de son propre accès à l'application.",
    etapes: [
      "Sur la page de connexion, saisissez votre adresse email et votre mot de passe, puis cliquez sur « Se connecter ».",
      "Vous êtes redirigé automatiquement vers le tableau de bord correspondant à votre rôle (administrateur, professeur, surveillant ou élève).",
      "Des boutons de comptes de démonstration (Admin / Professeur / Surveillant / Élève) permettent de pré-remplir les identifiants pour tester l'application.",
      "Si vous êtes parent, n'utilisez pas ce formulaire : cliquez sur « Espace Parents » pour entrer votre code d'accès à 6 chiffres (voir la section « Espace Parents »).",
    ],
    astuce: "Votre session reste ouverte tant que vous ne cliquez pas sur « Déconnexion » dans le menu latéral.",
  },
  {
    id: 'tableau_de_bord',
    icon: '📊',
    titre: 'Tableau de bord',
    roles: ['admin', 'professeur', 'surveillant', 'eleve'],
    intro: "La page d'accueil affiche une vue d'ensemble adaptée à votre rôle.",
    etapes: [
      "Administrateur : nombre d'élèves, de professeurs, de classes et de sanctions, ainsi que les absences récentes et l'activité récente de l'établissement.",
      "Professeur / Surveillant : accès rapide aux modules de saisie (notes, absences/retards) et à votre solde de points depuis le menu latéral.",
      "Élève : votre moyenne générale, le nombre de notes, d'absences et de retards, présentés sous forme de fiche personnelle.",
    ],
  },
  {
    id: 'resultats_notes',
    icon: '📝',
    titre: 'Résultats scolaires — notes',
    roles: ['professeur', 'eleve', 'parent'],
    intro: "La saisie et la consultation des résultats (notes) se font depuis le menu « Saisie des notes » (professeur) ou « Mes notes » (élève / parent).",
    etapes: [
      "Professeur : ouvrez « Saisie des notes », choisissez la classe, la matière, le trimestre et le type d'évaluation (Devoir 1 à 3, Examen, Interrogation, TP).",
      "Saisissez la note sur 20 de chaque élève : une valeur inférieure à 10 s'affiche en rouge, une valeur suffisante en vert. Vous pouvez ajouter un commentaire par élève.",
      "La moyenne de la classe et une barre de progression (% d'élèves déjà notés) se mettent à jour automatiquement. Utilisez « Effacer tout » pour recommencer ou « Enregistrer » pour valider la saisie.",
      "Chaque saisie complète rapporte des points à l'auteur (voir la section « Points & récompenses »), avec un bonus si toute la classe a été notée.",
      "Élève : ouvrez « Mes notes » pour consulter, matière par matière, votre moyenne (avec coefficient) et le détail de chaque note obtenue.",
      "Parent : depuis l'Espace Parents, l'onglet « Notes » affiche la moyenne générale de votre enfant et le détail par matière.",
    ],
  },
  {
    id: 'absences_retards',
    icon: '⏰',
    titre: 'Absences & retards',
    roles: ['surveillant', 'eleve', 'parent'],
    intro: "Le surveillant enregistre les absences et retards ; l'élève et le parent peuvent en consulter l'historique.",
    etapes: [
      "Surveillant : dans le module de saisie, basculez sur l'onglet « Absence » ou « Retard », recherchez l'élève par nom ou prénom.",
      "Pour une absence, indiquez les dates de début et de fin ; pour un retard, la date et l'heure d'arrivée. Ajoutez un motif si besoin puis activez « Justifié(e) » lorsque c'est le cas.",
      "L'onglet « Historique » regroupe l'ensemble des absences et retards déjà saisis.",
      "Élève / Parent : consultez le nombre total d'absences et de retards ainsi que leur statut (justifié ou non) depuis votre espace.",
    ],
  },
  {
    id: 'discipline',
    icon: '⚠️',
    titre: 'Discipline & sanctions',
    roles: ['admin', 'surveillant'],
    intro: "Le suivi disciplinaire centralise les sanctions, retards et absences.",
    etapes: [
      "Surveillant : depuis « Sanctions », cliquez sur « + Nouvelle sanction », sélectionnez l'élève, le type (avertissement, retenue, exclusion temporaire ou définitive), le motif, une description et les dates concernées.",
      "Administrateur : la page « Discipline » présente les statistiques globales (sanctions, retards, absences) et la liste complète des sanctions enregistrées.",
    ],
  },
  {
    id: 'gestion_eleves',
    icon: '👤',
    titre: 'Gestion des élèves',
    roles: ['admin', 'professeur', 'surveillant'],
    intro: "Consultez et gérez la liste des élèves de l'établissement.",
    etapes: [
      "Utilisez la barre de recherche pour retrouver un élève par nom, prénom ou matricule.",
      "Administrateur : cliquez sur « + Ajouter » pour inscrire un nouvel élève (nom, prénom, matricule, date de naissance, classe, nationalité, adresse).",
      "Le tableau affiche pour chaque élève sa classe et ses informations principales.",
    ],
  },
  {
    id: 'classes_professeurs',
    icon: '🏛',
    titre: 'Classes & professeurs',
    roles: ['admin'],
    intro: "Module réservé à l'administrateur pour organiser les classes et affecter les professeurs.",
    etapes: [
      "La vue globale présente une carte par classe (effectif d'élèves et de professeurs). Cliquez sur « + Nouvelle classe » pour en créer une (nom, niveau).",
      "Le tableau des professeurs liste les matières enseignées et les classes assignées ; « + Ajouter un professeur » permet de créer un profil (nom, email, matières via cases à cocher, classes).",
      "Cliquez sur « Voir le détail » d'une classe pour gérer ses élèves (ajout, modification, suppression, changement de classe) et ses professeurs (affectation/retrait), ainsi que la « couverture des matières » (matières sans professeur assigné).",
    ],
  },
  {
    id: 'programme_devoirs',
    icon: '📅',
    titre: 'Programme des devoirs',
    roles: ['admin', 'professeur', 'surveillant', 'eleve', 'parent'],
    intro: "Le calendrier commun des devoirs, compositions, examens et sorties.",
    etapes: [
      "Filtrez par niveau, classe ou type d'épreuve, et basculez entre la vue Liste (groupée par mois) et la vue Calendrier.",
      "Un bandeau signale les échéances dans les 3 prochains jours.",
      "Professeur / Administrateur : cliquez sur « + Ajouter un devoir » pour renseigner la date, le type, la matière, le professeur, les horaires et les classes concernées (une ou plusieurs). Utilisez ✏️ pour modifier ou 🗑️ pour supprimer un devoir existant.",
      "Élève / Parent : la vue est automatiquement filtrée sur votre classe, en lecture seule.",
    ],
  },
  {
    id: 'points_recompenses',
    icon: '🏆',
    titre: 'Points & récompenses',
    roles: ['professeur', 'surveillant'],
    intro: "Professeurs et surveillants gagnent des points pour leurs saisies, convertibles en récompense.",
    etapes: [
      "Depuis « Mes points », consultez votre solde (points gagnés, retirés, disponibles) et sa contre-valeur en FCFA, ainsi que votre classement parmi les collègues.",
      "L'onglet « Dashboard » montre votre progression vers le seuil de retrait et le barème de points par action. « Historique » liste vos transactions.",
      "Pour demander un retrait, cliquez sur « Demander un retrait », indiquez le nombre de points, l'opérateur Mobile Money (Orange ou Moov) et le numéro de téléphone.",
      "Suivez le statut de vos demandes dans l'onglet « Retraits ».",
    ],
  },
  {
    id: 'admin_points',
    icon: '💰',
    titre: 'Administration des points',
    roles: ['admin'],
    intro: "Module réservé à l'administrateur pour piloter le programme de points.",
    etapes: [
      "L'onglet « Retraits » permet de filtrer les demandes par statut, de les valider, de les refuser (motif obligatoire) ou de les marquer comme payées.",
      "L'onglet « Classement » présente le classement général de tous les employés.",
      "L'onglet « Configuration » permet d'ajuster le barème de points par action, le taux de conversion en FCFA, le montant minimum de retrait, ainsi que l'année scolaire et la date d'expiration des points. N'oubliez pas de cliquer sur « Sauvegarder ».",
    ],
  },
  {
    id: 'codes_parents',
    icon: '🔑',
    titre: 'Codes d\'accès parents',
    roles: ['admin'],
    intro: "Génération et gestion des codes à 6 chiffres qui donnent accès à l'Espace Parents.",
    etapes: [
      "Recherchez un code existant par élève, parent, code ou classe, ou filtrez par statut (actif, expiré, désactivé).",
      "Cliquez sur « + Générer un code », sélectionnez l'élève, renseignez les informations du parent (téléphone et/ou email requis) et choisissez la durée de validité (semaine, mois, trimestre ou année, chacune avec son tarif affiché).",
      "Pour un code existant : activez/désactivez-le 🔒🔓, renouvelez-le 🔄 pour prolonger sa validité, envoyez-le par SMS 📱 ou email ✉️, ou supprimez-le 🗑️.",
      "Les demandes soumises par les parents eux-mêmes via « Obtenir un code » (paiement Orange Money) apparaissent avec le statut « Paiement en attente » (filtre dédié 💰) : ouvrez la demande pour voir le montant, la référence de transaction et le numéro expéditeur, puis « ✅ Confirmer le paiement » (active le code) ou « ❌ Rejeter » (motif requis) après vérification manuelle du virement.",
    ],
  },
  {
    id: 'espace_parents',
    icon: '👨‍👩‍👧',
    titre: 'Espace Parents',
    roles: ['parent'],
    intro: "Portail dédié aux parents, accessible depuis la page de connexion sans compte classique.",
    etapes: [
      "Cliquez sur « Espace Parents » depuis la page de connexion, puis saisissez les 6 chiffres du code fourni par l'établissement.",
      "Cliquez sur « Accéder au suivi » : la fiche de votre enfant s'affiche (nom, classe, matricule, date d'expiration de l'accès).",
      "Trois onglets sont disponibles : « Notes » (moyenne générale et détail par matière), « Devoirs » (prochaines échéances) et « Absences » (compteurs et historique justifié/non justifié).",
      "Cliquez sur « Déconnexion » pour quitter l'espace et ressaisir un code plus tard.",
      "Pas encore de code ? Cliquez sur « 🟠 Obtenir un code avec Orange Money » : choisissez une durée, envoyez le montant affiché au 76 26 07 15 via Orange Money, puis renseignez le formulaire (matricule et infos de l'élève, vos coordonnées, et la référence de la transaction reçue par SMS). Le code est activé après vérification manuelle du paiement par l'établissement et vous est envoyé par SMS/email.",
    ],
    astuce: "Si vous n'avez pas de code, contactez l'administration de l'établissement ou utilisez « Obtenir un code avec Orange Money » directement depuis le portail.",
  },
]

function defaultOpenIds(role?: Role): Set<string> {
  if (!role) return new Set([SECTIONS[0].id])
  const matches = SECTIONS.filter(s => s.roles.includes(role)).map(s => s.id)
  return new Set(matches.length ? matches : [SECTIONS[0].id])
}

export default function ManuelUtilisation({ role }: { role?: Role }) {
  const [open, setOpen] = useState<Set<string>>(() => defaultOpenIds(role))
  const [query, setQuery] = useState('')

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.filter(s =>
      s.titre.toLowerCase().includes(q) ||
      s.intro.toLowerCase().includes(q) ||
      s.etapes.some(e => e.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>📖 Manuel d'utilisation</h1>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 20, maxWidth: 640 }}>
        Guide pas à pas des fonctionnalités d'EduSuivi. Les sections qui vous concernent
        {role ? <> (<strong style={{ color: ROLE_COLOR[role] }}>{ROLE_LABEL[role]}</strong>)</> : null} sont dépliées par défaut — cliquez sur un titre pour l'ouvrir ou le refermer.
      </p>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher dans le manuel (ex : notes, code parent, devoir...)"
        style={{ width: '100%', maxWidth: 480, padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
      />

      {sections.length === 0 && (
        <p style={{ color: '#999', fontSize: 14 }}>Aucune section ne correspond à votre recherche.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map(s => {
          const isOpen = open.has(s.id)
          const concerne = role ? s.roles.includes(role) : false
          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: concerne ? `1px solid ${ROLE_COLOR[role!]}55` : '1px solid transparent' }}>
              <button
                onClick={() => toggle(s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{s.titre}</span>
                <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 220 }}>
                  {s.roles.map(r => (
                    <span key={r} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: ROLE_COLOR[r] + '1a', color: ROLE_COLOR[r] }}>{ROLE_LABEL[r]}</span>
                  ))}
                </span>
                <span style={{ color: '#aaa', fontSize: 14, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 18px 18px 50px' }}>
                  <p style={{ fontSize: 13.5, color: '#555', marginBottom: 10, lineHeight: 1.6 }}>{s.intro}</p>
                  <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {s.etapes.map((e, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: '#333', lineHeight: 1.6 }}>{e}</li>
                    ))}
                  </ol>
                  {s.astuce && (
                    <p style={{ marginTop: 12, fontSize: 13, color: '#2563eb', background: '#eff6ff', padding: '8px 12px', borderRadius: 8 }}>
                      💡 {s.astuce}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
