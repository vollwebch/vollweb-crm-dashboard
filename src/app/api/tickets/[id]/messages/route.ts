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

    const messages = await db.ticketMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get ticket messages error:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { content, isInternal, attachments } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      )
    }

    // Verify ticket belongs to company
    const ticket = await db.ticket.findFirst({
      where: {
        id,
        client: { companyId: user.companyId }
      },
      include: {
        client: {
          include: {
            clientUsers: true
          }
        }
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
        isInternal: isInternal || false,
        authorId: user.id,
        authorType: 'USER',
        attachments: attachments || null
      }
    })

    // Update ticket status
    if (!isInternal) {
      await db.ticket.update({
        where: { id },
        data: {
          status: 'WAITING_CLIENT',
          updatedAt: new Date()
        }
      })

      // Notify client users
      for (const clientUser of ticket.client.clientUsers) {
        await db.notification.create({
          data: {
            type: 'TICKET_REPLY',
            title: 'Nueva respuesta en tu ticket',
            message: `Hay una nueva respuesta en el ticket: ${ticket.subject}`,
            clientUserId: clientUser.id,
            entityType: 'TICKET',
            entityId: ticket.id,
            data: { ticketId: ticket.id }
          }
        })
      }
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
