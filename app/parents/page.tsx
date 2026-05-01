'use client'

import { useState } from 'react'

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
  const [tab, setTab] = useState<'notes' | 'devoirs' | 'absences'>('notes')

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
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
    }
    setLoading(false)
  }

  // ── Espace connecté ──────────────────────────────────────────────────────────
  if (eleve) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

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
              onClick={() => { setEleve(null); setDigits(['', '', '', '', '', '']) }}
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
          {tab === 'notes' && <NotesView eleve={eleve} />}
          {tab === 'devoirs' && <DevoirsView eleve={eleve} />}
          {tab === 'absences' && <AbsencesView />}
        </div>
      </div>
    )
  }

  // ── Page saisie code ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
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
          <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Vous n'avez pas de code ?</p>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            Contactez l'administration de l'école. Le code vous sera envoyé par SMS ou email.
          </p>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Notes ────────────────────────────────────────────────────────────────────
function NotesView({ eleve }: { eleve: any }) {
  const MATIERES = [
    { nom: 'Mathématiques', coef: 3, couleur: '#2563eb' },
    { nom: 'Français',      coef: 3, couleur: '#7c3aed' },
    { nom: 'SVT',           coef: 2, couleur: '#059669' },
    { nom: 'Histoire-Géo',  coef: 2, couleur: '#d97706' },
    { nom: 'Anglais',       coef: 2, couleur: '#0891b2' },
  ]
  const NOTES = [
    { matiere: 'Mathématiques', valeur: 14, typeEval: 'Devoir 1', trimestre: 3 },
    { matiere: 'Français',      valeur: 12, typeEval: 'Devoir 1', trimestre: 3 },
    { matiere: 'SVT',           valeur: 16, typeEval: 'Devoir 1', trimestre: 3 },
    { matiere: 'Anglais',       valeur: 13, typeEval: 'Devoir 1', trimestre: 3 },
  ]
  const moy = (NOTES.reduce((s, n) => s + n.valeur, 0) / NOTES.length).toFixed(1)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#2563eb', margin: 0 }}>{moy}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Moyenne générale</p>
        </div>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#059669', margin: 0 }}>{NOTES.length}</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Notes</p>
        </div>
        <div style={{ background: '#fefce8', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#d97706', margin: 0 }}>T3</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Trimestre</p>
        </div>
      </div>
      {MATIERES.map(m => {
        const notes = NOTES.filter(n => n.matiere === m.nom)
        if (!notes.length) return null
        const mMoy = (notes.reduce((s, n) => s + n.valeur, 0) / notes.length).toFixed(1)
        return (
          <div key={m.nom} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.couleur }} />
                <strong style={{ fontSize: 14 }}>{m.nom}</strong>
                <span style={{ fontSize: 11, color: '#aaa' }}>coeff.{m.coef}</span>
              </div>
              <strong style={{ color: parseFloat(mMoy) >= 10 ? '#059669' : '#dc2626' }}>{mMoy}/20</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {notes.map((n, i) => (
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
function DevoirsView({ eleve }: { eleve: any }) {
  const prochains = [
    { date: '2025-05-07', matiere: 'Maths',    heure: '10h-12h' },
    { date: '2025-05-09', matiere: 'Français', heure: '10h-12h' },
    { date: '2025-05-14', matiere: 'IR',        heure: '10h-12h' },
  ]
  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
        Prochains devoirs — <strong>{eleve.classe}</strong>
      </p>
      {prochains.map((d, i) => {
        const days = Math.ceil((new Date(d.date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
        return (
          <div key={i} style={{ background: '#fff', border: `1px solid ${days <= 3 ? '#fbbf24' : '#e5e7eb'}`, borderLeft: `4px solid ${days <= 3 ? '#f59e0b' : '#2563eb'}`, borderRadius: '0 12px 12px 0', padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ minWidth: 52, textAlign: 'center', background: days <= 3 ? '#fef3c7' : '#eff6ff', borderRadius: 8, padding: '6px 8px' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: days <= 3 ? '#d97706' : '#2563eb' }}>
                {new Date(d.date).getDate()}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>
                {new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' })}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{d.matiere}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>🕐 {d.heure}</p>
            </div>
            {days <= 3 && days >= 0 && (
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
function AbsencesView() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#dc2626', margin: 0 }}>1</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Absences</p>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#d97706', margin: 0 }}>2</p>
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>Retards</p>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>Historique</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>Absence</span>
          <div>
            <p style={{ margin: 0, fontSize: 13 }}>04–05 novembre 2024</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Maladie · Justifiée</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: '#fff7ed', color: '#d97706', fontWeight: 600 }}>Retard</span>
          <div>
            <p style={{ margin: 0, fontSize: 13 }}>08 octobre 2024</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Arrivée 08h25 · Transport · Justifié</p>
          </div>
        </div>
      </div>
    </div>
  )
}
