import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, getCurrentUser } from '@/lib/auth'

// POST - Create employee (only admin can do this)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    // Only admins can create employees
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear empleados.' },
        { status: 403 }
      )
    }

    const { name, email, password, role } = await request.json()

    // Validations
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create employee with same companyId as admin
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER', // Default to USER if not specified
        companyId: currentUser.companyId
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { error: 'Error al crear empleado' },
      { status: 500 }
    )
  }
}

// GET - List employees (only admin can do this)
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get all users from same company
    const users = await db.user.findMany({
      where: {
        companyId: currentUser.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('List employees error:', error)
    return NextResponse.json(
      { error: 'Error al listar empleados' },
      { status: 500 }
    )
  }
}
