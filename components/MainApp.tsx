'use client'

// ─── Import de l'application complète depuis suivi_scolaire.jsx ───────────────
// Ce composant reprend toute la logique de l'application de démonstration
// et la connecte aux APIs réelles

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { authFetch } from '@/lib/apiClient'
const SaisieApp = dynamic(() => import('./SaisieApp'), { ssr: false })
const AdminClasses = dynamic(() => import('./AdminClasses'), { ssr: false })
const ProgrammeDevoirs = dynamic(() => import('./ProgrammeDevoirs'), { ssr: false })
const AdminCodes = dynamic(() => import('./ParentAccess').then(m => ({ default: m.AdminCodes })), { ssr: false })
const PointsDashboard = dynamic(() => import('./PointsModule').then(m => ({ default: m.PointsDashboard })), { ssr: false })
const AdminPoints = dynamic(() => import('./PointsModule').then(m => ({ default: m.AdminPoints })), { ssr: false })
const ManuelUtilisation = dynamic(() => import('./ManuelUtilisation'), { ssr: false })

const avg = (arr: number[]) => arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-"
const roleLabel: Record<string,string> = { admin:"Administrateur", professeur:"Professeur", surveillant:"Surveillant", eleve:"Élève" }
const roleColor: Record<string,string> = { admin:"#7c3aed", professeur:"#2563eb", surveillant:"#d97706", eleve:"#059669" }
const sanctionLabel: Record<string,string> = { avertissement:"Avertissement", retenue:"Retenue", exclusion_temp:"Exclusion temporaire", exclusion_def:"Exclusion définitive" }
const sanctionColor: Record<string,string> = { avertissement:"#d97706", retenue:"#dc2626", exclusion_temp:"#b91c1c", exclusion_def:"#7f1d1d" }

function hashId(id: string) { let h=0; for (let i=0;i<id.length;i++){h=(h*31+id.charCodeAt(i))|0} return Math.abs(h) }

// ─── Composants partagés ──────────────────────────────────────────────────────
function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 style={{fontSize:22,fontWeight:700,color:"#1a1a2e",marginBottom:24}}>{children}</h1>
}

function Card({ children, style={} }: { children: React.ReactNode, style?: any }) {
  return <div style={{background:"#fff",borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:0,...style}}>{children}</div>
}

function StatCard({ icon, label, value, color="#2563eb" }: any) {
  return (
    <div style={{background:"#fff",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",borderLeft:`4px solid ${color}`}}>
      <span style={{fontSize:28}}>{icon}</span>
      <div>
        <p style={{fontSize:28,fontWeight:700,color,margin:0}}>{value}</p>
        <p style={{fontSize:13,color:"#666",margin:0}}>{label}</p>
      </div>
    </div>
  )
}

function Badge({ label, color="#2563eb" }: any) {
  return <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:500,background:color+"22",color}}>{label}</span>
}

function Loading() {
  return <p style={{textAlign:"center",color:"#aaa",padding:60}}>⏳ Chargement...</p>
}

function EleveAvatar({ eleve, size=36 }: any) {
  const initials = `${eleve.prenom?.[0]||""}${eleve.nom?.[0]||""}`
  const colors = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"]
  const bg = colors[hashId(String(eleve.id))%colors.length]
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>
      {initials}
    </div>
  )
}

function Toast({ msg, type }: any) {
  const colors: any = { success:"#059669", error:"#dc2626" }
  return (
    <div style={{position:"fixed",top:20,right:20,color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:14,fontWeight:500,zIndex:2000,background:colors[type]||colors.success,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
      {msg}
    </div>
  )
}

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f0f0f0"}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700}}>{title}</h3>
          <button style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888"}} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"16px 20px"}}>{children}</div>
      </div>
    </div>
  )
}

function Input({ label, ...props }: any) {
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:"block",fontSize:13,fontWeight:500,color:"#444",marginBottom:5}}>{label}</label>}
      <input style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}} {...props}/>
    </div>
  )
}

function Select({ label, children, ...props }: any) {
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:"block",fontSize:13,fontWeight:500,color:"#444",marginBottom:5}}>{label}</label>}
      <select style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}} {...props}>{children}</select>
    </div>
  )
}

function Textarea({ label, ...props }: any) {
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:"block",fontSize:13,fontWeight:500,color:"#444",marginBottom:5}}>{label}</label>}
      <textarea style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box",minHeight:80}} {...props}/>
    </div>
  )
}

function TableComp({ cols, rows, emptyMsg="Aucune donnée" }: any) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
        <thead>
          <tr>{cols.map((c:any)=><th key={c.key} style={{textAlign:"left",padding:"10px 12px",fontSize:12,fontWeight:600,color:"#888",background:"#f8f9fc",borderBottom:"1px solid #eee"}}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} style={{textAlign:"center",padding:24,color:"#999"}}>{emptyMsg}</td></tr>
            : rows.map((r:any,i:number)=>(
              <tr key={i} style={{borderBottom:"1px solid #f0f0f0"}}>
                {cols.map((c:any)=><td key={c.key} style={{padding:"10px 12px",verticalAlign:"middle"}}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

// ─── Dashboards ───────────────────────────────────────────────────────────────
function AdminHome() {
  const [loading, setLoading] = useState(true)
  const [ecole, setEcole] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [eleves, setEleves] = useState<any[]>([])
  const [profs, setProfs] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [rc, re, rp, rs, ra, rec] = await Promise.all([
          authFetch('/api/classes'), authFetch('/api/eleves'), authFetch('/api/professeurs'),
          authFetch('/api/sanctions'), authFetch('/api/absences'), authFetch('/api/mon-ecole'),
        ])
        const [dc, de, dp, ds, da, dec] = await Promise.all([rc.json(), re.json(), rp.json(), rs.json(), ra.json(), rec.json()])
        if (dc.success) setClasses(dc.data || [])
        if (de.success) setEleves(de.data || [])
        if (dp.success) setProfs(dp.data || [])
        if (ds.success) setSanctions(ds.data || [])
        if (da.success) setAbsences(da.data || [])
        if (dec.success) setEcole(dec.data)
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading/>

  return (
    <div>
      <PageTitle>Tableau de bord</PageTitle>
      {ecole && (
        <p style={{marginTop:-18,marginBottom:24,fontSize:14,color:"#666"}}>
          🏫 {ecole.nom}{ecole.ville ? ` — ${ecole.ville}` : ""}{ecole.pays ? `, ${ecole.pays}` : ""}
        </p>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:24}}>
        <StatCard icon="👤" label="Élèves inscrits" value={eleves.length} color="#2563eb"/>
        <StatCard icon="👩‍🏫" label="Professeurs" value={profs.length} color="#7c3aed"/>
        <StatCard icon="🏛" label="Classes" value={classes.length} color="#059669"/>
        <StatCard icon="⚠️" label="Sanctions" value={sanctions.length} color="#d97706"/>
      </div>
      <Card>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Absences récentes</h3>
        {absences.length === 0
          ? <p style={{textAlign:"center",color:"#aaa",padding:20}}>Aucune absence enregistrée</p>
          : absences.slice(0,5).map((a:any)=>{
            const el = eleves.find((e:any)=>e.id===a.eleveId)
            return el ? (
              <div key={a.id} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                <EleveAvatar eleve={el} size={30}/>
                <div style={{marginLeft:10}}>
                  <p style={{margin:0,fontSize:13,fontWeight:500}}>{el.prenom} {el.nom}</p>
                  <p style={{margin:0,fontSize:12,color:"#888"}}>{a.dateDebut} — {a.justifiee?"Justifiée":"Non justifiée"}</p>
                </div>
              </div>
            ) : null
          })}
      </Card>
    </div>
  )
}

function ElevesPageComp({ role, showToast }: any) {
  const peutModifier = role === "admin" || role === "super_admin"
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [eleves, setEleves] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<"add"|"edit"|null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const [rc, re] = await Promise.all([authFetch('/api/classes'), authFetch('/api/eleves')])
      const [dc, de] = await Promise.all([rc.json(), re.json()])
      if (dc.success) setClasses(dc.data || [])
      if (de.success) setEleves(de.data || [])
    } catch { showToast("Erreur de chargement","error") }
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const filtered = eleves.filter((e:any) =>
    `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())
  )

  const save = async () => {
    if (!form.nom || !form.prenom || !form.matricule) return showToast("Nom, prénom et matricule requis","error")
    setSaving(true)
    try {
      const payload = {
        id: form.id, nom: form.nom, prenom: form.prenom, matricule: form.matricule,
        dateNaissance: form.dateNaissance || null, nationalite: form.nationalite,
        adresse: form.adresse, classeId: form.classeId || null,
      }
      const res = await authFetch('/api/eleves', {
        method: modal === "add" ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await charger()
      showToast(modal === "add" ? "Élève ajouté avec succès" : "Élève modifié avec succès")
      setModal(null); setForm({})
    } catch (e:any) {
      showToast(e.message || "Erreur lors de l'enregistrement","error")
    }
    setSaving(false)
  }

  const remove = async (e:any) => {
    if (!confirm(`Supprimer ${e.prenom} ${e.nom} définitivement ?`)) return
    try {
      const res = await authFetch(`/api/eleves?id=${e.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await charger()
      showToast("Élève supprimé","error")
    } catch {
      showToast("Erreur lors de la suppression","error")
    }
  }

  if (loading) return <Loading/>

  return (
    <div>
      <PageTitle>Gestion des élèves</PageTitle>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <input style={{flex:1,padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14}} placeholder="Rechercher un élève..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {peutModifier && (
          <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={()=>{setForm({nationalite:"Burkinabè"});setModal("add")}}>+ Ajouter</button>
        )}
      </div>
      <Card>
        <TableComp
          cols={[
            {key:"avatar",label:"",render:(r:any)=><EleveAvatar eleve={r} size={32}/>},
            {key:"nom",label:"Nom",render:(r:any)=><strong>{r.nom} {r.prenom}</strong>},
            {key:"matricule",label:"Matricule",render:(r:any)=><code style={{fontSize:12,background:"#f5f5f5",padding:"2px 6px",borderRadius:4}}>{r.matricule}</code>},
            {key:"classe",label:"Classe",render:(r:any)=>classes.find((c:any)=>c.id===r.classeId)?.nom||"-"},
            {key:"nationalite",label:"Nationalité"},
            ...(peutModifier ? [{key:"actions",label:"",render:(r:any)=>(
              <div style={{display:"flex",gap:6}}>
                <button style={{padding:"5px 10px",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,fontSize:12,cursor:"pointer"}} onClick={()=>{setForm(r);setModal("edit")}}>✏️</button>
                <button style={{padding:"5px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,fontSize:12,cursor:"pointer"}} onClick={()=>remove(r)}>🗑️</button>
              </div>
            )}] : []),
          ]}
          rows={filtered}
        />
      </Card>
      {modal && (
        <Modal title={modal==="add" ? "Ajouter un élève" : "Modifier l'élève"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Prénom" value={form.prenom||""} onChange={(e:any)=>setForm({...form,prenom:e.target.value})}/>
            <Input label="Nom" value={form.nom||""} onChange={(e:any)=>setForm({...form,nom:e.target.value})}/>
            <Input label="Matricule" value={form.matricule||""} onChange={(e:any)=>setForm({...form,matricule:e.target.value})}/>
            <Input label="Date de naissance" type="date" value={form.dateNaissance||""} onChange={(e:any)=>setForm({...form,dateNaissance:e.target.value})}/>
            <Select label="Classe" value={form.classeId||""} onChange={(e:any)=>setForm({...form,classeId:e.target.value})}>
              <option value="">Sans classe</option>
              {classes.map((c:any)=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
            <Input label="Nationalité" value={form.nationalite||""} onChange={(e:any)=>setForm({...form,nationalite:e.target.value})}/>
          </div>
          <Input label="Adresse" value={form.adresse||""} onChange={(e:any)=>setForm({...form,adresse:e.target.value})}/>
          <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
            <button style={{padding:"9px 20px",background:"#fff",color:"#444",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer"}} onClick={()=>setModal(null)}>Annuler</button>
            <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}} onClick={save} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SanctionsPageComp({ showToast }: any) {
  const [loading, setLoading] = useState(true)
  const [eleves, setEleves] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ eleveId:"", type:"avertissement", motif:"", description:"", dateDebut:"", dateFin:"" })
  const [saving, setSaving] = useState(false)

  const charger = async () => {
    setLoading(true)
    try {
      const [re, rs] = await Promise.all([authFetch('/api/eleves'), authFetch('/api/sanctions')])
      const [de, ds] = await Promise.all([re.json(), rs.json()])
      if (de.success) setEleves(de.data || [])
      if (ds.success) setSanctions(ds.data || [])
    } catch { showToast("Erreur de chargement","error") }
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const save = async () => {
    if (!form.eleveId || !form.motif || !form.dateDebut) return showToast("Champs requis manquants","error")
    setSaving(true)
    try {
      const res = await authFetch('/api/sanctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await charger()
      showToast("Sanction enregistrée")
      setModal(false)
      setForm({ eleveId:"", type:"avertissement", motif:"", description:"", dateDebut:"", dateFin:"" })
    } catch (e:any) {
      showToast(e.message || "Erreur lors de l'enregistrement","error")
    }
    setSaving(false)
  }

  if (loading) return <Loading/>

  return (
    <div>
      <PageTitle>Sanctions disciplinaires</PageTitle>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={()=>setModal(true)}>+ Nouvelle sanction</button>
      </div>
      <Card>
        <TableComp
          cols={[
            {key:"el",label:"Élève",render:(r:any)=>{const el=eleves.find((e:any)=>e.id===r.eleveId);return el?`${el.prenom} ${el.nom}`:"-"}},
            {key:"type",label:"Type",render:(r:any)=><Badge label={sanctionLabel[r.type]||r.type} color={sanctionColor[r.type]||"#888"}/>},
            {key:"motif",label:"Motif"},
            {key:"dateDebut",label:"Date"},
          ]}
          rows={sanctions}
          emptyMsg="Aucune sanction enregistrée"
        />
      </Card>
      {modal && (
        <Modal title="Nouvelle sanction" onClose={()=>setModal(false)}>
          <Select label="Élève" value={form.eleveId} onChange={(e:any)=>setForm({...form,eleveId:e.target.value})}>
            <option value="">Sélectionner un élève</option>
            {eleves.map((e:any)=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
          </Select>
          <Select label="Type" value={form.type} onChange={(e:any)=>setForm({...form,type:e.target.value})}>
            <option value="avertissement">Avertissement</option>
            <option value="retenue">Retenue</option>
            <option value="exclusion_temp">Exclusion temporaire</option>
            <option value="exclusion_def">Exclusion définitive</option>
          </Select>
          <Input label="Motif" value={form.motif} onChange={(e:any)=>setForm({...form,motif:e.target.value})}/>
          <Textarea label="Description" value={form.description} onChange={(e:any)=>setForm({...form,description:e.target.value})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Date début" type="date" value={form.dateDebut} onChange={(e:any)=>setForm({...form,dateDebut:e.target.value})}/>
            <Input label="Date fin (optionnel)" type="date" value={form.dateFin} onChange={(e:any)=>setForm({...form,dateFin:e.target.value})}/>
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
            <button style={{padding:"9px 20px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer"}} onClick={()=>setModal(false)}>Annuler</button>
            <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}} onClick={save} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function DisciplinePage() {
  const [loading, setLoading] = useState(true)
  const [eleves, setEleves] = useState<any[]>([])
  const [sanctions, setSanctions] = useState<any[]>([])
  const [retards, setRetards] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [re, rs, rr, ra] = await Promise.all([
          authFetch('/api/eleves'), authFetch('/api/sanctions'), authFetch('/api/retards'), authFetch('/api/absences'),
        ])
        const [de, ds, dr, da] = await Promise.all([re.json(), rs.json(), rr.json(), ra.json()])
        if (de.success) setEleves(de.data || [])
        if (ds.success) setSanctions(ds.data || [])
        if (dr.success) setRetards(dr.data || [])
        if (da.success) setAbsences(da.data || [])
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading/>

  return (
    <div>
      <PageTitle>Discipline</PageTitle>
      <div className="stat-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        <StatCard icon="⚠️" label="Sanctions" value={sanctions.length} color="#d97706"/>
        <StatCard icon="⏰" label="Retards" value={retards.length} color="#dc2626"/>
        <StatCard icon="📅" label="Absences" value={absences.length} color="#7c3aed"/>
      </div>
      <Card>
        <TableComp
          cols={[
            {key:"el",label:"Élève",render:(r:any)=>{const el=eleves.find((e:any)=>e.id===r.eleveId);return el?`${el.prenom} ${el.nom}`:"-"}},
            {key:"type",label:"Type",render:(r:any)=><Badge label={sanctionLabel[r.type]||r.type} color={sanctionColor[r.type]||"#888"}/>},
            {key:"motif",label:"Motif"},
            {key:"dateDebut",label:"Date"},
          ]}
          rows={sanctions}
          emptyMsg="Aucune sanction"
        />
      </Card>
    </div>
  )
}

function EleveHome() {
  const [loading, setLoading] = useState(true)
  const [ecole, setEcole] = useState<any>(null)
  const [eleve, setEleve] = useState<any>(null)
  const [classe, setClasse] = useState<any>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [retards, setRetards] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [re, rn, ra, rr, rc, rec] = await Promise.all([
          authFetch('/api/eleves'), authFetch('/api/notes'), authFetch('/api/absences'), authFetch('/api/retards'), authFetch('/api/classes'), authFetch('/api/mon-ecole'),
        ])
        const [de, dn, da, dr, dc, dec] = await Promise.all([re.json(), rn.json(), ra.json(), rr.json(), rc.json(), rec.json()])
        const moi = de.success ? (de.data || [])[0] || null : null
        setEleve(moi)
        if (dn.success) setNotes(dn.data || [])
        if (da.success) setAbsences(da.data || [])
        if (dr.success) setRetards(dr.data || [])
        if (dc.success && moi) setClasse((dc.data || []).find((c:any)=>c.id===moi.classeId) || null)
        if (dec.success) setEcole(dec.data)
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading/>
  if (!eleve) return <p>Profil introuvable</p>

  return (
    <div>
      {ecole && (
        <p style={{margin:"0 0 12px",fontSize:14,color:"#666"}}>
          🏫 {ecole.nom}{ecole.ville ? ` — ${ecole.ville}` : ""}{ecole.pays ? `, ${ecole.pays}` : ""}
        </p>
      )}
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28,background:"linear-gradient(135deg,#1a1a2e,#2563eb)",borderRadius:16,padding:"24px 28px",color:"#fff"}}>
        <EleveAvatar eleve={eleve} size={56}/>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700}}>{eleve.prenom} {eleve.nom}</h1>
          <p style={{margin:0,opacity:0.8,fontSize:14}}>{classe?.nom || "Sans classe"} · Matricule {eleve.matricule}</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16}}>
        <StatCard icon="📊" label="Moyenne générale" value={`${avg(notes.map((n:any)=>n.valeur))}/20`} color="#2563eb"/>
        <StatCard icon="📝" label="Notes" value={notes.length} color="#7c3aed"/>
        <StatCard icon="📅" label="Absences" value={absences.length} color="#dc2626"/>
        <StatCard icon="⏰" label="Retards" value={retards.length} color="#d97706"/>
      </div>
    </div>
  )
}

function MesNotesPage() {
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<any[]>([])
  const [matieres, setMatieres] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [rn, rm] = await Promise.all([authFetch('/api/notes'), authFetch('/api/matieres')])
        const [dn, dm] = await Promise.all([rn.json(), rm.json()])
        if (dn.success) setNotes(dn.data || [])
        if (dm.success) setMatieres(dm.data || [])
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <Loading/>

  const matieresAvecNotes = matieres.filter((m:any)=>notes.some((n:any)=>n.matiereId===m.id))

  return (
    <div>
      <PageTitle>Mes notes</PageTitle>
      {matieresAvecNotes.length === 0 && <p style={{textAlign:"center",color:"#aaa",padding:40}}>Aucune note pour l'instant</p>}
      {matieresAvecNotes.map((m:any)=>{
        const mNotes = notes.filter((n:any)=>n.matiereId===m.id)
        return (
          <Card key={m.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:m.couleur}}/>
                <strong>{m.nom}</strong>
                <span style={{fontSize:12,color:"#888"}}>coeff. {m.coefficient}</span>
              </div>
              <strong style={{color:parseFloat(avg(mNotes.map((n:any)=>n.valeur)))>=10?"#059669":"#dc2626"}}>{avg(mNotes.map((n:any)=>n.valeur))}/20</strong>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {mNotes.map((n:any,i:number)=>(
                <div key={i} style={{background:"#f8f9ff",borderRadius:8,padding:"8px 14px",textAlign:"center",minWidth:80}}>
                  <p style={{margin:0,fontSize:18,fontWeight:700,color:n.valeur>=10?"#2563eb":"#dc2626"}}>{n.valeur}</p>
                  <p style={{margin:0,fontSize:11,color:"#888"}}>{n.typeEval}</p>
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function getNavItems(role: string) {
  const all: Record<string, any[]> = {
    admin: [
      {id:"home",          icon:"📊", label:"Tableau de bord"},
      {id:"eleves",        icon:"👤", label:"Élèves"},
      {id:"classes",       icon:"🏛", label:"Classes & Profs"},
      {id:"devoirs",       icon:"📅", label:"Programme devoirs"},
      {id:"discipline",    icon:"⚠️", label:"Discipline"},
      {id:"codes_parents", icon:"🔑", label:"Codes parents"},
      {id:"admin_points",  icon:"🏆", label:"Points & Récompenses"},
      {id:"manuel",        icon:"📖", label:"Manuel d'utilisation"},
    ],
    professeur: [
      {id:"home",          icon:"📊", label:"Tableau de bord"},
      {id:"saisie_notes",  icon:"📝", label:"Saisie des notes"},
      {id:"devoirs",       icon:"📅", label:"Programme devoirs"},
      {id:"eleves",        icon:"👤", label:"Mes élèves"},
      {id:"mes_points",    icon:"🏆", label:"Mes points"},
      {id:"manuel",        icon:"📖", label:"Manuel d'utilisation"},
    ],
    surveillant: [
      {id:"home",          icon:"📊", label:"Tableau de bord"},
      {id:"absences",      icon:"📅", label:"Absences / Retards"},
      {id:"eleves",        icon:"👤", label:"Élèves"},
      {id:"sanctions",     icon:"⚠️", label:"Sanctions"},
      {id:"mes_points",    icon:"🏆", label:"Mes points"},
      {id:"manuel",        icon:"📖", label:"Manuel d'utilisation"},
    ],
    eleve: [
      {id:"home",         icon:"📊", label:"Mon espace"},
      {id:"notes",        icon:"📝", label:"Mes notes"},
      {id:"devoirs",      icon:"📅", label:"Programme devoirs"},
      {id:"mon_assiduite",icon:"⏰", label:"Assiduité"},
      {id:"manuel",       icon:"📖", label:"Manuel d'utilisation"},
    ],
  }
  return all[role] || []
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function MainApp({ initialUser, superAdminEcoleNom, onExitEcole }: { initialUser: any, superAdminEcoleNom?: string, onExitEcole?: () => void }) {
  const router = useRouter()
  const [session] = useState(initialUser)
  const [page, setPage] = useState("home")
  const [sideOpen, setSideOpen] = useState(true)

  // Sidebar repliée par défaut sur petit écran (mobile / app Android) pour
  // laisser la place au contenu — l'utilisateur peut toujours la déplier.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) setSideOpen(false)
  }, [])
  const [toast, setToast] = useState<any>(null)

  const showToast = (msg: string, type="success") => {
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    localStorage.removeItem('activeEcoleId')
    localStorage.removeItem('activeEcoleNom')
    router.push('/login')
  }

  const navItems = getNavItems(session.role)

  const renderPage = () => {
    if (page === "home") {
      if (session.role === "eleve") return <EleveHome/>
      return <AdminHome/>
    }
    if (page === "eleves") return <ElevesPageComp role={session.role} showToast={showToast}/>
    if (page === "saisie_notes") return <SaisieApp role="professeur"/>
    if (page === "absences") return <SaisieApp role="surveillant"/>
    if (page === "devoirs") return <ProgrammeDevoirs role={session.role} />
    if (page === "codes_parents") return <AdminCodes />
    if (page === "mes_points") return <PointsDashboard session={session} />
    if (page === "admin_points") return <AdminPoints />
    if (page === "mon_assiduite") return <div style={{padding:24,textAlign:"center",color:"#888"}}><p style={{fontSize:32}}>⏰</p><p>Assiduité — disponible prochainement</p></div>
    if (page === "sanctions") return <SanctionsPageComp showToast={showToast}/>
    if (page === "classes") return <AdminClasses />
    if (page === "manuel") return <ManuelUtilisation role={session.role} />
    if (page === "discipline") return <DisciplinePage/>
    if (page === "notes") return <MesNotesPage/>
    return <AdminHome/>
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {/* Sidebar */}
      <aside className="app-sidebar" style={{background:"#1a1a2e",display:"flex",flexDirection:"column",flexShrink:0,width:sideOpen?220:64,transition:"width 0.2s",overflow:"hidden"}}>
        <div style={{padding:"20px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          {sideOpen && <span style={{color:"#fff",fontWeight:800,fontSize:16,whiteSpace:"nowrap"}}>🏫 EduSuivi</span>}
          <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:12,padding:"4px 6px"}} onClick={()=>setSideOpen(!sideOpen)}>
            {sideOpen?"◀":"▶"}
          </button>
        </div>
        <nav style={{flex:1}}>
          {navItems.map((item:any)=>(
            <button key={item.id}
              style={{display:"flex",alignItems:"center",padding:"10px 16px",width:"100%",background:page===item.id?"rgba(37,99,235,0.35)":"none",border:"none",borderRight:page===item.id?"3px solid #2563eb":"none",color:page===item.id?"#fff":"rgba(255,255,255,0.65)",cursor:"pointer",textAlign:"left",whiteSpace:"nowrap",overflow:"hidden"}}
              onClick={()=>setPage(item.id)}
              title={item.label}>
              <span style={{fontSize:18}}>{item.icon}</span>
              {sideOpen && <span style={{marginLeft:10,fontSize:14}}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          {superAdminEcoleNom && (
            <div style={{marginBottom:10,padding:"8px 10px",background:"rgba(124,58,237,0.25)",border:"1px solid rgba(124,58,237,0.5)",borderRadius:8}}>
              {sideOpen && <p style={{margin:"0 0 6px",fontSize:11,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>🏢 {superAdminEcoleNom}</p>}
              <button
                onClick={onExitEcole}
                title="Retour Super Admin"
                style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",cursor:"pointer",fontSize:12,padding:"6px 8px",borderRadius:6,width:"100%"}}>
                <span>↩️</span>{sideOpen&&" Retour Super Admin"}
              </button>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:roleColor[session.role],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>
              {session.prenom?.[0]}{session.nom?.[0]}
            </div>
            {sideOpen && <div>
              <p style={{fontSize:13,fontWeight:600,margin:0,color:"#fff"}}>{session.prenom} {session.nom}</p>
              <p style={{fontSize:11,color:"#888",margin:0}}>{roleLabel[session.role]}</p>
            </div>}
          </div>
          <button style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:13,padding:"6px 8px",borderRadius:8,width:"100%"}} onClick={logout}>
            <span>🚪</span>{sideOpen&&" Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="app-main" style={{flex:1,padding:"28px 32px",overflow:"auto",background:"#f4f6fb",minWidth:0}}>
        {renderPage()}
      </main>
    </div>
  )
}
