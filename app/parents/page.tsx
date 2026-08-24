'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ManuelUtilisation = dynamic(() => import('@/components/ManuelUtilisation'), { ssr: false })

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function ParentsPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [eleve, setEleve] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [retards, setRetards] = useState<any[]>([])
  const [devoirs, setDevoirs] = useState<any[]>([])
  const [tab, setTab] = useState<'notes' | 'devoirs' | 'absences'>('notes')
  const [showHelp, setShowHelp] = useState(false)
  const [showObtenir, setShowObtenir] = useState(false)

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const n = [...digits]
    n[i] = val.slice(-1)
    setDigits(n)
    if (val && i < 5) document.getElementById(`pd${i + 1}`)?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      document.getElementById(`pd${i - 1}`)?.focus()
    }
  }

  const verifier = async () => {
    setError('')
    const code = digits.join('')
    if (code.length !== 6) return setError('Entrez les 6 chiffres de votre code')

    setLoading(true)
    try {
      const res = await fetch('/api/codes/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Code invalide ou expiré.')
        setLoading(false)
        return
      }

      setEleve(data.eleve)
      setNotes(data.notes || [])
      setAbsences(data.absences || [])
      setRetards(data.retards || [])
      setDevoirs(data.devoirs || [])
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
    }
    setLoading(false)
  }

  // ── Espace connecté ──────────────────────────────────────────────────────────
  if (eleve) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
        {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2563eb)', color: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
              {eleve.prenom[0]}{eleve.nom[0]}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{eleve.prenom} {eleve.nom}</p>
              <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>{eleve.classe} · Matricule {eleve.matricule}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, opacity: .7 }}>Accès valide jusqu'au</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{formatDate(eleve.dateExpiration)}</p>
            </div>
            <button
              onClick={() => setShowHelp(true)}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer' }}
            >
              ❓ Aide
            </button>
            <button
              onClick={() => { setEleve(null); setNotes([]); setAbsences([]); setRetards([]); setDevoirs([]); setDigits(['', '', '', '', '', '']) }}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 8, color: '#fff', fontSize: 12, cursor: 'pointer' }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {[
            { id: 'notes',    label: '📝 Notes' },
            { id: 'devoirs',  label: '📅 Devoirs' },
            { id: 'absences', label: '⏰ Absences' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '13px 16px', border: 'none', borderBottom: tab === t.id ? '3px solid #2563eb' : '3px solid transparent', background: 'transparent', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#2563eb' : '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', maxWidth: 800, margin: '0 auto' }}>
          {tab === 'notes' && <NotesView notes={notes} />}
          {tab === 'devoirs' && <DevoirsView eleve={eleve} devoirs={devoirs} />}
          {tab === 'absences' && <AbsencesView absences={absences} retards={retards} />}
        </div>
      </div>
    )
  }

  // ── Page saisie code ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      {showObtenir && <ObtenirCodeOverlay onClose={() => setShowObtenir(false)} />}
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>👨‍👩‍👧</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>Espace Parents</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.6 }}>
            Entrez votre code à 6 chiffres pour accéder au suivi scolaire de votre enfant
          </p>
        </div>

        {/* Saisie code */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input key={i} id={`pd${i}`}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              style={{
                width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700,
                border: d ? '2px solid #2563eb' : '2px solid #e5e7eb',
                borderRadius: 10, outline: 'none',
                background: d ? '#eff6ff' : '#fff', color: '#1a1a2e',
                transition: 'all .15s',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 13, marginBottom: 12, lineHeight: 1.5, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>
            {error}
          </p>
        )}

        <button
          onClick={verifier}
          disabled={loading || digits.join('').length !== 6}
          style={{
            width: '100%', padding: 13,
            background: loading ? '#93c5fd' : digits.join('').length === 6 ? '#2563eb' : '#93c5fd',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700,
            cursor: (loading || digits.join('').length !== 6) ? 'not-allowed' : 'pointer',
            marginBottom: 20,
          }}
        >
          {loading ? '⏳ Vérification...' : 'Accéder au suivi →'}
        </button>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Vous n'avez pas de code ?</p>
          <button
            onClick={() => setShowObtenir(true)}
            style={{ width: '100%', padding: '11px 16px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, color: '#c2410c', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
          >
            🟠 Obtenir un code avec Orange Money
          </button>
          <p style={{ fontSize: 11, color: '#999', lineHeight: 1.5, margin: 0 }}>
            Ou contactez l'administration de l'école — le code vous sera envoyé par SMS ou email.
          </p>
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={() => setShowHelp(true)}
            style={{ background: 'none', border: 'none', fontSize: 12, color: '#2563eb', cursor: 'pointer', padding: 0 }}
          >
            ❓ Comment ça marche ?
          </button>
          <a href="/login" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function NotesView({ notes }: { notes: any[] }) {
  if (!notes.length) {
    return <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Aucune note enregistrée pour l'instant</p>
  }

  const moy = (notes.reduce((s, n) => s + n.valeur, 0) / notes.length).toFixed(1)
  const trimestres = [...new Set(notes.map(n => n.trimestre))].sort()
  const matieres = [...new Map(notes.map(n => [n.matiereNom, n])).values()]

  return (
    <div>
      <div className="stat-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#2563eb', margin: 0 }}>{moy}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Moyenne générale</p>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#059669', margin: 0 }}>{notes.length}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Notes</p>
        </div>
        <div style={{ background: '#fefce8', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#d97706', margin: 0 }}>{trimestres.map(t => `T${t}`).join(', ') || '-'}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Trimestre{trimestres.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      {matieres.map(m => {
        const notesMatiere = notes.filter(n => n.matiereNom === m.matiereNom)
        const mMoy = (notesMatiere.reduce((s, n) => s + n.valeur, 0) / notesMatiere.length).toFixed(1)
        return (
          <div key={m.matiereNom} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.couleur }} />
                <strong style={{ fontSize: 14 }}>{m.matiereNom}</strong>
                <span style={{ fontSize: 11, color: '#aaa' }}>coeff.{m.coefficient}</span>
              </div>
              <strong style={{ color: parseFloat(mMoy) >= 10 ? '#059669' : '#dc2626' }}>{mMoy}/20</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {notesMatiere.map((n, i) => (
                <div key={i} style={{ background: '#f8f9ff', borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 70 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: n.valeur >= 10 ? '#2563eb' : '#dc2626' }}>{n.valeur}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#888' }}>{n.typeEval}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Devoirs ──────────────────────────────────────────────────────────────────
function DevoirsView({ eleve, devoirs }: { eleve: any; devoirs: any[] }) {
  if (!devoirs.length) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
          Programme des devoirs — <strong>{eleve.classe}</strong>
        </p>
        <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Aucun devoir programmé pour l'instant</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
        Programme des devoirs — <strong>{eleve.classe}</strong>
      </p>
      {devoirs.map((d) => {
        const days = Math.ceil((new Date(d.date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
        return (
          <div key={d.id} style={{ background: '#fff', border: `1px solid ${days >= 0 && days <= 3 ? '#fbbf24' : '#e5e7eb'}`, borderLeft: `4px solid ${days >= 0 && days <= 3 ? '#f59e0b' : '#2563eb'}`, borderRadius: '0 12px 12px 0', padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, opacity: days < 0 ? 0.6 : 1 }}>
            <div style={{ minWidth: 52, textAlign: 'center', background: days >= 0 && days <= 3 ? '#fef3c7' : '#eff6ff', borderRadius: 8, padding: '6px 8px' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: days >= 0 && days <= 3 ? '#d97706' : '#2563eb' }}>
                {new Date(d.date).getDate()}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>
                {new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' })}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{d.matiere}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                {d.heureDebut && d.heureFin ? `🕐 ${d.heureDebut}–${d.heureFin}` : ''}
                {d.professeur ? ` · ${d.professeur}` : ''}
              </p>
              {d.note && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#d97706', fontStyle: 'italic' }}>ℹ️ {d.note}</p>}
            </div>
            {days >= 0 && days <= 3 && (
              <span style={{ padding: '3px 10px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
                Dans {days}j ⚠️
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Absences ─────────────────────────────────────────────────────────────────
function AbsencesView({ absences, retards }: { absences: any[]; retards: any[] }) {
  const historique = [
    ...absences.map(a => ({ ...a, sorte: 'absence' as const, date: a.dateDebut })),
    ...retards.map(r => ({ ...r, sorte: 'retard' as const })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#dc2626', margin: 0 }}>{absences.length}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Absences</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#d97706', margin: 0 }}>{retards.length}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Retards</p>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>Historique</p>
        {historique.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Aucune absence ni retard enregistré</p>}
        {historique.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < historique.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: h.sorte === 'absence' ? '#fef2f2' : '#fff7ed', color: h.sorte === 'absence' ? '#dc2626' : '#d97706', fontWeight: 600 }}>
              {h.sorte === 'absence' ? 'Absence' : 'Retard'}
            </span>
            <div>
              {h.sorte === 'absence' ? (
                <p style={{ margin: 0, fontSize: 13 }}>{formatDate(h.dateDebut)}{h.dateFin && h.dateFin !== h.dateDebut ? ` → ${formatDate(h.dateFin)}` : ''}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 13 }}>{formatDate(h.date)} · Arrivée {h.heureArrivee}</p>
              )}
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                {h.motif ? `${h.motif} · ` : ''}{(h.sorte === 'absence' ? h.justifiee : h.justifie) ? 'Justifié(e)' : 'Non justifié(e)'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Obtenir un code (paiement Orange Money) ─────────────────────────────────
const NUMERO_ORANGE_MONEY = '76 26 07 15'

const DUREES: Record<string, { label: string; prix: number }> = {
  semaine: { label: '1 semaine', prix: 500 },
  mois: { label: '1 mois', prix: 1500 },
  trimestre: { label: '1 trimestre', prix: 3500 },
  annee: { label: '1 an', prix: 10000 },
}

function ObtenirCodeOverlay({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    ecoleId: '', eleveMatricule: '', eleveNom: '', elevePrenom: '', eleveClasse: '',
    parentEmail: '', parentTel: '', validite: 'trimestre',
  })
  const [ecoles, setEcoles] = useState<{ id: string; nom: string; ville?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [envoye, setEnvoye] = useState(false)

  useEffect(() => {
    fetch('/api/ecoles')
      .then(r => r.json())
      .then(d => { if (d.success) setEcoles(d.data) })
      .catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const tarif = DUREES[form.validite]

  const soumettre = async () => {
    setError('')
    if (!form.ecoleId) {
      return setError('Sélectionnez l\'école de l\'enfant')
    }
    if (!form.eleveMatricule || !form.eleveClasse || !form.eleveNom || !form.elevePrenom) {
      return setError('Matricule, classe, nom et prénom de l\'élève requis')
    }
    if (!form.parentTel) {
      return setError('Numéro de téléphone requis')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/codes/demander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi de la demande')
        setLoading(false)
        return
      }
      setEnvoye(true)
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', padding: '5vh 20px', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff' }}>
          <strong style={{ fontSize: 15 }}>🟠 Obtenir un code — Orange Money</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {envoye ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Demande envoyée</h3>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
              Votre demande est en cours de vérification par l'administration. Une fois votre paiement confirmé,
              vous recevrez votre code d'accès par SMS et/ou email.
            </p>
            <button onClick={onClose} style={{ padding: '10px 24px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 14, marginBottom: 18 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#c2410c' }}>Comment ça marche</p>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#7c2d12', lineHeight: 1.7 }}>
                <li>Choisissez une durée ci-dessous et notez le montant.</li>
                <li>Envoyez ce montant via <strong>Orange Money</strong> au <strong>{NUMERO_ORANGE_MONEY}</strong> depuis le numéro que vous renseignez ci-dessous.</li>
                <li>Remplissez le formulaire et envoyez votre demande — l'école est alertée immédiatement et vérifie le paiement.</li>
                <li>Votre code d'accès vous est envoyé par SMS/email dès que le paiement est confirmé.</li>
              </ol>
            </div>

            <p style={labelStyle}>École de l'enfant</p>
            <select style={{ ...inputStyle, marginBottom: 14 }} value={form.ecoleId} onChange={e => set('ecoleId', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {ecoles.map(e => (
                <option key={e.id} value={e.id}>{e.nom}{e.ville ? ` — ${e.ville}` : ''}</option>
              ))}
            </select>

            <p style={labelStyle}>Durée d'accès souhaitée</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {Object.entries(DUREES).map(([k, v]) => (
                <button key={k} onClick={() => set('validite', k)}
                  style={{ padding: '9px 10px', borderRadius: 8, border: form.validite === k ? '2px solid #c2410c' : '1px solid #e5e7eb', background: form.validite === k ? '#fff7ed' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{v.label}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c2410c' }}>{v.prix.toLocaleString()} FCFA</p>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div><p style={labelStyle}>Matricule de l'élève</p><input style={inputStyle} value={form.eleveMatricule} onChange={e => set('eleveMatricule', e.target.value)} placeholder="2024-001" /></div>
              <div><p style={labelStyle}>Classe</p><input style={inputStyle} value={form.eleveClasse} onChange={e => set('eleveClasse', e.target.value)} placeholder="3ème A" /></div>
              <div><p style={labelStyle}>Prénom élève</p><input style={inputStyle} value={form.elevePrenom} onChange={e => set('elevePrenom', e.target.value)} /></div>
              <div><p style={labelStyle}>Nom élève</p><input style={inputStyle} value={form.eleveNom} onChange={e => set('eleveNom', e.target.value)} /></div>
              <div><p style={labelStyle}>Numéro utilisé pour payer (Orange Money)</p><input style={inputStyle} value={form.parentTel} onChange={e => set('parentTel', e.target.value)} placeholder="70 00 00 00" /></div>
              <div><p style={labelStyle}>Email (optionnel)</p><input style={inputStyle} type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} /></div>
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: 12.5, margin: '8px 0', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{error}</p>
            )}

            <button
              onClick={soumettre}
              disabled={loading}
              style={{ width: '100%', marginTop: 10, padding: 12, background: loading ? '#fdba74' : '#c2410c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Envoi...' : `Envoyer ma demande — ${tarif.prix.toLocaleString()} FCFA payés`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aide ─────────────────────────────────────────────────────────────────────
function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', padding: '5vh 20px', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#f4f6fb', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
          <strong style={{ fontSize: 15 }}>Aide — Espace Parents</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <ManuelUtilisation role="parent" />
        </div>
      </div>
    </div>
  )
}
