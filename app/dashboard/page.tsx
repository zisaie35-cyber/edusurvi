'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Chargement dynamique de l'app principale
const MainApp = dynamic(() => import('@/components/MainApp'), { ssr: false })
const SuperAdminApp = dynamic(() => import('@/components/SuperAdminApp'), { ssr: false })

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    if (!stored || !token) {
      router.push('/login')
      return
    }
    try {
      setUser(JSON.parse(stored))
    } catch {
      router.push('/login')
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f6fb',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏫</div>
          <p style={{ color: '#666', fontSize: 14 }}>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (user.role === 'super_admin') {
    const logout = () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      router.push('/login')
    }
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
        <div style={{ background: '#1a1a2e', color: '#fff', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 15 }}>🏫 EduSuivi — Super Administration</strong>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            🚪 Déconnexion
          </button>
        </div>
        <div style={{ padding: '28px 32px' }}>
          <SuperAdminApp session={user} />
        </div>
      </div>
    )
  }

  return <MainApp initialUser={user} />
}
