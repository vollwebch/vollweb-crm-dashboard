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

    const invoices = await db.invoice.findMany({
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

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Get client invoices error:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}
