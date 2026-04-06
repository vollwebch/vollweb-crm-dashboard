import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

// Translations for invoices
const translations: Record<string, Record<string, string>> = {
  es: {
    invoice: 'FACTURA',
    draft: 'Borrador',
    sent: 'Enviada',
    paid: 'Pagada',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
    issueDate: 'Fecha de emisión',
    dueDate: 'Vencimiento',
    billTo: 'FACTURAR A',
    description: 'Descripción',
    qty: 'Cant.',
    price: 'Precio',
    tax: 'IVA',
    total: 'Total',
    subtotal: 'Subtotal',
    taxAmount: 'IVA',
    totalAmount: 'TOTAL',
    notes: 'Notas',
    terms: 'Condiciones',
    taxId: 'NIF',
    page: 'Página',
  },
  de: {
    invoice: 'RECHNUNG',
    draft: 'Entwurf',
    sent: 'Gesendet',
    paid: 'Bezahlt',
    overdue: 'Überfällig',
    cancelled: 'Storniert',
    issueDate: 'Rechnungsdatum',
    dueDate: 'Fälligkeitsdatum',
    billTo: 'RECHNUNG AN',
    description: 'Beschreibung',
    qty: 'Menge',
    price: 'Preis',
    tax: 'MwSt',
    total: 'Total',
    subtotal: 'Zwischensumme',
    taxAmount: 'MwSt',
    totalAmount: 'GESAMT',
    notes: 'Anmerkungen',
    terms: 'Bedingungen',
    taxId: 'UID',
    page: 'Seite',
  },
  fr: {
    invoice: 'FACTURE',
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
    issueDate: 'Date d\'émission',
    dueDate: 'Échéance',
    billTo: 'FACTURER À',
    description: 'Description',
    qty: 'Qté',
    price: 'Prix',
    tax: 'TVA',
    total: 'Total',
    subtotal: 'Sous-total',
    taxAmount: 'TVA',
    totalAmount: 'TOTAL',
    notes: 'Notes',
    terms: 'Conditions',
    taxId: 'N° TVA',
    page: 'Page',
  },
  it: {
    invoice: 'FATTURA',
    draft: 'Bozza',
    sent: 'Inviata',
    paid: 'Pagata',
    overdue: 'Scaduta',
    cancelled: 'Annullata',
    issueDate: 'Data di emissione',
    dueDate: 'Scadenza',
    billTo: 'FATTURARE A',
    description: 'Descrizione',
    qty: 'Qtà',
    price: 'Prezzo',
    tax: 'IVA',
    total: 'Totale',
    subtotal: 'Subtotale',
    taxAmount: 'IVA',
    totalAmount: 'TOTALE',
    notes: 'Note',
    terms: 'Condizioni',
    taxId: 'P.IVA',
    page: 'Pagina',
  },
  en: {
    invoice: 'INVOICE',
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    billTo: 'BILL TO',
    description: 'Description',
    qty: 'Qty',
    price: 'Price',
    tax: 'Tax',
    total: 'Total',
    subtotal: 'Subtotal',
    taxAmount: 'Tax',
    totalAmount: 'TOTAL',
    notes: 'Notes',
    terms: 'Terms',
    taxId: 'Tax ID',
    page: 'Page',
  },
}

// Professional colors matching the logo (black, orange)
const colors = {
  black: [0, 0, 0] as [number, number, number],
  orange: [249, 115, 22] as [number, number, number], // Orange accent
  darkGray: [60, 60, 60] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  bgGray: [248, 248, 248] as [number, number, number],
}

// Status colors
const statusColors: Record<string, [number, number, number]> = {
  DRAFT: [120, 120, 120],
  SENT: [249, 115, 22], // Orange
  PAID: [34, 197, 94],
  OVERDUE: [239, 68, 68],
  CANCELLED: [100, 100, 100]
}

// GET - Generate and download PDF
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
    
    // Use invoice language field, fallback to es
    const language = invoice.language || 'es'
    const t = translations[language] || translations.es
    

    
    const systemConfig = await db.systemConfig.findFirst()
    
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Try to add logo with proper aspect ratio
    let logoAdded = false
    let logoWidth = 0
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath)
        const base64 = logoData.toString('base64')
        // Logo is 288x288 (square), maintain aspect ratio
        // Set height to 20mm, width will be same (square)
        const logoSize = 20 // mm, for square logo
        doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 14, 8, logoSize, logoSize)
        logoAdded = true
        logoWidth = logoSize
      }
    } catch (e) {
      console.log('Could not add logo:', e)
    }
    
    // Header - Company Name (positioned after logo)
    const textStartX = logoAdded ? (14 + logoWidth + 5) : 14
    doc.setFontSize(20)
    doc.setTextColor(...colors.black)
    doc.setFont('helvetica', 'bold')
    doc.text(systemConfig?.companyName || 'Vollweb', textStartX, 22)
    
    // Company details
    doc.setFontSize(8)
    doc.setTextColor(...colors.gray)
    doc.setFont('helvetica', 'normal')
    
    let companyY = 28
    if (systemConfig?.companyTaxId) {
      doc.text(`${t.taxId}: ${systemConfig.companyTaxId}`, textStartX, companyY)
      companyY += 4
    }
    if (systemConfig?.companyAddress) {
      doc.text(systemConfig.companyAddress, textStartX, companyY)
      companyY += 4
    }
    if (systemConfig?.companyPostalCode && systemConfig?.companyCity) {
      doc.text(`${systemConfig.companyPostalCode} ${systemConfig.companyCity}`, textStartX, companyY)
      companyY += 4
    }
    if (systemConfig?.companyEmail) {
      doc.text(systemConfig.companyEmail, textStartX, companyY)
    }
    
    // Invoice title (right side)
    doc.setFontSize(24)
    doc.setTextColor(...colors.black)
    doc.setFont('helvetica', 'bold')
    doc.text(t.invoice, pageWidth - 14, 20, { align: 'right' })
    
    doc.setFontSize(11)
    doc.text(invoice.number, pageWidth - 14, 30, { align: 'right' })
    
    // Status badge
    const statusLabels: Record<string, string> = {
      DRAFT: t.draft,
      SENT: t.sent,
      PAID: t.paid,
      OVERDUE: t.overdue,
      CANCELLED: t.cancelled
    }
    
    doc.setFontSize(9)
    doc.setTextColor(...(statusColors[invoice.status] || statusColors.DRAFT))
    doc.text(statusLabels[invoice.status] || invoice.status, pageWidth - 14, 38, { align: 'right' })
    
    // Dates
    doc.setFontSize(8)
    doc.setTextColor(...colors.gray)
    
    let datesY = 48
    const issueDate = new Date(invoice.issueDate).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : 'es-ES')
    doc.text(`${t.issueDate}: ${issueDate}`, pageWidth - 14, datesY, { align: 'right' })
    
    if (invoice.dueDate) {
      datesY += 5
      const dueDate = new Date(invoice.dueDate).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : 'es-ES')
      doc.text(`${t.dueDate}: ${dueDate}`, pageWidth - 14, datesY, { align: 'right' })
    }
    
    // Client box
    const clientBoxY = 58
    doc.setDrawColor(...colors.lightGray)
    doc.setFillColor(...colors.bgGray)
    doc.roundedRect(14, clientBoxY, 85, 32, 2, 2, 'FD')
    
    doc.setFontSize(7)
    doc.setTextColor(...colors.gray)
    doc.text(t.billTo, 18, clientBoxY + 7)
    
    doc.setFontSize(10)
    doc.setTextColor(...colors.black)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.clientName, 18, clientBoxY + 14)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.gray)
    
    let clientInfoY = clientBoxY + 20
    if (invoice.clientEmail) {
      doc.text(invoice.clientEmail, 18, clientInfoY)
      clientInfoY += 4
    }
    if (invoice.clientTaxId) {
      doc.text(`${t.taxId}: ${invoice.clientTaxId}`, 18, clientInfoY)
      clientInfoY += 4
    }
    if (invoice.clientAddress) {
      doc.text(invoice.clientAddress, 18, clientInfoY)
    }
    
    // Items table
    const tableStartY = clientBoxY + 40
    
    const tableData = invoice.items.map(item => [
      item.description,
      Number(item.quantity).toString(),
      formatCurrency(Number(item.unitPrice), systemConfig?.currency),
      `${Number(item.taxRate)}%`,
      formatCurrency(Number(item.total), systemConfig?.currency)
    ])
    
    autoTable(doc, {
      startY: tableStartY,
      head: [[t.description, t.qty, t.price, t.tax, t.total]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.black,
        textColor: colors.white,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.darkGray,
      },
      alternateRowStyles: {
        fillColor: colors.bgGray,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })
    
    // Totals section
    const finalY = (doc as any).lastAutoTable.finalY + 8
    const totalsX = pageWidth - 65
    
    // Totals box
    doc.setDrawColor(...colors.lightGray)
    doc.setFillColor(...colors.bgGray)
    doc.roundedRect(totalsX - 10, finalY - 5, 65, 30, 2, 2, 'FD')
    
    doc.setFontSize(8)
    doc.setTextColor(...colors.gray)
    doc.text(`${t.subtotal}:`, totalsX - 5, finalY + 2)
    doc.text(formatCurrency(Number(invoice.subtotal), systemConfig?.currency), pageWidth - 14, finalY + 2, { align: 'right' })
    
    doc.text(`${t.taxAmount} (${Number(invoice.taxRate)}%):`, totalsX - 5, finalY + 10)
    doc.text(formatCurrency(Number(invoice.taxAmount), systemConfig?.currency), pageWidth - 14, finalY + 10, { align: 'right' })
    
    doc.setFontSize(11)
    doc.setTextColor(...colors.black)
    doc.setFont('helvetica', 'bold')
    doc.text(`${t.totalAmount}:`, totalsX - 5, finalY + 20)
    doc.setTextColor(...colors.orange)
    doc.text(formatCurrency(Number(invoice.total), systemConfig?.currency), pageWidth - 14, finalY + 20, { align: 'right' })
    
    // Notes
    let notesY = finalY + 45
    if (invoice.notes) {
      doc.setFontSize(7)
      doc.setTextColor(...colors.gray)
      doc.setFont('helvetica', 'bold')
      doc.text(`${t.notes}:`, 14, notesY)
      doc.setFont('helvetica', 'normal')
      const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 28)
      doc.text(notesLines, 14, notesY + 4)
      notesY += notesLines.length * 3 + 8
    }
    
    if (invoice.terms) {
      doc.setFontSize(7)
      doc.setTextColor(...colors.gray)
      doc.setFont('helvetica', 'bold')
      doc.text(`${t.terms}:`, 14, notesY)
      doc.setFont('helvetica', 'normal')
      const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - 28)
      doc.text(termsLines, 14, notesY + 4)
    }
    
    // Footer
    doc.setDrawColor(...colors.lightGray)
    doc.setLineWidth(0.5)
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15)
    
    doc.setFontSize(7)
    doc.setTextColor(...colors.gray)
    doc.text(
      `${systemConfig?.companyName || 'Vollweb'}${systemConfig?.companyEmail ? ` | ${systemConfig.companyEmail}` : ''}${systemConfig?.companyPhone ? ` | ${systemConfig.companyPhone}` : ''}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error al generar PDF' } },
      { status: 500 }
    )
  }
}

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const locales: Record<string, string> = {
    EUR: 'es-ES',
    USD: 'en-US',
    GBP: 'en-GB',
    CHF: 'de-CH',
  }
  
  return new Intl.NumberFormat(locales[currency] || 'es-ES', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(amount)
}
