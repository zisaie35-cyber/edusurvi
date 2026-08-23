'use client'

import { useState, useEffect, useMemo } from 'react'
import { authFetch } from '@/lib/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ecole {
  id: string
  nom: string
  ville: string | null
  telephone: string | null
  email: string | null
  email_alerte: string | null
  telephone_alerte: string | null
  actif: boolean
  created_at: string
}

interface Admin {
  id: string
  nom: string
  prenom: string
  email: string
  ecole_id: string
  actif: boolean
  created_at: string
}

// ─── UI partagée ──────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: string }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.2)', maxWidth: 360 }}>
      {msg}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function Input({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5 }}>{label}</label>
      <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} {...props} />
    </div>
  )
}

const BP: React.CSSProperties = { padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function SuperAdminApp({ session }: { session: any }) {
  const [ecoles, setEcoles] = useState<Ecole[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<any>(null)
  const [modalEcole, setModalEcole] = useState(false)
  const [modalAdmin, setModalAdmin] = useState<Ecole | null>(null)
  const [saving, setSaving] = useState(false)

  const [formEcole, setFormEcole] = useState({ nom: '', ville: '', telephone: '', email: '', emailAlerte: '', telephoneAlerte: '' })
  const [formAdmin, setFormAdmin] = useState({ nom: '', prenom: '', email: '', password: '' })

  const toast2 = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const charger = async () => {
    setLoading(true)
    try {
      const [ecolesRes, adminsRes] = await Promise.all([
        authFetch('/api/ecoles'),
        authFetch('/api/admins'),
      ])
      const [ecolesData, adminsData] = await Promise.all([ecolesRes.json(), adminsRes.json()])
      if (ecolesData.success) setEcoles(ecolesData.data || [])
      if (adminsData.success) setAdmins(adminsData.data || [])
    } catch {
      toast2('Erreur de chargement', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const adminsParEcole = useMemo(() => {
    const map: Record<string, Admin[]> = {}
    for (const a of admins) {
      if (!map[a.ecole_id]) map[a.ecole_id] = []
      map[a.ecole_id].push(a)
    }
    return map
  }, [admins])

  const creerEcole = async () => {
    if (!formEcole.nom) return toast2('Nom de l\'école requis', 'error')
    setSaving(true)
    try {
      const res = await authFetch('/api/ecoles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formEcole),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await charger()
      setModalEcole(false)
      setFormEcole({ nom: '', ville: '', telephone: '', email: '', emailAlerte: '', telephoneAlerte: '' })
      toast2('École créée ✓')
    } catch (e: any) {
      toast2(e.message || 'Erreur lors de la création', 'error')
    }
    setSaving(false)
  }

  const toggleEcole = async (e: Ecole) => {
    try {
      const res = await authFetch('/api/ecoles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id, actif: !e.actif }),
      })
      if (!res.ok) throw new Error()
      await charger()
      toast2(`École ${e.actif ? 'désactivée' : 'activée'} ✓`)
    } catch {
      toast2('Erreur lors de la mise à jour', 'error')
    }
  }

  const creerAdmin = async () => {
    if (!modalAdmin) return
    if (!formAdmin.nom || !formAdmin.prenom || !formAdmin.email || !formAdmin.password) {
      return toast2('Tous les champs sont requis', 'error')
    }
    setSaving(true)
    try {
      const res = await authFetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formAdmin, ecoleId: modalAdmin.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await charger()
      setModalAdmin(null)
      setFormAdmin({ nom: '', prenom: '', email: '', password: '' })
      toast2(`Administrateur créé pour ${modalAdmin.nom} ✓`)
    } catch (e: any) {
      toast2(e.message || 'Erreur lors de la création', 'error')
    }
    setSaving(false)
  }

  const toggleAdmin = async (a: Admin) => {
    try {
      const res = await authFetch('/api/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, actif: !a.actif }),
      })
      if (!res.ok) throw new Error()
      await charger()
      toast2(`Administrateur ${a.actif ? 'désactivé' : 'activé'} ✓`)
    } catch {
      toast2('Erreur lors de la mise à jour', 'error')
    }
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>🏢 Écoles</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Connecté en tant que super administrateur — {session.prenom} {session.nom}</p>
        </div>
        <button style={BP} onClick={() => setModalEcole(true)}>+ Nouvelle école</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Écoles', val: ecoles.length, color: '#2563eb', icon: '🏢' },
          { label: 'Écoles actives', val: ecoles.filter(e => e.actif).length, color: '#059669', icon: '✅' },
          { label: 'Administrateurs', val: admins.length, color: '#7c3aed', icon: '👤' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>⏳ Chargement...</p>
      ) : ecoles.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 48, fontSize: 14, background: '#fff', borderRadius: 14 }}>
          Aucune école pour l'instant. Cliquez « + Nouvelle école ».
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {ecoles.map(e => {
            const adminsEcole = adminsParEcole[e.id] || []
            return (
              <div key={e.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', opacity: e.actif ? 1 : .6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 15 }}>{e.nom}</strong>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: e.actif ? '#f0fdf4' : '#f3f4f6', color: e.actif ? '#059669' : '#888' }}>
                        {e.actif ? 'Active' : 'Désactivée'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{e.ville || '—'}{e.telephone ? ` · ${e.telephone}` : ''}{e.email ? ` · ${e.email}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...BP, background: '#f0fdf4', color: '#059669', border: '1px solid #86efac' }} onClick={() => setModalAdmin(e)}>+ Admin</button>
                    <button style={{ ...BP, background: e.actif ? '#fef2f2' : '#f0fdf4', color: e.actif ? '#dc2626' : '#059669', border: `1px solid ${e.actif ? '#fecaca' : '#86efac'}` }} onClick={() => toggleEcole(e)}>
                      {e.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>Administrateurs ({adminsEcole.length})</p>
                  {adminsEcole.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Aucun administrateur — cliquez « + Admin » pour en créer un.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {adminsEcole.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                          <span>{a.prenom} {a.nom} <span style={{ color: '#aaa', fontSize: 12 }}>({a.email})</span></span>
                          <button
                            onClick={() => toggleAdmin(a)}
                            style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: '1px solid #e5e7eb', background: a.actif ? '#fef2f2' : '#f0fdf4', color: a.actif ? '#dc2626' : '#059669' }}
                          >
                            {a.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalEcole && (
        <Modal title="Nouvelle école" onClose={() => setModalEcole(false)}>
          <Input label="Nom de l'école" value={formEcole.nom} onChange={(e: any) => setFormEcole({ ...formEcole, nom: e.target.value })} placeholder="Collège Notre-Dame" />
          <Input label="Ville" value={formEcole.ville} onChange={(e: any) => setFormEcole({ ...formEcole, ville: e.target.value })} placeholder="Bobo-Dioulasso" />
          <Input label="Téléphone" value={formEcole.telephone} onChange={(e: any) => setFormEcole({ ...formEcole, telephone: e.target.value })} />
          <Input label="Email" type="email" value={formEcole.email} onChange={(e: any) => setFormEcole({ ...formEcole, email: e.target.value })} />
          <Input label="Email d'alerte paiements (optionnel)" type="email" value={formEcole.emailAlerte} onChange={(e: any) => setFormEcole({ ...formEcole, emailAlerte: e.target.value })} placeholder="Par défaut si vide" />
          <Input label="Téléphone d'alerte paiements (optionnel)" value={formEcole.telephoneAlerte} onChange={(e: any) => setFormEcole({ ...formEcole, telephoneAlerte: e.target.value })} placeholder="Par défaut si vide" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setModalEcole(false)} style={{ padding: '9px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
            <button onClick={creerEcole} disabled={saving} style={{ ...BP, background: saving ? '#93c5fd' : '#1a1a2e' }}>{saving ? '⏳...' : 'Créer l\'école'}</button>
          </div>
        </Modal>
      )}

      {modalAdmin && (
        <Modal title={`Nouvel administrateur — ${modalAdmin.nom}`} onClose={() => setModalAdmin(null)}>
          <Input label="Prénom" value={formAdmin.prenom} onChange={(e: any) => setFormAdmin({ ...formAdmin, prenom: e.target.value })} />
          <Input label="Nom" value={formAdmin.nom} onChange={(e: any) => setFormAdmin({ ...formAdmin, nom: e.target.value })} />
          <Input label="Email" type="email" value={formAdmin.email} onChange={(e: any) => setFormAdmin({ ...formAdmin, email: e.target.value })} />
          <Input label="Mot de passe (8 caractères min.)" type="password" value={formAdmin.password} onChange={(e: any) => setFormAdmin({ ...formAdmin, password: e.target.value })} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setModalAdmin(null)} style={{ padding: '9px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
            <button onClick={creerAdmin} disabled={saving} style={{ ...BP, background: saving ? '#93c5fd' : '#1a1a2e' }}>{saving ? '⏳...' : 'Créer l\'administrateur'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
