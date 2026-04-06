import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyId, getCurrentUser } from '@/lib/auth'

// GET - List payments
export async function GET(req: NextRequest) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const entityType = searchParams.get('entityType')

    const where: any = {
      client: { companyId } // Multi-tenant filter
    }

    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (entityType) where.entityType = entityType

    const payments = await db.payment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totals = {
      total: payments.length,
      pending: payments.filter((p) => p.status === 'PENDING').length,
      paid: payments.filter((p) => p.status === 'PAID').length,
      failed: payments.filter((p) => p.status === 'FAILED').length,
      pendingAmount: payments
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      paidAmount: payments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + Number(p.amount), 0),
    }

    return NextResponse.json({ payments, totals })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Error al obtener los pagos' },
      { status: 500 }
    )
  }
}

// POST - Create manual payment
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, entityType, entityId, amount, description, status, paidAt, dueDate } = body

    if (!clientId || !amount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verify client belongs to user's company
    const client = await db.client.findFirst({
      where: { 
        id: clientId,
        companyId: currentUser.companyId 
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const payment = await db.payment.create({
      data: {
        clientId,
        entityType: entityType || 'CUSTOM',
        entityId: entityId || 'custom',
        amount,
        status: status || 'PENDING',
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidAt: paidAt ? new Date(paidAt) : null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Error al crear el pago' },
      { status: 500 }
    )
  }
}
