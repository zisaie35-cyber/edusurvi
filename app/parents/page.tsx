'use client'

import { useState } from 'react'

export default function ParentsPage() {
  const [code, setCode] = useState(['','','','','',''])
  const [error, setError] = useState('')

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const newCode = [...code]
    newCode[i] = val.slice(-1)
    setCode(newCode)
    if (val && i < 5) {
      document.getElementById(`d${i+1}`)?.focus()
    }
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      document.getElementById(`d${i-1}`)?.focus()
    }
  }

  const verifier = () => {
    const c = code.join('')
    if (c.length !== 6) return setError('Entrez les 6 chiffres')
    setError('Code invalide ou expiré. Contactez l\'administration.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#1a1a2e,#2563eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍👩‍👧</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>
            Espace Parents
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            Entrez votre code à 6 chiffres pour accéder au suivi de votre enfant
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {code.map((d, i) => (
            <input
              key={i}
              id={`d${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              style={{
                width: 48, height: 56, textAlign: 'center',
                fontSize: 24, fontWeight: 700,
                border: d ? '2px solid #2563eb' : '2px solid #e5e7eb',
                borderRadius: 10, outline: 'none',
                background: d ? '#eff6ff' : '#fff',
                color: '#1a1a2e',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          onClick={verifier}
          style={{
            width: '100%', padding: 12,
            background: code.join('').length === 6 ? '#2563eb' : '#93c5fd',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 20,
          }}
        >
          Accéder au suivi →
        </button>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            Vous n'avez pas encore de code ?
          </p>
          <p style={{ fontSize: 12, color: '#666' }}>
            Contactez l'administration de l'école pour obtenir votre code d'accès.
          </p>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
            ← Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  )
}
