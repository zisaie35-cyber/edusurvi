'use client'

// ─── Import de l'application complète depuis suivi_scolaire.jsx ───────────────
// Ce composant reprend toute la logique de l'application de démonstration
// et la connecte aux APIs réelles

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Données de démonstration (remplacées progressivement par les APIs)
const SEED = {
  users: [
    { id:1, nom:"Diallo", prenom:"Mamadou", email:"admin@ecole.bf", password:"admin123", role:"admin", actif:true, avatar:"MD" },
    { id:2, nom:"Ouédraogo", prenom:"Safi", email:"prof1@ecole.bf", password:"prof123", role:"professeur", actif:true, avatar:"SO" },
    { id:3, nom:"Sawadogo", prenom:"Ismaël", email:"prof2@ecole.bf", password:"prof123", role:"professeur", actif:true, avatar:"IS" },
    { id:4, nom:"Kaboré", prenom:"Adèle", email:"surv@ecole.bf", password:"surv123", role:"surveillant", actif:true, avatar:"AK" },
    { id:5, nom:"Traoré", prenom:"Aïcha", email:"eleve1@ecole.bf", password:"eleve123", role:"eleve", actif:true, avatar:"AT", eleveId:1 },
  ],
  classes: [
    { id:1, nom:"3ème A", niveau:"3ème", effectif:28 },
    { id:2, nom:"4ème B", niveau:"4ème", effectif:31 },
    { id:3, nom:"5ème A", niveau:"5ème", effectif:25 },
  ],
  matieres: [
    { id:1, nom:"Mathématiques", coef:3, couleur:"#2563eb" },
    { id:2, nom:"Français", coef:3, couleur:"#7c3aed" },
    { id:3, nom:"SVT", coef:2, couleur:"#059669" },
    { id:4, nom:"Histoire-Géo", coef:2, couleur:"#d97706" },
    { id:5, nom:"Physique-Chimie", coef:2, couleur:"#dc2626" },
    { id:6, nom:"Anglais", coef:2, couleur:"#0891b2" },
  ],
  eleves: [
    { id:1, nom:"Traoré", prenom:"Aïcha", matricule:"2024-001", classe:1, dateNaissance:"2009-03-14", nationalite:"Burkinabè", adresse:"Secteur 15, Ouagadougou" },
    { id:2, nom:"Compaoré", prenom:"Théo", matricule:"2024-002", classe:1, dateNaissance:"2008-11-22", nationalite:"Burkinabè", adresse:"Secteur 7, Ouagadougou" },
    { id:3, nom:"Zongo", prenom:"Fatima", matricule:"2024-003", classe:2, dateNaissance:"2009-06-05", nationalite:"Burkinabè", adresse:"Pissy, Ouagadougou" },
    { id:4, nom:"Ouédraogo", prenom:"Brice", matricule:"2024-004", classe:1, dateNaissance:"2009-01-18", nationalite:"Burkinabè", adresse:"Gounghin, Ouagadougou" },
    { id:5, nom:"Sawadogo", prenom:"Mariam", matricule:"2024-005", classe:2, dateNaissance:"2008-09-30", nationalite:"Burkinabè", adresse:"Secteur 22, Ouagadougou" },
    { id:6, nom:"Kaboré", prenom:"Luc", matricule:"2024-006", classe:3, dateNaissance:"2010-02-11", nationalite:"Burkinabè", adresse:"Tampouy, Ouagadougou" },
    { id:7, nom:"Diallo", prenom:"Salimata", matricule:"2024-007", classe:1, dateNaissance:"2009-07-25", nationalite:"Burkinabè", adresse:"Secteur 28, Ouagadougou" },
    { id:8, nom:"Nikiema", prenom:"Joël", matricule:"2024-008", classe:2, dateNaissance:"2008-12-03", nationalite:"Burkinabè", adresse:"Bilbalogho, Ouagadougou" },
    { id:9, nom:"Tapsoba", prenom:"Reine", matricule:"2024-009", classe:3, dateNaissance:"2010-04-17", nationalite:"Burkinabè", adresse:"Secteur 30, Ouagadougou" },
    { id:10, nom:"Ouattara", prenom:"Issa", matricule:"2024-010", classe:1, dateNaissance:"2009-08-09", nationalite:"Burkinabè", adresse:"Dassasgo, Ouagadougou" },
  ],
  notes: [
    {id:1, eleveId:1, matiereId:1, valeur:15, typeEval:"Devoir 1", trimestre:1, professeurId:2, commentaire:"Bon travail"},
    {id:2, eleveId:1, matiereId:2, valeur:14, typeEval:"Devoir 1", trimestre:1, professeurId:2, commentaire:"Bien"},
    {id:3, eleveId:1, matiereId:3, valeur:12, typeEval:"Devoir 1", trimestre:1, professeurId:3, commentaire:""},
    {id:4, eleveId:2, matiereId:1, valeur:9, typeEval:"Devoir 1", trimestre:1, professeurId:2, commentaire:"Des efforts à faire"},
    {id:5, eleveId:3, matiereId:1, valeur:18, typeEval:"Devoir 1", trimestre:1, professeurId:2, commentaire:"Excellent"},
  ],
  sanctions: [
    { id:1, eleveId:2, type:"retenue", motif:"Bavardage répété", description:"A été renvoyé de cours.", dateDebut:"2024-10-15", dateFin:"2024-10-16", surveillantId:4 },
  ],
  retards: [
    { id:1, eleveId:1, date:"2024-10-08", heureArrivee:"08:25", motif:"Transport", justifie:true, surveillantId:4 },
    { id:2, eleveId:2, date:"2024-10-10", heureArrivee:"09:00", motif:"Réveil tardif", justifie:false, surveillantId:4 },
  ],
  absences: [
    { id:1, eleveId:3, dateDebut:"2024-10-02", dateFin:"2024-10-03", motif:"Maladie", justifiee:true, surveillantId:4 },
  ],
  logs: [
    { id:1, userId:2, action:"Notes saisies pour Traoré Aïcha - Mathématiques T1", date:"2024-10-22 09:14" },
    { id:2, userId:4, action:"Sanction enregistrée pour Compaoré Théo", date:"2024-10-22 10:30" },
  ]
}

const avg = (arr: number[]) => arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2) : "-"
const roleLabel: Record<string,string> = { admin:"Administrateur", professeur:"Professeur", surveillant:"Surveillant", eleve:"Élève" }
const roleColor: Record<string,string> = { admin:"#7c3aed", professeur:"#2563eb", surveillant:"#d97706", eleve:"#059669" }
const sanctionLabel: Record<string,string> = { avertissement:"Avertissement", retenue:"Retenue", exclusion_temp:"Exclusion temporaire", exclusion_def:"Exclusion définitive" }
const sanctionColor: Record<string,string> = { avertissement:"#d97706", retenue:"#dc2626", exclusion_temp:"#b91c1c", exclusion_def:"#7f1d1d" }

function initData() {
  if (typeof window === 'undefined') return SEED
  const stored = localStorage.getItem("school_data")
  if (stored) return JSON.parse(stored)
  localStorage.setItem("school_data", JSON.stringify(SEED))
  return SEED
}

function saveData(data: any) {
  if (typeof window !== 'undefined') localStorage.setItem("school_data", JSON.stringify(data))
}

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

function EleveAvatar({ eleve, size=36 }: any) {
  const initials = `${eleve.prenom[0]}${eleve.nom[0]}`
  const colors = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"]
  const bg = colors[eleve.id % colors.length]
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
function AdminHome({ data }: any) {
  return (
    <div>
      <PageTitle>Tableau de bord</PageTitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:24}}>
        <StatCard icon="👤" label="Élèves inscrits" value={data.eleves.length} color="#2563eb"/>
        <StatCard icon="👩‍🏫" label="Professeurs" value={data.users.filter((u:any)=>u.role==="professeur").length} color="#7c3aed"/>
        <StatCard icon="🏛" label="Classes" value={data.classes.length} color="#059669"/>
        <StatCard icon="⚠️" label="Sanctions" value={data.sanctions.length} color="#d97706"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Absences récentes</h3>
          {data.absences.slice(0,3).map((a:any)=>{
            const el = data.eleves.find((e:any)=>e.id===a.eleveId)
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
        <Card>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Activité récente</h3>
          {data.logs.map((l:any)=>{
            const u = data.users.find((x:any)=>x.id===l.userId)
            return (
              <div key={l.id} style={{display:"flex",alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:roleColor[u?.role||"admin"],color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>{u?.avatar}</div>
                <div style={{marginLeft:10}}>
                  <p style={{margin:0,fontSize:12}}>{l.action}</p>
                  <p style={{margin:0,fontSize:11,color:"#aaa"}}>{l.date}</p>
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

function ElevesPageComp({ data, update, showToast }: any) {
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({nom:"",prenom:"",matricule:"",classe:1,dateNaissance:"",nationalite:"Burkinabè",adresse:""})

  const filtered = data.eleves.filter((e:any) =>
    `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())
  )

  const save = () => {
    if (!form.nom || !form.prenom) return showToast("Nom et prénom requis","error")
    const newEleve = { ...form, id: Date.now(), classe: parseInt(String(form.classe)), photo:null }
    update({ ...data, eleves:[...data.eleves,newEleve] })
    setModal(false)
    showToast("Élève ajouté avec succès")
  }

  return (
    <div>
      <PageTitle>Gestion des élèves</PageTitle>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <input style={{flex:1,padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14}} placeholder="Rechercher un élève..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={()=>setModal(true)}>+ Ajouter</button>
      </div>
      <Card>
        <TableComp
          cols={[
            {key:"avatar",label:"",render:(r:any)=><EleveAvatar eleve={r} size={32}/>},
            {key:"nom",label:"Nom",render:(r:any)=><strong>{r.nom} {r.prenom}</strong>},
            {key:"matricule",label:"Matricule",render:(r:any)=><code style={{fontSize:12,background:"#f5f5f5",padding:"2px 6px",borderRadius:4}}>{r.matricule}</code>},
            {key:"classe",label:"Classe",render:(r:any)=>data.classes.find((c:any)=>c.id===r.classe)?.nom||"-"},
            {key:"nationalite",label:"Nationalité"},
          ]}
          rows={filtered}
        />
      </Card>
      {modal && (
        <Modal title="Ajouter un élève" onClose={()=>setModal(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Prénom" value={form.prenom} onChange={(e:any)=>setForm({...form,prenom:e.target.value})}/>
            <Input label="Nom" value={form.nom} onChange={(e:any)=>setForm({...form,nom:e.target.value})}/>
            <Input label="Matricule" value={form.matricule} onChange={(e:any)=>setForm({...form,matricule:e.target.value})}/>
            <Input label="Date de naissance" type="date" value={form.dateNaissance} onChange={(e:any)=>setForm({...form,dateNaissance:e.target.value})}/>
            <Select label="Classe" value={form.classe} onChange={(e:any)=>setForm({...form,classe:e.target.value})}>
              {data.classes.map((c:any)=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </Select>
            <Input label="Nationalité" value={form.nationalite} onChange={(e:any)=>setForm({...form,nationalite:e.target.value})}/>
          </div>
          <Input label="Adresse" value={form.adresse} onChange={(e:any)=>setForm({...form,adresse:e.target.value})}/>
          <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
            <button style={{padding:"9px 20px",background:"#fff",color:"#444",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer"}} onClick={()=>setModal(false)}>Annuler</button>
            <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}} onClick={save}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SanctionsPageComp({ session, data, update, showToast }: any) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ eleveId:"", type:"avertissement", motif:"", description:"", dateDebut:"", dateFin:"" })

  const save = () => {
    if (!form.eleveId || !form.motif) return showToast("Champs requis manquants","error")
    const newS = { id:Date.now(), eleveId:parseInt(form.eleveId), type:form.type, motif:form.motif, description:form.description, dateDebut:form.dateDebut, dateFin:form.dateFin||null, surveillantId:session.id }
    update({...data, sanctions:[...data.sanctions, newS]})
    showToast("Sanction enregistrée")
    setModal(false)
  }

  return (
    <div>
      <PageTitle>Sanctions disciplinaires</PageTitle>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}} onClick={()=>setModal(true)}>+ Nouvelle sanction</button>
      </div>
      <Card>
        <TableComp
          cols={[
            {key:"el",label:"Élève",render:(r:any)=>{const el=data.eleves.find((e:any)=>e.id===r.eleveId);return el?`${el.prenom} ${el.nom}`:"-"}},
            {key:"type",label:"Type",render:(r:any)=><Badge label={sanctionLabel[r.type]||r.type} color={sanctionColor[r.type]||"#888"}/>},
            {key:"motif",label:"Motif"},
            {key:"dateDebut",label:"Date"},
          ]}
          rows={data.sanctions}
          emptyMsg="Aucune sanction enregistrée"
        />
      </Card>
      {modal && (
        <Modal title="Nouvelle sanction" onClose={()=>setModal(false)}>
          <Select label="Élève" value={form.eleveId} onChange={(e:any)=>setForm({...form,eleveId:e.target.value})}>
            <option value="">Sélectionner un élève</option>
            {data.eleves.map((e:any)=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
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
            <button style={{padding:"9px 20px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}} onClick={save}>Enregistrer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EleveHome({ session, data }: any) {
  const eleve = data.eleves.find((e:any)=>e.id===session.eleveId)
  if (!eleve) return <p>Profil introuvable</p>
  const notes = data.notes.filter((n:any)=>n.eleveId===eleve.id)
  const absences = data.absences.filter((a:any)=>a.eleveId===eleve.id)
  const retards = data.retards.filter((r:any)=>r.eleveId===eleve.id)
  const classe = data.classes.find((c:any)=>c.id===eleve.classe)
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28,background:"linear-gradient(135deg,#1a1a2e,#2563eb)",borderRadius:16,padding:"24px 28px",color:"#fff"}}>
        <EleveAvatar eleve={eleve} size={56}/>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700}}>{eleve.prenom} {eleve.nom}</h1>
          <p style={{margin:0,opacity:0.8,fontSize:14}}>{classe?.nom} · Matricule {eleve.matricule}</p>
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

// ─── Navigation ───────────────────────────────────────────────────────────────
function getNavItems(role: string) {
  const all: Record<string, any[]> = {
    admin: [
      {id:"home",icon:"📊",label:"Tableau de bord"},
      {id:"eleves",icon:"👤",label:"Élèves"},
      {id:"classes",icon:"🏛",label:"Classes"},
      {id:"discipline",icon:"⚠️",label:"Discipline"},
    ],
    professeur: [
      {id:"home",icon:"📊",label:"Tableau de bord"},
      {id:"eleves",icon:"👤",label:"Mes élèves"},
    ],
    surveillant: [
      {id:"home",icon:"📊",label:"Tableau de bord"},
      {id:"eleves",icon:"👤",label:"Élèves"},
      {id:"sanctions",icon:"⚠️",label:"Sanctions"},
    ],
    eleve: [
      {id:"home",icon:"📊",label:"Mon espace"},
      {id:"notes",icon:"📝",label:"Mes notes"},
    ],
  }
  return all[role] || []
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function MainApp({ initialUser }: { initialUser: any }) {
  const router = useRouter()
  const [data, setData] = useState(initData())
  const [session] = useState(initialUser)
  const [page, setPage] = useState("home")
  const [sideOpen, setSideOpen] = useState(true)
  const [toast, setToast] = useState<any>(null)

  const update = (newData: any) => { setData(newData); saveData(newData) }
  const showToast = (msg: string, type="success") => {
    setToast({msg,type})
    setTimeout(()=>setToast(null),3000)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const navItems = getNavItems(session.role)

  const renderPage = () => {
    const props = { session, data, update, showToast }
    if (page === "home") {
      if (session.role === "admin") return <AdminHome {...props}/>
      if (session.role === "eleve") return <EleveHome {...props}/>
      return <AdminHome {...props}/>
    }
    if (page === "eleves") return <ElevesPageComp {...props}/>
    if (page === "sanctions") return <SanctionsPageComp {...props}/>
    if (page === "classes") return (
      <div>
        <PageTitle>Classes</PageTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
          {data.classes.map((cl:any)=>(
            <Card key={cl.id}>
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{cl.nom}</h3>
              <p style={{color:"#666",fontSize:13,marginBottom:12}}>Niveau {cl.niveau}</p>
              <p style={{fontSize:24,fontWeight:700,color:"#2563eb",margin:0}}>{data.eleves.filter((e:any)=>e.classe===cl.id).length}</p>
              <p style={{fontSize:12,color:"#888"}}>élèves inscrits</p>
            </Card>
          ))}
        </div>
      </div>
    )
    if (page === "discipline") return (
      <div>
        <PageTitle>Discipline</PageTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
          <StatCard icon="⚠️" label="Sanctions" value={data.sanctions.length} color="#d97706"/>
          <StatCard icon="⏰" label="Retards" value={data.retards.length} color="#dc2626"/>
          <StatCard icon="📅" label="Absences" value={data.absences.length} color="#7c3aed"/>
        </div>
        <Card>
          <TableComp
            cols={[
              {key:"el",label:"Élève",render:(r:any)=>{const el=data.eleves.find((e:any)=>e.id===r.eleveId);return el?`${el.prenom} ${el.nom}`:"-"}},
              {key:"type",label:"Type",render:(r:any)=><Badge label={sanctionLabel[r.type]||r.type} color={sanctionColor[r.type]||"#888"}/>},
              {key:"motif",label:"Motif"},
              {key:"dateDebut",label:"Date"},
            ]}
            rows={data.sanctions}
            emptyMsg="Aucune sanction"
          />
        </Card>
      </div>
    )
    if (page === "notes") {
      const eleve = data.eleves.find((e:any)=>e.id===session.eleveId)
      if (!eleve) return <p>Élève introuvable</p>
      const notes = data.notes.filter((n:any)=>n.eleveId===eleve.id)
      return (
        <div>
          <PageTitle>Mes notes</PageTitle>
          {data.matieres.map((m:any)=>{
            const mNotes = notes.filter((n:any)=>n.matiereId===m.id)
            if(!mNotes.length) return null
            return (
              <Card key={m.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:m.couleur}}/>
                    <strong>{m.nom}</strong>
                    <span style={{fontSize:12,color:"#888"}}>coeff. {m.coef}</span>
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
    return <AdminHome {...props}/>
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {/* Sidebar */}
      <aside style={{background:"#1a1a2e",display:"flex",flexDirection:"column",flexShrink:0,width:sideOpen?220:64,transition:"width 0.2s",overflow:"hidden"}}>
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
      <main style={{flex:1,padding:"28px 32px",overflow:"auto",background:"#f4f6fb"}}>
        {renderPage()}
      </main>
    </div>
  )
}
