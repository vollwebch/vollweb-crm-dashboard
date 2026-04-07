import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedToId = searchParams.get('assignedToId')
    const clientId = searchParams.get('clientId')

    const where: any = {}
    
    // Filter by company through client
    where.client = { companyId: user.companyId }
    
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    if (clientId) {
      where.clientId = clientId
    }

    const tickets = await db.ticket.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        clientUser: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: 'Error al obtener tickets' },
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
    const { subject, description, clientId, category, priority, assignedToId } = body

    if (!subject || !description || !clientId) {
      return NextResponse.json(
        { error: 'Asunto, descripción y cliente son requeridos' },
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

    const ticket = await db.ticket.create({
      data: {
        subject,
        description,
        category: category || 'general',
        priority: priority || 'MEDIUM',
        clientId,
        assignedToId: assignedToId || null,
        status: 'OPEN'
      },
      include: {
        client: {
          select: { id: true, name: true, company: true }
        },
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    })

    // Create first message
    await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: description,
        authorId: user.id,
        authorType: 'USER'
      }
    })

    // Create notification for assigned user
    if (assignedToId) {
      await db.notification.create({
        data: {
          type: 'TICKET_ASSIGNED',
          title: 'Ticket asignado',
          message: `Se te ha asignado el ticket: ${subject}`,
          userId: assignedToId,
          entityType: 'TICKET',
          entityId: ticket.id,
          data: { ticketId: ticket.id }
        }
      })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: 'Error al crear ticket' },
      { status: 500 }
    )
  }
}
