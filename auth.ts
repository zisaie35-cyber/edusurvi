// lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { NextRequest } from 'next/server'

const JWT_SECRET         = process.env.JWT_SECRET!
const REFRESH_SECRET     = process.env.REFRESH_TOKEN_SECRET!
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     || '15m'
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

export interface JwtPayload {
  userId: string
  role: string
  email: string
}

// ── Génération des tokens ─────────────────────────────────────
export function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)

  return { accessToken, refreshToken }
}

// ── Vérification du token ─────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}

// ── Extraire le user depuis la request ───────────────────────
export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.split(' ')[1]
    return verifyAccessToken(token)
  } catch {
    return null
  }
}

// ── Middleware de rôle ────────────────────────────────────────
export function requireRole(roles: string[]) {
  return (user: JwtPayload | null): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }
}

// ── Login ─────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.actif) {
    throw new Error('Identifiants invalides')
  }

  const passwordOk = await bcrypt.compare(password, user.password)
  if (!passwordOk) {
    throw new Error('Identifiants invalides')
  }

  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  }

  const tokens = generateTokens(payload)

  return {
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  }
}
