'use client'

import { useState, useEffect, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeParent {
  id: string
  code: string
  eleve_id: number
  eleve_nom: string
  eleve_prenom: string
  eleve_matricule: string
  eleve_classe: string
  parent_nom: string
  parent_prenom: string
  parent_email: string
  parent_tel: string
  validite: string
  date_creation: string
  date_expiration: string
  actif: boolean
  sms_sent: boolean
  email_sent: boolean
}

const ELEVES_DEMO = [
  { id:1,  nom:'Traoré',    prenom:'Aïcha',    matricule:'2024-001', classe:'3e A' },
  { id:2,  nom:'Compaoré',  prenom:'Théo',     matricule:'2024-002', classe:'3e A' },
  { id:3,  nom:'Zongo',     prenom:'Fatima',   matricule:'2024-003', classe:'4e B' },
  { id:4,  nom:'Ouédraogo', prenom:'Brice',    matricule:'2024-004', classe:'3e A' },
  { id:5,  nom:'Sawadogo',  prenom:'Mariam',   matricule:'2024-005', classe:'4e B' },
  { id:6,  nom:'Kaboré',    prenom:'Luc',      matricule:'2024-006', classe:'5e A' },
  { id:7,  nom:'Diallo',    prenom:'Salimata', matricule:'2024-007', classe:'3e A' },
  { id:8,  nom:'Nikiema',   prenom:'Joël',     matricule:'2024-008', classe:'4e B' },
  { id:9,  nom:'Tapsoba',   prenom:'Reine',    matricule:'2024-009', classe:'5e A' },
  { id:10, nom:'Ouattara',  prenom:'Issa',     matricule:'2024-010', classe:'3e A' },
]

const VALIDITES: Record<string, { label:string; jours:number; prix:number; couleur:string }> = {
  semaine:   { label:'1 semaine',   jours:7,   prix:500,   couleur:'#0891b2' },
  mois:      { label:'1 mois',      jours:30,  prix:1500,  couleur:'#2563eb' },
  trimestre: { label:'1 trimestre', jours:90,  prix:3500,  couleur:'#7c3aed' },
  annee:     { label:'1 an',        jours:365, prix:10000, couleur:'#059669' },
}

function isExpired(date: string): boolean {
  return date < new Date().toISOString().split('T')[0]
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg:string; type:string }) {
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: type==='success'?'#059669':type==='error'?'#dc2626':'#2563eb', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.2)', maxWidth:360 }}>
      {msg}
    </div>
  )
}

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f0f0f0', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  )
}

function Confirm({ msg, onOui, onNon }: { msg:string; onOui:()=>void; onNon:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:380, width:'90%' }}>
        <div style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>⚠️</div>
        <p style={{ textAlign:'center', fontSize:14, marginBottom:24, lineHeight:1.6 }}>{msg}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onNon} style={{ flex:1, padding:10, border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Annuler</button>
          <button onClick={onOui} style={{ flex:1, padding:10, background:'#dc2626', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function F({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#555', marginBottom:5 }}>{label}</label>
      {children}
    </div>
  )
}

const IN: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
const BP: React.CSSProperties = { padding:'9px 20px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }
const BE: React.CSSProperties = { padding:'5px 12px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:6, fontSize:12, cursor:'pointer' }
const BD: React.CSSProperties = { padding:'5px 12px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, fontSize:12, cursor:'pointer' }
const BG: React.CSSProperties = { padding:'5px 12px', background:'#f0fdf4', color:'#059669', border:'1px solid #86efac', borderRadius:6, fontSize:12, cursor:'pointer' }

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export function AdminCodes() {
  const [codes, setCodes] = useState<CodeParent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [modal, setModal] = useState<'generer'|'detail'|null>(null)
  const [selected, setSelected] = useState<CodeParent|null>(null)
  const [toast, setToast] = useState<any>(null)
  const [confirm, setConfirm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string|null>(null)

  const [form, setForm] = useState({
    eleveId: 0,
    parentNom: '',
    parentPrenom: '',
    parentEmail: '',
    parentTel: '',
    validite: 'trimestre',
  })

  const toast2 = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Charger les codes depuis l'API
  const chargerCodes = async () => {
    try {
      const res = await fetch('/api/codes')
      const data = await res.json()
      if (data.success) setCodes(data.data || [])
    } catch {
      toast2('Erreur de chargement des codes', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { chargerCodes() }, [])

  // Filtrage
  const filtered = useMemo(() => {
    return codes.filter(c => {
      const txt = `${c.eleve_nom} ${c.eleve_prenom} ${c.code} ${c.eleve_classe} ${c.parent_nom} ${c.parent_prenom}`.toLowerCase()
      if (!txt.includes(search.toLowerCase())) return false
      if (filterStatut === 'actif') return c.actif && !isExpired(c.date_expiration)
      if (filterStatut === 'expire') return isExpired(c.date_expiration)
      if (filterStatut === 'inactif') return !c.actif
      return true
    }).sort((a, b) => b.date_creation.localeCompare(a.date_creation))
  }, [codes, search, filterStatut])

  const stats = useMemo(() => ({
    total: codes.length,
    actifs: codes.filter(c => c.actif && !isExpired(c.date_expiration)).length,
    expires: codes.filter(c => isExpired(c.date_expiration)).length,
    inactifs: codes.filter(c => !c.actif).length,
  }), [codes])

  // Générer un code
  const generer = async () => {
    if (!form.eleveId) return toast2('Sélectionner un élève', 'error')
    if (!form.parentNom || !form.parentPrenom) return toast2('Nom et prénom du parent requis', 'error')
    if (!form.parentEmail && !form.parentTel) return toast2('Email ou téléphone requis', 'error')

    const eleve = ELEVES_DEMO.find(e => e.id === form.eleveId)
    if (!eleve) return

    setSaving(true)
    try {
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleveId: eleve.id,
          eleveNom: eleve.nom,
          elevePrenom: eleve.prenom,
          eleveMatricule: eleve.matricule,
          eleveClasse: eleve.classe,
          parentNom: form.parentNom,
          parentPrenom: form.parentPrenom,
          parentEmail: form.parentEmail,
          parentTel: form.parentTel,
          validite: form.validite,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await chargerCodes()
      setModal('detail')
      setSelected(data.data)
      setForm({ eleveId:0, parentNom:'', parentPrenom:'', parentEmail:'', parentTel:'', validite:'trimestre' })
      toast2(`Code ${data.data.code} généré pour ${eleve.prenom} ${eleve.nom} ✓`)
    } catch (e: any) {
      toast2(e.message || 'Erreur lors de la génération', 'error')
    }
    setSaving(false)
  }

  // Activer / Désactiver
  const toggleActif = async (c: CodeParent) => {
    setConfirm({
      msg: `${c.actif ? 'Désactiver' : 'Activer'} le code ${c.code} de ${c.parent_prenom} ${c.parent_nom} ?`,
      onOui: async () => {
        setConfirm(null)
        try {
          const res = await fetch('/api/codes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: c.id, actif: !c.actif }),
          })
          if (!res.ok) throw new Error()
          await chargerCodes()
          if (selected?.id === c.id) setSelected(prev => prev ? { ...prev, actif: !prev.actif } : null)
          toast2(`Code ${c.actif ? 'désactivé' : 'activé'} ✓`)
        } catch {
          toast2('Erreur lors de la mise à jour', 'error')
        }
      }
    })
  }

  // Supprimer
  const supprimer = async (c: CodeParent) => {
    setConfirm({
      msg: `Supprimer définitivement le code de ${c.parent_prenom} ${c.parent_nom} pour ${c.eleve_prenom} ${c.eleve_nom} ?`,
      onOui: async () => {
        setConfirm(null)
        try {
          const res = await fetch(`/api/codes?id=${c.id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error()
          await chargerCodes()
          if (selected?.id === c.id) { setSelected(null); setModal(null) }
          toast2('Code supprimé', 'error')
        } catch {
          toast2('Erreur lors de la suppression', 'error')
        }
      }
    })
  }

  // Renouveler
  const renouveler = async (c: CodeParent) => {
    const v = VALIDITES[c.validite]
    try {
      const res = await fetch('/api/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, actif: true, dateExpiration: addDays(v?.jours || 30) }),
      })
      if (!res.ok) throw new Error()
      await chargerCodes()
      toast2(`Code renouvelé — valable encore ${v?.label} ✓`)
    } catch {
      toast2('Erreur lors du renouvellement', 'error')
    }
  }

  // Simuler envoi SMS
  const envoyerSMS = async (c: CodeParent) => {
    if (!c.parent_tel) return toast2('Aucun numéro de téléphone', 'error')
    setSending('sms-' + c.id)
    setTimeout(async () => {
      await fetch('/api/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, smsSent: true }),
      })
      await chargerCodes()
      if (selected?.id === c.id) setSelected(prev => prev ? { ...prev, sms_sent: true } : null)
      setSending(null)
      toast2(`SMS envoyé au +226 ${c.parent_tel} ✓`)
    }, 1500)
  }

  // Simuler envoi Email
  const envoyerEmail = async (c: CodeParent) => {
    if (!c.parent_email) return toast2('Aucun email renseigné', 'error')
    setSending('email-' + c.id)
    setTimeout(async () => {
      await fetch('/api/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, emailSent: true }),
      })
      await chargerCodes()
      if (selected?.id === c.id) setSelected(prev => prev ? { ...prev, email_sent: true } : null)
      setSending(null)
      toast2(`Email envoyé à ${c.parent_email} ✓`)
    }, 1500)
  }

  const statutCode = (c: CodeParent) => {
    if (!c.actif) return { label:'Désactivé', color:'#888', bg:'#f3f4f6' }
    if (isExpired(c.date_expiration)) return { label:'Expiré', color:'#dc2626', bg:'#fef2f2' }
    return { label:'Actif', color:'#059669', bg:'#f0fdf4' }
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <Confirm msg={confirm.msg} onOui={confirm.onOui} onNon={() => setConfirm(null)} />}

      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#1a1a2e', margin:'0 0 4px' }}>🔑 Codes d'accès parents</h1>
          <p style={{ fontSize:13, color:'#888', margin:0 }}>Gérer les codes d'accès des parents</p>
        </div>
        <button style={BP} onClick={() => { setForm({ eleveId:0, parentNom:'', parentPrenom:'', parentEmail:'', parentTel:'', validite:'trimestre' }); setModal('generer') }}>
          + Générer un code
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total',      val:stats.total,    color:'#2563eb', icon:'🔑' },
          { label:'Actifs',     val:stats.actifs,   color:'#059669', icon:'✅' },
          { label:'Expirés',    val:stats.expires,  color:'#dc2626', icon:'⏰' },
          { label:'Désactivés', val:stats.inactifs, color:'#888',    icon:'🔒' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', borderLeft:`4px solid ${s.color}`, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:22 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize:24, fontWeight:700, color:s.color, margin:0 }}>{s.val}</p>
              <p style={{ fontSize:12, color:'#888', margin:0 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input
          style={{ flex:1, minWidth:200, padding:'8px 14px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, outline:'none' }}
          placeholder="Rechercher par élève, parent, code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', gap:6 }}>
          {[
            { val:'tous',    label:'Tous' },
            { val:'actif',   label:'✅ Actifs' },
            { val:'expire',  label:'⏰ Expirés' },
            { val:'inactif', label:'🔒 Désactivés' },
          ].map(f => (
            <button key={f.val} onClick={() => setFilterStatut(f.val)}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor:'pointer', border:'1px solid #e5e7eb', background: filterStatut===f.val ? '#1a1a2e' : '#fff', color: filterStatut===f.val ? '#fff' : '#666', fontWeight: filterStatut===f.val ? 600 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background:'#fff', borderRadius:14, border:'0.5px solid #e5e7eb', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        {loading
          ? <p style={{ textAlign:'center', color:'#aaa', padding:40 }}>⏳ Chargement...</p>
          : filtered.length === 0
            ? <p style={{ textAlign:'center', color:'#aaa', padding:48, fontSize:14 }}>
                {codes.length === 0 ? 'Aucun code généré pour l\'instant. Cliquez "+ Générer un code".' : 'Aucun résultat.'}
              </p>
            : <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fc' }}>
                      {['Élève','Classe','Parent','Code','Validité','Expiration','Notifs','Statut','Actions'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:600, color:'#888', borderBottom:'1px solid #eee', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const s = statutCode(c)
                      const exp = isExpired(c.date_expiration)
                      return (
                        <tr key={c.id} style={{ borderBottom:'1px solid #f3f4f6', background: i%2===0 ? '#fff' : '#fafbff', opacity: (!c.actif || exp) ? .65 : 1 }}>
                          <td style={{ padding:'11px 14px', fontWeight:600 }}>{c.eleve_prenom} {c.eleve_nom}</td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'#555', fontWeight:500 }}>{c.eleve_classe}</span>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <p style={{ margin:0, fontWeight:500 }}>{c.parent_prenom} {c.parent_nom}</p>
                            <p style={{ margin:0, fontSize:11, color:'#888' }}>
                              {c.parent_tel && `📱 ${c.parent_tel}`}
                              {c.parent_email && ` ✉️ ${c.parent_email}`}
                            </p>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <code style={{ fontSize:16, fontWeight:700, letterSpacing:3, background:'#f3f4f6', padding:'3px 10px', borderRadius:6, cursor:'pointer' }}
                              onClick={() => { setSelected(c); setModal('detail') }}>
                              {c.code}
                            </code>
                          </td>
                          <td style={{ padding:'11px 14px', fontSize:12, color: VALIDITES[c.validite]?.couleur || '#888', fontWeight:500 }}>
                            {VALIDITES[c.validite]?.label || c.validite}
                          </td>
                          <td style={{ padding:'11px 14px', fontSize:12, color: exp ? '#dc2626' : '#666', fontWeight: exp ? 600 : 400 }}>
                            {formatDate(c.date_expiration)}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex', gap:4 }}>
                              <span title="SMS" style={{ fontSize:14, opacity: c.sms_sent ? 1 : .25 }}>📱</span>
                              <span title="Email" style={{ fontSize:14, opacity: c.email_sent ? 1 : .25 }}>✉️</span>
                            </div>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{s.label}</span>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                              <button style={BE} onClick={() => { setSelected(c); setModal('detail') }}>👁️</button>
                              <button style={c.actif ? BD : BG} onClick={() => toggleActif(c)}>
                                {c.actif ? '🔒' : '🔓'}
                              </button>
                              {(exp || !c.actif) && <button style={BG} onClick={() => renouveler(c)}>🔄</button>}
                              <button style={BD} onClick={() => supprimer(c)}>🗑️</button>
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

      {/* ── MODAL GÉNÉRER ── */}
      {modal === 'generer' && (
        <Modal title="Générer un code d'accès parent" onClose={() => setModal(null)}>
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
            <p style={{ fontSize:12, color:'#1d4ed8', margin:0 }}>
              🔒 Le code sera lié uniquement à l'élève sélectionné. Un parent ne peut pas accéder aux données d'un autre élève.
            </p>
          </div>

          <F label="Élève concerné *">
            <select style={IN} value={form.eleveId} onChange={e => setForm({ ...form, eleveId: parseInt(e.target.value) })}>
              <option value={0}>Sélectionner un élève...</option>
              {ELEVES_DEMO.map(e => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.classe} ({e.matricule})</option>
              ))}
            </select>
          </F>

          <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:14, marginBottom:4 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:10 }}>INFORMATIONS DU PARENT</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <F label="Prénom *">
                <input style={IN} value={form.parentPrenom} onChange={e => setForm({ ...form, parentPrenom: e.target.value })} placeholder="Amadou"/>
              </F>
              <F label="Nom *">
                <input style={IN} value={form.parentNom} onChange={e => setForm({ ...form, parentNom: e.target.value })} placeholder="TRAORE"/>
              </F>
            </div>
            <F label="Téléphone (SMS)">
              <div style={{ display:'flex' }}>
                <span style={{ padding:'9px 10px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRight:'none', borderRadius:'8px 0 0 8px', fontSize:13, color:'#666' }}>+226</span>
                <input style={{ ...IN, borderRadius:'0 8px 8px 0', flex:1 }} type="tel" value={form.parentTel} onChange={e => setForm({ ...form, parentTel: e.target.value })} placeholder="70 XX XX XX"/>
              </div>
            </F>
            <F label="Email">
              <input style={IN} type="email" value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@email.com"/>
            </F>
          </div>

          <F label="Durée de validité *">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {Object.entries(VALIDITES).map(([k, v]) => (
                <label key={k} onClick={() => setForm({ ...form, validite: k })}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, cursor:'pointer', border: form.validite===k ? `2px solid ${v.couleur}` : '1px solid #e5e7eb', background: form.validite===k ? v.couleur+'10' : '#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${form.validite===k ? v.couleur : '#ccc'}`, background: form.validite===k ? v.couleur : 'transparent' }}/>
                    <div>
                      <p style={{ margin:0, fontWeight:600, fontSize:13, color: form.validite===k ? v.couleur : '#1a1a2e' }}>{v.label}</p>
                      <p style={{ margin:0, fontSize:11, color:'#888' }}>{v.jours} jours</p>
                    </div>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color: form.validite===k ? v.couleur : '#888' }}>{v.prix.toLocaleString()} FCFA</span>
                </label>
              ))}
            </div>
          </F>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setModal(null)} style={{ padding:'9px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', fontSize:13 }}>Annuler</button>
            <button onClick={generer} disabled={saving}
              style={{ ...BP, background: saving ? '#93c5fd' : '#1a1a2e', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Génération...' : '🔑 Générer le code'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL DÉTAIL ── */}
      {modal === 'detail' && selected && (
        <Modal title="Détail du code d'accès" onClose={() => { setModal(null); setSelected(null) }}>
          <div style={{ background:'linear-gradient(135deg,#1a1a2e,#2563eb)', borderRadius:14, padding:'20px 24px', marginBottom:20, textAlign:'center' }}>
            <p style={{ margin:'0 0 8px', fontSize:12, color:'rgba(255,255,255,.7)' }}>Code d'accès</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:10 }}>
              {selected.code.split('').map((d, i) => (
                <div key={i} style={{ width:42, height:50, background:'rgba(255,255,255,.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff' }}>
                  {d}
                </div>
              ))}
            </div>
            <span style={{ padding:'4px 14px', borderRadius:99, fontSize:12, fontWeight:600, background:'rgba(255,255,255,.2)', color:'#fff' }}>
              {statutCode(selected).label}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              { label:'Élève',     val:`${selected.eleve_prenom} ${selected.eleve_nom}` },
              { label:'Classe',    val:selected.eleve_classe },
              { label:'Matricule', val:selected.eleve_matricule },
              { label:'Parent',    val:`${selected.parent_prenom} ${selected.parent_nom}` },
              { label:'Validité',  val:VALIDITES[selected.validite]?.label || selected.validite },
              { label:'Expire le', val:formatDate(selected.date_expiration) },
            ].map(item => (
              <div key={item.label} style={{ background:'#f8f9ff', borderRadius:8, padding:'8px 12px' }}>
                <p style={{ margin:0, fontSize:11, color:'#888' }}>{item.label}</p>
                <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* SMS */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:14, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:0, fontWeight:600, fontSize:13 }}>📱 Envoi SMS</p>
                <p style={{ margin:0, fontSize:12, color:'#888' }}>{selected.parent_tel ? `+226 ${selected.parent_tel}` : 'Aucun numéro'}</p>
              </div>
              {selected.sms_sent
                ? <span style={{ padding:'4px 12px', borderRadius:99, background:'#f0fdf4', color:'#059669', fontSize:12, fontWeight:600 }}>✓ Envoyé</span>
                : <button onClick={() => envoyerSMS(selected)} disabled={sending==='sms-'+selected.id || !selected.parent_tel}
                    style={{ ...BP, fontSize:12, padding:'7px 14px', background: sending==='sms-'+selected.id ? '#93c5fd' : '#1a1a2e' }}>
                    {sending==='sms-'+selected.id ? '⏳...' : 'Envoyer SMS'}
                  </button>
              }
            </div>
          </div>

          {/* Email */}
          <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:14, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ margin:0, fontWeight:600, fontSize:13 }}>✉️ Envoi Email</p>
                <p style={{ margin:0, fontSize:12, color:'#888' }}>{selected.parent_email || 'Aucun email'}</p>
              </div>
              {selected.email_sent
                ? <span style={{ padding:'4px 12px', borderRadius:99, background:'#f0fdf4', color:'#059669', fontSize:12, fontWeight:600 }}>✓ Envoyé</span>
                : <button onClick={() => envoyerEmail(selected)} disabled={sending==='email-'+selected.id || !selected.parent_email}
                    style={{ ...BP, fontSize:12, padding:'7px 14px', background: sending==='email-'+selected.id ? '#93c5fd' : '#1a1a2e' }}>
                    {sending==='email-'+selected.id ? '⏳...' : 'Envoyer email'}
                  </button>
              }
            </div>
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button style={{ ...BP, flex:1, background: selected.actif ? '#dc2626' : '#059669' }} onClick={() => toggleActif(selected)}>
              {selected.actif ? '🔒 Désactiver' : '🔓 Activer'}
            </button>
            {(isExpired(selected.date_expiration) || !selected.actif) && (
              <button style={{ ...BP, flex:1, background:'#7c3aed' }} onClick={() => renouveler(selected)}>
                🔄 Renouveler
              </button>
            )}
            <button style={{ ...BD, flex:1, padding:9 }} onClick={() => supprimer(selected)}>
              🗑️ Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminCodes
