
'use client'

import { useState } from 'react'

const CLASSES = [
  { id:1, nom:"3ème A", niveau:"3ème" },
  { id:2, nom:"4ème B", niveau:"4ème" },
  { id:3, nom:"5ème A", niveau:"5ème" },
]

const MATIERES = [
  { id:1, nom:"Mathématiques",   coef:3, couleur:"#2563eb" },
  { id:2, nom:"Français",        coef:3, couleur:"#7c3aed" },
  { id:3, nom:"SVT",             coef:2, couleur:"#059669" },
  { id:4, nom:"Histoire-Géo",    coef:2, couleur:"#d97706" },
  { id:5, nom:"Physique-Chimie", coef:2, couleur:"#dc2626" },
  { id:6, nom:"Anglais",         coef:2, couleur:"#0891b2" },
]

const PROFESSEURS = [
  { id:2, nom:"Ouédraogo", prenom:"Safi",   matieres:[1,2], classes:[1,2] },
  { id:3, nom:"Sawadogo",  prenom:"Ismaël", matieres:[3,4], classes:[1,3] },
]

const ELEVES = [
  { id:1,  nom:"Traoré",    prenom:"Aïcha",    classe:1, matricule:"2024-001" },
  { id:2,  nom:"Compaoré",  prenom:"Théo",     classe:1, matricule:"2024-002" },
  { id:3,  nom:"Zongo",     prenom:"Fatima",   classe:2, matricule:"2024-003" },
  { id:4,  nom:"Ouédraogo", prenom:"Brice",    classe:1, matricule:"2024-004" },
  { id:5,  nom:"Sawadogo",  prenom:"Mariam",   classe:2, matricule:"2024-005" },
  { id:6,  nom:"Kaboré",    prenom:"Luc",      classe:3, matricule:"2024-006" },
  { id:7,  nom:"Diallo",    prenom:"Salimata", classe:1, matricule:"2024-007" },
  { id:8,  nom:"Nikiema",   prenom:"Joël",     classe:2, matricule:"2024-008" },
  { id:9,  nom:"Tapsoba",   prenom:"Reine",    classe:3, matricule:"2024-009" },
  { id:10, nom:"Ouattara",  prenom:"Issa",     classe:1, matricule:"2024-010" },
]

const AVATAR_COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#0e7490","#be185d"]

function Avatar({ nom, prenom, id, size=36 }: { nom:string, prenom:string, id:number, size?:number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: AVATAR_COLORS[id % AVATAR_COLORS.length],
      color:"#fff", display:"flex", alignItems:"center",
      justifyContent:"center", fontWeight:700,
      fontSize:size*0.33, flexShrink:0,
    }}>
      {prenom[0]}{nom[0]}
    </div>
  )
}

function NiveauBadge({ niveau }: { niveau:string }) {
  const colors: Record<string,{bg:string,color:string}> = {
    "3ème": { bg:"#ede9fe", color:"#5b21b6" },
    "4ème": { bg:"#dbeafe", color:"#1d4ed8" },
    "5ème": { bg:"#dcfce7", color:"#15803d" },
    "6ème": { bg:"#fef3c7", color:"#b45309" },
  }
  const c = colors[niveau] || { bg:"#f3f4f6", color:"#374151" }
  return (
    <span style={{
      padding:"2px 10px", borderRadius:99, fontSize:11,
      fontWeight:600, background:c.bg, color:c.color
    }}>
      {niveau}
    </span>
  )
}

export default function AdminClasses() {
  const [selectedClasse, setSelectedClasse] = useState<number|null>(null)
  const [view, setView] = useState<"eleves"|"profs">("eleves")
  const [search, setSearch] = useState("")

  const classe = CLASSES.find(c => c.id === selectedClasse)
  const elevesClasse = ELEVES.filter(e => e.classe === selectedClasse)
    .filter(e => `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()))
  const profsClasse = PROFESSEURS.filter(p => p.classes.includes(selectedClasse!))

  // Vue globale — toutes les classes
  if (!selectedClasse) {
    return (
      <div>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#1a1a2e", margin:"0 0 4px" }}>
            Classes & Effectifs
          </h1>
          <p style={{ fontSize:13, color:"#888", margin:0 }}>
            {CLASSES.length} classes · {ELEVES.length} élèves · {PROFESSEURS.length} professeurs
          </p>
        </div>

        {/* Cartes classes */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16, marginBottom:32 }}>
          {CLASSES.map(cl => {
            const eleves = ELEVES.filter(e => e.classe === cl.id)
            const profs = PROFESSEURS.filter(p => p.classes.includes(cl.id))
            return (
              <div
                key={cl.id}
                onClick={() => setSelectedClasse(cl.id)}
                style={{
                  background:"#fff", borderRadius:14, padding:20,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
                  border:"0.5px solid #e5e7eb", cursor:"pointer",
                  transition:"all .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.06)")}
              >
                {/* En-tête */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <div>
                    <h2 style={{ fontSize:20, fontWeight:700, margin:"0 0 4px", color:"#1a1a2e" }}>{cl.nom}</h2>
                    <NiveauBadge niveau={cl.niveau}/>
                  </div>
                  <div style={{
                    width:48, height:48, borderRadius:12,
                    background:"linear-gradient(135deg,#1a1a2e,#2563eb)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22
                  }}>
                    🏛
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                  <div style={{ flex:1, background:"#eff6ff", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                    <p style={{ fontSize:24, fontWeight:700, color:"#2563eb", margin:0 }}>{eleves.length}</p>
                    <p style={{ fontSize:11, color:"#6b7280", margin:0 }}>Élèves</p>
                  </div>
                  <div style={{ flex:1, background:"#f5f3ff", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                    <p style={{ fontSize:24, fontWeight:700, color:"#7c3aed", margin:0 }}>{profs.length}</p>
                    <p style={{ fontSize:11, color:"#6b7280", margin:0 }}>Professeurs</p>
                  </div>
                  <div style={{ flex:1, background:"#f0fdf4", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                    <p style={{ fontSize:24, fontWeight:700, color:"#059669", margin:0 }}>{MATIERES.length}</p>
                    <p style={{ fontSize:11, color:"#6b7280", margin:0 }}>Matières</p>
                  </div>
                </div>

                {/* Aperçu élèves */}
                <div style={{ marginBottom:12 }}>
                  <p style={{ fontSize:11, color:"#888", margin:"0 0 6px", fontWeight:500 }}>ÉLÈVES</p>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {eleves.slice(0,6).map(e => (
                      <Avatar key={e.id} nom={e.nom} prenom={e.prenom} id={e.id} size={28}/>
                    ))}
                    {eleves.length > 6 && (
                      <div style={{
                        width:28, height:28, borderRadius:"50%",
                        background:"#f3f4f6", color:"#6b7280",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, fontWeight:600
                      }}>+{eleves.length-6}</div>
                    )}
                  </div>
                </div>

                {/* Aperçu profs */}
                <div>
                  <p style={{ fontSize:11, color:"#888", margin:"0 0 6px", fontWeight:500 }}>PROFESSEURS</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {profs.map(p => (
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Avatar nom={p.nom} prenom={p.prenom} id={p.id} size={22}/>
                        <span style={{ fontSize:12, color:"#374151" }}>{p.prenom} {p.nom}</span>
                        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
                          {p.matieres.filter(m => {
                            const prof = PROFESSEURS.find(x => x.id === p.id)
                            return prof?.classes.includes(cl.id)
                          }).map(mid => {
                            const mat = MATIERES.find(m => m.id === mid)
                            return mat ? (
                              <span key={mid} style={{
                                fontSize:10, padding:"1px 6px", borderRadius:4,
                                background: mat.couleur+"22", color: mat.couleur, fontWeight:500
                              }}>{mat.nom.split(" ")[0]}</span>
                            ) : null
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid #f3f4f6", display:"flex", justifyContent:"flex-end" }}>
                  <span style={{ fontSize:12, color:"#2563eb", fontWeight:500 }}>Voir le détail →</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Vue globale professeurs */}
        <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"0.5px solid #e5e7eb" }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:"0 0 16px", color:"#1a1a2e" }}>
            👩‍🏫 Tous les professeurs
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {PROFESSEURS.map(p => (
              <div key={p.id} style={{
                border:"0.5px solid #e5e7eb", borderRadius:12, padding:14,
                display:"flex", alignItems:"flex-start", gap:12
              }}>
                <Avatar nom={p.nom} prenom={p.prenom} id={p.id} size={44}/>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:14 }}>{p.prenom} {p.nom}</p>
                  <p style={{ margin:"0 0 8px", fontSize:12, color:"#888" }}>Professeur</p>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                    {p.matieres.map(mid => {
                      const mat = MATIERES.find(m => m.id === mid)
                      return mat ? (
                        <span key={mid} style={{
                          fontSize:11, padding:"2px 8px", borderRadius:6,
                          background: mat.couleur+"18", color: mat.couleur, fontWeight:500
                        }}>{mat.nom}</span>
                      ) : null
                    })}
                  </div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {p.classes.map(cid => {
                      const cl = CLASSES.find(c => c.id === cid)
                      return cl ? (
                        <span key={cid} style={{
                          fontSize:11, padding:"2px 8px", borderRadius:6,
                          background:"#f3f4f6", color:"#374151", fontWeight:500
                        }}>🏛 {cl.nom}</span>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Vue détail d'une classe ──────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        <button
          onClick={() => { setSelectedClasse(null); setSearch(""); setView("eleves") }}
          style={{ background:"none", border:"none", cursor:"pointer", color:"#2563eb", fontSize:13, fontWeight:500, padding:0 }}
        >
          ← Toutes les classes
        </button>
        <span style={{ color:"#ccc" }}>/</span>
        <span style={{ fontSize:13, fontWeight:600, color:"#1a1a2e" }}>{classe?.nom}</span>
        <NiveauBadge niveau={classe?.niveau || ""}/>
      </div>

      {/* En-tête classe */}
      <div style={{
        background:"linear-gradient(135deg,#1a1a2e 0%,#2563eb 100%)",
        borderRadius:16, padding:"24px 28px", color:"#fff", marginBottom:20,
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:700, margin:"0 0 4px" }}>{classe?.nom}</h1>
          <p style={{ margin:0, opacity:0.8, fontSize:14 }}>Niveau {classe?.niveau} · Année 2024–2025</p>
        </div>
        <div style={{ display:"flex", gap:20 }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:28, fontWeight:700, margin:0 }}>{ELEVES.filter(e=>e.classe===selectedClasse).length}</p>
            <p style={{ fontSize:12, opacity:0.8, margin:0 }}>Élèves</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:28, fontWeight:700, margin:0 }}>{profsClasse.length}</p>
            <p style={{ fontSize:12, opacity:0.8, margin:0 }}>Profs</p>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:28, fontWeight:700, margin:0 }}>{MATIERES.length}</p>
            <p style={{ fontSize:12, opacity:0.8, margin:0 }}>Matières</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          { id:"eleves", label:`👤 Élèves (${ELEVES.filter(e=>e.classe===selectedClasse).length})` },
          { id:"profs",  label:`👩‍🏫 Professeurs (${profsClasse.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)}
            style={{
              padding:"9px 20px", borderRadius:8, fontSize:13, cursor:"pointer",
              background: view===t.id ? "#1a1a2e" : "#fff",
              color: view===t.id ? "#fff" : "#666",
              border: view===t.id ? "none" : "1px solid #e5e7eb",
              fontWeight: view===t.id ? 600 : 400,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Vue Élèves ── */}
      {view === "eleves" && (
        <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"0.5px solid #e5e7eb" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <input
              style={{
                flex:1, padding:"8px 14px", border:"1px solid #e5e7eb",
                borderRadius:8, fontSize:13, outline:"none"
              }}
              placeholder="Rechercher un élève..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ fontSize:13, color:"#888", whiteSpace:"nowrap" }}>
              {elevesClasse.length} élève{elevesClasse.length > 1 ? "s" : ""}
            </span>
          </div>

          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr style={{ background:"#f8f9fc" }}>
                <th style={TH}>#</th>
                <th style={TH}>Élève</th>
                <th style={TH}>Matricule</th>
                <th style={TH}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {elevesClasse.map((e, i) => (
                <tr key={e.id} style={{ borderBottom:"1px solid #f3f4f6", background: i%2===0?"#fff":"#fafbff" }}>
                  <td style={TD}><span style={{ color:"#aaa", fontSize:12 }}>{i+1}</span></td>
                  <td style={TD}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar nom={e.nom} prenom={e.prenom} id={e.id} size={34}/>
                      <div>
                        <p style={{ margin:0, fontWeight:600, fontSize:13 }}>{e.prenom} {e.nom}</p>
                      </div>
                    </div>
                  </td>
                  <td style={TD}>
                    <code style={{ fontSize:12, background:"#f3f4f6", padding:"2px 8px", borderRadius:4 }}>
                      {e.matricule}
                    </code>
                  </td>
                  <td style={TD}>
                    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600, background:"#dcfce7", color:"#059669" }}>
                      Actif
                    </span>
                  </td>
                </tr>
              ))}
              {elevesClasse.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:"center", padding:32, color:"#aaa" }}>Aucun élève trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Vue Professeurs ── */}
      {view === "profs" && (
        <div style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"0.5px solid #e5e7eb" }}>
          {profsClasse.length === 0 ? (
            <p style={{ textAlign:"center", color:"#aaa", padding:32 }}>Aucun professeur assigné à cette classe</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {profsClasse.map(p => (
                <div key={p.id} style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:16, border:"0.5px solid #e5e7eb",
                  borderRadius:12, background:"#fafbff"
                }}>
                  <Avatar nom={p.nom} prenom={p.prenom} id={p.id} size={48}/>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 4px", fontWeight:700, fontSize:15 }}>{p.prenom} {p.nom}</p>
                    <p style={{ margin:"0 0 8px", fontSize:12, color:"#888" }}>Professeur assigné à {classe?.nom}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {p.matieres.map(mid => {
                        const mat = MATIERES.find(m => m.id === mid)
                        return mat ? (
                          <div key={mid} style={{
                            display:"flex", alignItems:"center", gap:5,
                            padding:"3px 10px", borderRadius:8,
                            background: mat.couleur+"18",
                          }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:mat.couleur }}/>
                            <span style={{ fontSize:12, color: mat.couleur, fontWeight:500 }}>{mat.nom}</span>
                            <span style={{ fontSize:11, color:"#888" }}>coeff.{mat.coef}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:0, fontSize:11, color:"#888" }}>Autres classes</p>
                    <div style={{ display:"flex", gap:4, marginTop:4, justifyContent:"flex-end" }}>
                      {p.classes.filter(cid => cid !== selectedClasse).map(cid => {
                        const cl = CLASSES.find(c => c.id === cid)
                        return cl ? (
                          <span key={cid} style={{
                            fontSize:11, padding:"2px 8px", borderRadius:6,
                            background:"#f3f4f6", color:"#374151"
                          }}>{cl.nom}</span>
                        ) : null
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matières sans prof assigné */}
          <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f3f4f6" }}>
            <p style={{ fontSize:12, color:"#888", marginBottom:10, fontWeight:500 }}>TOUTES LES MATIÈRES DE LA CLASSE</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
              {MATIERES.map(m => {
                const prof = PROFESSEURS.find(p => p.classes.includes(selectedClasse!) && p.matieres.includes(m.id))
                return (
                  <div key={m.id} style={{
                    padding:"10px 12px", borderRadius:10,
                    background: m.couleur+"12",
                    border:`1px solid ${m.couleur}33`
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:m.couleur }}/>
                      <span style={{ fontSize:12, fontWeight:600, color:m.couleur }}>{m.nom}</span>
                    </div>
                    <p style={{ margin:0, fontSize:11, color:"#666" }}>Coeff. {m.coef}</p>
                    <p style={{ margin:"3px 0 0", fontSize:11, color: prof?"#059669":"#dc2626", fontWeight:500 }}>
                      {prof ? `${prof.prenom} ${prof.nom}` : "Non assigné"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TH: React.CSSProperties = {
  textAlign:"left", padding:"10px 14px", fontSize:12,
  fontWeight:600, color:"#888", borderBottom:"1px solid #eee"
}
const TD: React.CSSProperties = { padding:"11px 14px", verticalAlign:"middle" }
