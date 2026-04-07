import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compareClientPassword, generateClientToken } from '@/lib/client-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Find client user by email
    const clientUser = await db.clientUser.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        client: {
          include: {
            companyObj: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    if (!clientUser.active) {
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada. Contacta con soporte.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await compareClientPassword(password, clientUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Update last login
    await db.clientUser.update({
      where: { id: clientUser.id },
      data: { lastLoginAt: new Date() }
    })

    // Generate token
    const token = generateClientToken({
      clientUserId: clientUser.id,
      email: clientUser.email,
      clientId: clientUser.clientId
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('client-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return NextResponse.json({
      success: true,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        client: {
          id: clientUser.client.id,
          name: clientUser.client.name,
          company: clientUser.client.company
        }
      }
    })
  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
