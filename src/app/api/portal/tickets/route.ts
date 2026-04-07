import { NextResponse } from 'next/server'
import { getCurrentClientUser } from '@/lib/client-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clientUser = await getCurrentClientUser()
    
    if (!clientUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const tickets = await db.ticket.findMany({
      where: {
        clientId: clientUser.clientId
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        assignedTo: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Get client tickets error:', error)
    return NextResponse.json(
      { error: 'Error al obtener tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const clientUser = await getCurrentClientUser()
    
    if (!clientUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, description, category, priority } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Asunto y descripción son requeridos' },
        { status: 400 }
      )
    }

    const ticket = await db.ticket.create({
      data: {
        subject,
        description,
        category: category || 'general',
        priority: priority || 'MEDIUM',
        clientId: clientUser.clientId,
        clientUserId: clientUser.id,
        status: 'OPEN'
      }
    })

    // Create first message with description
    await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: description,
        authorId: clientUser.id,
        authorType: 'CLIENT_USER'
      }
    })

    // Notify company admins
    const companyUsers = await db.user.findMany({
      where: { companyId: clientUser.client.companyObj?.id || '' }
    })

    for (const user of companyUsers) {
      await db.notification.create({
        data: {
          type: 'TICKET_NEW',
          title: 'Nuevo ticket de soporte',
          message: `${clientUser.name} ha creado un nuevo ticket: ${subject}`,
          userId: user.id,
          entityType: 'TICKET',
          entityId: ticket.id,
          data: { ticketId: ticket.id, clientId: clientUser.clientId }
        }
      })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Create client ticket error:', error)
    return NextResponse.json(
      { error: 'Error al crear ticket' },
      { status: 500 }
    )
  }
}
