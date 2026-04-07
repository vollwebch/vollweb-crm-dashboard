import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// Generate invoice number
async function generateInvoiceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear()
  
  let counter = await db.$queryRaw<{ last_number: number }[]>`
    SELECT last_number FROM invoice_counter 
    WHERE company_id = ${companyId} AND year = ${year}
    FOR UPDATE
  `

  if (counter.length === 0) {
    await db.$executeRaw`
      INSERT INTO invoice_counter (company_id, year, last_number, created_at, updated_at)
      VALUES (${companyId}, ${year}, 1, NOW(), NOW())
    `
    return `FAC-${year}-0001`
  }

  const nextNumber = counter[0].last_number + 1
  
  await db.$executeRaw`
    UPDATE invoice_counter 
    SET last_number = ${nextNumber}, updated_at = NOW()
    WHERE company_id = ${companyId} AND year = ${year}
  `

  return `FAC-${year}-${String(nextNumber).padStart(4, '0')}`
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

    // Verify quote belongs to company
    const quote = await db.quote.findFirst({
      where: {
        id,
        client: { companyId: user.companyId },
        deletedAt: null
      },
      include: {
        items: true,
        client: true
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    if (quote.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Esta cotización ya fue convertida a factura' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(user.companyId)

    // Create invoice from quote
    const invoice = await db.invoice.create({
      data: {
        number: invoiceNumber,
        clientId: quote.clientId,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientAddress: quote.clientAddress,
        clientTaxId: quote.clientTaxId,
        language: quote.language,
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        status: 'DRAFT',
        items: {
          create: quote.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
            order: item.order
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Mark quote as converted
    await db.quote.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        invoiceId: invoice.id,
        convertedAt: new Date()
      }
    })

    // Create notification
    await db.notification.create({
      data: {
        type: 'INFO',
        title: 'Cotización convertida',
        message: `La cotización ${quote.number} ha sido convertida a factura ${invoiceNumber}`,
        userId: user.id,
        entityType: 'QUOTE',
        entityId: quote.id,
        data: { quoteId: quote.id, invoiceId: invoice.id }
      }
    })

    return NextResponse.json({ 
      success: true, 
      invoice,
      quoteNumber: quote.number 
    })
  } catch (error) {
    console.error('Convert quote error:', error)
    return NextResponse.json(
      { error: 'Error al convertir cotización' },
      { status: 500 }
    )
  }
}
