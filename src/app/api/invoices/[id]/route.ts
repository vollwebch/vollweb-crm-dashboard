import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// GET - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!invoice || invoice.deletedAt) {
      return NextResponse.json(
        { success: false, error: { message: 'Factura no encontrada' } },
        { status: 404 }
      )
    }
    
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
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al obtener factura' } },
      { status: 500 }
    )
  }
}

// PATCH - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingInvoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true }
    })
    
    if (!existingInvoice || existingInvoice.deletedAt) {
      return NextResponse.json(
        { success: false, error: { message: 'Factura no encontrada' } },
        { status: 404 }
      )
    }
    
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: { message: 'No se puede editar una factura pagada' } },
        { status: 400 }
      )
    }
    
    const { items, status, dueDate, notes, terms, paidAt, language } = body
    
    // If only updating status
    if (status && !items) {
      const updateData: any = { status }
      if (status === 'PAID') {
        updateData.paidAt = paidAt ? new Date(paidAt) : new Date()
      }
      
      const invoice = await db.invoice.update({
        where: { id },
        data: updateData,
        include: { client: true, items: true }
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
    }
    
    // Full update with items
    if (items) {
      let subtotal = 0
      const processedItems = items.map((item: any, index: number) => {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice)
        subtotal += itemTotal
        return {
          description: item.description,
          quantity: new Decimal(item.quantity),
          unitPrice: new Decimal(item.unitPrice),
          taxRate: new Decimal(item.taxRate || 21),
          total: new Decimal(itemTotal),
          order: index
        }
      })
      
      const taxRate = body.taxRate || 21
      const taxAmount = subtotal * (taxRate / 100)
      const total = subtotal + taxAmount
      
      await db.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })
      
      const invoice = await db.invoice.update({
        where: { id },
        data: {
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          terms,
          language,
          subtotal: new Decimal(subtotal),
          taxRate: new Decimal(taxRate),
          taxAmount: new Decimal(taxAmount),
          total: new Decimal(total),
          items: {
            create: processedItems
          }
        },
        include: { client: true, items: true }
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
    }
    
    return NextResponse.json(
      { success: false, error: { message: 'Nada que actualizar' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al actualizar factura' } },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const invoice = await db.invoice.findUnique({
      where: { id }
    })
    
    if (!invoice || invoice.deletedAt) {
      return NextResponse.json(
        { success: false, error: { message: 'Factura no encontrada' } },
        { status: 404 }
      )
    }
    
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: { message: 'No se puede eliminar una factura pagada' } },
        { status: 400 }
      )
    }
    
    await db.invoice.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    
    return NextResponse.json({
      success: true,
      data: { message: 'Factura eliminada' }
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al eliminar factura' } },
      { status: 500 }
    )
  }
}
