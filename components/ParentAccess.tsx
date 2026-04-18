
'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeParent {
  id: string
  code: string           // 6 chiffres ex: "847291"
  eleveId: number
  eleveNom: string
  elevePrenom: string
  eleveMatricule: string
  eleveClasse: string
  validite: "semaine" | "mois" | "trimestre" | "annee"
  dateCreation: string
  dateExpiration: string
  actif: boolean
  paiementValide: boolean
  paiementMode: "orange" | "moov" | "admin"
  paiementRef: string
}

// Tarifs par type de validité
const TARIFS: Record<string, { label:string, prix:number, duree:string, couleur:string }> = {
  semaine:   { label:"1 semaine",   prix:500,   duree:"7 jours",    couleur:"#0891b2" },
  mois:      { label:"1 mois",      prix:1500,  duree:"30 jours",   couleur:"#2563eb" },
  trimestre: { label:"1 trimestre", prix:3500,  duree:"3 mois",     couleur:"#7c3aed" },
  annee:     { label:"1 an",        prix:10000, duree:"12 mois",    couleur:"#059669" },
}

// Données demo élèves (à remplacer par API)
const ELEVES_DEMO = [
  { id:1, nom:"Traoré",    prenom:"Aïcha",    matricule:"2024-001", classe:"3e A" },
  { id:2, nom:"Compaoré",  prenom:"Théo",     matricule:"2024-002", classe:"3e A" },
  { id:3, nom:"Zongo",     prenom:"Fatima",   matricule:"2024-003", classe:"4e B" },
  { id:4, nom:"Ouédraogo", prenom:"Brice",    matricule:"2024-004", classe:"3e A" },
  { id:5, nom:"Sawadogo",  prenom:"Mariam",   matricule:"2024-005", classe:"4e B" },
]

function useLS<T>(k:string,i:T):[T,(v:T)=>void]{
  const [s,ss]=useState<T>(()=>{
    if(typeof window==='undefined')return i
    try{const x=localStorage.getItem('edu_'+k);return x?JSON.parse(x):i}catch{return i}
  })
  const set=(v:T)=>{ss(v);if(typeof window!=='undefined')localStorage.setItem('edu_'+k,JSON.stringify(v))}
  return[s,set]
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addDays(days:number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function dureeToJours(v:string): number {
  const map: Record<string,number> = { semaine:7, mois:30, trimestre:90, annee:365 }
  return map[v] || 30
}

function isExpired(dateExp:string): boolean {
  return new Date(dateExp) < new Date()
}

// ─── ESPACE PARENT (accès par code) ──────────────────────────────────────────
export function EspaceParent() {
  const [code, setCode] = useState(["","","","","",""])
  const [step, setStep] = useState<"saisie"|"verification"|"espace">("saisie")
  const [eleve, setEleve] = useState<any>(null)
  const [error, setError] = useState("")
  const [codes] = useLS<CodeParent[]>('codes_parents', [])
  const [inputRefs] = useState<any[]>(Array(6).fill(null))

  const codeStr = code.join("")

  const handleDigit = (i:number, val:string) => {
    if(!/^\d*$/.test(val)) return
    const newCode = [...code]
    newCode[i] = val.slice(-1)
    setCode(newCode)
    if(val && i < 5) {
      const next = document.getElementById(`digit-${i+1}`)
      next?.focus()
    }
  }

  const handleKeyDown = (i:number, e:React.KeyboardEvent) => {
    if(e.key==="Backspace" && !code[i] && i > 0) {
      const prev = document.getElementById(`digit-${i-1}`)
      prev?.focus()
    }
  }

  const verifier = () => {
    setError("")
    if(codeStr.length !== 6) return setError("Entrez les 6 chiffres de votre code")

    const found = codes.find(c =>
      c.code === codeStr &&
      c.actif &&
      c.paiementValide &&
      !isExpired(c.dateExpiration)
    )

    if(!found) return setError("Code invalide, expiré ou non activé. Vérifiez votre code.")

    const el = ELEVES_DEMO.find(e => e.id === found.eleveId)
    if(!el) return setError("Élève introuvable. Contactez l'administration.")

    setEleve({ ...el, code: found })
    setStep("espace")
  }

  if(step === "espace" && eleve) {
    return <EspaceParentConnecte eleve={eleve} onLogout={()=>{ setStep("saisie"); setCode(["","","","","",""]); setEleve(null) }}/>
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1a1a2e,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>👨‍👩‍👧</div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#1a1a2e",margin:"0 0 6px"}}>Espace Parents</h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>Entrez votre code à 6 chiffres pour accéder au suivi de votre enfant</p>
        </div>

        {/* Saisie code */}
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:24}}>
          {code.map((d,i)=>(
            <input
              key={i}
              id={`digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e=>handleDigit(i,e.target.value)}
              onKeyDown={e=>handleKeyDown(i,e)}
              style={{
                width:48, height:56, textAlign:"center", fontSize:24, fontWeight:700,
                border: d ? "2px solid #2563eb" : "2px solid #e5e7eb",
                borderRadius:10, outline:"none", background: d ? "#eff6ff" : "#fff",
                color:"#1a1a2e", transition:"all .15s"
              }}
            />
          ))}
        </div>

        {error && <p style={{textAlign:"center",color:"#dc2626",fontSize:13,marginBottom:12}}>{error}</p>}

        <button
          onClick={verifier}
          disabled={codeStr.length!==6}
          style={{width:"100%",padding:"12px",background:codeStr.length===6?"#2563eb":"#93c5fd",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:codeStr.length===6?"pointer":"not-allowed",marginBottom:16}}
        >
          Accéder au suivi →
        </button>

        <div style={{borderTop:"1px solid #f0f0f0",paddingTop:16,textAlign:"center"}}>
          <p style={{fontSize:12,color:"#888",marginBottom:8}}>Vous n'avez pas encore de code ?</p>
          <button
            onClick={()=>setStep("verification")}
            style={{fontSize:13,color:"#2563eb",background:"none",border:"none",cursor:"pointer",fontWeight:500,textDecoration:"underline"}}
          >
            Obtenir un code d'accès →
          </button>
        </div>
      </div>

      {step==="verification" && (
        <AchatCodeModal onClose={()=>setStep("saisie")}/>
      )}
    </div>
  )
}

// ─── FORMULAIRE ACHAT CODE ────────────────────────────────────────────────────
function AchatCodeModal({ onClose }: { onClose:()=>void }) {
  const [step, setStep] = useState<"identite"|"validite"|"paiement"|"confirmation">("identite")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [matricule, setMatricule] = useState("")
  const [eleveFound, setEleveFound] = useState<any>(null)
  const [validite, setValidite] = useState<string>("mois")
  const [modePaiement, setModePaiement] = useState<"orange"|"moov">("orange")
  const [telephone, setTelephone] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeGenere, setCodeGenere] = useState("")
  const [error, setError] = useState("")
  const [codes, setCodes] = useLS<CodeParent[]>('codes_parents', [])

  // Étape 1 : vérification identité élève
  const verifierEleve = () => {
    setError("")
    if(!nom || !prenom || !matricule) return setError("Tous les champs sont requis")

    const el = ELEVES_DEMO.find(e =>
      e.nom.toLowerCase() === nom.toLowerCase() &&
      e.prenom.toLowerCase() === prenom.toLowerCase() &&
      e.matricule === matricule
    )

    if(!el) return setError("Aucun élève trouvé avec ces informations. Vérifiez le nom, prénom et matricule.")

    setEleveFound(el)
    setStep("validite")
  }

  // Étape 3 : simuler paiement Mobile Money
  const initierPaiement = () => {
    if(!telephone || telephone.length < 8) return setError("Numéro de téléphone invalide")
    setError("")
    setLoading(true)

    // Simulation envoi demande paiement
    setTimeout(() => {
      setLoading(false)
      setStep("confirmation")
    }, 2000)
  }

  // Étape 4 : confirmer et générer le code
  const confirmerPaiement = () => {
    const code = genCode()
    const newCode: CodeParent = {
      id: `code-${Date.now()}`,
      code,
      eleveId: eleveFound.id,
      eleveNom: eleveFound.nom,
      elevePrenom: eleveFound.prenom,
      eleveMatricule: eleveFound.matricule,
      eleveClasse: eleveFound.classe,
      validite: validite as any,
      dateCreation: new Date().toISOString().split("T")[0],
      dateExpiration: addDays(dureeToJours(validite)),
      actif: true,
      paiementValide: true,
      paiementMode: modePaiement,
      paiementRef: `REF-${Date.now()}`,
    }
    setCodes([...codes, newCode])
    setCodeGenere(code)
    setStep("confirmation")
  }

  const tarif = TARIFS[validite]

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #f0f0f0"}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:700}}>Obtenir un code d'accès</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
        </div>

        <div style={{padding:24}}>
          {/* Étapes */}
          <div style={{display:"flex",gap:4,marginBottom:24}}>
            {["identite","validite","paiement","confirmation"].map((s,i)=>(
              <div key={s} style={{flex:1,height:4,borderRadius:2,background:["identite","validite","paiement","confirmation"].indexOf(step)>=i?"#2563eb":"#e5e7eb",transition:"background .3s"}}/>
            ))}
          </div>

          {/* ── Étape 1 : Identité élève ── */}
          {step==="identite" && (
            <div>
              <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 6px"}}>1. Identifier votre enfant</h3>
              <p style={{fontSize:13,color:"#888",margin:"0 0 20px"}}>Entrez exactement les informations de votre enfant telles qu'elles figurent sur sa carte scolaire.</p>

              <div style={{marginBottom:14}}>
                <label style={LBL}>Nom de famille *</label>
                <input style={IN} value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: TRAORE"/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={LBL}>Prénom *</label>
                <input style={IN} value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Ex: Aïcha"/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={LBL}>Numéro de matricule *</label>
                <input style={IN} value={matricule} onChange={e=>setMatricule(e.target.value)} placeholder="Ex: 2024-001"/>
              </div>

              {error && <p style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{error}</p>}

              <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
                <p style={{fontSize:12,color:"#0369a1",margin:0}}>
                  🔒 <strong>Sécurité :</strong> Votre code sera lié uniquement à cet élève. Il est impossible d'accéder aux données d'un autre enfant avec ce code.
                </p>
              </div>

              <button onClick={verifierEleve} style={BTN_P}>Vérifier →</button>
            </div>
          )}

          {/* ── Étape 2 : Durée de validité ── */}
          {step==="validite" && eleveFound && (
            <div>
              <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>✅</span>
                <div>
                  <p style={{margin:0,fontWeight:700,fontSize:14}}>{eleveFound.prenom} {eleveFound.nom}</p>
                  <p style={{margin:0,fontSize:12,color:"#666"}}>{eleveFound.classe} · Matricule {eleveFound.matricule}</p>
                </div>
              </div>

              <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 16px"}}>2. Choisir la durée d'accès</h3>

              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                {Object.entries(TARIFS).map(([k,t])=>(
                  <label key={k} onClick={()=>setValidite(k)} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"14px 16px",borderRadius:10,cursor:"pointer",
                    border: validite===k ? `2px solid ${t.couleur}` : "1px solid #e5e7eb",
                    background: validite===k ? t.couleur+"10" : "#fff",
                    transition:"all .15s"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${validite===k?t.couleur:"#ccc"}`,background:validite===k?t.couleur:"transparent",transition:"all .15s"}}/>
                      <div>
                        <p style={{margin:0,fontWeight:600,fontSize:14,color:validite===k?t.couleur:"#1a1a2e"}}>{t.label}</p>
                        <p style={{margin:0,fontSize:12,color:"#888"}}>{t.duree}</p>
                      </div>
                    </div>
                    <span style={{fontSize:16,fontWeight:700,color:validite===k?t.couleur:"#1a1a2e"}}>{t.prix.toLocaleString()} FCFA</span>
                  </label>
                ))}
              </div>

              <button onClick={()=>setStep("paiement")} style={BTN_P}>
                Continuer — {tarif.prix.toLocaleString()} FCFA →
              </button>
            </div>
          )}

          {/* ── Étape 3 : Paiement Mobile Money ── */}
          {step==="paiement" && (
            <div>
              <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 6px"}}>3. Paiement Mobile Money</h3>
              <p style={{fontSize:13,color:"#888",margin:"0 0 20px"}}>Montant à payer : <strong style={{color:"#1a1a2e"}}>{tarif.prix.toLocaleString()} FCFA</strong></p>

              {/* Choix opérateur */}
              <div style={{display:"flex",gap:10,marginBottom:20}}>
                {(["orange","moov"] as const).map(op=>(
                  <button key={op} onClick={()=>setModePaiement(op)} style={{
                    flex:1,padding:"12px",borderRadius:10,cursor:"pointer",
                    border: modePaiement===op ? `2px solid ${op==="orange"?"#f97316":"#3b82f6"}` : "1px solid #e5e7eb",
                    background: modePaiement===op ? (op==="orange"?"#fff7ed":"#eff6ff") : "#fff",
                    fontWeight:modePaiement===op?700:400
                  }}>
                    <div style={{fontSize:28,marginBottom:4}}>{op==="orange"?"🟠":"🔵"}</div>
                    <div style={{fontSize:13,color:op==="orange"?"#ea580c":"#2563eb"}}>{op==="orange"?"Orange Money":"Moov Money"}</div>
                  </button>
                ))}
              </div>

              <div style={{marginBottom:14}}>
                <label style={LBL}>Numéro {modePaiement==="orange"?"Orange":"Moov"} Money *</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{padding:"8px 12px",background:"#f3f4f6",borderRadius:"8px 0 0 8px",fontSize:14,color:"#666",border:"1px solid #e5e7eb",borderRight:"none"}}>+226</span>
                  <input style={{...IN,borderRadius:"0 8px 8px 0",flex:1}} type="tel" value={telephone} onChange={e=>setTelephone(e.target.value)} placeholder="XX XX XX XX"/>
                </div>
              </div>

              <div style={{background:"#fffbeb",border:"1px solid #fbbf24",borderRadius:8,padding:"10px 14px",marginBottom:16}}>
                <p style={{fontSize:12,color:"#92400e",margin:0}}>
                  📱 Vous recevrez une demande de confirmation sur votre téléphone. Validez avec votre code PIN {modePaiement==="orange"?"Orange Money":"Moov Money"}.
                </p>
              </div>

              {error && <p style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{error}</p>}

              <button onClick={initierPaiement} disabled={loading} style={{...BTN_P, background:loading?"#93c5fd":undefined, cursor:loading?"not-allowed":"pointer"}}>
                {loading ? "⏳ Envoi de la demande..." : `Payer ${tarif.prix.toLocaleString()} FCFA →`}
              </button>
            </div>
          )}

          {/* ── Étape 4 : Confirmation + code ── */}
          {step==="confirmation" && !codeGenere && (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>📱</div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Confirmez le paiement</h3>
              <p style={{fontSize:13,color:"#888",marginBottom:20}}>
                Une demande de paiement de <strong>{tarif.prix.toLocaleString()} FCFA</strong> a été envoyée au <strong>+226 {telephone}</strong>.<br/>
                Validez avec votre PIN, puis cliquez "Confirmer".
              </p>
              <button onClick={confirmerPaiement} style={BTN_P}>
                ✅ J'ai validé le paiement — Générer mon code
              </button>
              <button onClick={()=>setStep("paiement")} style={{...BTN_P,background:"#fff",color:"#666",border:"1px solid #e5e7eb",marginTop:8}}>
                ← Retour
              </button>
            </div>
          )}

          {/* ── Code généré ! ── */}
          {codeGenere && (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>🎉</div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Votre code d'accès</h3>
              <p style={{fontSize:13,color:"#888",marginBottom:20}}>
                Valable {tarif.duree} pour <strong>{eleveFound?.prenom} {eleveFound?.nom}</strong>
              </p>

              <div style={{background:"linear-gradient(135deg,#1a1a2e,#2563eb)",borderRadius:16,padding:"24px 32px",marginBottom:20,display:"inline-block",minWidth:240}}>
                <p style={{margin:"0 0 4px",fontSize:12,color:"rgba(255,255,255,.7)"}}>Votre code secret</p>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  {codeGenere.split("").map((d,i)=>(
                    <div key={i} style={{width:40,height:48,background:"rgba(255,255,255,.15)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff"}}>
                      {d}
                    </div>
                  ))}
                </div>
                <p style={{margin:"8px 0 0",fontSize:11,color:"rgba(255,255,255,.6)"}}>Expire le {addDays(dureeToJours(validite))}</p>
              </div>

              <div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:8,padding:"10px 14px",marginBottom:16,textAlign:"left"}}>
                <p style={{fontSize:12,color:"#92400e",margin:0}}>
                  ⚠️ <strong>Conservez ce code précieusement.</strong> Il ne sera plus affiché. En cas de perte, contactez l'administration.
                </p>
              </div>

              <button onClick={onClose} style={BTN_P}>Fermer et se connecter →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ESPACE PARENT CONNECTÉ ───────────────────────────────────────────────────
function EspaceParentConnecte({ eleve, onLogout }: { eleve:any, onLogout:()=>void }) {
  const [tab, setTab] = useState<"notes"|"devoirs"|"absences">("notes")

  return (
    <div style={{minHeight:"100vh",background:"#f4f6fb",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#2563eb)",color:"#fff",padding:"20px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>
            {eleve.prenom[0]}{eleve.nom[0]}
          </div>
          <div>
            <p style={{margin:0,fontSize:16,fontWeight:700}}>{eleve.prenom} {eleve.nom}</p>
            <p style={{margin:0,fontSize:12,opacity:.8}}>{eleve.classe} · Matricule {eleve.matricule}</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right",marginRight:8}}>
            <p style={{margin:0,fontSize:11,opacity:.7}}>Accès valide jusqu'au</p>
            <p style={{margin:0,fontSize:13,fontWeight:600}}>{eleve.code?.dateExpiration}</p>
          </div>
          <button onClick={onLogout} style={{padding:"7px 16px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,color:"#fff",fontSize:13,cursor:"pointer"}}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 28px",display:"flex",gap:4}}>
        {[
          {id:"notes",    label:"📝 Notes"},
          {id:"devoirs",  label:"📅 Programme devoirs"},
          {id:"absences", label:"⏰ Absences & Retards"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)} style={{padding:"14px 18px",border:"none",borderBottom:tab===t.id?"3px solid #2563eb":"3px solid transparent",background:"transparent",fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?"#2563eb":"#666",cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"24px 28px",maxWidth:860,margin:"0 auto"}}>
        {tab==="notes" && <NotesParent eleve={eleve}/>}
        {tab==="devoirs" && (
          <div>
            <p style={{fontSize:13,color:"#888",marginBottom:16}}>Programme des devoirs pour la classe <strong>{eleve.classe}</strong></p>
            {/* Import dynamique ProgrammeDevoirs en lecture seule */}
            <NotesParent eleve={eleve} mode="devoirs"/>
          </div>
        )}
        {tab==="absences" && <AbsencesParent eleve={eleve}/>}
      </div>
    </div>
  )
}

// ─── Notes (vue parent) ───────────────────────────────────────────────────────
function NotesParent({ eleve, mode="notes" }: { eleve:any, mode?:string }) {
  const MATIERES = [
    {nom:"Mathématiques",coef:3,couleur:"#2563eb"},
    {nom:"Français",coef:3,couleur:"#7c3aed"},
    {nom:"SVT",coef:2,couleur:"#059669"},
    {nom:"Histoire-Géo",coef:2,couleur:"#d97706"},
    {nom:"Anglais",coef:2,couleur:"#0891b2"},
  ]
  // Notes démo
  const NOTES_DEMO = [
    {matiere:"Mathématiques",valeur:14,typeEval:"Devoir 1",trimestre:3},
    {matiere:"Français",valeur:12,typeEval:"Devoir 1",trimestre:3},
    {matiere:"SVT",valeur:16,typeEval:"Devoir 1",trimestre:3},
    {matiere:"Anglais",valeur:13,typeEval:"Devoir 1",trimestre:3},
  ]

  if(mode==="devoirs") return (
    <div style={{background:"#fff8f0",border:"1px solid #fed7aa",borderRadius:12,padding:20,textAlign:"center"}}>
      <p style={{fontSize:32,marginBottom:8}}>🚧</p>
      <p style={{fontWeight:600}}>Programme des devoirs</p>
      <p style={{fontSize:13,color:"#888"}}>Le programme de la classe {eleve.classe} s'affichera ici.<br/>Consultez la section Programme dans l'interface principale.</p>
    </div>
  )

  const moy = (NOTES_DEMO.reduce((s,n)=>s+n.valeur,0)/NOTES_DEMO.length).toFixed(1)

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <div style={{background:"#eff6ff",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:28,fontWeight:700,color:"#2563eb",margin:0}}>{moy}</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>Moyenne générale</p>
        </div>
        <div style={{background:"#f0fdf4",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:28,fontWeight:700,color:"#059669",margin:0}}>{NOTES_DEMO.length}</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>Notes saisies</p>
        </div>
        <div style={{background:"#fef3c7",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:28,fontWeight:700,color:"#d97706",margin:0}}>T3</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>Trimestre en cours</p>
        </div>
      </div>
      {MATIERES.map(m=>{
        const notes=NOTES_DEMO.filter(n=>n.matiere===m.nom)
        if(!notes.length) return null
        return(
          <div key={m.nom} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:m.couleur}}/>
                <strong style={{fontSize:14}}>{m.nom}</strong>
                <span style={{fontSize:12,color:"#aaa"}}>coeff.{m.coef}</span>
              </div>
              <strong style={{color:parseFloat((notes.reduce((s,n)=>s+n.valeur,0)/notes.length).toFixed(1))>=10?"#059669":"#dc2626"}}>
                {(notes.reduce((s,n)=>s+n.valeur,0)/notes.length).toFixed(1)}/20
              </strong>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {notes.map((n,i)=>(
                <div key={i} style={{background:"#f8f9ff",borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:70}}>
                  <p style={{margin:0,fontSize:18,fontWeight:700,color:n.valeur>=10?"#2563eb":"#dc2626"}}>{n.valeur}</p>
                  <p style={{margin:0,fontSize:10,color:"#888"}}>{n.typeEval}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AbsencesParent({ eleve }:{ eleve:any }) {
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:"#fef2f2",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:28,fontWeight:700,color:"#dc2626",margin:0}}>1</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>Absences</p>
        </div>
        <div style={{background:"#fff7ed",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <p style={{fontSize:28,fontWeight:700,color:"#d97706",margin:0}}>2</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>Retards</p>
        </div>
      </div>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
        <p style={{margin:"0 0 12px",fontWeight:600,fontSize:14}}>Historique</p>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,background:"#fef2f2",color:"#dc2626",fontWeight:600}}>Absence</span>
          <div>
            <p style={{margin:0,fontSize:13}}>04–05 novembre 2024</p>
            <p style={{margin:0,fontSize:12,color:"#888"}}>Maladie · Justifiée</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0"}}>
          <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,background:"#fff7ed",color:"#d97706",fontWeight:600}}>Retard</span>
          <div>
            <p style={{margin:0,fontSize:13}}>08 octobre 2024</p>
            <p style={{margin:0,fontSize:12,color:"#888"}}>Arrivée 08h25 · Transport · Justifié</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ADMIN : Gestion des codes ────────────────────────────────────────────────
export function AdminCodes() {
  const [codes, setCodes] = useLS<CodeParent[]>('codes_parents', [])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ eleveId:0, validite:"mois" })
  const [toast, setToast] = useState<any>(null)
  const [confirm, setConfirm] = useState<any>(null)

  const toast2=(msg:string,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  const filtered = codes.filter(c=>
    `${c.eleveNom} ${c.elevePrenom} ${c.code} ${c.eleveClasse}`.toLowerCase().includes(search.toLowerCase())
  )

  const genererCode = () => {
    if(!form.eleveId) return toast2("Sélectionner un élève","error")
    const el = ELEVES_DEMO.find(e=>e.id===form.eleveId)
    if(!el) return toast2("Élève introuvable","error")

    const newCode: CodeParent = {
      id: `code-${Date.now()}`,
      code: genCode(),
      eleveId: el.id,
      eleveNom: el.nom,
      elevePrenom: el.prenom,
      eleveMatricule: el.matricule,
      eleveClasse: el.classe,
      validite: form.validite as any,
      dateCreation: new Date().toISOString().split("T")[0],
      dateExpiration: addDays(dureeToJours(form.validite)),
      actif: true,
      paiementValide: true,
      paiementMode: "admin",
      paiementRef: `ADMIN-${Date.now()}`,
    }
    setCodes([...codes, newCode])
    toast2(`Code ${newCode.code} généré pour ${el.prenom} ${el.nom} ✓`)
    setModal(false)
    setForm({eleveId:0, validite:"mois"})
  }

  const revoquer = (id:string) => {
    setConfirm({msg:"Révoquer ce code ? Le parent n'aura plus accès.", onOui:()=>{
      setCodes(codes.map(c=>c.id===id?{...c,actif:false}:c))
      toast2("Code révoqué","error")
      setConfirm(null)
    }})
  }

  const renouveler = (id:string) => {
    const c = codes.find(x=>x.id===id)
    if(!c) return
    setCodes(codes.map(x=>x.id===id?{...x,actif:true,dateExpiration:addDays(dureeToJours(x.validite))}:x))
    toast2("Code renouvelé ✓")
  }

  return (
    <div>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:toast.type==="success"?"#059669":"#dc2626",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:500}}>{toast.msg}</div>}
      {confirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:360,width:"90%"}}>
            <p style={{textAlign:"center",fontSize:14,marginBottom:24}}>{confirm.msg}</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirm(null)} style={{flex:1,padding:10,border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer"}}>Annuler</button>
              <button onClick={confirm.onOui} style={{flex:1,padding:10,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#1a1a2e",margin:"0 0 4px"}}>🔑 Codes d'accès parents</h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>{codes.length} code{codes.length>1?"s":""} générés · {codes.filter(c=>c.actif&&!isExpired(c.dateExpiration)).length} actifs</p>
        </div>
        <button onClick={()=>setModal(true)} style={{padding:"9px 20px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          + Générer un code
        </button>
      </div>

      <input style={{width:"100%",padding:"9px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none",marginBottom:16,boxSizing:"border-box"}} placeholder="Rechercher par élève, code, classe..." value={search} onChange={e=>setSearch(e.target.value)}/>

      <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #e5e7eb",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        {filtered.length===0
          ? <p style={{textAlign:"center",color:"#aaa",padding:40}}>Aucun code trouvé</p>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead>
              <tr style={{background:"#f8f9fc"}}>
                {["Élève","Classe","Code","Validité","Expire le","Paiement","Statut","Actions"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"10px 14px",fontSize:12,fontWeight:600,color:"#888",borderBottom:"1px solid #eee"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>{
                const exp=isExpired(c.dateExpiration)
                return(
                  <tr key={c.id} style={{borderBottom:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafbff",opacity:(!c.actif||exp)?.6:1}}>
                    <td style={{padding:"11px 14px",fontWeight:500}}>{c.elevePrenom} {c.eleveNom}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:"#666"}}>{c.eleveClasse}</td>
                    <td style={{padding:"11px 14px"}}>
                      <code style={{fontSize:15,fontWeight:700,letterSpacing:3,background:"#f3f4f6",padding:"3px 10px",borderRadius:6}}>{c.code}</code>
                    </td>
                    <td style={{padding:"11px 14px",fontSize:12,color:TARIFS[c.validite]?.couleur,fontWeight:500}}>{TARIFS[c.validite]?.label}</td>
                    <td style={{padding:"11px 14px",fontSize:12,color:exp?"#dc2626":"#666"}}>{c.dateExpiration}</td>
                    <td style={{padding:"11px 14px"}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:c.paiementMode==="admin"?"#f0fdf4":"#eff6ff",color:c.paiementMode==="admin"?"#059669":"#2563eb",fontWeight:600}}>
                        {c.paiementMode==="admin"?"Admin":c.paiementMode==="orange"?"Orange":"Moov"}
                      </span>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600,background:c.actif&&!exp?"#dcfce7":exp?"#fee2e2":"#f3f4f6",color:c.actif&&!exp?"#059669":exp?"#dc2626":"#888"}}>
                        {!c.actif?"Révoqué":exp?"Expiré":"Actif"}
                      </span>
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:6}}>
                        {c.actif && !exp && <button onClick={()=>revoquer(c.id)} style={{padding:"4px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,fontSize:11,cursor:"pointer"}}>Révoquer</button>}
                        {(exp || !c.actif) && <button onClick={()=>renouveler(c.id)} style={{padding:"4px 10px",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:6,fontSize:11,cursor:"pointer"}}>Renouveler</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        }
      </div>

      {/* Modal génération admin */}
      {modal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:420,width:"90%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700}}>Générer un code (admin)</h3>
              <button onClick={()=>setModal(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={LBL}>Élève *</label>
              <select style={IN} value={form.eleveId} onChange={e=>setForm({...form,eleveId:parseInt(e.target.value)})}>
                <option value={0}>Sélectionner un élève</option>
                {ELEVES_DEMO.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.classe}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={LBL}>Durée de validité *</label>
              <select style={IN} value={form.validite} onChange={e=>setForm({...form,validite:e.target.value})}>
                {Object.entries(TARIFS).map(([k,t])=><option key={k} value={k}>{t.label} ({t.prix.toLocaleString()} FCFA)</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setModal(false)} style={{flex:1,padding:10,border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer"}}>Annuler</button>
              <button onClick={genererCode} style={{flex:1,padding:10,background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>Générer le code</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const LBL:React.CSSProperties={display:"block",fontSize:12,fontWeight:500,color:"#555",marginBottom:4}
const IN:React.CSSProperties={width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff"}
const BTN_P:React.CSSProperties={width:"100%",padding:"12px",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}

export default EspaceParent
