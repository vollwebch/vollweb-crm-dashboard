import { NextRequest, NextResponse } from 'next/server'
import { getCurrentClientUser } from '@/lib/client-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clientUser = await getCurrentClientUser()
    
    if (!clientUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const ticket = await db.ticket.findFirst({
      where: {
        id,
        clientId: clientUser.clientId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        assignedTo: {
          select: { id: true, name: true }
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
    console.error('Get client ticket error:', error)
    return NextResponse.json(
      { error: 'Error al obtener ticket' },
      { status: 500 }
    )
  }
}
