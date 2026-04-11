// middleware.ts — À la racine du projet
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

// Routes protégées par rôle
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard/admin':       ['admin'],
  '/dashboard/professeur':  ['admin', 'professeur'],
  '/dashboard/surveillant': ['admin', 'surveillant'],
  '/dashboard/eleve':       ['admin', 'eleve'],
  '/api/eleves':            ['admin', 'professeur', 'surveillant', 'eleve'],
  '/api/notes':             ['admin', 'professeur', 'eleve'],
  '/api/absences':          ['admin', 'surveillant', 'eleve'],
  '/api/sanctions':         ['admin', 'surveillant'],
  '/api/retards':           ['admin', 'surveillant', 'eleve'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques — pas de vérification
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Vérifier le token
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ||
                request.cookies.get('accessToken')?.value

  if (!token) {
    // API → 401, Page → redirect login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = verifyAccessToken(token)

    // Vérifier le rôle pour les routes protégées
    const matchedRoute = Object.keys(ROUTE_ROLES).find(r => pathname.startsWith(r))
    if (matchedRoute) {
      const allowedRoles = ROUTE_ROLES[matchedRoute]
      if (!allowedRoles.includes(payload.role)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/login?error=forbidden', request.url))
      }
    }

    // Ajouter les infos user dans les headers pour les route handlers
    const response = NextResponse.next()
    response.headers.set('x-user-id',   payload.userId)
    response.headers.set('x-user-role', payload.role)
    response.headers.set('x-user-email', payload.email)
    return response

  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/((?!auth).*)',
  ],
}
