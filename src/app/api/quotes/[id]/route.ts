import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const quote = await db.quote.findFirst({
      where: {
        id,
        client: { companyId: user.companyId },
        deletedAt: null
      },
      include: {
        client: {
          select: { 
            id: true, 
            name: true, 
            company: true, 
            email: true,
            address: true,
            taxId: true,
            phone: true
          }
        },
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Get quote error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { 
      items, 
      notes, 
      terms, 
      internalNotes,
      validUntil,
      discount,
      status,
      language
    } = body

    // Verify quote belongs to company
    const existingQuote = await db.quote.findFirst({
      where: {
        id,
        client: { companyId: user.companyId },
        deletedAt: null
      }
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // If items provided, recalculate totals
    let updateData: any = {}
    
    if (items && items.length > 0) {
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

      // Delete existing items and create new ones
      await db.quoteItem.deleteMany({
        where: { quoteId: id }
      })

      await db.quoteItem.createMany({
        data: processedItems.map((item: any) => ({
          ...item,
          quoteId: id
        }))
      })

      updateData = {
        subtotal,
        discount: discountDecimal,
        taxAmount,
        total
      }
    }

    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (notes !== undefined) updateData.notes = notes
    if (terms !== undefined) updateData.terms = terms
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (status !== undefined) updateData.status = status
    if (language !== undefined) updateData.language = language

    const quote = await db.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Update quote error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.quote.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete quote error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}
