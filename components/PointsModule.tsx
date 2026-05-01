'use client'

import { useState, useEffect, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Config {
  pts_note: number
  pts_classe_complete: number
  pts_devoir: number
  pts_absence: number
  pts_retard: number
  pts_sanction: number
  pts_bonus_deadline: number
  pts_bonus_streak: number
  taux_fcfa: number
  minimum_retrait: number
  annee_scolaire: string
  date_expiration: string
}

interface Transaction {
  id: string
  user_id: string
  user_nom: string
  user_prenom: string
  user_role: string
  action: string
  description: string
  points: number
  created_at: string
}

interface Retrait {
  id: string
  user_id: string
  user_nom: string
  user_prenom: string
  user_role: string
  points: number
  montant_fcfa: number
  operateur: string
  telephone: string
  statut: string
  created_at: string
  refuse_motif?: string
}

interface Classement {
  user_id: string
  user_nom: string
  user_prenom: string
  user_role: string
  total: number
}

// ─── Config par défaut (si API non disponible) ────────────────────────────────
const DEFAULT_CONFIG: Config = {
  pts_note: 10,
  pts_classe_complete: 100,
  pts_devoir: 30,
  pts_absence: 15,
  pts_retard: 10,
  pts_sanction: 20,
  pts_bonus_deadline: 50,
  pts_bonus_streak: 80,
  taux_fcfa: 5,
  minimum_retrait: 500,
  annee_scolaire: '2024-2025',
  date_expiration: '2025-07-31',
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:     { label: 'En attente',       color: '#d97706', bg: '#fef3c7' },
  valide_ecole:   { label: 'Validé école',     color: '#2563eb', bg: '#eff6ff' },
  valide_central: { label: 'Validé central',   color: '#7c3aed', bg: '#f5f3ff' },
  paye:           { label: 'Payé ✓',           color: '#059669', bg: '#f0fdf4' },
  refuse:         { label: 'Refusé',           color: '#dc2626', bg: '#fef2f2' },
}

const ROLE_COLOR: Record<string, string> = {
  professeur: '#2563eb',
  surveillant: '#d97706',
  admin: '#7c3aed',
}

const ACTION_ICONS: Record<string, string> = {
  note:             '📝',
  classe_complete:  '⭐',
  devoir:           '📅',
  absence:          '📋',
  retard:           '⏰',
  sanction:         '⚠️',
  bonus_deadline:   '⚡',
  bonus_streak:     '🔥',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function daysUntilExpiry(date: string): number {
  return Math.ceil((new Date(date).getTime() - new Date().getTime()) / 86400000)
}

// ─── UI ───────────────────────────────────────────────────────────────────────
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
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const IN: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }
const BP: React.CSSProperties = { padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }

// ─── DASHBOARD PROF / SURVEILLANT ────────────────────────────────────────────
export function PointsDashboard({ session }: { session: any }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [solde, setSolde] = useState({ total: 0, retires: 0, disponible: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [retraits, setRetraits] = useState<Retrait[]>([])
  const [classement, setClassement] = useState<Classement[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'dashboard' | 'historique' | 'classement' | 'retrait'>('dashboard')
  const [modalRetrait, setModalRetrait] = useState(false)
  const [toast, setToast] = useState<any>(null)
  const [formRetrait, setFormRetrait] = useState({ points: 0, operateur: 'orange', telephone: '' })
  const [saving, setSaving] = useState(false)

  const toast2 = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const charger = async () => {
    setLoading(true)
    try {
      const [cfgRes, soldeRes, txRes, retRes, clsRes] = await Promise.all([
        fetch('/api/points?type=config'),
        fetch(`/api/points?type=solde&userId=${session.id}`),
        fetch(`/api/points?type=transactions&userId=${session.id}`),
        fetch(`/api/points?type=mes_retraits&userId=${session.id}`),
        fetch('/api/points?type=classement'),
      ])
      const [cfg, sol, tx, ret, cls] = await Promise.all([cfgRes.json(), soldeRes.json(), txRes.json(), retRes.json(), clsRes.json()])
      if (cfg.success) setConfig(cfg.data)
      if (sol.success) setSolde(sol.data)
      if (tx.success) setTransactions(tx.data || [])
      if (ret.success) setRetraits(ret.data || [])
      if (cls.success) setClassement(cls.data || [])
    } catch {
      // Utiliser les données par défaut
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const valeurFcfa = Math.round(solde.disponible * config.taux_fcfa)
  const pctMin = config.minimum_retrait > 0 ? Math.min(100, Math.round((solde.disponible / config.minimum_retrait) * 100)) : 100
  const monRang = classement.findIndex(c => c.user_id === String(session.id)) + 1
  const jours = daysUntilExpiry(config.date_expiration)

  const demanderRetrait = async () => {
    if (formRetrait.points < config.minimum_retrait) return toast2(`Minimum ${config.minimum_retrait} points requis`, 'error')
    if (formRetrait.points > solde.disponible) return toast2(`Seulement ${solde.disponible} pts disponibles`, 'error')
    if (!formRetrait.telephone) return toast2('Numéro de téléphone requis', 'error')
    setSaving(true)
    try {
      const res = await fetch('/api/points/retraits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(session.id),
          userNom: session.nom,
          userPrenom: session.prenom,
          userRole: session.role,
          points: formRetrait.points,
          montantFcfa: Math.round(formRetrait.points * config.taux_fcfa),
          operateur: formRetrait.operateur,
          telephone: formRetrait.telephone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast2('Demande de retrait envoyée ✓ En attente de validation.')
      setModalRetrait(false)
      charger()
    } catch (e: any) {
      toast2(e.message || 'Erreur', 'error')
    }
    setSaving(false)
  }

  const rankEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}e`

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>⏳ Chargement...</div>

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2563eb)', borderRadius: 16, padding: '22px 28px', color: '#fff', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>🏆 Mes points</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: .8 }}>Année {config.annee_scolaire} · Expire le {formatDate(config.date_expiration)}{jours <= 30 ? ` ⚠️ Dans ${jours} jours` : ''}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>{solde.disponible.toLocaleString()} pts</p>
            <p style={{ margin: 0, fontSize: 14, opacity: .8 }}>≈ {valeurFcfa.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Total gagné',   val: solde.total.toLocaleString() + ' pts',   color: 'rgba(255,255,255,.15)' },
            { label: 'Retiré',        val: solde.retires.toLocaleString() + ' pts',  color: 'rgba(255,255,255,.1)' },
            { label: 'Disponible',    val: solde.disponible.toLocaleString() + ' pts', color: 'rgba(255,255,255,.2)' },
            { label: 'Classement',    val: monRang > 0 ? rankEmoji(monRang) : '—',   color: 'rgba(255,255,255,.1)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.color, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{s.val}</p>
              <p style={{ margin: 0, fontSize: 11, opacity: .8 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard',   label: '📊 Dashboard' },
          { id: 'historique',  label: `📋 Historique (${transactions.length})` },
          { id: 'classement',  label: '🏆 Classement' },
          { id: 'retrait',     label: `💸 Retraits (${retraits.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: tab === t.id ? '#1a1a2e' : '#fff', color: tab === t.id ? '#fff' : '#666', border: tab === t.id ? 'none' : '1px solid #e5e7eb', fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div>
          {/* Progression vers retrait */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Progression vers le retrait</h3>
              <span style={{ fontSize: 13, color: '#666' }}>{solde.disponible} / {config.minimum_retrait} pts minimum</span>
            </div>
            <div style={{ height: 12, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${pctMin}%`, height: '100%', background: pctMin >= 100 ? '#059669' : '#2563eb', borderRadius: 6, transition: 'width .6s' }} />
            </div>
            {pctMin >= 100
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#059669', fontWeight: 600 }}>✅ Seuil atteint — vous pouvez demander un retrait</p>
                  <button style={{ ...BP, background: '#059669' }} onClick={() => { setFormRetrait({ points: solde.disponible, operateur: 'orange', telephone: '' }); setModalRetrait(true) }}>
                    💸 Demander le retrait
                  </button>
                </div>
              : <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Il vous manque encore <strong>{config.minimum_retrait - solde.disponible} pts</strong> pour atteindre le minimum de retrait</p>
            }
          </div>

          {/* Barème des actions */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Barème — Comment gagner des points</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
              {[
                { key: 'pts_note',            label: 'Note saisie',              icon: '📝' },
                { key: 'pts_classe_complete',  label: 'Classe 100% notée',        icon: '⭐' },
                { key: 'pts_devoir',           label: 'Devoir planifié',          icon: '📅' },
                { key: 'pts_absence',          label: 'Absence enregistrée',      icon: '📋' },
                { key: 'pts_retard',           label: 'Retard enregistré',        icon: '⏰' },
                { key: 'pts_sanction',         label: 'Sanction saisie',          icon: '⚠️' },
                { key: 'pts_bonus_deadline',   label: 'Bonus avant deadline',     icon: '⚡' },
                { key: 'pts_bonus_streak',     label: '7 jours consécutifs',      icon: '🔥' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8f9ff', borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#444' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>+{(config as any)[item.key]} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab === 'historique' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Historique de mes points</h3>
          {transactions.length === 0
            ? <p style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>Aucune transaction. Commencez à saisir des notes ou des absences !</p>
            : transactions.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 22 }}>{ACTION_ICONS[t.action] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{t.description || t.action}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{formatDateTime(t.created_at)}</p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.points > 0 ? '#059669' : '#dc2626' }}>
                    {t.points > 0 ? '+' : ''}{t.points} pts
                  </span>
                </div>
              ))
          }
        </div>
      )}

      {/* ── CLASSEMENT ── */}
      {tab === 'classement' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Classement — Année {config.annee_scolaire}</h3>
          {classement.length === 0
            ? <p style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>Aucune donnée de classement disponible</p>
            : classement.map((c, i) => {
                const isMe = c.user_id === String(session.id)
                const rang = i + 1
                return (
                  <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: isMe ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafbff', border: isMe ? '1.5px solid #2563eb' : '1px solid #f0f0f0' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: rang <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][rang - 1] : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: rang <= 3 ? 16 : 12, fontWeight: 700 }}>
                      {rang <= 3 ? ['🥇', '🥈', '🥉'][rang - 1] : rang}
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ROLE_COLOR[c.user_role] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                      {c.user_prenom[0]}{c.user_nom[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: isMe ? 700 : 500, fontSize: 13 }}>
                        {c.user_prenom} {c.user_nom}
                        {isMe && <span style={{ marginLeft: 8, fontSize: 11, color: '#2563eb', fontWeight: 600 }}>← Vous</span>}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{c.user_role}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: ROLE_COLOR[c.user_role] || '#888' }}>{c.total.toLocaleString()} pts</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{(c.total * config.taux_fcfa).toLocaleString()} FCFA</p>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}

      {/* ── RETRAITS ── */}
      {tab === 'retrait' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button style={{ ...BP, background: solde.disponible >= config.minimum_retrait ? '#059669' : '#aaa', cursor: solde.disponible >= config.minimum_retrait ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (solde.disponible >= config.minimum_retrait) { setFormRetrait({ points: solde.disponible, operateur: 'orange', telephone: '' }); setModalRetrait(true) } }}>
              💸 Demander un retrait
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
            {retraits.length === 0
              ? <p style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>Aucune demande de retrait</p>
              : retraits.map(r => {
                  const s = STATUT_CONFIG[r.statut] || STATUT_CONFIG.en_attente
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ textAlign: 'center', minWidth: 60 }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{r.points.toLocaleString()}</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#888' }}>points</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{r.montant_fcfa.toLocaleString()} FCFA</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{r.operateur === 'orange' ? '🟠' : '🔵'} +226 {r.telephone} · {formatDate(r.created_at)}</p>
                        {r.refuse_motif && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#dc2626' }}>Motif : {r.refuse_motif}</p>}
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  )
                })
            }
          </div>
        </div>
      )}

      {/* Modal retrait */}
      {modalRetrait && (
        <Modal title="Demander un retrait" onClose={() => setModalRetrait(false)}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
              Solde disponible : <strong>{solde.disponible.toLocaleString()} pts</strong> = <strong>{valeurFcfa.toLocaleString()} FCFA</strong>
            </p>
          </div>
          <F label="Points à retirer">
            <input style={IN} type="number" min={config.minimum_retrait} max={solde.disponible} value={formRetrait.points}
              onChange={e => setFormRetrait({ ...formRetrait, points: parseInt(e.target.value) || 0 })} />
            <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
              Minimum : {config.minimum_retrait} pts · Valeur : {(formRetrait.points * config.taux_fcfa).toLocaleString()} FCFA
            </p>
          </F>
          <F label="Opérateur Mobile Money">
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ val: 'orange', label: '🟠 Orange Money' }, { val: 'moov', label: '🔵 Moov Money' }].map(op => (
                <button key={op.val} onClick={() => setFormRetrait({ ...formRetrait, operateur: op.val })}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', border: formRetrait.operateur === op.val ? '2px solid #2563eb' : '1px solid #e5e7eb', background: formRetrait.operateur === op.val ? '#eff6ff' : '#fff', fontWeight: formRetrait.operateur === op.val ? 600 : 400, fontSize: 13 }}>
                  {op.label}
                </button>
              ))}
            </div>
          </F>
          <F label="Numéro de téléphone">
            <div style={{ display: 'flex' }}>
              <span style={{ padding: '9px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 13, color: '#666' }}>+226</span>
              <input style={{ ...IN, borderRadius: '0 8px 8px 0', flex: 1 }} type="tel" value={formRetrait.telephone}
                onChange={e => setFormRetrait({ ...formRetrait, telephone: e.target.value })} placeholder="70 XX XX XX" />
            </div>
          </F>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setModalRetrait(false)} style={{ padding: '9px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
            <button onClick={demanderRetrait} disabled={saving}
              style={{ ...BP, background: saving ? '#93c5fd' : '#059669', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳...' : '💸 Envoyer la demande'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── ADMIN POINTS ─────────────────────────────────────────────────────────────
export function AdminPoints() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [retraits, setRetraits] = useState<Retrait[]>([])
  const [classement, setClassement] = useState<Classement[]>([])
  const [tab, setTab] = useState<'retraits' | 'classement' | 'config'>('retraits')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<any>(null)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [editConfig, setEditConfig] = useState<Config | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [refusMotif, setRefusMotif] = useState('')
  const [refusId, setRefusId] = useState<string | null>(null)

  const toast2 = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const charger = async () => {
    setLoading(true)
    try {
      const [cfgRes, retRes, clsRes] = await Promise.all([
        fetch('/api/points?type=config'),
        fetch('/api/points?type=retraits'),
        fetch('/api/points?type=classement'),
      ])
      const [cfg, ret, cls] = await Promise.all([cfgRes.json(), retRes.json(), clsRes.json()])
      if (cfg.success) { setConfig(cfg.data); setEditConfig(cfg.data) }
      if (ret.success) setRetraits(ret.data || [])
      if (cls.success) setClassement(cls.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const action = async (id: string, act: string, motif?: string) => {
    try {
      const res = await fetch('/api/points/retraits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: act, motif }),
      })
      if (!res.ok) throw new Error()
      toast2(`Action effectuée ✓`)
      charger()
    } catch {
      toast2('Erreur', 'error')
    }
  }

  const sauvegarderConfig = async () => {
    if (!editConfig) return
    setSavingConfig(true)
    try {
      const res = await fetch('/api/points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig),
      })
      if (!res.ok) throw new Error()
      setConfig(editConfig)
      toast2('Configuration sauvegardée ✓')
    } catch {
      toast2('Erreur lors de la sauvegarde', 'error')
    }
    setSavingConfig(false)
  }

  const filteredRetraits = retraits.filter(r => filterStatut === 'tous' || r.statut === filterStatut)

  const stats = {
    enAttente: retraits.filter(r => r.statut === 'en_attente').length,
    valideEcole: retraits.filter(r => r.statut === 'valide_ecole').length,
    apayer: retraits.filter(r => r.statut === 'valide_ecole' || r.statut === 'valide_central').reduce((s, r) => s + r.montant_fcfa, 0),
    paye: retraits.filter(r => r.statut === 'paye').reduce((s, r) => s + r.montant_fcfa, 0),
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>🏆 Gestion des points</h1>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Valider les retraits, configurer le barème et suivre le classement</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'En attente validation', val: stats.enAttente,                    color: '#d97706', icon: '⏳' },
          { label: 'Validés par les écoles', val: stats.valideEcole,                  color: '#2563eb', icon: '✅' },
          { label: 'FCFA à décaisser',       val: stats.apayer.toLocaleString()+' F', color: '#7c3aed', icon: '💰' },
          { label: 'FCFA déjà payés',        val: stats.paye.toLocaleString()+' F',   color: '#059669', icon: '💸' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: `4px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: 11, color: '#888', margin: 0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'retraits',   label: `💸 Demandes de retrait (${retraits.length})` },
          { id: 'classement', label: '🏆 Classement' },
          { id: 'config',     label: '⚙️ Configuration' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: tab === t.id ? '#1a1a2e' : '#fff', color: tab === t.id ? '#fff' : '#666', border: tab === t.id ? 'none' : '1px solid #e5e7eb', fontWeight: tab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RETRAITS ── */}
      {tab === 'retraits' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { val: 'tous',           label: 'Tous' },
              { val: 'en_attente',     label: '⏳ En attente' },
              { val: 'valide_ecole',   label: '✅ Validé école' },
              { val: 'valide_central', label: '🟣 Validé central' },
              { val: 'paye',           label: '💸 Payés' },
              { val: 'refuse',         label: '❌ Refusés' },
            ].map(f => (
              <button key={f.val} onClick={() => setFilterStatut(f.val)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid #e5e7eb', background: filterStatut === f.val ? '#1a1a2e' : '#fff', color: filterStatut === f.val ? '#fff' : '#666', fontWeight: filterStatut === f.val ? 600 : 400 }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            {loading
              ? <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>⏳ Chargement...</p>
              : filteredRetraits.length === 0
                ? <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Aucune demande</p>
                : <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8f9fc' }}>
                          {['Employé', 'Rôle', 'Points', 'Montant', 'Opérateur', 'Date', 'Statut', 'Actions'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#888', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRetraits.map((r, i) => {
                          const s = STATUT_CONFIG[r.statut] || STATUT_CONFIG.en_attente
                          return (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                              <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.user_prenom} {r.user_nom}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: (ROLE_COLOR[r.user_role] || '#888') + '20', color: ROLE_COLOR[r.user_role] || '#888', fontWeight: 500 }}>{r.user_role}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r.points.toLocaleString()} pts</td>
                              <td style={{ padding: '11px 14px', fontWeight: 700, color: '#059669' }}>{r.montant_fcfa.toLocaleString()} FCFA</td>
                              <td style={{ padding: '11px 14px', fontSize: 12 }}>{r.operateur === 'orange' ? '🟠' : '🔵'} +226 {r.telephone}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#666' }}>{formatDate(r.created_at)}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                  {r.statut === 'en_attente' && (
                                    <>
                                      <button onClick={() => action(r.id, 'valider_ecole')} style={{ padding: '4px 10px', background: '#f0fdf4', color: '#059669', border: '1px solid #86efac', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✓ Valider</button>
                                      <button onClick={() => setRefusId(r.id)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✗ Refuser</button>
                                    </>
                                  )}
                                  {r.statut === 'valide_ecole' && (
                                    <span style={{ fontSize: 11, color: '#888' }}>En attente central</span>
                                  )}
                                  {r.statut === 'valide_central' && (
                                    <button onClick={() => action(r.id, 'payer')} style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>💸 Marquer payé</button>
                                  )}
                                  {(r.statut === 'paye' || r.statut === 'refuse') && (
                                    <span style={{ fontSize: 11, color: '#aaa' }}>Terminé</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
            }
          </div>

          {/* Modal refus */}
          {refusId && (
            <Modal title="Motif du refus" onClose={() => { setRefusId(null); setRefusMotif('') }}>
              <F label="Expliquer le motif du refus au prof/surveillant">
                <textarea style={{ ...IN, minHeight: 80 }} value={refusMotif} onChange={e => setRefusMotif(e.target.value)} placeholder="Ex: Solde insuffisant vérifiable, période d'expiration dépassée..." />
              </F>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setRefusId(null); setRefusMotif('') }} style={{ padding: '9px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                <button onClick={() => { action(refusId, 'refuser', refusMotif); setRefusId(null); setRefusMotif('') }}
                  style={{ padding: '9px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Confirmer le refus
                </button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── CLASSEMENT ── */}
      {tab === 'classement' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Classement général — Année {config.annee_scolaire}</h3>
          {classement.length === 0
            ? <p style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>Aucune donnée</p>
            : classement.map((c, i) => (
                <div key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 6, background: i % 2 === 0 ? '#fff' : '#fafbff', border: '1px solid #f0f0f0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 16 : 12, fontWeight: 700 }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ROLE_COLOR[c.user_role] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {c.user_prenom[0]}{c.user_nom[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{c.user_prenom} {c.user_nom}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{c.user_role}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: ROLE_COLOR[c.user_role] || '#888' }}>{c.total.toLocaleString()} pts</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{(c.total * config.taux_fcfa).toLocaleString()} FCFA</p>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* ── CONFIGURATION ── */}
      {tab === 'config' && editConfig && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>⚙️ Barème des actions</h3>
              {[
                { key: 'pts_note',           label: '📝 Note saisie' },
                { key: 'pts_classe_complete', label: '⭐ Classe 100% notée' },
                { key: 'pts_devoir',          label: '📅 Devoir planifié' },
                { key: 'pts_absence',         label: '📋 Absence enregistrée' },
                { key: 'pts_retard',          label: '⏰ Retard enregistré' },
                { key: 'pts_sanction',        label: '⚠️ Sanction saisie' },
                { key: 'pts_bonus_deadline',  label: '⚡ Bonus avant deadline' },
                { key: 'pts_bonus_streak',    label: '🔥 7 jours consécutifs' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                  <input type="number" min={0} style={{ width: 70, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                    value={(editConfig as any)[item.key]}
                    onChange={e => setEditConfig({ ...editConfig, [item.key]: parseInt(e.target.value) || 0 })} />
                  <span style={{ fontSize: 12, color: '#888', width: 26 }}>pts</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb', marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>💱 Conversion & Retrait</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>1 point =</span>
                  <input type="number" min={1} style={{ width: 70, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                    value={editConfig.taux_fcfa}
                    onChange={e => setEditConfig({ ...editConfig, taux_fcfa: parseInt(e.target.value) || 1 })} />
                  <span style={{ fontSize: 12, color: '#888' }}>FCFA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>Minimum retrait</span>
                  <input type="number" min={100} style={{ width: 80, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, textAlign: 'center' }}
                    value={editConfig.minimum_retrait}
                    onChange={e => setEditConfig({ ...editConfig, minimum_retrait: parseInt(e.target.value) || 500 })} />
                  <span style={{ fontSize: 12, color: '#888' }}>pts</span>
                </div>
                <div style={{ background: '#f8f9ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#666' }}>
                  Minimum retrait = <strong>{(editConfig.minimum_retrait * editConfig.taux_fcfa).toLocaleString()} FCFA</strong>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '0.5px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>📅 Année scolaire & Expiration</h3>
                <F label="Année scolaire">
                  <input style={IN} value={editConfig.annee_scolaire} onChange={e => setEditConfig({ ...editConfig, annee_scolaire: e.target.value })} placeholder="2024-2025" />
                </F>
                <F label="Date d'expiration des points">
                  <input style={IN} type="date" value={editConfig.date_expiration} onChange={e => setEditConfig({ ...editConfig, date_expiration: e.target.value })} />
                </F>
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
                  ⚠️ Les points non réclamés avant cette date seront définitivement perdus. Un rappel sera envoyé 30 jours avant.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={sauvegarderConfig} disabled={savingConfig}
              style={{ ...BP, background: savingConfig ? '#93c5fd' : '#1a1a2e', cursor: savingConfig ? 'not-allowed' : 'pointer', padding: '11px 28px', fontSize: 14 }}>
              {savingConfig ? '⏳ Sauvegarde...' : '💾 Sauvegarder la configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PointsDashboard
