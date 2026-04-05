import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getCompanyId } from '@/lib/auth'

// GET - Get a single calendar note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const note = await prisma.calendarNote.findFirst({
      where: { id, companyId }
    })

    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching calendar note:', error)
    return NextResponse.json({ error: 'Error al obtener nota' }, { status: 500 })
  }
}

// PUT - Update a calendar note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Verify ownership
    const existing = await prisma.calendarNote.findFirst({
      where: { id, companyId: currentUser.companyId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    const note = await prisma.calendarNote.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        color: data.color || 'brand',
        date: data.date ? new Date(data.date) : undefined
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating calendar note:', error)
    return NextResponse.json({ error: 'Error al actualizar nota' }, { status: 500 })
  }
}

// DELETE - Delete a calendar note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.calendarNote.findFirst({
      where: { id, companyId: currentUser.companyId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    await prisma.calendarNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar note:', error)
    return NextResponse.json({ error: 'Error al eliminar nota' }, { status: 500 })
  }
}
