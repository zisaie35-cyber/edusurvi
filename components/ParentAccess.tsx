'use client'

import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeParent {
  id: string
  code: string
  eleveId: number
  eleveNom: string
  elevePrenom: string
  eleveMatricule: string
  eleveClasse: string
  parentNom: string
  parentPrenom: string
  parentEmail: string
  parentTel: string
  validite: 'semaine' | 'mois' | 'trimestre' | 'annee'
  dateCreation: string
  dateExpiration: string
  actif: boolean
  smsSent: boolean
  emailSent: boolean
}

interface Eleve {
  id: number
  nom: string
  prenom: string
  matricule: string
  classe: string
}

// ─── Données démo ─────────────────────────────────────────────────────────────
const ELEVES_DEMO: Eleve[] = [
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

const VALIDITES = {
  semaine:   { label:'1 semaine',   jours:7,   prix:500,   couleur:'#0891b2' },
  mois:      { label:'1 mois',      jours:30,  prix:1500,  couleur:'#2563eb' },
  trimestre: { label:'1 trimestre', jours:90,  prix:3500,  couleur:'#7c3aed' },
  annee:     { label:'1 an',        jours:365, prix:10000, couleur:'#059669' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useLS<T>(k: string, i: T): [T, (v: T) => void] {
  const [s, ss] = useState<T>(() => {
    if (typeof window === 'undefined') return i
    try { const x = localStorage.getItem('edu_' + k); return x ? JSON.parse(x) : i } catch { return i }
  })
  const set = (v: T) => { ss(v); if (typeof window !== 'undefined') localStorage.setItem('edu_' + k, JSON.stringify(v)) }
  return [s, set]
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function isExpired(dateExp: string): boolean {
  return new Date(dateExp) < new Date()
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: string }) {
  return (
    <div style={{
      position:'fixed', top:20, right:20, zIndex:9999,
      background: type==='success' ? '#059669' : type==='error' ? '#dc2626' : '#2563eb',
      color:'#fff', padding:'12px 20px', borderRadius:12,
      fontSize:14, fontWeight:500, boxShadow:'0 8px 24px rgba(0,0,0,.2)',
      maxWidth:360,
    }}>
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

// ─── COMPOSANT ADMIN CODES ────────────────────────────────────────────────────
export function AdminCodes() {
  const [codes, setCodes] = useLS<CodeParent[]>('codes_parents', [])
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [modal, setModal] = useState<'generer' | 'detail' | null>(null)
  const [selected, setSelected] = useState<CodeParent | null>(null)
  const [toast, setToast] = useState<any>(null)
  const [confirm, setConfirm] = useState<any>(null)
  const [sending, setSending] = useState<string | null>(null)

  // Formulaire génération
  const [form, setForm] = useState({
    eleveId: 0,
    parentNom: '',
    parentPrenom: '',
    parentEmail: '',
    parentTel: '',
    validite: 'trimestre' as keyof typeof VALIDITES,
  })

  const toast2 = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtrage
  const filtered = useMemo(() => {
    return codes
      .filter(c => {
        const txt = `${c.eleveNom} ${c.elevePrenom} ${c.code} ${c.eleveClasse} ${c.parentNom} ${c.parentPrenom}`.toLowerCase()
        if (!txt.includes(search.toLowerCase())) return false
        if (filterStatut === 'actif') return c.actif && !isExpired(c.dateExpiration)
        if (filterStatut === 'expire') return isExpired(c.dateExpiration)
        if (filterStatut === 'inactif') return !c.actif
        return true
      })
      .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation))
  }, [codes, search, filterStatut])

  // Stats
  const stats = useMemo(() => ({
    total: codes.length,
    actifs: codes.filter(c => c.actif && !isExpired(c.dateExpiration)).length,
    expires: codes.filter(c => isExpired(c.dateExpiration)).length,
    inactifs: codes.filter(c => !c.actif).length,
  }), [codes])

  // Générer un code
  const generer = () => {
    if (!form.eleveId) return toast2('Sélectionner un élève', 'error')
    if (!form.parentNom || !form.parentPrenom) return toast2('Nom et prénom du parent requis', 'error')
    if (!form.parentEmail && !form.parentTel) return toast2('Email ou téléphone requis pour envoyer le code', 'error')

    const eleve = ELEVES_DEMO.find(e => e.id === form.eleveId)
    if (!eleve) return toast2('Élève introuvable', 'error')

    const v = VALIDITES[form.validite]
    const newCode: CodeParent = {
      id: `code-${Date.now()}`,
      code: genCode(),
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
      dateCreation: new Date().toISOString().split('T')[0],
      dateExpiration: addDays(v.jours),
      actif: true,
      smsSent: false,
      emailSent: false,
    }

    setCodes([newCode, ...codes])
    setModal(null)
    setForm({ eleveId:0, parentNom:'', parentPrenom:'', parentEmail:'', parentTel:'', validite:'trimestre' })

    // Afficher le code généré
    setSelected(newCode)
    setModal('detail')
    toast2(`Code ${newCode.code} généré pour ${eleve.prenom} ${eleve.nom} ✓`)
  }

  // Activer / Désactiver
  const toggleActif = (id: string) => {
    const c = codes.find(x => x.id === id)
    if (!c) return
    const action = c.actif ? 'désactiver' : 'activer'
    setConfirm({
      msg: `Voulez-vous ${action} le code ${c.code} de ${c.parentPrenom} ${c.parentNom} (${c.elevePrenom} ${c.eleveNom}) ?`,
      onOui: () => {
        setCodes(codes.map(x => x.id === id ? { ...x, actif: !x.actif } : x))
        toast2(`Code ${c.actif ? 'désactivé' : 'activé'} ✓`)
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, actif: !prev.actif } : null)
        setConfirm(null)
      }
    })
  }

  // Supprimer
  const supprimer = (id: string) => {
    const c = codes.find(x => x.id === id)
    setConfirm({
      msg: `Supprimer définitivement le code de ${c?.parentPrenom} ${c?.parentNom} pour ${c?.elevePrenom} ${c?.eleveNom} ?`,
      onOui: () => {
        setCodes(codes.filter(x => x.id !== id))
        toast2('Code supprimé', 'error')
        if (selected?.id === id) { setSelected(null); setModal(null) }
        setConfirm(null)
      }
    })
  }

  // Simuler envoi SMS
  const envoyerSMS = (id: string) => {
    const c = codes.find(x => x.id === id)
    if (!c?.parentTel) return toast2('Aucun numéro de téléphone renseigné', 'error')
    setSending('sms-' + id)
    setTimeout(() => {
      setCodes(codes.map(x => x.id === id ? { ...x, smsSent: true } : x))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, smsSent: true } : null)
      setSending(null)
      toast2(`SMS envoyé au +226 ${c.parentTel} ✓`)
    }, 1500)
  }

  // Simuler envoi Email
  const envoyerEmail = (id: string) => {
    const c = codes.find(x => x.id === id)
    if (!c?.parentEmail) return toast2('Aucun email renseigné', 'error')
    setSending('email-' + id)
    setTimeout(() => {
      setCodes(codes.map(x => x.id === id ? { ...x, emailSent: true } : x))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, emailSent: true } : null)
      setSending(null)
      toast2(`Email envoyé à ${c.parentEmail} ✓`)
    }, 1500)
  }

  // Renouveler
  const renouveler = (id: string) => {
    const c = codes.find(x => x.id === id)
    if (!c) return
    const v = VALIDITES[c.validite]
    setCodes(codes.map(x => x.id === id ? { ...x, actif:true, dateExpiration: addDays(v.jours) } : x))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, actif:true, dateExpiration: addDays(v.jours) } : null)
    toast2(`Code renouvelé — valable encore ${v.label} ✓`)
  }

  const statutCode = (c: CodeParent) => {
    if (!c.actif) return { label:'Désactivé', color:'#888',    bg:'#f3f4f6' }
    if (isExpired(c.dateExpiration)) return { label:'Expiré',  color:'#dc2626', bg:'#fef2f2' }
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
          <p style={{ fontSize:13, color:'#888', margin:0 }}>
            Gérer les codes d'accès des parents à l'espace de suivi de leurs enfants
          </p>
        </div>
        <button style={BP} onClick={() => { setForm({ eleveId:0, parentNom:'', parentPrenom:'', parentEmail:'', parentTel:'', validite:'trimestre' }); setModal('generer') }}>
          + Générer un code
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total', val:stats.total,    color:'#2563eb', icon:'🔑' },
          { label:'Actifs',  val:stats.actifs,   color:'#059669', icon:'✅' },
          { label:'Expirés', val:stats.expires,  color:'#dc2626', icon:'⏰' },
          { label:'Désactivés', val:stats.inactifs, color:'#888', icon:'🔒' },
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
          placeholder="Rechercher par élève, parent, code, classe..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', gap:6 }}>
          {[
            { val:'tous',     label:'Tous' },
            { val:'actif',    label:'✅ Actifs' },
            { val:'expire',   label:'⏰ Expirés' },
            { val:'inactif',  label:'🔒 Désactivés' },
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
        {filtered.length === 0
          ? <p style={{ textAlign:'center', color:'#aaa', padding:48, fontSize:14 }}>
              {codes.length === 0 ? 'Aucun code généré pour l\'instant' : 'Aucun résultat pour cette recherche'}
            </p>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8f9fc' }}>
                    {['Élève','Classe','Parent','Code','Validité','Expiration','Notifications','Statut','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:600, color:'#888', borderBottom:'1px solid #eee', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const s = statutCode(c)
                    const exp = isExpired(c.dateExpiration)
                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f3f4f6', background: i%2===0 ? '#fff' : '#fafbff', opacity: (!c.actif || exp) ? .65 : 1 }}>
                        <td style={{ padding:'11px 14px', fontWeight:600 }}>{c.elevePrenom} {c.eleveNom}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'#f3f4f6', color:'#555', fontWeight:500 }}>{c.eleveClasse}</span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <p style={{ margin:0, fontWeight:500 }}>{c.parentPrenom} {c.parentNom}</p>
                          <p style={{ margin:0, fontSize:11, color:'#888' }}>{c.parentTel && `📱 ${c.parentTel}`}{c.parentEmail && ` · ✉️ ${c.parentEmail}`}</p>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <code style={{ fontSize:16, fontWeight:700, letterSpacing:3, background:'#f3f4f6', padding:'3px 10px', borderRadius:6, cursor:'pointer' }}
                            onClick={() => { setSelected(c); setModal('detail') }}>
                            {c.code}
                          </code>
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:12, color: VALIDITES[c.validite].couleur, fontWeight:500 }}>
                          {VALIDITES[c.validite].label}
                        </td>
                        <td style={{ padding:'11px 14px', fontSize:12, color: exp ? '#dc2626' : '#666', fontWeight: exp ? 600 : 400 }}>
                          {formatDate(c.dateExpiration)}
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            <span title="SMS" style={{ fontSize:14, opacity: c.smsSent ? 1 : .3 }}>📱</span>
                            <span title="Email" style={{ fontSize:14, opacity: c.emailSent ? 1 : .3 }}>✉️</span>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>{s.label}</span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            <button style={BE} onClick={() => { setSelected(c); setModal('detail') }}>👁️</button>
                            <button style={c.actif ? BD : BG} onClick={() => toggleActif(c.id)}>
                              {c.actif ? '🔒' : '🔓'}
                            </button>
                            {(exp || !c.actif) && <button style={BG} onClick={() => renouveler(c.id)}>🔄</button>}
                            <button style={BD} onClick={() => supprimer(c.id)}>🗑️</button>
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

          <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:14, marginBottom:14 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:10 }}>INFORMATIONS DU PARENT</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <F label="Prénom du parent *">
                <input style={IN} value={form.parentPrenom} onChange={e => setForm({ ...form, parentPrenom: e.target.value })} placeholder="Amadou"/>
              </F>
              <F label="Nom du parent *">
                <input style={IN} value={form.parentNom} onChange={e => setForm({ ...form, parentNom: e.target.value })} placeholder="TRAORE"/>
              </F>
            </div>
            <F label="Numéro de téléphone (pour SMS)">
              <div style={{ display:'flex', alignItems:'center' }}>
                <span style={{ padding:'9px 10px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRight:'none', borderRadius:'8px 0 0 8px', fontSize:13, color:'#666' }}>+226</span>
                <input style={{ ...IN, borderRadius:'0 8px 8px 0', flex:1 }} type="tel" value={form.parentTel} onChange={e => setForm({ ...form, parentTel: e.target.value })} placeholder="70 XX XX XX"/>
              </div>
            </F>
            <F label="Adresse email (pour email)">
              <input style={IN} type="email" value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@email.com"/>
            </F>
          </div>

          <F label="Durée de validité *">
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(Object.entries(VALIDITES) as [keyof typeof VALIDITES, typeof VALIDITES[keyof typeof VALIDITES]][]).map(([k, v]) => (
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
            <button onClick={generer} style={BP}>🔑 Générer le code</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL DÉTAIL / ENVOI ── */}
      {modal === 'detail' && selected && (() => {
        const s = statutCode(selected)
        const exp = isExpired(selected.dateExpiration)
        return (
          <Modal title="Détail du code d'accès" onClose={() => { setModal(null); setSelected(null) }}>

            {/* Code affiché en grand */}
            <div style={{ background:'linear-gradient(135deg,#1a1a2e,#2563eb)', borderRadius:14, padding:'20px 24px', marginBottom:20, textAlign:'center' }}>
              <p style={{ margin:'0 0 6px', fontSize:12, color:'rgba(255,255,255,.7)' }}>Code d'accès</p>
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:8 }}>
                {selected.code.split('').map((d, i) => (
                  <div key={i} style={{ width:42, height:50, background:'rgba(255,255,255,.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff' }}>
                    {d}
                  </div>
                ))}
              </div>
              <span style={{ padding:'4px 14px', borderRadius:99, fontSize:12, fontWeight:600, background: s.bg+'33', color:'#fff' }}>{s.label}</span>
            </div>

            {/* Infos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[
                { label:'Élève', val:`${selected.elevePrenom} ${selected.eleveNom}` },
                { label:'Classe', val:selected.eleveClasse },
                { label:'Matricule', val:selected.eleveMatricule },
                { label:'Parent', val:`${selected.parentPrenom} ${selected.parentNom}` },
                { label:'Validité', val:VALIDITES[selected.validite].label },
                { label:'Expire le', val:formatDate(selected.dateExpiration) },
              ].map(item => (
                <div key={item.label} style={{ background:'#f8f9ff', borderRadius:8, padding:'8px 12px' }}>
                  <p style={{ margin:0, fontSize:11, color:'#888' }}>{item.label}</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* Envoi SMS */}
            <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:14, marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>📱 Envoi par SMS</p>
                  <p style={{ margin:0, fontSize:12, color:'#888' }}>
                    {selected.parentTel ? `+226 ${selected.parentTel}` : 'Aucun numéro renseigné'}
                  </p>
                </div>
                {selected.smsSent
                  ? <span style={{ padding:'4px 12px', borderRadius:99, background:'#f0fdf4', color:'#059669', fontSize:12, fontWeight:600 }}>✓ Envoyé</span>
                  : <button
                      style={{ ...BP, fontSize:12, padding:'7px 14px', background: sending==='sms-'+selected.id ? '#93c5fd' : '#1a1a2e', cursor: sending==='sms-'+selected.id ? 'not-allowed' : 'pointer' }}
                      onClick={() => envoyerSMS(selected.id)}
                      disabled={sending==='sms-'+selected.id || !selected.parentTel}
                    >
                      {sending==='sms-'+selected.id ? '⏳ Envoi...' : 'Envoyer SMS'}
                    </button>
                }
              </div>
            </div>

            {/* Envoi Email */}
            <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:14, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>✉️ Envoi par email</p>
                  <p style={{ margin:0, fontSize:12, color:'#888' }}>
                    {selected.parentEmail || 'Aucun email renseigné'}
                  </p>
                </div>
                {selected.emailSent
                  ? <span style={{ padding:'4px 12px', borderRadius:99, background:'#f0fdf4', color:'#059669', fontSize:12, fontWeight:600 }}>✓ Envoyé</span>
                  : <button
                      style={{ ...BP, fontSize:12, padding:'7px 14px', background: sending==='email-'+selected.id ? '#93c5fd' : '#1a1a2e', cursor: sending==='email-'+selected.id ? 'not-allowed' : 'pointer' }}
                      onClick={() => envoyerEmail(selected.id)}
                      disabled={sending==='email-'+selected.id || !selected.parentEmail}
                    >
                      {sending==='email-'+selected.id ? '⏳ Envoi...' : 'Envoyer email'}
                    </button>
                }
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button style={{ ...BP, flex:1, background: selected.actif ? '#dc2626' : '#059669' }} onClick={() => toggleActif(selected.id)}>
                {selected.actif ? '🔒 Désactiver' : '🔓 Activer'}
              </button>
              {(exp || !selected.actif) && (
                <button style={{ ...BP, flex:1, background:'#7c3aed' }} onClick={() => renouveler(selected.id)}>
                  🔄 Renouveler
                </button>
              )}
              <button style={{ ...BD, flex:1, padding:'9px' }} onClick={() => supprimer(selected.id)}>
                🗑️ Supprimer
              </button>
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}

// ─── PAGE PARENTS (accès par code) ───────────────────────────────────────────
export function EspaceParent() {
  const [codes] = useLS<CodeParent[]>('codes_parents', [])
  const [digits, setDigits] = useState(['','','','','',''])
  const [error, setError] = useState('')
  const [eleve, setEleve] = useState<any>(null)
  const [tab, setTab] = useState<'notes'|'devoirs'|'absences'>('notes')

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const n = [...digits]; n[i] = val.slice(-1); setDigits(n)
    if (val && i < 5) document.getElementById(`pd${i+1}`)?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) document.getElementById(`pd${i-1}`)?.focus()
  }

  const verifier = () => {
    setError('')
    const code = digits.join('')
    if (code.length !== 6) return setError('Entrez les 6 chiffres de votre code')
    const found = codes.find(c => c.code === code && c.actif && !isExpired(c.dateExpiration))
    if (!found) return setError('Code invalide, expiré ou désactivé. Contactez l\'administration.')
    setEleve(found)
  }

  // Espace connecté
  if (eleve) {
    return (
      <div style={{ minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1a1a2e,#2563eb)', color:'#fff', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>
              {eleve.elevePrenom[0]}{eleve.eleveNom[0]}
            </div>
            <div>
              <p style={{ margin:0, fontSize:16, fontWeight:700 }}>{eleve.elevePrenom} {eleve.eleveNom}</p>
              <p style={{ margin:0, fontSize:12, opacity:.8 }}>{eleve.eleveClasse} · Matricule {eleve.eleveMatricule}</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:0, fontSize:11, opacity:.7 }}>Accès valide jusqu'au</p>
              <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{formatDate(eleve.dateExpiration)}</p>
            </div>
            <button onClick={() => { setEleve(null); setDigits(['','','','','','']) }}
              style={{ padding:'7px 14px', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', borderRadius:8, color:'#fff', fontSize:12, cursor:'pointer' }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px', display:'flex', gap:4, overflowX:'auto' }}>
          {[
            { id:'notes',    label:'📝 Notes' },
            { id:'devoirs',  label:'📅 Devoirs' },
            { id:'absences', label:'⏰ Absences' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding:'13px 16px', border:'none', borderBottom: tab===t.id ? '3px solid #2563eb' : '3px solid transparent', background:'transparent', fontSize:13, fontWeight: tab===t.id ? 600 : 400, color: tab===t.id ? '#2563eb' : '#666', cursor:'pointer', whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'20px 24px', maxWidth:800, margin:'0 auto' }}>
          {tab === 'notes' && <NotesView eleve={eleve}/>}
          {tab === 'devoirs' && <DevoirsView eleve={eleve}/>}
          {tab === 'absences' && <AbsencesView/>}
        </div>
      </div>
    )
  }

  // Page saisie code
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a1a2e,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:10 }}>👨‍👩‍👧</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#1a1a2e', margin:'0 0 8px' }}>Espace Parents</h1>
          <p style={{ fontSize:13, color:'#888', margin:0, lineHeight:1.6 }}>
            Entrez votre code à 6 chiffres pour accéder au suivi scolaire de votre enfant
          </p>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
          {digits.map((d, i) => (
            <input key={i} id={`pd${i}`}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              style={{
                width:46, height:54, textAlign:'center', fontSize:22, fontWeight:700,
                border: d ? '2px solid #2563eb' : '2px solid #e5e7eb',
                borderRadius:10, outline:'none',
                background: d ? '#eff6ff' : '#fff', color:'#1a1a2e',
                transition:'all .15s',
              }}
            />
          ))}
        </div>

        {error && <p style={{ textAlign:'center', color:'#dc2626', fontSize:13, marginBottom:12, lineHeight:1.5 }}>{error}</p>}

        <button onClick={verifier}
          style={{ width:'100%', padding:13, background: digits.join('').length===6 ? '#2563eb' : '#93c5fd', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: digits.join('').length===6 ? 'pointer' : 'not-allowed', marginBottom:20 }}>
          Accéder au suivi →
        </button>

        <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:16, textAlign:'center' }}>
          <p style={{ fontSize:12, color:'#888', marginBottom:6 }}>Vous n'avez pas de code ?</p>
          <p style={{ fontSize:12, color:'#666', lineHeight:1.5 }}>Contactez l'administration de l'école. Le code vous sera envoyé par SMS ou email.</p>
        </div>

        <div style={{ marginTop:14, textAlign:'center' }}>
          <a href="/login" style={{ fontSize:12, color:'#2563eb', textDecoration:'none' }}>← Retour à la connexion</a>
        </div>
      </div>
    </div>
  )
}

// ─── Vues de l'espace parent connecté ────────────────────────────────────────
function NotesView({ eleve }: { eleve: any }) {
  const MATIERES = [
    { nom:'Mathématiques', coef:3, couleur:'#2563eb' },
    { nom:'Français',      coef:3, couleur:'#7c3aed' },
    { nom:'SVT',           coef:2, couleur:'#059669' },
    { nom:'Histoire-Géo',  coef:2, couleur:'#d97706' },
    { nom:'Anglais',       coef:2, couleur:'#0891b2' },
  ]
  const NOTES = [
    { matiere:'Mathématiques', valeur:14, typeEval:'Devoir 1', trimestre:3 },
    { matiere:'Français',      valeur:12, typeEval:'Devoir 1', trimestre:3 },
    { matiere:'SVT',           valeur:16, typeEval:'Devoir 1', trimestre:3 },
    { matiere:'Anglais',       valeur:13, typeEval:'Devoir 1', trimestre:3 },
  ]
  const moy = (NOTES.reduce((s,n)=>s+n.valeur,0)/NOTES.length).toFixed(1)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        <div style={{ background:'#eff6ff', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:'#2563eb', margin:0 }}>{moy}</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>Moyenne générale</p>
        </div>
        <div style={{ background:'#f0fdf4', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:'#059669', margin:0 }}>{NOTES.length}</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>Notes</p>
        </div>
        <div style={{ background:'#fefce8', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:'#d97706', margin:0 }}>T3</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>Trimestre</p>
        </div>
      </div>
      {MATIERES.map(m => {
        const notes = NOTES.filter(n => n.matiere === m.nom)
        if (!notes.length) return null
        const mNotes = notes.map(n=>n.valeur)
        const mMoy = (mNotes.reduce((s,v)=>s+v,0)/mNotes.length).toFixed(1)
        return (
          <div key={m.nom} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:m.couleur }}/>
                <strong style={{ fontSize:14 }}>{m.nom}</strong>
                <span style={{ fontSize:11, color:'#aaa' }}>coeff.{m.coef}</span>
              </div>
              <strong style={{ color: parseFloat(mMoy)>=10 ? '#059669' : '#dc2626' }}>{mMoy}/20</strong>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {notes.map((n,i) => (
                <div key={i} style={{ background:'#f8f9ff', borderRadius:8, padding:'6px 12px', textAlign:'center', minWidth:70 }}>
                  <p style={{ margin:0, fontSize:18, fontWeight:700, color: n.valeur>=10 ? '#2563eb' : '#dc2626' }}>{n.valeur}</p>
                  <p style={{ margin:0, fontSize:10, color:'#888' }}>{n.typeEval}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DevoirsView({ eleve }: { eleve: any }) {
  const prochains = [
    { date:'2025-05-07', matiere:'Maths', heure:'10h-12h', classes:['3e A','3e B','3e C'] },
    { date:'2025-05-09', matiere:'Français', heure:'10h-12h', classes:['3e A','3e B','3e C'] },
    { date:'2025-05-14', matiere:'IR', heure:'10h-12h', classes:['3e A','3e B','3e C'] },
  ]
  return (
    <div>
      <p style={{ fontSize:13, color:'#888', marginBottom:14 }}>Prochains devoirs — <strong>{eleve.eleveClasse}</strong></p>
      {prochains.map((d, i) => {
        const days = Math.ceil((new Date(d.date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
        return (
          <div key={i} style={{ background:'#fff', border:`1px solid ${days<=3?'#fbbf24':'#e5e7eb'}`, borderLeft:`4px solid ${days<=3?'#f59e0b':'#2563eb'}`, borderRadius:'0 12px 12px 0', padding:'12px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ minWidth:52, textAlign:'center', background: days<=3 ? '#fef3c7' : '#eff6ff', borderRadius:8, padding:'6px 8px' }}>
              <p style={{ margin:0, fontSize:20, fontWeight:700, color: days<=3 ? '#d97706' : '#2563eb' }}>
                {new Date(d.date).getDate()}
              </p>
              <p style={{ margin:0, fontSize:10, color:'#888' }}>
                {new Date(d.date).toLocaleDateString('fr-FR',{month:'short'})}
              </p>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{d.matiere}</p>
              <p style={{ margin:0, fontSize:12, color:'#888' }}>🕐 {d.heure}</p>
            </div>
            {days <= 3 && days >= 0 && (
              <span style={{ padding:'3px 10px', borderRadius:99, background:'#fef2f2', color:'#dc2626', fontSize:11, fontWeight:600 }}>
                Dans {days}j ⚠️
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AbsencesView() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        <div style={{ background:'#fef2f2', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:'#dc2626', margin:0 }}>1</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>Absences</p>
        </div>
        <div style={{ background:'#fff7ed', borderRadius:12, padding:'12px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:'#d97706', margin:0 }}>2</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>Retards</p>
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
        <p style={{ margin:'0 0 12px', fontWeight:600, fontSize:14 }}>Historique</p>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#fef2f2', color:'#dc2626', fontWeight:600 }}>Absence</span>
          <div>
            <p style={{ margin:0, fontSize:13 }}>04–05 novembre 2024</p>
            <p style={{ margin:0, fontSize:12, color:'#888' }}>Maladie · Justifiée</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0' }}>
          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:'#fff7ed', color:'#d97706', fontWeight:600 }}>Retard</span>
          <div>
            <p style={{ margin:0, fontSize:13 }}>08 octobre 2024</p>
            <p style={{ margin:0, fontSize:12, color:'#888' }}>Arrivée 08h25 · Transport · Justifié</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EspaceParent
