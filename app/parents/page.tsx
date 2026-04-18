'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParentsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#1a1a2e,#2563eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
          Espace Parents
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Entrez votre code à 6 chiffres
        </p>
        <p style={{ fontSize: 13, color: '#2563eb' }}>
          Page en cours de chargement...
        </p>
      </div>
    </div>
  )
}
