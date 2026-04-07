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

    // Get dashboard stats
    const [
      invoices,
      pendingInvoices,
      paidInvoices,
      services,
      activeServices,
      tickets,
      openTickets
    ] = await Promise.all([
      db.invoice.count({
        where: { clientId: clientUser.clientId, deletedAt: null }
      }),
      db.invoice.count({
        where: { 
          clientId: clientUser.clientId, 
          deletedAt: null,
          status: { in: ['SENT', 'OVERDUE'] }
        }
      }),
      db.invoice.count({
        where: { 
          clientId: clientUser.clientId, 
          deletedAt: null,
          status: 'PAID'
        }
      }),
      db.clientService.count({
        where: { clientId: clientUser.clientId }
      }),
      db.clientService.count({
        where: { clientId: clientUser.clientId, status: 'ACTIVE' }
      }),
      db.ticket.count({
        where: { clientId: clientUser.clientId }
      }),
      db.ticket.count({
        where: { 
          clientId: clientUser.clientId,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_STAFF'] }
        }
      })
    ])

    // Get total revenue
    const totalRevenue = await db.invoice.aggregate({
      where: {
        clientId: clientUser.clientId,
        deletedAt: null,
        status: 'PAID'
      },
      _sum: { total: true }
    })

    // Get pending amount
    const pendingAmount = await db.invoice.aggregate({
      where: {
        clientId: clientUser.clientId,
        deletedAt: null,
        status: { in: ['SENT', 'OVERDUE'] }
      },
      _sum: { total: true }
    })

    return NextResponse.json({
      stats: {
        invoices,
        pendingInvoices,
        paidInvoices,
        services,
        activeServices,
        tickets,
        openTickets,
        totalRevenue: totalRevenue._sum.total || 0,
        pendingAmount: pendingAmount._sum.total || 0
      }
    })
  } catch (error) {
    console.error('Get client dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    )
  }
}
