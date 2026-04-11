// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loginUser } from '@/lib/auth'

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    const { email, password } = LoginSchema.parse(body)

    // Auth
    const result = await loginUser(email, password)

    // Réponse avec refresh token en cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    })

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })

    return response
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur de connexion' },
      { status: 401 }
    )
  }
}
