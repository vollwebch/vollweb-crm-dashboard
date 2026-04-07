import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashClientPassword } from '@/lib/client-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const where: any = {
      client: { companyId: user.companyId }
    }
    
    if (clientId) {
      where.clientId = clientId
    }

    const clientUsers = await db.clientUser.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Return without passwords
    const safeUsers = clientUsers.map(u => {
      const { password, ...safeUser } = u
      return safeUser
    })

    return NextResponse.json({ clientUsers: safeUsers })
  } catch (error) {
    console.error('Get client users error:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios de clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, password, name, phone, clientId } = body

    if (!email || !password || !name || !clientId) {
      return NextResponse.json(
        { error: 'Email, contraseña, nombre y cliente son requeridos' },
        { status: 400 }
      )
    }

    // Verify client belongs to company
    const client = await db.client.findFirst({
      where: { id: clientId, companyId: user.companyId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Check if email already exists
    const existingUser = await db.clientUser.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashClientPassword(password)

    const clientUser = await db.clientUser.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || null,
        clientId
      },
      include: {
        client: {
          select: { id: true, name: true, company: true }
        }
      }
    })

    // Return without password
    const { password: _, ...safeUser } = clientUser

    return NextResponse.json({ clientUser: safeUser })
  } catch (error) {
    console.error('Create client user error:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario de cliente' },
      { status: 500 }
    )
  }
}
