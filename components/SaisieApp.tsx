'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Classe { id: string; nom: string; niveau: string }
interface Matiere { id: string; nom: string; coefficient: number; couleur: string }
interface Eleve { id: string; nom: string; prenom: string; matricule: string; classeId: string | null }

interface Note {
  eleveId: string
  matiereId: string
  valeur: number
  typeEval: string
  trimestre: number
  commentaire: string
}

interface Absence {
  eleveId: string
  dateDebut: string
  dateFin: string
  motif: string
  justifiee: boolean
}

interface Retard {
  eleveId: string
  date: string
  heureArrivee: string
  motif: string
  justifie: boolean
}

const TYPES_EVAL = ["Devoir 1", "Devoir 2", "Devoir 3", "Examen", "Interrogation", "TP"]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 } return Math.abs(h) }
const COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2"]
function avatarColor(id: string) { return COLORS[hashStr(id) % COLORS.length] }

function Avatar({ eleve, size=36 }: { eleve: Eleve, size?: number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: avatarColor(eleve.id),
      color:"#fff", display:"flex", alignItems:"center",
      justifyContent:"center", fontWeight:700,
      fontSize: size * 0.35, flexShrink:0
    }}>
      {eleve.prenom?.[0]}{eleve.nom?.[0]}
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
function SaisieNotesForm({ classes, eleves, matieres, onSave }: {
  classes: Classe[], eleves: Eleve[], matieres: Matiere[],
  onSave: (notes: Note[], meta: { typeEval: string, trimestre: number, classeId: string, matiereId: string }) => void | Promise<void>
}) {
  const [classeId, setClasseId] = useState(classes[0]?.id || "")
  const [matiereId, setMatiereId] = useState(matieres[0]?.id || "")
  const [trimestre, setTrimestre] = useState(1)
  const [typeEval, setTypeEval] = useState("Devoir 1")
  const [valeurs, setValeurs] = useState<Record<string,string>>({})
  const [commentaires, setCommentaires] = useState<Record<string,string>>({})
  const [showComment, setShowComment] = useState<string|null>(null)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const elevesClasse = eleves.filter(e => e.classeId === classeId)
  const matiere = matieres.find(m => m.id === matiereId)

  const validateNote = (val: string) => {
    const n = parseFloat(val)
    return !isNaN(n) && n >= 0 && n <= 20
  }

  const setValeur = (eleveId: string, val: string) => {
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
    if (!notes.length) return
    onSave(notes, { typeEval, trimestre, classeId, matiereId })
    setValeurs({})
    setCommentaires({})
  }

  const moyenneClasse = () => {
    const vals = Object.values(valeurs).filter(v => v !== "" && validateNote(v)).map(v => parseFloat(v))
    if (!vals.length) return null
    return (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1)
  }

  if (!classes.length) return <p style={{textAlign:"center", color:"#999", padding:32}}>Aucune classe pour l'instant — créez-en une dans « Classes & Profs ».</p>
  if (!matieres.length) return <p style={{textAlign:"center", color:"#999", padding:32}}>Chargement des matières...</p>

  return (
    <div>
      {/* Filtres */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20,
        background:"#f8f9ff", borderRadius:12, padding:16
      }}>
        <div>
          <label style={S.label}>Classe</label>
          <select style={S.select} value={classeId} onChange={e => setClasseId(e.target.value)}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Matière</label>
          <select style={S.select} value={matiereId} onChange={e => setMatiereId(e.target.value)}>
            {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
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
          <span style={{fontSize:12, color:"#888"}}>coeff. {matiere?.coefficient}</span>
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
            {elevesClasse.length === 0 && (
              <tr><td colSpan={4} style={{textAlign:"center", padding:24, color:"#999"}}>Aucun élève dans cette classe</td></tr>
            )}
            {elevesClasse.map((eleve, i) => (
              <tr key={eleve.id} style={{background: i%2===0 ? "#fff" : "#fafbff", borderBottom:"1px solid #f0f0f0"}}>
                <td style={{...S.td, color:"#aaa", fontSize:12, textAlign:"center"}}>{i+1}</td>
                <td style={S.td}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <Avatar eleve={eleve} size={32}/>
                    <div>
                      <p style={{margin:0, fontWeight:600, fontSize:13}}>{eleve.prenom} {eleve.nom}</p>
                      <p style={{margin:0, fontSize:11, color:"#888"}}>{eleve.matricule}</p>
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

// ─── Sélecteur d'élève partagé (absences / retards) ──────────────────────────
function SelecteurEleve({ eleves, classes, eleveId, onSelect, accent }: {
  eleves: Eleve[], classes: Classe[], eleveId: string, onSelect: (id: string) => void, accent: string
}) {
  const [search, setSearch] = useState("")
  const nomClasse = (classeId: string | null) => classes.find(c => c.id === classeId)?.nom || "Sans classe"
  const filtered = eleves.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase())
  )
  const selectedEleve = eleves.find(e => e.id === eleveId)

  return (
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
              onClick={() => { onSelect(e.id); setSearch("") }}
              style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                cursor:"pointer", background: eleveId===e.id ? "#eff6ff" : "#fff",
                borderBottom:"1px solid #f5f5f5"
              }}
            >
              <Avatar eleve={e} size={28}/>
              <div>
                <p style={{margin:0, fontSize:13, fontWeight:500}}>{e.prenom} {e.nom}</p>
                <p style={{margin:0, fontSize:11, color:"#888"}}>{nomClasse(e.classeId)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedEleve && (
        <div style={{display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:accent+"14", borderRadius:8, marginTop:8, border:`1.5px solid ${accent}44`}}>
          <Avatar eleve={selectedEleve} size={32}/>
          <div>
            <p style={{margin:0, fontWeight:600}}>{selectedEleve.prenom} {selectedEleve.nom}</p>
            <p style={{margin:0, fontSize:12, color:"#888"}}>{nomClasse(selectedEleve.classeId)}</p>
          </div>
          <button onClick={() => onSelect("")} style={{marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#888", fontSize:16}}>✕</button>
        </div>
      )}
    </div>
  )
}

// ─── FORMULAIRE ABSENCES ──────────────────────────────────────────────────────
function SaisieAbsencesForm({ eleves, classes, onSave }: { eleves: Eleve[], classes: Classe[], onSave: (a: Absence) => void | Promise<void> }) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState<Absence>({ eleveId: "", dateDebut: today, dateFin: today, motif: "", justifiee: false })

  const handleSave = () => {
    if (!form.eleveId || !form.dateDebut) return
    onSave(form)
    setForm({ eleveId:"", dateDebut: today, dateFin: today, motif:"", justifiee:false })
  }

  return (
    <div>
      <SelecteurEleve eleves={eleves} classes={classes} eleveId={form.eleveId} onSelect={id => setForm(prev => ({...prev, eleveId: id}))} accent="#2563eb"/>

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

      <div style={{marginBottom:14}}>
        <label style={S.label}>Motif (optionnel)</label>
        <input style={S.input} placeholder="Maladie, deuil, voyage..." value={form.motif}
          onChange={e => setForm(prev => ({...prev, motif: e.target.value}))}/>
      </div>

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
function SaisieRetardsForm({ eleves, classes, onSave }: { eleves: Eleve[], classes: Classe[], onSave: (r: Retard) => void | Promise<void> }) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState<Retard>({ eleveId: "", date: today, heureArrivee: "", motif: "", justifie: false })

  const handleSave = () => {
    if (!form.eleveId || !form.date || !form.heureArrivee) return
    onSave(form)
    setForm({ eleveId:"", date: today, heureArrivee:"", motif:"", justifie:false })
  }

  return (
    <div>
      <SelecteurEleve eleves={eleves} classes={classes} eleveId={form.eleveId} onSelect={id => setForm(prev => ({...prev, eleveId: id}))} accent="#d97706"/>

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
function Historique({ notes, absences, retards, eleves, matieres }: {
  notes: Note[], absences: Absence[], retards: Retard[], eleves: Eleve[], matieres: Matiere[]
}) {
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
          : notes.map((n, i) => {
              const el = eleves.find(e => e.id === n.eleveId)
              const mat = matieres.find(m => m.id === n.matiereId)
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
          : absences.map((a, i) => {
              const el = eleves.find(e => e.id === a.eleveId)
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
          : retards.map((r, i) => {
              const el = eleves.find(e => e.id === r.eleveId)
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
export default function SaisieApp({ role }: { role: "professeur" | "surveillant" }) {
  const [tab, setTab] = useState<"saisie"|"historique">("saisie")
  const [toast, setToast] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<Classe[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
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

  useEffect(() => {
    const charger = async () => {
      setLoading(true)
      try {
        const [rc, re, rm] = await Promise.all([authFetch('/api/classes'), authFetch('/api/eleves'), authFetch('/api/matieres')])
        const [dc, de, dm] = await Promise.all([rc.json(), re.json(), rm.json()])
        if (dc.success) setClasses(dc.data || [])
        if (de.success) setEleves(de.data || [])
        if (dm.success) setMatieres(dm.data || [])

        if (role === "professeur") {
          const dn = await authFetch('/api/notes').then(r => r.json())
          if (dn.success) setNotes(dn.data || [])
        } else {
          const [ra, rr] = await Promise.all([authFetch('/api/absences'), authFetch('/api/retards')])
          const [da, dr] = await Promise.all([ra.json(), rr.json()])
          if (da.success) setAbsences(da.data || [])
          if (dr.success) setRetards(dr.data || [])
        }
      } catch {
        showToast("Erreur de chargement", "error")
      }
      setLoading(false)
    }
    charger()
  }, [role])

  const addPoints = async (action: string, description: string, ptsKey: string, defaultPts: number) => {
    const user = getUser()
    if (!user?.id) return
    try {
      const cfg = await authFetch('/api/points?type=config').then(r => r.json())
      const pts = cfg?.data?.[ptsKey] || defaultPts
      await authFetch('/api/points', {
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

  const handleSaveNotes = async (newNotes: Note[], meta: { typeEval: string, trimestre: number, classeId: string, matiereId: string }) => {
    try {
      const res = await authFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: newNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotes(prev => [...(data.data || newNotes), ...prev])
      showToast(`✅ ${newNotes.length} note(s) enregistrée(s) avec succès !`)
    } catch (e: any) {
      showToast(e.message || "Erreur lors de l'enregistrement", "error")
      return
    }

    const user = getUser()
    if (user?.id) {
      try {
        const cfg = await authFetch('/api/points?type=config').then(r => r.json())
        const ptsParNote = cfg?.data?.pts_note || 10
        const ptsTotal = newNotes.length * ptsParNote

        await authFetch('/api/points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: String(user.id),
            userNom: user.nom,
            userPrenom: user.prenom,
            userRole: user.role,
            action: 'note',
            description: `${newNotes.length} note(s) saisie(s) — ${meta.typeEval} T${meta.trimestre}`,
            points: ptsTotal,
            annee: '2024-2025',
          }),
        })

        const elevesClasse = eleves.filter(e => e.classeId === meta.classeId)
        const toutesNotees = elevesClasse.every(e =>
          newNotes.some(n => n.eleveId === e.id) ||
          notes.some(n => n.eleveId === e.id && n.matiereId === meta.matiereId && n.trimestre === meta.trimestre)
        )
        if (toutesNotees) {
          const ptsBonus = cfg?.data?.pts_classe_complete || 100
          const classe = classes.find(c => c.id === meta.classeId)
          await authFetch('/api/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: String(user.id),
              userNom: user.nom,
              userPrenom: user.prenom,
              userRole: user.role,
              action: 'classe_complete',
              description: `Bonus — Classe ${classe?.nom || ''} 100% notée T${meta.trimestre}`,
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
    const el = eleves.find(e => e.id === a.eleveId)
    try {
      const res = await authFetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAbsences(prev => [data.data, ...prev])
      showToast(`✅ Absence de ${el?.prenom} ${el?.nom} enregistrée`)
    } catch (e: any) {
      showToast(e.message || "Erreur lors de l'enregistrement", "error")
      return
    }
    await addPoints('absence', `Absence enregistrée — ${el?.prenom} ${el?.nom}`, 'pts_absence', 15)
    setTab("historique")
  }

  const handleSaveRetard = async (r: Retard) => {
    const el = eleves.find(e => e.id === r.eleveId)
    try {
      const res = await authFetch('/api/retards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRetards(prev => [data.data, ...prev])
      showToast(`✅ Retard de ${el?.prenom} ${el?.nom} enregistré`)
    } catch (e: any) {
      showToast(e.message || "Erreur lors de l'enregistrement", "error")
      return
    }
    await addPoints('retard', `Retard enregistré — ${el?.prenom} ${el?.nom}`, 'pts_retard', 10)
    setTab("historique")
  }

  const totalHistorique = role === "professeur" ? notes.length : absences.length + retards.length

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#f4f6fb", minHeight:"100vh", padding:24}}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Header */}
      <div style={{maxWidth:860, margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22, fontWeight:700, color:"#1a1a2e", margin:0}}>
            {role === "professeur" ? "📝 Saisie des notes" : "👁️ Suivi de l'assiduité"}
          </h1>
          <p style={{fontSize:13, color:"#888", margin:"4px 0 0"}}>
            {role === "professeur" ? "Enregistrez les notes par matière et trimestre" : "Enregistrez les absences et retards des élèves"}
          </p>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:8, marginBottom:20}}>
          {[
            {id:"saisie", label: role==="professeur" ? "✏️ Nouvelle saisie" : "➕ Enregistrer"},
            {id:"historique", label:`📋 Historique (${totalHistorique})`},
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
          {loading ? <p style={{textAlign:"center", color:"#aaa", padding:40}}>⏳ Chargement...</p> : <>
            {tab === "saisie" && role === "professeur" && (
              <SaisieNotesForm classes={classes} eleves={eleves} matieres={matieres} onSave={handleSaveNotes}/>
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
                  ? <SaisieAbsencesForm eleves={eleves} classes={classes} onSave={handleSaveAbsence}/>
                  : <SaisieRetardsForm eleves={eleves} classes={classes} onSave={handleSaveRetard}/>
                }
              </div>
            )}

            {tab === "historique" && (
              <Historique notes={notes} absences={absences} retards={retards} eleves={eleves} matieres={matieres}/>
            )}
          </>}
        </div>
      </div>
    </div>
  )
}
