'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/apiClient'

interface Classe { id:string; nom:string; niveau:string }
interface Eleve { id:string; nom:string; prenom:string; classeId:string|null; matricule:string; dateNaissance:string; email:string }
interface Professeur { id:string; nom:string; prenom:string; email:string; actif:boolean; matieres:string[]; classes:string[]; password?:string }
interface Matiere { id:string; nom:string; coefficient:number; couleur:string }

const NIVEAUX = ["6ème","5ème","4ème","3ème","2nde","1ère","Terminale"]
const AV = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#0e7490","#be185d"]

function hashStr(s:string){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0}return Math.abs(h)}

function Av({nom,prenom,id,size=36}:{nom:string,prenom:string,id:string|number,size?:number}){
  const idx = typeof id === 'number' ? id : hashStr(id)
  return <div style={{width:size,height:size,borderRadius:"50%",background:AV[idx%AV.length],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:Math.round(size*.33),flexShrink:0}}>{prenom?.[0]}{nom?.[0]}</div>
}

function Bdg({label,color}:{label:string,color:string}){
  return <span style={{padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:600,background:color+"20",color}}>{label}</span>
}

function Toast({msg,type}:{msg:string,type:string}){
  return <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:type==="success"?"#059669":type==="error"?"#dc2626":"#2563eb",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:500,boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>{msg}</div>
}

function Confirm({message,onOui,onNon}:{message:string,onOui:()=>void,onNon:()=>void}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:380,width:"90%"}}>
        <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>⚠️</div>
        <p style={{textAlign:"center",fontSize:15,marginBottom:24,whiteSpace:"pre-wrap"}}>{message}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onNon} style={BS}>Annuler</button>
          <button onClick={onOui} style={{...BP,background:"#dc2626",flex:1}}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:React.ReactNode}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f0f0f0",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  )
}

function F({label,children}:{label:string,children:React.ReactNode}){
  return <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:500,color:"#555",marginBottom:5}}>{label}</label>{children}</div>
}

const IN:React.CSSProperties={width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff"}
const BP:React.CSSProperties={padding:"9px 20px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}
const BS:React.CSSProperties={flex:1,padding:"9px 20px",background:"#fff",color:"#444",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,cursor:"pointer"}
const BE:React.CSSProperties={padding:"6px 12px",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,fontSize:12,cursor:"pointer"}
const BD:React.CSSProperties={padding:"6px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,fontSize:12,cursor:"pointer"}
const TH:React.CSSProperties={textAlign:"left",padding:"10px 14px",fontSize:12,fontWeight:600,color:"#888",borderBottom:"1px solid #eee"}
const TD:React.CSSProperties={padding:"11px 14px",verticalAlign:"middle"}

export default function AdminClasses(){
  const [classes,setClasses]=useState<Classe[]>([])
  const [eleves,setEleves]=useState<Eleve[]>([])
  const [matieres,setMatieres]=useState<Matiere[]>([])
  const [profs,setProfs]=useState<Professeur[]>([])
  const [loading,setLoading]=useState(true)

  const [sel,setSel]=useState<string|null>(null)
  const [view,setView]=useState<"eleves"|"profs">("eleves")
  const [search,setSearch]=useState("")
  const [toast,setToast]=useState<any>(null)
  const [confirm,setConfirm]=useState<any>(null)
  const [mClasse,setMClasse]=useState<"add"|"edit"|null>(null)
  const [mEleve,setMEleve]=useState<"add"|"edit"|null>(null)
  const [mProf,setMProf]=useState<"add"|"edit"|null>(null)
  const [fC,setFC]=useState<Partial<Classe>>({})
  const [fE,setFE]=useState<Partial<Eleve>>({})
  const [fP,setFP]=useState<Partial<Professeur>>({})
  const [saving,setSaving]=useState(false)

  const toast2=(msg:string,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}
  const askDel=(msg:string,fn:()=>void)=>setConfirm({message:msg,onOui:()=>{fn();setConfirm(null)}})

  const charger=async()=>{
    setLoading(true)
    try{
      const [rc,re,rm,rp]=await Promise.all([authFetch('/api/classes'),authFetch('/api/eleves'),authFetch('/api/matieres'),authFetch('/api/professeurs')])
      const [dc,de,dm,dp]=await Promise.all([rc.json(),re.json(),rm.json(),rp.json()])
      if(dc.success)setClasses(dc.data||[])
      if(de.success)setEleves(de.data||[])
      if(dm.success)setMatieres(dm.data||[])
      if(dp.success)setProfs(dp.data||[])
    }catch{
      toast2("Erreur de chargement","error")
    }
    setLoading(false)
  }
  useEffect(()=>{charger()},[])

  // CRUD Classes
  const svClasse=async()=>{
    if(!fC.nom||!fC.niveau)return toast2("Nom et niveau requis","error")
    setSaving(true)
    try{
      const res=await authFetch('/api/classes',{
        method: mClasse==="add"?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(mClasse==="add"?{nom:fC.nom,niveau:fC.niveau}:{id:fC.id,nom:fC.nom,niveau:fC.niveau}),
      })
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)
      await charger()
      toast2(mClasse==="add"?"Classe ajoutée ✓":"Classe modifiée ✓")
      setMClasse(null);setFC({})
    }catch(e:any){
      toast2(e.message||"Erreur lors de l'enregistrement","error")
    }
    setSaving(false)
  }
  const delClasse=(id:string)=>{
    const nb=eleves.filter(e=>e.classeId===id).length
    askDel(`Supprimer cette classe ?\n${nb>0?`⚠️ ${nb} élève(s) seront sans classe.`:""}`,async()=>{
      try{
        const res=await authFetch(`/api/classes?id=${id}`,{method:'DELETE'})
        if(!res.ok)throw new Error()
        await charger()
        if(sel===id)setSel(null)
        toast2("Classe supprimée","error")
      }catch{
        toast2("Erreur lors de la suppression","error")
      }
    })
  }

  // CRUD Élèves
  const svEleve=async()=>{
    if(!fE.nom||!fE.prenom||!fE.matricule)return toast2("Nom, prénom et matricule requis","error")
    setSaving(true)
    try{
      const payload:any = mEleve==="add"
        ? {nom:fE.nom,prenom:fE.prenom,matricule:fE.matricule,dateNaissance:fE.dateNaissance,email:fE.email,classeId:fE.classeId||sel}
        : {id:fE.id,nom:fE.nom,prenom:fE.prenom,matricule:fE.matricule,dateNaissance:fE.dateNaissance,email:fE.email,classeId:fE.classeId}
      const res=await authFetch('/api/eleves',{
        method: mEleve==="add"?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
      })
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)
      await charger()
      toast2(mEleve==="add"?`${fE.prenom} ${fE.nom} ajouté(e) ✓`:"Élève modifié(e) ✓")
      setMEleve(null);setFE({})
    }catch(e:any){
      toast2(e.message||"Erreur lors de l'enregistrement","error")
    }
    setSaving(false)
  }
  const delEleve=(id:string)=>{
    const el=eleves.find(e=>e.id===id)
    askDel(`Supprimer ${el?.prenom} ${el?.nom} définitivement ?`,async()=>{
      try{
        const res=await authFetch(`/api/eleves?id=${id}`,{method:'DELETE'})
        if(!res.ok)throw new Error()
        await charger()
        toast2("Élève supprimé(e)","error")
      }catch{
        toast2("Erreur lors de la suppression","error")
      }
    })
  }

  // CRUD Profs (vrais comptes, backend réel)
  const svProf=async()=>{
    if(!fP.nom||!fP.prenom||!fP.email)return toast2("Nom, prénom et email requis","error")
    if(mProf==="add"&&(!fP.password||fP.password.length<8))return toast2("Mot de passe : 8 caractères minimum","error")
    setSaving(true)
    try{
      const payload:any = mProf==="add"
        ? {nom:fP.nom,prenom:fP.prenom,email:fP.email,password:fP.password,matieres:fP.matieres||[],classes:fP.classes||(sel?[sel]:[])}
        : {id:fP.id,nom:fP.nom,prenom:fP.prenom,email:fP.email,matieres:fP.matieres||[],classes:fP.classes||[]}
      const res=await authFetch('/api/professeurs',{
        method: mProf==="add"?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
      })
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)
      await charger()
      toast2(mProf==="add"?`Prof. ${fP.prenom} ${fP.nom} ajouté(e) ✓`:"Professeur modifié(e) ✓")
      setMProf(null);setFP({})
    }catch(e:any){
      toast2(e.message||"Erreur lors de l'enregistrement","error")
    }
    setSaving(false)
  }
  const toggleProf=async(p:Professeur)=>{
    try{
      const res=await authFetch('/api/professeurs',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:p.id,actif:!p.actif}),
      })
      if(!res.ok)throw new Error()
      await charger()
      toast2(`Professeur ${p.actif?"désactivé":"activé"} ✓`)
    }catch{
      toast2("Erreur lors de la mise à jour","error")
    }
  }
  const retirerDeClasse=async(p:Professeur,classeId:string)=>{
    try{
      const res=await authFetch('/api/professeurs',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:p.id,classes:p.classes.filter(c=>c!==classeId),matieres:p.matieres}),
      })
      if(!res.ok)throw new Error()
      await charger()
      toast2("Professeur retiré de la classe ✓")
    }catch{
      toast2("Erreur lors de la mise à jour","error")
    }
  }

  // Modal matières checkboxes
  const MatieresCheck=({val,onChange}:{val:string[],onChange:(v:string[])=>void})=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {matieres.map(m=>{
        const on=val.includes(m.id)
        return(
          <label key={m.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:on?m.couleur+"18":"#f9f9f9",border:`1px solid ${on?m.couleur:"#e5e7eb"}`}}>
            <input type="checkbox" checked={on} onChange={e=>onChange(e.target.checked?[...val,m.id]:val.filter(x=>x!==m.id))}/>
            <span style={{fontSize:12,color:on?m.couleur:"#444",fontWeight:on?600:400}}>{m.nom}</span>
          </label>
        )
      })}
    </div>
  )

  const ClassesCheck=({val,onChange}:{val:string[],onChange:(v:string[])=>void})=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {classes.map(cl=>{
        const on=val.includes(cl.id)
        return(
          <label key={cl.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"5px 10px",borderRadius:8,background:on?"#eff6ff":"#f9f9f9",border:`1px solid ${on?"#2563eb":"#e5e7eb"}`}}>
            <input type="checkbox" checked={on} onChange={e=>onChange(e.target.checked?[...val,cl.id]:val.filter(x=>x!==cl.id))}/>
            <span style={{fontSize:12,color:on?"#2563eb":"#444",fontWeight:on?600:400}}>🏛 {cl.nom}</span>
          </label>
        )
      })}
    </div>
  )

  const cl=classes.find(c=>c.id===sel)
  const eC=eleves.filter(e=>e.classeId===sel).filter(e=>`${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()))
  const pC=profs.filter(p=>p.classes.includes(sel!))

  if(loading) return <p style={{textAlign:"center",color:"#aaa",padding:60}}>⏳ Chargement...</p>

  // ── VUE GLOBALE ─────────────────────────────────────────────────────────────
  if(!sel) return(
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {confirm&&<Confirm message={confirm.message} onOui={confirm.onOui} onNon={()=>setConfirm(null)}/>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#1a1a2e",margin:"0 0 4px"}}>Classes & Effectifs</h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>{classes.length} classe{classes.length>1?"s":""} · {eleves.length} élèves · {profs.length} professeurs</p>
        </div>
        <button style={BP} onClick={()=>{setFC({niveau:"3ème"});setMClasse("add")}}>+ Nouvelle classe</button>
      </div>

      {/* Cartes classes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16,marginBottom:28}}>
        {classes.map(c=>{
          const nb=eleves.filter(e=>e.classeId===c.id).length
          const np=profs.filter(p=>p.classes.includes(c.id)).length
          return(
            <div key={c.id} style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.06)",border:"0.5px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 6px",color:"#1a1a2e"}}>{c.nom}</h2>
                  <Bdg label={c.niveau} color="#2563eb"/>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={BE} onClick={()=>{setFC(c);setMClasse("edit")}} title="Modifier">✏️</button>
                  <button style={BD} onClick={()=>delClasse(c.id)} title="Supprimer">🗑️</button>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <div style={{flex:1,background:"#eff6ff",borderRadius:10,padding:10,textAlign:"center"}}>
                  <p style={{fontSize:22,fontWeight:700,color:"#2563eb",margin:0}}>{nb}</p>
                  <p style={{fontSize:11,color:"#6b7280",margin:0}}>Élèves</p>
                </div>
                <div style={{flex:1,background:"#f5f3ff",borderRadius:10,padding:10,textAlign:"center"}}>
                  <p style={{fontSize:22,fontWeight:700,color:"#7c3aed",margin:0}}>{np}</p>
                  <p style={{fontSize:11,color:"#6b7280",margin:0}}>Profs</p>
                </div>
              </div>
              <div style={{display:"flex",gap:4,marginBottom:12}}>
                {eleves.filter(e=>e.classeId===c.id).slice(0,7).map(e=><Av key={e.id} nom={e.nom} prenom={e.prenom} id={e.id} size={26}/>)}
                {nb>7&&<div style={{width:26,height:26,borderRadius:"50%",background:"#f3f4f6",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600}}>+{nb-7}</div>}
              </div>
              <button onClick={()=>{setSel(c.id);setView("eleves")}} style={{width:"100%",padding:"8px",background:"#f8f9ff",border:"1px solid #e0e7ff",borderRadius:8,color:"#2563eb",fontSize:13,fontWeight:500,cursor:"pointer"}}>
                Voir le détail →
              </button>
            </div>
          )
        })}
        <div onClick={()=>{setFC({niveau:"3ème"});setMClasse("add")}} style={{background:"#f8f9ff",borderRadius:14,padding:20,border:"2px dashed #c7d2fe",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:180,color:"#6366f1",gap:8}}>
          <span style={{fontSize:32}}>+</span>
          <span style={{fontSize:14,fontWeight:500}}>Ajouter une classe</span>
        </div>
      </div>

      {/* Tableau profs */}
      <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.06)",border:"0.5px solid #e5e7eb"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontSize:16,fontWeight:700,margin:0}}>👩‍🏫 Tous les professeurs</h2>
          <button style={BP} onClick={()=>{setFP({matieres:[],classes:[]});setMProf("add")}}>+ Ajouter un professeur</button>
        </div>
        {profs.length===0
          ?<p style={{textAlign:"center",color:"#aaa",padding:24}}>Aucun professeur enregistré</p>
          :profs.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f3f4f6",opacity:p.actif?1:.6}}>
              <Av nom={p.nom} prenom={p.prenom} id={p.id} size={40}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <p style={{margin:0,fontWeight:600,fontSize:14}}>{p.prenom} {p.nom}</p>
                  {!p.actif&&<Bdg label="Désactivé" color="#888"/>}
                </div>
                <p style={{margin:"0 0 6px",fontSize:12,color:"#888"}}>{p.email}</p>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {p.matieres.map(mid=>{const m=matieres.find(x=>x.id===mid);return m?<Bdg key={mid} label={m.nom} color={m.couleur}/>:null})}
                  {p.classes.map(cid=>{const c=classes.find(x=>x.id===cid);return c?<Bdg key={cid} label={c.nom} color="#475569"/>:null})}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button style={BE} onClick={()=>{setFP({...p});setMProf("edit")}}>✏️ Modifier</button>
                <button style={p.actif?BD:BE} onClick={()=>toggleProf(p)}>{p.actif?"Désactiver":"Activer"}</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Modals globaux */}
      {mClasse&&(
        <Modal title={mClasse==="add"?"Nouvelle classe":"Modifier la classe"} onClose={()=>setMClasse(null)}>
          <F label="Nom (ex: 3ème A) *"><input style={IN} value={fC.nom||""} onChange={e=>setFC({...fC,nom:e.target.value})} placeholder="3ème A"/></F>
          <F label="Niveau *">
            <select style={IN} value={fC.niveau||"3ème"} onChange={e=>setFC({...fC,niveau:e.target.value})}>
              {NIVEAUX.map(n=><option key={n}>{n}</option>)}
            </select>
          </F>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={BS} onClick={()=>setMClasse(null)}>Annuler</button>
            <button style={BP} onClick={svClasse} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
      {mProf&&(
        <Modal title={mProf==="add"?"Nouveau professeur":"Modifier le professeur"} onClose={()=>setMProf(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Prénom *"><input style={IN} value={fP.prenom||""} onChange={e=>setFP({...fP,prenom:e.target.value})}/></F>
            <F label="Nom *"><input style={IN} value={fP.nom||""} onChange={e=>setFP({...fP,nom:e.target.value})}/></F>
          </div>
          <F label="Email *"><input style={IN} type="email" value={fP.email||""} onChange={e=>setFP({...fP,email:e.target.value})}/></F>
          {mProf==="add"&&(
            <F label="Mot de passe (8 caractères min.) *"><input style={IN} type="password" value={fP.password||""} onChange={e=>setFP({...fP,password:e.target.value})}/></F>
          )}
          <F label="Matières enseignées"><MatieresCheck val={fP.matieres||[]} onChange={v=>setFP({...fP,matieres:v})}/></F>
          <F label="Classes assignées"><ClassesCheck val={fP.classes||[]} onChange={v=>setFP({...fP,classes:v})}/></F>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={BS} onClick={()=>setMProf(null)}>Annuler</button>
            <button style={BP} onClick={svProf} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
    </div>
  )

  // ── VUE DÉTAIL CLASSE ────────────────────────────────────────────────────────
  return(
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {confirm&&<Confirm message={confirm.message} onOui={confirm.onOui} onNon={()=>setConfirm(null)}/>}

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
        <button onClick={()=>{setSel(null);setSearch("")}} style={{background:"none",border:"none",cursor:"pointer",color:"#2563eb",fontSize:13,fontWeight:500,padding:0}}>← Toutes les classes</button>
        <span style={{color:"#ccc"}}>/</span>
        <span style={{fontSize:13,fontWeight:600}}>{cl?.nom}</span>
        <Bdg label={cl?.niveau||""} color="#2563eb"/>
      </div>

      {/* Banner */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#2563eb)",borderRadius:16,padding:"22px 28px",color:"#fff",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,margin:"0 0 4px"}}>{cl?.nom}</h1>
          <p style={{margin:0,opacity:.8,fontSize:13}}>Niveau {cl?.niveau} · Année 2024–2025</p>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[{v:eleves.filter(e=>e.classeId===sel).length,l:"Élèves"},{v:pC.length,l:"Profs"},{v:matieres.length,l:"Matières"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <p style={{fontSize:26,fontWeight:700,margin:0}}>{s.v}</p>
              <p style={{fontSize:12,opacity:.8,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{...BE,fontSize:12}} onClick={()=>{setFC(cl);setMClasse("edit")}}>✏️ Modifier</button>
          <button style={{...BD,fontSize:12}} onClick={()=>delClasse(sel!)}>🗑️ Supprimer</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[{id:"eleves",l:`👤 Élèves (${eleves.filter(e=>e.classeId===sel).length})`},{id:"profs",l:`👩‍🏫 Professeurs (${pC.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id as any)} style={{padding:"9px 20px",borderRadius:8,fontSize:13,cursor:"pointer",background:view===t.id?"#1a1a2e":"#fff",color:view===t.id?"#fff":"#666",border:view===t.id?"none":"1px solid #e5e7eb",fontWeight:view===t.id?600:400}}>{t.l}</button>
        ))}
      </div>

      {/* Élèves */}
      {view==="eleves"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.06)",border:"0.5px solid #e5e7eb"}}>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <input style={{flex:1,minWidth:180,padding:"8px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none"}} placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <button style={BP} onClick={()=>{setFE({classeId:sel,matricule:`2024-${String(eleves.length+1).padStart(3,"0")}`});setMEleve("add")}}>+ Ajouter un élève</button>
          </div>
          {eC.length===0
            ?<p style={{textAlign:"center",color:"#aaa",padding:32}}>Aucun élève trouvé</p>
            :<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead><tr style={{background:"#f8f9fc"}}>
                <th style={TH}>#</th><th style={TH}>Élève</th><th style={TH}>Matricule</th><th style={TH}>Date naissance</th><th style={TH}>Actions</th>
              </tr></thead>
              <tbody>
                {eC.map((e,i)=>(
                  <tr key={e.id} style={{borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafbff"}}>
                    <td style={TD}><span style={{color:"#aaa",fontSize:12}}>{i+1}</span></td>
                    <td style={TD}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Av nom={e.nom} prenom={e.prenom} id={e.id} size={32}/>
                        <div>
                          <p style={{margin:0,fontWeight:600,fontSize:13}}>{e.prenom} {e.nom}</p>
                          <p style={{margin:0,fontSize:11,color:"#888"}}>{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={TD}><code style={{fontSize:12,background:"#f3f4f6",padding:"2px 8px",borderRadius:4}}>{e.matricule}</code></td>
                    <td style={TD}><span style={{fontSize:13,color:"#666"}}>{e.dateNaissance||"—"}</span></td>
                    <td style={TD}>
                      <div style={{display:"flex",gap:6}}>
                        <button style={BE} onClick={()=>{setFE({...e});setMEleve("edit")}}>✏️</button>
                        <button style={BD} onClick={()=>delEleve(e.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          }
        </div>
      )}

      {/* Profs */}
      {view==="profs"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,.06)",border:"0.5px solid #e5e7eb"}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <button style={BP} onClick={()=>{setFP({matieres:[],classes:[sel!]});setMProf("add")}}>+ Assigner un professeur</button>
          </div>
          {pC.length===0
            ?<p style={{textAlign:"center",color:"#aaa",padding:32}}>Aucun professeur assigné</p>
            :pC.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:14,padding:14,border:"0.5px solid #e5e7eb",borderRadius:12,marginBottom:10,opacity:p.actif?1:.6}}>
                <Av nom={p.nom} prenom={p.prenom} id={p.id} size={46}/>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 4px",fontWeight:700,fontSize:15}}>{p.prenom} {p.nom}</p>
                  <p style={{margin:"0 0 8px",fontSize:12,color:"#888"}}>{p.email}</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.matieres.map(mid=>{const m=matieres.find(x=>x.id===mid);return m?<Bdg key={mid} label={m.nom} color={m.couleur}/>:null})}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={BE} onClick={()=>{setFP({...p});setMProf("edit")}}>✏️ Modifier</button>
                  <button style={BD} onClick={()=>retirerDeClasse(p,sel!)}>🗑️ Retirer</button>
                </div>
              </div>
            ))
          }
          {/* Couverture matières */}
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #f3f4f6"}}>
            <p style={{fontSize:12,color:"#888",marginBottom:10,fontWeight:600}}>COUVERTURE DES MATIÈRES</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:8}}>
              {matieres.map(m=>{
                const p=pC.find(x=>x.matieres.includes(m.id))
                return(
                  <div key={m.id} style={{padding:"10px 12px",borderRadius:10,background:m.couleur+"10",border:`1px solid ${m.couleur}30`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:m.couleur}}/>
                      <span style={{fontSize:12,fontWeight:600,color:m.couleur}}>{m.nom}</span>
                    </div>
                    <p style={{margin:"2px 0 0",fontSize:11,color:p?"#059669":"#dc2626",fontWeight:500}}>
                      {p?`✓ ${p.prenom} ${p.nom}`:"✗ Non assigné"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals détail */}
      {mClasse&&(
        <Modal title={mClasse==="add"?"Nouvelle classe":"Modifier la classe"} onClose={()=>setMClasse(null)}>
          <F label="Nom *"><input style={IN} value={fC.nom||""} onChange={e=>setFC({...fC,nom:e.target.value})}/></F>
          <F label="Niveau *"><select style={IN} value={fC.niveau||"3ème"} onChange={e=>setFC({...fC,niveau:e.target.value})}>{NIVEAUX.map(n=><option key={n}>{n}</option>)}</select></F>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={BS} onClick={()=>setMClasse(null)}>Annuler</button>
            <button style={BP} onClick={svClasse} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
      {mEleve&&(
        <Modal title={mEleve==="add"?"Ajouter un élève":"Modifier l'élève"} onClose={()=>setMEleve(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Prénom *"><input style={IN} value={fE.prenom||""} onChange={e=>setFE({...fE,prenom:e.target.value})}/></F>
            <F label="Nom *"><input style={IN} value={fE.nom||""} onChange={e=>setFE({...fE,nom:e.target.value})}/></F>
            <F label="Matricule *"><input style={IN} value={fE.matricule||""} onChange={e=>setFE({...fE,matricule:e.target.value})}/></F>
            <F label="Date de naissance"><input style={IN} type="date" value={fE.dateNaissance||""} onChange={e=>setFE({...fE,dateNaissance:e.target.value})}/></F>
          </div>
          <F label="Email (optionnel)"><input style={IN} type="email" value={fE.email||""} onChange={e=>setFE({...fE,email:e.target.value})}/></F>
          <F label="Classe">
            <select style={IN} value={fE.classeId||sel||""} onChange={e=>setFE({...fE,classeId:e.target.value})}>
              {classes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </F>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={BS} onClick={()=>setMEleve(null)}>Annuler</button>
            <button style={BP} onClick={svEleve} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
      {mProf&&(
        <Modal title={mProf==="add"?"Assigner un professeur":"Modifier le professeur"} onClose={()=>setMProf(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Prénom *"><input style={IN} value={fP.prenom||""} onChange={e=>setFP({...fP,prenom:e.target.value})}/></F>
            <F label="Nom *"><input style={IN} value={fP.nom||""} onChange={e=>setFP({...fP,nom:e.target.value})}/></F>
          </div>
          <F label="Email *"><input style={IN} type="email" value={fP.email||""} onChange={e=>setFP({...fP,email:e.target.value})}/></F>
          {mProf==="add"&&(
            <F label="Mot de passe (8 caractères min.) *"><input style={IN} type="password" value={fP.password||""} onChange={e=>setFP({...fP,password:e.target.value})}/></F>
          )}
          <F label="Matières enseignées"><MatieresCheck val={fP.matieres||[]} onChange={v=>setFP({...fP,matieres:v})}/></F>
          <F label="Classes assignées"><ClassesCheck val={fP.classes||[]} onChange={v=>setFP({...fP,classes:v})}/></F>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={BS} onClick={()=>setMProf(null)}>Annuler</button>
            <button style={BP} onClick={svProf} disabled={saving}>{saving?"⏳...":"Enregistrer"}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
