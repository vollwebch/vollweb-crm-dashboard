import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// Generate quote number
async function generateQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear()
  
  let counter = await db.$queryRaw<{ last_number: number }[]>`
    SELECT last_number FROM quote_counter 
    WHERE company_id = ${companyId} AND year = ${year}
    FOR UPDATE
  `

  if (counter.length === 0) {
    await db.$executeRaw`
      INSERT INTO quote_counter (company_id, year, last_number, created_at, updated_at)
      VALUES (${companyId}, ${year}, 1, NOW(), NOW())
    `
    return `COT-${year}-0001`
  }

  const nextNumber = counter[0].last_number + 1
  
  await db.$executeRaw`
    UPDATE quote_counter 
    SET last_number = ${nextNumber}, updated_at = NOW()
    WHERE company_id = ${companyId} AND year = ${year}
  `

  return `COT-${year}-${String(nextNumber).padStart(4, '0')}`
}

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
    const clientId = searchParams.get('clientId')

    const where: any = {
      client: { companyId: user.companyId },
      deletedAt: null
    }
    
    if (status) {
      where.status = status
    }
    if (clientId) {
      where.clientId = clientId
    }

    const quotes = await db.quote.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        items: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { issueDate: 'desc' }
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Get quotes error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
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
    const { 
      clientId, 
      items, 
      notes, 
      terms, 
      internalNotes,
      validUntil,
      discount,
      language
    } = body

    if (!clientId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cliente e items son requeridos' },
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

    // Calculate totals
    let subtotal = new Decimal(0)
    const processedItems = items.map((item: any, index: number) => {
      const quantity = new Decimal(item.quantity || 1)
      const unitPrice = new Decimal(item.unitPrice || 0)
      const taxRate = new Decimal(item.taxRate || 21)
      const total = quantity.mul(unitPrice)
      subtotal = subtotal.add(total)
      
      return {
        description: item.description,
        quantity,
        unitPrice,
        taxRate,
        total,
        order: index
      }
    })

    const discountDecimal = new Decimal(discount || 0)
    const taxRate = new Decimal(21)
    const discountedSubtotal = subtotal.sub(discountDecimal)
    const taxAmount = discountedSubtotal.mul(taxRate).div(100)
    const total = discountedSubtotal.add(taxAmount)

    // Generate quote number
    const number = await generateQuoteNumber(user.companyId)

    const quote = await db.quote.create({
      data: {
        number,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        clientTaxId: client.taxId,
        validUntil: validUntil ? new Date(validUntil) : null,
        language: language || 'es',
        subtotal,
        taxRate,
        taxAmount,
        discount: discountDecimal,
        total,
        notes,
        terms,
        internalNotes,
        items: {
          create: processedItems
        }
      },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        items: true
      }
    })

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Create quote error:', error)
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    )
  }
}
