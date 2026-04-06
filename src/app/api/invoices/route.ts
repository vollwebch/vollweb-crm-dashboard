import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { getCurrentUser, getCompanyId } from '@/lib/auth'

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: { message: 'No autorizado' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const search = searchParams.get('search')
    
    const where: any = {
      deletedAt: null,
      client: { companyId } // Multi-tenant filter through client
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (clientId) {
      where.clientId = clientId
    }
    
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true
          }
        },
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const total = await db.invoice.count({ where })
    
    const serializedInvoices = invoices.map(invoice => ({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        total: Number(item.total)
      }))
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        invoices: serializedInvoices,
        pagination: { total }
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al obtener facturas' } },
      { status: 500 }
    )
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { message: 'No autorizado' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientId, items, issueDate, dueDate, notes, terms, taxRate, language } = body
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: { message: 'Cliente requerido' } },
        { status: 400 }
      )
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Añade al menos una línea' } },
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
        { success: false, error: { message: 'Cliente no encontrado' } },
        { status: 404 }
      )
    }
    
    // Get company-specific config and counter
    const systemConfig = await db.systemConfig.findUnique({
      where: { companyId: currentUser.companyId }
    })
    
    const prefix = systemConfig?.invoicePrefix || 'FAC'
    const currentYear = new Date().getFullYear()
    
    // Get or create invoice counter for this company
    let counter = await db.invoiceCounter.findUnique({
      where: { 
        companyId_year: {
          companyId: currentUser.companyId,
          year: currentYear
        }
      }
    })
    
    if (!counter) {
      counter = await db.invoiceCounter.create({
        data: { 
          year: currentYear, 
          lastNumber: 0,
          companyId: currentUser.companyId 
        }
      })
    }
    
    const nextNumber = counter.lastNumber + 1
    await db.invoiceCounter.update({
      where: { id: counter.id },
      data: { lastNumber: nextNumber }
    })
    
    const invoiceNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`
    
    let subtotal = 0
    const processedItems = items.map((item: any, index: number) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice)
      subtotal += itemTotal
      return {
        description: item.description,
        quantity: new Decimal(item.quantity),
        unitPrice: new Decimal(item.unitPrice),
        taxRate: new Decimal(item.taxRate || taxRate || 21),
        total: new Decimal(itemTotal),
        order: index
      }
    })
    
    const effectiveTaxRate = taxRate || 21
    const taxAmount = subtotal * (effectiveTaxRate / 100)
    const total = subtotal + taxAmount
    
    const invoice = await db.invoice.create({
      data: {
        number: invoiceNumber,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: [client.address, client.city, client.country].filter(Boolean).join(', '),
        clientTaxId: client.taxId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        language: language || 'es',
        subtotal: new Decimal(subtotal),
        taxRate: new Decimal(effectiveTaxRate),
        taxAmount: new Decimal(taxAmount),
        total: new Decimal(total),
        notes,
        terms,
        items: {
          create: processedItems
        }
      },
      include: {
        items: true,
        client: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        invoice: {
          ...invoice,
          subtotal: Number(invoice.subtotal),
          taxRate: Number(invoice.taxRate),
          taxAmount: Number(invoice.taxAmount),
          total: Number(invoice.total),
          items: invoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            total: Number(item.total)
          }))
        }
      }
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al crear factura' } },
      { status: 500 }
    )
  }
}
