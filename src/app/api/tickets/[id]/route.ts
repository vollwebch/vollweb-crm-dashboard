import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

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

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true }
        },
        clientUser: {
          select: { id: true, name: true, email: true, phone: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: 'Error al obtener ticket' },
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
    const { subject, status, priority, category, assignedToId } = body

    // Verify ticket belongs to company
    const existingTicket = await db.ticket.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      }
    })

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (subject !== undefined) updateData.subject = subject
    if (status !== undefined) {
      updateData.status = status
      if (status === 'CLOSED' || status === 'RESOLVED') {
        updateData.closedAt = new Date()
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    const ticket = await db.ticket.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, company: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    })

    // Notify if assigned to new user
    if (assignedToId && assignedToId !== existingTicket.assignedToId) {
      await db.notification.create({
        data: {
          type: 'TICKET_ASSIGNED',
          title: 'Ticket asignado',
          message: `Se te ha asignado el ticket: ${ticket.subject}`,
          userId: assignedToId,
          entityType: 'TICKET',
          entityId: ticket.id,
          data: { ticketId: ticket.id }
        }
      })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ticket' },
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

    // Verify ticket belongs to company
    const ticket = await db.ticket.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    await db.ticket.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ticket error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ticket' },
      { status: 500 }
    )
  }
}
