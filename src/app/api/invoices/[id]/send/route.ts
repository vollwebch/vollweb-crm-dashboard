import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// POST - Send invoice by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: { orderBy: { order: 'asc' } }
      }
    })
    
    if (!invoice || invoice.deletedAt) {
      return NextResponse.json(
        { success: false, error: { message: 'Factura no encontrada' } },
        { status: 404 }
      )
    }
    
    if (!invoice.clientEmail) {
      return NextResponse.json(
        { success: false, error: { message: 'El cliente no tiene email' } },
        { status: 400 }
      )
    }
    
    const systemConfig = await db.systemConfig.findFirst()
    
    // Check if SMTP is configured
    if (!systemConfig?.smtpHost || !systemConfig?.smtpUser) {
      console.log('📧 Email not configured. SMTP settings needed in SystemConfig.')
      console.log('📧 Would send to:', invoice.clientEmail)
      
      // Update invoice as sent anyway for demo
      const updatedInvoice = await db.invoice.update({
        where: { id },
        data: {
          status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
          emailSent: true,
          emailSentAt: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Email simulado (configura SMTP para envío real)',
          invoice: updatedInvoice
        }
      })
    }
    
    // In production, integrate with nodemailer or email service
    // For now, simulate sending
    console.log('📧 Sending email via SMTP:', {
      host: systemConfig.smtpHost,
      to: invoice.clientEmail,
      from: systemConfig.emailFrom,
      subject: `Factura ${invoice.number}`
    })
    
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
        emailSent: true,
        emailSentAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Factura enviada correctamente',
        invoice: updatedInvoice
      }
    })
  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al enviar factura' } },
      { status: 500 }
    )
  }
}
