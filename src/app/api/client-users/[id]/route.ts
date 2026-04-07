import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashClientPassword } from '@/lib/client-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const clientUser = await db.clientUser.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Return without password
    const { password: _, ...safeUser } = clientUser

    return NextResponse.json({ clientUser: safeUser })
  } catch (error) {
    console.error('Get client user error:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { email, password, name, phone, active } = body

    // Verify client user belongs to company
    const existingUser = await db.clientUser.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (email && email !== existingUser.email) {
      // Check if new email already exists
      const emailExists = await db.clientUser.findUnique({
        where: { email: email.toLowerCase() }
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
      updateData.email = email.toLowerCase()
    }
    if (password) {
      updateData.password = await hashClientPassword(password)
    }
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (active !== undefined) updateData.active = active

    const clientUser = await db.clientUser.update({
      where: { id },
      data: updateData,
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
    console.error('Update client user error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify client user belongs to company
    const clientUser = await db.clientUser.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    await db.clientUser.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client user error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
