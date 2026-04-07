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

    const quotes = await db.quote.findMany({
      where: {
        clientId: clientUser.clientId,
        deletedAt: null
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { issueDate: 'desc' }
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Get client quotes error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}
