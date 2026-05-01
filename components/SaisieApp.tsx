'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Note {
  eleveId: number
  matiereId: number
  valeur: number
  typeEval: string
  trimestre: number
  commentaire: string
}

interface Absence {
  eleveId: number
  dateDebut: string
  dateFin: string
  motif: string
  justifiee: boolean
}

interface Retard {
  eleveId: number
  date: string
  heureArrivee: string
  motif: string
  justifie: boolean
}

// ─── Données de démo ──────────────────────────────────────────────────────────
const ELEVES = [
  { id:1, nom:"Traoré",    prenom:"Aïcha",    classe:"3ème A" },
  { id:2, nom:"Compaoré",  prenom:"Théo",     classe:"3ème A" },
  { id:3, nom:"Zongo",     prenom:"Fatima",   classe:"4ème B" },
  { id:4, nom:"Ouédraogo", prenom:"Brice",    classe:"3ème A" },
  { id:5, nom:"Sawadogo",  prenom:"Mariam",   classe:"4ème B" },
  { id:6, nom:"Kaboré",    prenom:"Luc",      classe:"5ème A" },
  { id:7, nom:"Diallo",    prenom:"Salimata", classe:"3ème A" },
  { id:8, nom:"Nikiema",   prenom:"Joël",     classe:"4ème B" },
  { id:9, nom:"Tapsoba",   prenom:"Reine",    classe:"5ème A" },
  { id:10, nom:"Ouattara", prenom:"Issa",     classe:"3ème A" },
]

const MATIERES = [
  { id:1, nom:"Mathématiques",   coef:3, couleur:"#2563eb" },
  { id:2, nom:"Français",        coef:3, couleur:"#7c3aed" },
  { id:3, nom:"SVT",             coef:2, couleur:"#059669" },
  { id:4, nom:"Histoire-Géo",    coef:2, couleur:"#d97706" },
  { id:5, nom:"Physique-Chimie", coef:2, couleur:"#dc2626" },
  { id:6, nom:"Anglais",         coef:2, couleur:"#0891b2" },
]

const CLASSES = ["3ème A", "4ème B", "5ème A"]
const TYPES_EVAL = ["Devoir 1", "Devoir 2", "Devoir 3", "Examen", "Interrogation", "TP"]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(e: any) {
  return `${e.prenom[0]}${e.nom[0]}`
}
const COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"]
function avatarColor(id: number) { return COLORS[id % COLORS.length] }

function Avatar({ eleve, size=36 }: any) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: avatarColor(eleve.id),
      color:"#fff", display:"flex", alignItems:"center",
      justifyContent:"center", fontWeight:700,
      fontSize: size * 0.35, flexShrink:0
    }}>
      {initials(eleve)}
    </div>
  )
}

function Badge({ label, color }: { label:string, color:string }) {
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:600, background:color+"22", color
    }}>{label}</span>
  )
}

function Toast({ msg, type, onClose }: any) {
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      background: type==="success" ? "#059669" : "#dc2626",
      color:"#fff", padding:"12px 20px", borderRadius:12,
      fontSize:14, fontWeight:500,
      boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
      display:"flex", alignItems:"center", gap:12,
      animation:"slideIn .3s ease"
    }}>
      <span>{type==="success" ? "✅" : "❌"}</span>
      {msg}
      <button onClick={onClose} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:16,marginLeft:8}}>✕</button>
    </div>
  )
}

// ─── FORMULAIRE SAISIE NOTES ─────────────────────────────────────────────────
function SaisieNotesForm({ onSave }: { onSave: (notes: Note[], meta: { typeEval: string, trimestre: number, classe: string, matiereId: number }) => void | Promise<void> }) {
  const [classe, setClasse] = useState("3ème A")
  const [matiereId, setMatiereId] = useState(1)
  const [trimestre, setTrimestre] = useState(1)
  const [typeEval, setTypeEval] = useState("Devoir 1")
  const [valeurs, setValeurs] = useState<Record<number,string>>({})
  const [commentaires, setCommentaires] = useState<Record<number,string>>({})
  const [showComment, setShowComment] = useState<number|null>(null)
  const [errors, setErrors] = useState<Record<number,string>>({})

  const elevesClasse = ELEVES.filter(e => e.classe === classe)
  const matiere = MATIERES.find(m => m.id === matiereId)

  const validateNote = (val: string) => {
    const n = parseFloat(val)
    return !isNaN(n) && n >= 0 && n <= 20
  }

  const setValeur = (eleveId: number, val: string) => {
    setValeurs(prev => ({ ...prev, [eleveId]: val }))
    if (val && !validateNote(val)) {
      setErrors(prev => ({ ...prev, [eleveId]: "Entre 0 et 20" }))
    } else {
      setErrors(prev => { const e = {...prev}; delete e[eleveId]; return e })
    }
  }

  const rempliCount = Object.values(valeurs).filter(v => v !== "").length
  const totalEleves = elevesClasse.length
  const pct = totalEleves > 0 ? Math.round((rempliCount / totalEleves) * 100) : 0

  const handleSave = () => {
    const notes: Note[] = []
    for (const eleve of elevesClasse) {
      const val = valeurs[eleve.id]
      if (val !== undefined && val !== "") {
        if (!validateNote(val)) return
        notes.push({
          eleveId: eleve.id,
          matiereId,
          valeur: parseFloat(val),
          typeEval,
          trimestre,
          commentaire: commentaires[eleve.id] || "",
        })
      }
    }
    onSave(notes, { typeEval, trimestre, classe, matiereId })
    setValeurs({})
    setCommentaires({})
  }

  const moyenneClasse = () => {
    const vals = Object.values(valeurs).filter(v => v !== "" && validateNote(v)).map(v => parseFloat(v))
    if (!vals.length) return null
    return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1)
  }

  return (
    <div>
      {/* Filtres */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20,
        background:"#f8f9ff", borderRadius:12, padding:16
      }}>
        <div>
          <label style={S.label}>Classe</label>
          <select style={S.select} value={classe} onChange={e => setClasse(e.target.value)}>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Matière</label>
          <select style={S.select} value={matiereId} onChange={e => setMatiereId(parseInt(e.target.value))}>
            {MATIERES.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Trimestre</label>
          <select style={S.select} value={trimestre} onChange={e => setTrimestre(parseInt(e.target.value))}>
            <option value={1}>Trimestre 1</option>
            <option value={2}>Trimestre 2</option>
            <option value={3}>Trimestre 3</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Type d'évaluation</label>
          <select style={S.select} value={typeEval} onChange={e => setTypeEval(e.target.value)}>
            {TYPES_EVAL.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* En-tête matière + progression */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:12, height:12, borderRadius:"50%", background: matiere?.couleur}}/>
          <strong style={{fontSize:15}}>{matiere?.nom}</strong>
          <span style={{fontSize:12, color:"#888"}}>coeff. {matiere?.coef}</span>
          <Badge label={`T${trimestre} · ${typeEval}`} color="#2563eb"/>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          {moyenneClasse() && (
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:11, color:"#888"}}>Moy. saisie : </span>
              <strong style={{color: parseFloat(moyenneClasse()!) >= 10 ? "#059669" : "#dc2626"}}>
                {moyenneClasse()}/20
              </strong>
            </div>
          )}
          <div style={{textAlign:"right"}}>
            <span style={{fontSize:11, color:"#888"}}>{rempliCount}/{totalEleves} élèves</span>
            <div style={{width:80, height:5, background:"#e5e7eb", borderRadius:3, marginTop:3, overflow:"hidden"}}>
              <div style={{width:`${pct}%`, height:"100%", background:"#2563eb", borderRadius:3, transition:"width .3s"}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau de saisie */}
      <div style={{border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", marginBottom:16}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontSize:14}}>
          <thead>
            <tr style={{background:"#1a1a2e", color:"#fff"}}>
              <th style={{...S.th, color:"#fff", background:"transparent", width:40}}>#</th>
              <th style={{...S.th, color:"#fff", background:"transparent"}}>Élève</th>
              <th style={{...S.th, color:"#fff", background:"transparent", width:130}}>Note /20</th>
              <th style={{...S.th, color:"#fff", background:"transparent", width:50}}>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {elevesClasse.map((eleve, i) => (
              <tr key={eleve.id} style={{background: i%2===0 ? "#fff" : "#fafbff", borderBottom:"1px solid #f0f0f0"}}>
                <td style={{...S.td, color:"#aaa", fontSize:12, textAlign:"center"}}>{i+1}</td>
                <td style={S.td}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <Avatar eleve={eleve} size={32}/>
                    <div>
                      <p style={{margin:0, fontWeight:600, fontSize:13}}>{eleve.prenom} {eleve.nom}</p>
                      <p style={{margin:0, fontSize:11, color:"#888"}}>{eleve.classe}</p>
                    </div>
                  </div>
                </td>
                <td style={S.td}>
                  <div style={{position:"relative"}}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder="—"
                      value={valeurs[eleve.id] || ""}
                      onChange={e => setValeur(eleve.id, e.target.value)}
                      style={{
                        width:"100%", padding:"7px 10px",
                        border: errors[eleve.id] ? "2px solid #dc2626" : "1.5px solid #e5e7eb",
                        borderRadius:8, fontSize:14, textAlign:"center",
                        background: valeurs[eleve.id]
                          ? parseFloat(valeurs[eleve.id]) >= 10 ? "#f0fdf4" : "#fef2f2"
                          : "#fff",
                        color: valeurs[eleve.id]
                          ? parseFloat(valeurs[eleve.id]) >= 10 ? "#059669" : "#dc2626"
                          : "#333",
                        fontWeight: valeurs[eleve.id] ? 700 : 400,
                        outline:"none",
                      }}
                    />
                    {errors[eleve.id] && (
                      <span style={{position:"absolute", right:-60, top:8, fontSize:10, color:"#dc2626", whiteSpace:"nowrap"}}>
                        {errors[eleve.id]}
                      </span>
                    )}
                  </div>
                  {showComment === eleve.id && (
                    <input
                      placeholder="Appréciation..."
                      value={commentaires[eleve.id] || ""}
                      onChange={e => setCommentaires(prev => ({...prev, [eleve.id]: e.target.value}))}
                      style={{width:"100%", marginTop:4, padding:"5px 8px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12}}
                    />
                  )}
                </td>
                <td style={{...S.td, textAlign:"center"}}>
                  <button
                    onClick={() => setShowComment(showComment === eleve.id ? null : eleve.id)}
                    title="Ajouter une appréciation"
                    style={{
                      background: commentaires[eleve.id] ? "#e0f2fe" : "none",
                      border:"none", cursor:"pointer", fontSize:16,
                      borderRadius:6, padding:"4px 6px"
                    }}
                  >
                    {commentaires[eleve.id] ? "💬" : "💭"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <button
          onClick={() => { setValeurs({}); setCommentaires({}); setErrors({}) }}
          style={{padding:"9px 18px", background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", color:"#666"}}
        >
          Effacer tout
        </button>
        <button
          onClick={handleSave}
          disabled={rempliCount === 0}
          style={{
            padding:"10px 24px", background: rempliCount > 0 ? "#2563eb" : "#93c5fd",
            color:"#fff", border:"none", borderRadius:8, fontSize:14,
            fontWeight:600, cursor: rempliCount > 0 ? "pointer" : "not-allowed"
          }}
        >
          💾 Enregistrer {rempliCount > 0 ? `(${rempliCount} notes)` : ""}
        </button>
      </div>
    </div>
  )
}

// ─── FORMULAIRE ABSENCES ──────────────────────────────────────────────────────
function SaisieAbsencesForm({ onSave }: { onSave: (a: Absence) => void | Promise<void> }) {
  const [form, setForm] = useState<Absence>({
    eleveId: 0,
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: new Date().toISOString().split("T")[0],
    motif: "",
    justifiee: false,
  })
  const [search, setSearch] = useState("")

  const filtered = ELEVES.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedEleve = ELEVES.find(e => e.id === form.eleveId)

  const handleSave = () => {
    if (!form.eleveId || !form.dateDebut) return
    onSave(form)
    setForm({ eleveId:0, dateDebut: new Date().toISOString().split("T")[0], dateFin: new Date().toISOString().split("T")[0], motif:"", justifiee:false })
    setSearch("")
  }

  return (
    <div>
      {/* Sélection élève */}
      <div style={{marginBottom:16}}>
        <label style={S.label}>Rechercher un élève</label>
        <input
          style={S.input}
          placeholder="Nom ou prénom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <div style={{border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", maxHeight:180, overflowY:"auto", marginTop:4}}>
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => { setForm(prev => ({...prev, eleveId: e.id})); setSearch("") }}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  cursor:"pointer", background: form.eleveId===e.id ? "#eff6ff" : "#fff",
                  borderBottom:"1px solid #f5f5f5"
                }}
              >
                <Avatar eleve={e} size={28}/>
                <div>
                  <p style={{margin:0, fontSize:13, fontWeight:500}}>{e.prenom} {e.nom}</p>
                  <p style={{margin:0, fontSize:11, color:"#888"}}>{e.classe}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedEleve && (
          <div style={{display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#eff6ff", borderRadius:8, marginTop:8, border:"1.5px solid #bfdbfe"}}>
            <Avatar eleve={selectedEleve} size={32}/>
            <div>
              <p style={{margin:0, fontWeight:600}}>{selectedEleve.prenom} {selectedEleve.nom}</p>
              <p style={{margin:0, fontSize:12, color:"#888"}}>{selectedEleve.classe}</p>
            </div>
            <button onClick={() => setForm(prev => ({...prev, eleveId:0}))} style={{marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#888", fontSize:16}}>✕</button>
          </div>
        )}
      </div>

      {/* Dates */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
        <div>
          <label style={S.label}>Date de début</label>
          <input type="date" style={S.input} value={form.dateDebut}
            onChange={e => setForm(prev => ({...prev, dateDebut: e.target.value}))}/>
        </div>
        <div>
          <label style={S.label}>Date de fin</label>
          <input type="date" style={S.input} value={form.dateFin}
            onChange={e => setForm(prev => ({...prev, dateFin: e.target.value}))}/>
        </div>
      </div>

      {/* Motif */}
      <div style={{marginBottom:14}}>
        <label style={S.label}>Motif (optionnel)</label>
        <input style={S.input} placeholder="Maladie, deuil, voyage..." value={form.motif}
          onChange={e => setForm(prev => ({...prev, motif: e.target.value}))}/>
      </div>

      {/* Justifiée */}
      <div style={{marginBottom:20}}>
        <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14}}>
          <div
            onClick={() => setForm(prev => ({...prev, justifiee: !prev.justifiee}))}
            style={{
              width:44, height:24, borderRadius:12,
              background: form.justifiee ? "#059669" : "#e5e7eb",
              position:"relative", transition:"background .2s", flexShrink:0, cursor:"pointer"
            }}
          >
            <div style={{
              position:"absolute", top:2, left: form.justifiee ? 22 : 2,
              width:20, height:20, borderRadius:"50%", background:"#fff",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left .2s"
            }}/>
          </div>
          <span style={{color: form.justifiee ? "#059669" : "#666", fontWeight: form.justifiee ? 600 : 400}}>
            Absence {form.justifiee ? "justifiée ✓" : "non justifiée"}
          </span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={!form.eleveId}
        style={{
          width:"100%", padding:"11px", background: form.eleveId ? "#dc2626" : "#fca5a5",
          color:"#fff", border:"none", borderRadius:8, fontSize:14,
          fontWeight:600, cursor: form.eleveId ? "pointer" : "not-allowed"
        }}
      >
        📅 Enregistrer l'absence
      </button>
    </div>
  )
}

// ─── FORMULAIRE RETARDS ───────────────────────────────────────────────────────
function SaisieRetardsForm({ onSave }: { onSave: (r: Retard) => void | Promise<void> }) {
  const [form, setForm] = useState<Retard>({
    eleveId: 0,
    date: new Date().toISOString().split("T")[0],
    heureArrivee: "",
    motif: "",
    justifie: false,
  })
  const [search, setSearch] = useState("")

  const filtered = ELEVES.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase())
  )
  const selectedEleve = ELEVES.find(e => e.id === form.eleveId)

  const handleSave = () => {
    if (!form.eleveId || !form.date || !form.heureArrivee) return
    onSave(form)
    setForm({ eleveId:0, date: new Date().toISOString().split("T")[0], heureArrivee:"", motif:"", justifie:false })
    setSearch("")
  }

  return (
    <div>
      {/* Sélection élève */}
      <div style={{marginBottom:16}}>
        <label style={S.label}>Rechercher un élève</label>
        <input style={S.input} placeholder="Nom ou prénom..."
          value={search} onChange={e => setSearch(e.target.value)}/>
        {search && (
          <div style={{border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", maxHeight:180, overflowY:"auto", marginTop:4}}>
            {filtered.map(e => (
              <div key={e.id} onClick={() => { setForm(prev => ({...prev, eleveId: e.id})); setSearch("") }}
                style={{display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background:"#fff", borderBottom:"1px solid #f5f5f5"}}>
                <Avatar eleve={e} size={28}/>
                <div>
                  <p style={{margin:0, fontSize:13, fontWeight:500}}>{e.prenom} {e.nom}</p>
                  <p style={{margin:0, fontSize:11, color:"#888"}}>{e.classe}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedEleve && (
          <div style={{display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#fff7ed", borderRadius:8, marginTop:8, border:"1.5px solid #fed7aa"}}>
            <Avatar eleve={selectedEleve} size={32}/>
            <div>
              <p style={{margin:0, fontWeight:600}}>{selectedEleve.prenom} {selectedEleve.nom}</p>
              <p style={{margin:0, fontSize:12, color:"#888"}}>{selectedEleve.classe}</p>
            </div>
            <button onClick={() => setForm(prev => ({...prev, eleveId:0}))} style={{marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#888", fontSize:16}}>✕</button>
          </div>
        )}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
        <div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date}
            onChange={e => setForm(prev => ({...prev, date: e.target.value}))}/>
        </div>
        <div>
          <label style={S.label}>Heure d'arrivée</label>
          <input type="time" style={S.input} value={form.heureArrivee}
            onChange={e => setForm(prev => ({...prev, heureArrivee: e.target.value}))}/>
        </div>
      </div>

      <div style={{marginBottom:14}}>
        <label style={S.label}>Motif (optionnel)</label>
        <input style={S.input} placeholder="Transport, réveil tardif..."
          value={form.motif} onChange={e => setForm(prev => ({...prev, motif: e.target.value}))}/>
      </div>

      <div style={{marginBottom:20}}>
        <label style={{display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14}}>
          <div
            onClick={() => setForm(prev => ({...prev, justifie: !prev.justifie}))}
            style={{
              width:44, height:24, borderRadius:12,
              background: form.justifie ? "#059669" : "#e5e7eb",
              position:"relative", transition:"background .2s", flexShrink:0, cursor:"pointer"
            }}
          >
            <div style={{
              position:"absolute", top:2, left: form.justifie ? 22 : 2,
              width:20, height:20, borderRadius:"50%", background:"#fff",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)", transition:"left .2s"
            }}/>
          </div>
          <span style={{color: form.justifie ? "#059669" : "#666", fontWeight: form.justifie ? 600 : 400}}>
            Retard {form.justifie ? "justifié ✓" : "non justifié"}
          </span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={!form.eleveId || !form.heureArrivee}
        style={{
          width:"100%", padding:"11px",
          background: (form.eleveId && form.heureArrivee) ? "#d97706" : "#fcd34d",
          color:"#fff", border:"none", borderRadius:8, fontSize:14,
          fontWeight:600, cursor: (form.eleveId && form.heureArrivee) ? "pointer" : "not-allowed"
        }}
      >
        ⏰ Enregistrer le retard
      </button>
    </div>
  )
}

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────
function Historique({ notes, absences, retards }: any) {
  const [tab, setTab] = useState<"notes"|"absences"|"retards">("notes")

  return (
    <div>
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        {[
          {id:"notes", label:`Notes (${notes.length})`, color:"#2563eb"},
          {id:"absences", label:`Absences (${absences.length})`, color:"#dc2626"},
          {id:"retards", label:`Retards (${retards.length})`, color:"#d97706"},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              padding:"7px 16px", borderRadius:8, fontSize:13, cursor:"pointer",
              background: tab===t.id ? t.color : "#fff",
              color: tab===t.id ? "#fff" : "#666",
              border: tab===t.id ? `1.5px solid ${t.color}` : "1px solid #e5e7eb",
              fontWeight: tab===t.id ? 600 : 400
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="notes" && (
        notes.length === 0
          ? <p style={{textAlign:"center", color:"#999", padding:32}}>Aucune note enregistrée</p>
          : notes.map((n: any, i: number) => {
              const el = ELEVES.find(e => e.id === n.eleveId)
              const mat = MATIERES.find(m => m.id === n.matiereId)
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f5f5f5"}}>
                  {el && <Avatar eleve={el} size={30}/>}
                  <div style={{flex:1}}>
                    <p style={{margin:0, fontSize:13, fontWeight:500}}>{el?.prenom} {el?.nom}</p>
                    <p style={{margin:0, fontSize:12, color:"#888"}}>{mat?.nom} · {n.typeEval} · T{n.trimestre}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:18, fontWeight:700, color: n.valeur>=10?"#059669":"#dc2626"}}>{n.valeur}</span>
                    <span style={{fontSize:12, color:"#888"}}>/20</span>
                  </div>
                </div>
              )
            })
      )}

      {tab==="absences" && (
        absences.length === 0
          ? <p style={{textAlign:"center", color:"#999", padding:32}}>Aucune absence enregistrée</p>
          : absences.map((a: any, i: number) => {
              const el = ELEVES.find(e => e.id === a.eleveId)
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f5f5f5"}}>
                  {el && <Avatar eleve={el} size={30}/>}
                  <div style={{flex:1}}>
                    <p style={{margin:0, fontSize:13, fontWeight:500}}>{el?.prenom} {el?.nom}</p>
                    <p style={{margin:0, fontSize:12, color:"#888"}}>{a.dateDebut} → {a.dateFin}{a.motif ? ` · ${a.motif}` : ""}</p>
                  </div>
                  <span style={{padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background: a.justifiee?"#dcfce7":"#fee2e2", color: a.justifiee?"#059669":"#dc2626"}}>
                    {a.justifiee ? "Justifiée" : "Non justifiée"}
                  </span>
                </div>
              )
            })
      )}

      {tab==="retards" && (
        retards.length === 0
          ? <p style={{textAlign:"center", color:"#999", padding:32}}>Aucun retard enregistré</p>
          : retards.map((r: any, i: number) => {
              const el = ELEVES.find(e => e.id === r.eleveId)
              return (
                <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f5f5f5"}}>
                  {el && <Avatar eleve={el} size={30}/>}
                  <div style={{flex:1}}>
                    <p style={{margin:0, fontSize:13, fontWeight:500}}>{el?.prenom} {el?.nom}</p>
                    <p style={{margin:0, fontSize:12, color:"#888"}}>{r.date} · Arrivée : {r.heureArrivee}{r.motif ? ` · ${r.motif}` : ""}</p>
                  </div>
                  <span style={{padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background: r.justifie?"#dcfce7":"#fee2e2", color: r.justifie?"#059669":"#dc2626"}}>
                    {r.justifie ? "Justifié" : "Non justifié"}
                  </span>
                </div>
              )
            })
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  label: { display:"block" as const, fontSize:12, fontWeight:500 as const, color:"#555", marginBottom:5 },
  select: { width:"100%", padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, background:"#fff", outline:"none" },
  input: { width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff", boxSizing:"border-box" as const },
  th: { textAlign:"left" as const, padding:"10px 14px", fontSize:12, fontWeight:600 as const, color:"#888", background:"#f8f9fc", borderBottom:"1px solid #eee" },
  td: { padding:"10px 14px", verticalAlign:"middle" as const },
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function SaisieApp() {
  const [role, setRole] = useState<"professeur"|"surveillant">("professeur")
  const [tab, setTab] = useState<"saisie"|"historique">("saisie")
  const [toast, setToast] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [retards, setRetards] = useState<Retard[]>([])
  const [absTab, setAbsTab] = useState<"absence"|"retard">("absence")

  const showToast = (msg: string, type="success") => {
    setToast({msg, type})
    setTimeout(() => setToast(null), 3000)
  }

  const getUser = () => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return null }
  }

  const addPoints = async (action: string, description: string, ptsKey: string, defaultPts: number) => {
    const user = getUser()
    if (!user?.id) return
    try {
      const cfg = await fetch('/api/points?type=config').then(r => r.json())
      const pts = cfg?.data?.[ptsKey] || defaultPts
      await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(user.id),
          userNom: user.nom,
          userPrenom: user.prenom,
          userRole: user.role,
          action,
          description,
          points: pts,
          annee: '2024-2025',
        }),
      })
      return { pts, cfg: cfg?.data }
    } catch { return null }
  }

  const handleSaveNotes = async (newNotes: Note[], meta?: { typeEval: string, trimestre: number, classe: string, matiereId: number }) => {
    setNotes(prev => [...newNotes, ...prev])
    showToast(`✅ ${newNotes.length} note(s) enregistrée(s) avec succès !`)

    const user = getUser()
    if (user?.id) {
      try {
        const cfg = await fetch('/api/points?type=config').then(r => r.json())
        const ptsParNote = cfg?.data?.pts_note || 10
        const ptsTotal = newNotes.length * ptsParNote

        // Points pour les notes saisies
        await fetch('/api/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: String(user.id),
            userNom: user.nom,
            userPrenom: user.prenom,
            userRole: user.role,
            action: 'note',
            description: `${newNotes.length} note(s) saisie(s) — ${meta?.typeEval || ''} T${meta?.trimestre || ''}`,
            points: ptsTotal,
            annee: '2024-2025',
          }),
        })

        // Bonus si toute la classe est notée
        const elevesClasse = ELEVES.filter(e => e.classe === classe)
        const toutesNotees = elevesClasse.every(e =>
          newNotes.some(n => n.eleveId === e.id) ||
          notes.some(n => n.eleveId === e.id && n.matiereId === (meta?.matiereId || 0) && n.trimestre === (meta?.trimestre || 0))
        )
        if (toutesNotees) {
          const ptsBonus = cfg?.data?.pts_classe_complete || 100
          await fetch('/api/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: String(user.id),
              userNom: user.nom,
              userPrenom: user.prenom,
              userRole: user.role,
              action: 'classe_complete',
              description: `Bonus — Classe ${meta?.classe || ''} 100% notée T${meta?.trimestre || ''}`,
              points: ptsBonus,
              annee: '2024-2025',
            }),
          })
          showToast(`🎉 Bonus +${ptsBonus} pts — Classe complète !`)
        }
      } catch {}
    }
    setTab("historique")
  }

  const handleSaveAbsence = async (a: Absence) => {
    setAbsences(prev => [a, ...prev])
    const el = ELEVES.find(e => e.id === a.eleveId)
    showToast(`✅ Absence de ${el?.prenom} ${el?.nom} enregistrée`)
    await addPoints('absence', `Absence enregistrée — ${el?.prenom} ${el?.nom}`, 'pts_absence', 15)
    setTab("historique")
  }

  const handleSaveRetard = async (r: Retard) => {
    setRetards(prev => [r, ...prev])
    const el = ELEVES.find(e => e.id === r.eleveId)
    showToast(`✅ Retard de ${el?.prenom} ${el?.nom} enregistré`)
    await addPoints('retard', `Retard enregistré — ${el?.prenom} ${el?.nom}`, 'pts_retard', 10)
    setTab("historique")
  }

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:24}}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Header */}
      <div style={{maxWidth:860, margin:"0 auto"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24}}>
          <div>
            <h1 style={{fontSize:22, fontWeight:700, color:"#1a1a2e", margin:0}}>
              {role === "professeur" ? "📝 Saisie des notes" : "👁️ Suivi de l'assiduité"}
            </h1>
            <p style={{fontSize:13, color:"#888", margin:"4px 0 0"}}>
              {role === "professeur" ? "Enregistrez les notes par matière et trimestre" : "Enregistrez les absences et retards des élèves"}
            </p>
          </div>
          {/* Toggle rôle */}
          <div style={{display:"flex", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:4, gap:4}}>
            {(["professeur","surveillant"] as const).map(r => (
              <button key={r} onClick={() => { setRole(r); setTab("saisie") }}
                style={{
                  padding:"7px 16px", borderRadius:7, fontSize:13, cursor:"pointer",
                  background: role===r ? "#1a1a2e" : "transparent",
                  color: role===r ? "#fff" : "#666",
                  border:"none", fontWeight: role===r ? 600 : 400, transition:"all .2s"
                }}>
                {r === "professeur" ? "Professeur" : "Surveillant"}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:8, marginBottom:20}}>
          {[
            {id:"saisie", label: role==="professeur" ? "✏️ Nouvelle saisie" : "➕ Enregistrer"},
            {id:"historique", label:`📋 Historique (${notes.length + absences.length + retards.length})`},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{
                padding:"9px 20px", borderRadius:8, fontSize:13, cursor:"pointer",
                background: tab===t.id ? "#1a1a2e" : "#fff",
                color: tab===t.id ? "#fff" : "#666",
                border: tab===t.id ? "none" : "1px solid #e5e7eb",
                fontWeight: tab===t.id ? 600 : 400
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{background:"#fff", borderRadius:16, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          {tab === "saisie" && role === "professeur" && (
            <SaisieNotesForm onSave={handleSaveNotes}/>
          )}

          {tab === "saisie" && role === "surveillant" && (
            <div>
              <div style={{display:"flex", gap:8, marginBottom:20}}>
                {[
                  {id:"absence", label:"📅 Absence", color:"#dc2626"},
                  {id:"retard", label:"⏰ Retard", color:"#d97706"},
                ].map(t => (
                  <button key={t.id} onClick={() => setAbsTab(t.id as any)}
                    style={{
                      padding:"8px 20px", borderRadius:8, fontSize:13, cursor:"pointer",
                      background: absTab===t.id ? t.color : "#fff",
                      color: absTab===t.id ? "#fff" : "#666",
                      border: absTab===t.id ? "none" : "1px solid #e5e7eb",
                      fontWeight: absTab===t.id ? 600 : 400
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {absTab === "absence"
                ? <SaisieAbsencesForm onSave={handleSaveAbsence}/>
                : <SaisieRetardsForm onSave={handleSaveRetard}/>
              }
            </div>
          )}

          {tab === "historique" && (
            <Historique notes={notes} absences={absences} retards={retards}/>
          )}
        </div>
      </div>
    </div>
  )
}
