import { NextRequest, NextResponse } from 'next/server'
import { getCurrentClientUser } from '@/lib/client-auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clientUser = await getCurrentClientUser()
    
    if (!clientUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content, attachments } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      )
    }

    // Verify ticket belongs to client
    const ticket = await db.ticket.findFirst({
      where: {
        id,
        clientId: clientUser.clientId
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    // Create message
    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        content,
        authorId: clientUser.id,
        authorType: 'CLIENT_USER',
        attachments: attachments || null
      }
    })

    // Update ticket status to waiting staff
    await db.ticket.update({
      where: { id },
      data: {
        status: 'WAITING_STAFF',
        updatedAt: new Date()
      }
    })

    // Notify assigned user or all company admins
    if (ticket.assignedToId) {
      await db.notification.create({
        data: {
          type: 'TICKET_REPLY',
          title: 'Nueva respuesta en ticket',
          message: `${clientUser.name} ha respondido al ticket: ${ticket.subject}`,
          userId: ticket.assignedToId,
          entityType: 'TICKET',
          entityId: ticket.id,
          data: { ticketId: ticket.id }
        }
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Create ticket message error:', error)
    return NextResponse.json(
      { error: 'Error al crear mensaje' },
      { status: 500 }
    )
  }
}
