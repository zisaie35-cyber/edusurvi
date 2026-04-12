'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Chargement dynamique de l'app principale
const MainApp = dynamic(() => import('@/components/MainApp'), { ssr: false })

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

  return <MainApp initialUser={user} />
}
