// lib/auth.ts
// Vérification de session partagée par les routes API protégées.
import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

export type Role = 'super_admin' | 'admin' | 'professeur' | 'surveillant' | 'eleve'

export interface SessionPayload {
  sub: string
  nom: string
  prenom: string
  email: string
  role: Role
  ecoleId: string | null
  [key: string]: unknown
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET
  if (!secret) throw new Error('AUTH_JWT_SECRET manquant')
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as SessionPayload
}

// Extrait et vérifie le token Bearer d'une requête. Retourne null si absent/invalide.
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  try {
    return await verifySession(token)
  } catch {
    return null
  }
}

// Exige une session valide dont le rôle est dans `roles` (si fourni).
// Lève une erreur avec un statut HTTP à porter dans la réponse par l'appelant.
export async function requireSession(request: NextRequest, roles?: Role[]): Promise<SessionPayload> {
  const session = await getSession(request)
  if (!session) {
    const err: any = new Error('Authentification requise')
    err.status = 401
    throw err
  }
  if (roles && !roles.includes(session.role)) {
    const err: any = new Error('Accès refusé pour ce rôle')
    err.status = 403
    throw err
  }
  return session
}
