'use client'

import { useState, useMemo, useEffect } from 'react'
import { authFetch } from '@/lib/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Classe { id: string; nom: string; niveau: string }

interface Devoir {
  id: string
  date: string        // "2025-04-03"
  matiere: string
  classes: string[]   // ids de classes réelles
  heureDebut: string  // "10:00"
  heureFin: string    // "12:00"
  professeur: string
  trimestre: number
  anneeId: string
  type: "devoir" | "composition" | "examen" | "sortie" | "autre"
  note?: string       // remarque optionnelle
}

const MATIERES_LIST = ["Français","Maths","Anglais","Histoire-Géo","SVT","PC","IR","TIC","EC","Philo","Philo-PC","SVT-Philo","TIC-EC","EC-IR","Oral d'anglais","Examen Spécial G9","Composition","Sortie récréative","Autre"]

const TYPE_CONFIG: Record<string, {label:string, color:string, bg:string}> = {
  devoir:      {label:"Devoir",      color:"#2563eb", bg:"#eff6ff"},
  composition: {label:"Composition", color:"#7c3aed", bg:"#f5f3ff"},
  examen:      {label:"Examen",      color:"#dc2626", bg:"#fef2f2"},
  sortie:      {label:"Sortie",      color:"#059669", bg:"#f0fdf4"},
  autre:       {label:"Autre",       color:"#888",    bg:"#f9f9f9"},
}

function jToDate(d:string){
  const [y,m,j]=d.split("-")
  return new Date(parseInt(y),parseInt(m)-1,parseInt(j))
}

function formatDate(d:string){
  const dt=jToDate(d)
  return dt.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
}

function daysUntil(d:string){
  const today=new Date(); today.setHours(0,0,0,0)
  const target=jToDate(d)
  return Math.ceil((target.getTime()-today.getTime())/(1000*60*60*24))
}

function AlertBadge({days}:{days:number}){
  if(days<0) return <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#f3f4f6",color:"#aaa",fontWeight:500}}>Passé</span>
  if(days===0) return <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#fef3c7",color:"#b45309",fontWeight:600,animation:"pulse 1s infinite"}}>Aujourd'hui !</span>
  if(days<=3) return <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#fef2f2",color:"#dc2626",fontWeight:600}}>Dans {days}j ⚠️</span>
  if(days<=7) return <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#fff7ed",color:"#d97706",fontWeight:500}}>Dans {days}j</span>
  return <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,background:"#f0fdf4",color:"#059669",fontWeight:500}}>Dans {days}j</span>
}

function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:React.ReactNode}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f0f0f0",position:"sticky",top:0,background:"#fff"}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

function Confirm({msg,onOui,onNon}:{msg:string,onOui:()=>void,onNon:()=>void}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:360,width:"90%"}}>
        <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗑️</div>
        <p style={{textAlign:"center",fontSize:14,marginBottom:24}}>{msg}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onNon} style={{flex:1,padding:10,border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",cursor:"pointer"}}>Annuler</button>
          <button onClick={onOui} style={{flex:1,padding:10,border:"none",borderRadius:8,background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:600}}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

function Toast({msg,type}:{msg:string,type:string}){
  return(
    <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:type==="success"?"#059669":"#dc2626",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
      {msg}
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function ProgrammeDevoirs({ role="eleve" }: { role?: string }) {
  const [loading, setLoading] = useState(true)
  const [devoirs, setDevoirs] = useState<Devoir[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [monClasseId, setMonClasseId] = useState<string|null>(null)
  const [filterNiveau, setFilterNiveau] = useState("Tous")
  const [filterClasse, setFilterClasse] = useState("Toutes")
  const [filterType, setFilterType] = useState("Tous")
  const [viewMode, setViewMode] = useState<"liste"|"calendrier">("liste")
  const [modal, setModal] = useState<"add"|"edit"|null>(null)
  const [confirm, setConfirm] = useState<any>(null)
  const [toast, setToast] = useState<any>(null)
  const [form, setForm] = useState<Partial<Devoir>>({})
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const canEdit = role === "professeur" || role === "admin" || role === "super_admin"
  const niveaux = useMemo(() => [...new Set(classes.map(c=>c.niveau))], [classes])

  const toast2 = (msg:string,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  const charger = async () => {
    setLoading(true)
    try {
      const reqs = [authFetch('/api/devoirs'), authFetch('/api/classes')]
      if (role === "eleve") reqs.push(authFetch('/api/eleves'))
      const [rd, rc, re] = await Promise.all(reqs)
      const [dd, dc, de] = await Promise.all([rd.json(), rc.json(), re ? re.json() : Promise.resolve(null)])
      if (dd.success) setDevoirs(dd.data || [])
      if (dc.success) setClasses(dc.data || [])
      if (de?.success) setMonClasseId((de.data || [])[0]?.classeId || null)
    } catch {
      toast2("Erreur de chargement", "error")
    }
    setLoading(false)
  }
  useEffect(() => { charger() }, [role])

  // Filtrage
  const filtered = useMemo(()=>{
    return devoirs
      .filter(d=>{
        if(role==="eleve") return monClasseId ? d.classes.includes(monClasseId) : false
        if(filterClasse!=="Toutes") return d.classes.includes(filterClasse)
        if(filterNiveau!=="Tous") return d.classes.some(cid=>classes.find(c=>c.id===cid)?.niveau===filterNiveau)
        return true
      })
      .filter(d=> filterType==="Tous" || d.type===filterType)
      .sort((a,b)=>a.date.localeCompare(b.date))
  },[devoirs,filterClasse,filterNiveau,filterType,role,monClasseId,classes])

  // Grouper par mois
  const grouped = useMemo(()=>{
    const g: Record<string, Devoir[]> = {}
    filtered.forEach(d=>{
      const m = d.date.substring(0,7)
      if(!g[m]) g[m]=[]
      g[m].push(d)
    })
    return g
  },[filtered])

  const moisLabel = (m:string)=>{
    const [y,mo]=m.split("-")
    return new Date(parseInt(y),parseInt(mo)-1,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
  }

  const nomClasse = (id:string) => classes.find(c=>c.id===id)?.nom || "?"

  const saveDevoir = async ()=>{
    if(!form.date||!form.matiere||selectedClasses.length===0) return toast2("Date, matière et classe(s) requis","error")
    setSaving(true)
    try {
      const payload = {
        id: form.id,
        date: form.date, matiere: form.matiere, classes: selectedClasses,
        heureDebut: form.heureDebut||"08:00", heureFin: form.heureFin||"10:00",
        professeur: form.professeur||"", trimestre: form.trimestre||3,
        anneeId: form.anneeId||"2025-2026", type: form.type||"devoir", note: form.note||"",
      }
      const res = await authFetch('/api/devoirs', {
        method: modal==="add" ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await charger()
      toast2(modal==="add"?"Devoir ajouté ✓":"Devoir modifié ✓")
      setModal(null); setForm({}); setSelectedClasses([])
    } catch (e:any) {
      toast2(e.message || "Erreur lors de l'enregistrement", "error")
    }
    setSaving(false)
  }

  const deleteDevoir = (id:string)=>{
    setConfirm({msg:"Supprimer ce devoir définitivement ?", onOui: async ()=>{
      try {
        const res = await authFetch(`/api/devoirs?id=${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        await charger()
        toast2("Devoir supprimé","error")
      } catch {
        toast2("Erreur lors de la suppression","error")
      }
      setConfirm(null)
    }})
  }

  const openAdd = ()=>{
    setForm({type:"devoir",trimestre:3,anneeId:"2025-2026",heureDebut:"10:00",heureFin:"12:00"})
    setSelectedClasses([])
    setModal("add")
  }

  const openEdit = (d:Devoir)=>{
    setForm({...d})
    setSelectedClasses([...d.classes])
    setModal("edit")
  }

  const toggleClass = (c:string)=>{
    setSelectedClasses(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c])
  }

  const toggleNiveau = (n:string)=>{
    const cls = classes.filter(c=>c.niveau===n).map(c=>c.id)
    const allOn = cls.every(c=>selectedClasses.includes(c))
    setSelectedClasses(prev=>{ if(allOn) return prev.filter(c=>!cls.includes(c)); return prev.concat(cls.filter(c=>!prev.includes(c))); })
  }

  // Devoirs à venir dans 3j (pour alertes)
  const alertes = devoirs.filter(d=>{
    const j=daysUntil(d.date)
    if (j<0 || j>3) return false
    return role==="eleve" ? (monClasseId ? d.classes.includes(monClasseId) : false) : true
  })

  if (loading) return <p style={{textAlign:"center",color:"#aaa",padding:60}}>⏳ Chargement...</p>

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <Confirm msg={confirm.msg} onOui={confirm.onOui} onNon={()=>setConfirm(null)}/>}

      {/* En-tête */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#1a1a2e",margin:"0 0 4px"}}>
            📅 Programme des devoirs
          </h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>
            {filtered.length} épreuve{filtered.length>1?"s":""}
          </p>
        </div>
        {canEdit && (
          <button onClick={openAdd} style={{padding:"9px 20px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            + Ajouter un devoir
          </button>
        )}
      </div>

      {/* Alertes imminentes */}
      {alertes.length > 0 && (
        <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
          <p style={{margin:"0 0 8px",fontWeight:600,color:"#92400e",fontSize:13}}>⚠️ Devoirs imminents</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {alertes.map(d=>(
              <div key={d.id} style={{background:"#fff",borderRadius:8,padding:"6px 12px",border:"1px solid #fbbf24",fontSize:12}}>
                <strong>{d.matiere}</strong> · {d.classes.map(nomClasse).join(", ")} · {formatDate(d.date).split(" ").slice(0,2).join(" ")}
                <span style={{marginLeft:6}}><AlertBadge days={daysUntil(d.date)}/></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      {role!=="eleve" && (
        <div style={{background:"#f8f9ff",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div>
            <label style={{fontSize:11,color:"#888",fontWeight:500,display:"block",marginBottom:3}}>NIVEAU</label>
            <select style={SEL} value={filterNiveau} onChange={e=>{setFilterNiveau(e.target.value);setFilterClasse("Toutes")}}>
              <option>Tous</option>
              {niveaux.map(n=><option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#888",fontWeight:500,display:"block",marginBottom:3}}>CLASSE</label>
            <select style={SEL} value={filterClasse} onChange={e=>setFilterClasse(e.target.value)}>
              <option value="Toutes">Toutes</option>
              {classes.filter(c=>filterNiveau==="Tous"||c.niveau===filterNiveau).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#888",fontWeight:500,display:"block",marginBottom:3}}>TYPE</label>
            <select style={SEL} value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="Tous">Tous</option>
              {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {(["liste","calendrier"] as const).map(m=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{padding:"6px 14px",borderRadius:7,fontSize:12,cursor:"pointer",background:viewMode===m?"#1a1a2e":"#fff",color:viewMode===m?"#fff":"#666",border:viewMode===m?"none":"1px solid #e5e7eb",fontWeight:viewMode===m?600:400}}>
                {m==="liste"?"☰ Liste":"📆 Calendrier"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vue Liste groupée par mois */}
      {viewMode==="liste" && Object.entries(grouped).map(([mois,devs])=>(
        <div key={mois} style={{marginBottom:28}}>
          <h2 style={{fontSize:15,fontWeight:700,color:"#1a1a2e",margin:"0 0 12px",textTransform:"capitalize",display:"flex",alignItems:"center",gap:8}}>
            <span style={{display:"inline-block",width:28,height:28,borderRadius:8,background:"#1a1a2e",color:"#fff",fontSize:12,fontWeight:700,lineHeight:"28px",textAlign:"center"}}>
              {new Date(mois+"-01").getMonth()+1}
            </span>
            {moisLabel(mois)}
            <span style={{fontSize:12,color:"#aaa",fontWeight:400}}>{devs.length} épreuve{devs.length>1?"s":""}</span>
          </h2>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {devs.map(d=>{
              const cfg=TYPE_CONFIG[d.type]||TYPE_CONFIG.autre
              const days=daysUntil(d.date)
              const isPast=days<0
              return(
                <div key={d.id} style={{background:"#fff",border:`1px solid ${isPast?"#f0f0f0":"#e5e7eb"}`,borderLeft:`4px solid ${isPast?"#e0e0e0":cfg.color}`,borderRadius:"0 10px 10px 0",padding:"12px 16px",display:"flex",alignItems:"center",gap:14,opacity:isPast?.6:1}}>
                  {/* Date */}
                  <div style={{minWidth:64,textAlign:"center",background:isPast?"#f9f9f9":cfg.bg,borderRadius:8,padding:"6px 8px"}}>
                    <p style={{margin:0,fontSize:20,fontWeight:700,color:isPast?"#aaa":cfg.color,lineHeight:1}}>
                      {jToDate(d.date).getDate()}
                    </p>
                    <p style={{margin:0,fontSize:10,color:"#888",textTransform:"capitalize"}}>
                      {jToDate(d.date).toLocaleDateString('fr-FR',{weekday:'short'})}
                    </p>
                  </div>
                  {/* Info */}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:14,color:isPast?"#aaa":"#1a1a2e"}}>{d.matiere}</span>
                      <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:600,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                      {!isPast && <AlertBadge days={days}/>}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#666"}}>🕐 {d.heureDebut}–{d.heureFin}</span>
                      <span style={{fontSize:12,color:"#666"}}>·</span>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {d.classes.map(cid=><span key={cid} style={{fontSize:11,padding:"1px 6px",borderRadius:4,background:"#f3f4f6",color:"#555",fontWeight:500}}>{nomClasse(cid)}</span>)}
                      </div>
                      {d.professeur && <span style={{fontSize:12,color:"#888"}}>· {d.professeur}</span>}
                    </div>
                    {d.note && <p style={{margin:"4px 0 0",fontSize:11,color:"#d97706",fontStyle:"italic"}}>ℹ️ {d.note}</p>}
                  </div>
                  {/* Actions prof */}
                  {canEdit && !isPast && (
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>openEdit(d)} style={{padding:"5px 10px",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,fontSize:12,cursor:"pointer"}}>✏️</button>
                      <button onClick={()=>deleteDevoir(d.id)} style={{padding:"5px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,fontSize:12,cursor:"pointer"}}>🗑️</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length===0 && (
        <div style={{textAlign:"center",padding:48,color:"#aaa"}}>
          <p style={{fontSize:32,marginBottom:8}}>📭</p>
          <p>Aucun devoir pour cette sélection</p>
        </div>
      )}

      {/* ── Modal ajout/modification ── */}
      {modal && (
        <Modal title={modal==="add"?"Ajouter un devoir":"Modifier le devoir"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={LBL}>Date *</label>
              <input style={IN} type="date" value={form.date||""} onChange={e=>setForm({...form,date:e.target.value})}/>
            </div>
            <div>
              <label style={LBL}>Type *</label>
              <select style={IN} value={form.type||"devoir"} onChange={e=>setForm({...form,type:e.target.value as any})}>
                {Object.entries(TYPE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Matière *</label>
              <select style={IN} value={form.matiere||""} onChange={e=>setForm({...form,matiere:e.target.value})}>
                <option value="">Choisir...</option>
                {MATIERES_LIST.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Professeur</label>
              <input style={IN} value={form.professeur||""} onChange={e=>setForm({...form,professeur:e.target.value})} placeholder="Nom du prof"/>
            </div>
            <div>
              <label style={LBL}>Heure début</label>
              <input style={IN} type="time" value={form.heureDebut||"10:00"} onChange={e=>setForm({...form,heureDebut:e.target.value})}/>
            </div>
            <div>
              <label style={LBL}>Heure fin</label>
              <input style={IN} type="time" value={form.heureFin||"12:00"} onChange={e=>setForm({...form,heureFin:e.target.value})}/>
            </div>
          </div>

          <div style={{margin:"14px 0"}}>
            <label style={LBL}>Classes concernées * ({selectedClasses.length} sélectionnée{selectedClasses.length>1?"s":""})</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {niveaux.map(n=>{
                const cls=classes.filter(c=>c.niveau===n).map(c=>c.id)
                const allOn=cls.length>0 && cls.every(c=>selectedClasses.includes(c))
                return(
                  <button key={n} onClick={()=>toggleNiveau(n)} style={{padding:"4px 12px",borderRadius:6,fontSize:12,cursor:"pointer",background:allOn?"#1a1a2e":"#f3f4f6",color:allOn?"#fff":"#555",border:"none",fontWeight:500}}>
                    Tout {n}
                  </button>
                )
              })}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {classes.length===0 && <p style={{fontSize:12,color:"#aaa",margin:0}}>Aucune classe — créez-en une dans « Classes & Profs ».</p>}
              {classes.map(c=>{
                const on=selectedClasses.includes(c.id)
                return(
                  <button key={c.id} onClick={()=>toggleClass(c.id)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,cursor:"pointer",background:on?"#2563eb":"#f9f9f9",color:on?"#fff":"#555",border:`1px solid ${on?"#2563eb":"#e5e7eb"}`,fontWeight:on?600:400}}>
                    {c.nom}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={LBL}>Note / Remarque (optionnel)</label>
            <input style={IN} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Ex: Durée exceptionnelle, salle..."/>
          </div>

          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setModal(null)} style={{padding:"9px 20px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontSize:13}}>Annuler</button>
            <button onClick={saveDevoir} disabled={saving} style={{padding:"9px 20px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const SEL:React.CSSProperties={padding:"7px 10px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,background:"#fff",outline:"none"}
const IN:React.CSSProperties={width:"100%",padding:"8px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff"}
const LBL:React.CSSProperties={display:"block",fontSize:12,fontWeight:500,color:"#555",marginBottom:4}
