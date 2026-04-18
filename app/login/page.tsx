'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Identifiants incorrects')
        setLoading(false)
        return
      }

      // Stocker le token
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Rediriger selon le rôle
      router.push('/dashboard')
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setLoading(false)
    }
  }

  const demos = [
    { label: 'Admin', email: 'admin@ecole.bf', pwd: 'admin123', color: '#7c3aed' },
    { label: 'Professeur', email: 'prof1@ecole.bf', pwd: 'prof123', color: '#2563eb' },
    { label: 'Surveillant', email: 'surv@ecole.bf', pwd: 'surv123', color: '#d97706' },
    { label: 'Élève', email: 'eleve1@ecole.bf', pwd: 'eleve123', color: '#059669' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#1a1a2e 0%,#1e3a5f 50%,#2563eb 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 36 }}>🏫</div>
        <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
          EduSuivi
        </h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 28 }}>
          Plateforme de suivi scolaire
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 5 }}>
            Adresse email
          </label>
          <input
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.bf"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 5 }}>
            Mot de passe
          </label>
          <input
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 }}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? '#93c5fd' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 4,
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        {/* Espace parents */}
        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <a
            href="/parents"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 10,
              textDecoration: 'none',
              color: '#15803d',
              fontSize: 14,
              fontWeight: 600,
              transition: 'background .15s',
            }}
          >
            <span style={{ fontSize: 20 }}>👨‍👩‍👧</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#15803d' }}>
                Espace Parents
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 400 }}>
                Accéder avec votre code à 6 chiffres
              </p>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 16, color: '#16a34a' }}>→</span>
          </a>
        </div>

        {/* Comptes démo */}
        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 10, textAlign: 'center' }}>
            Comptes de démonstration
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {demos.map(d => (
              <button
                key={d.label}
                onClick={() => { setEmail(d.email); setPassword(d.pwd) }}
                style={{
                  padding: '5px 12px',
                  background: '#fff',
                  border: `1px solid ${d.color}`,
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  color: d.color,
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
