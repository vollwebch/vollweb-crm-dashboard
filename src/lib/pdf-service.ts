import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '@/lib/db';

interface InvoicePdfData {
  invoiceId: string;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  // Get invoice with all related data
  const invoice = await db.invoice.findUnique({
    where: { id: data.invoiceId },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
      client: true,
      user: true,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Get system configuration
  let config = await db.systemConfig.findFirst();
  if (!config) {
    config = {
      id: 'default',
      companyName: 'Mi Empresa',
      companyTaxId: null,
      companyAddress: null,
      companyCity: null,
      companyPostalCode: null,
      companyCountry: 'España',
      companyPhone: null,
      companyEmail: null,
      companyWebsite: null,
      companyLogo: null,
      invoicePrefix: 'FAC',
      invoiceStartingNumber: 1,
      invoiceDefaultTaxRate: 21,
      invoiceDefaultDueDays: 30,
      invoiceTerms: null,
      invoiceNotes: null,
      currency: 'EUR',
      currencySymbol: '€',
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      smtpPassword: null,
      emailFrom: null,
      emailFromName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const textColor: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [156, 163, 175];

  // Header - Company Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName, margin, yPos);
  yPos += 8;

  // Company details
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  
  const companyDetails: string[] = [];
  if (config.companyAddress) companyDetails.push(config.companyAddress);
  if (config.companyCity && config.companyPostalCode) {
    companyDetails.push(`${config.companyPostalCode} ${config.companyCity}`);
  }
  if (config.companyCountry) companyDetails.push(config.companyCountry);
  
  companyDetails.forEach((detail, i) => {
    doc.text(detail, margin, yPos + (i * 4));
  });
  yPos += companyDetails.length * 4 + 2;

  if (config.companyTaxId) {
    doc.text(`NIF/CIF: ${config.companyTaxId}`, margin, yPos);
    yPos += 4;
  }

  if (config.companyPhone || config.companyEmail) {
    const contactInfo = [config.companyPhone, config.companyEmail].filter(Boolean).join(' | ');
    doc.text(contactInfo, margin, yPos);
    yPos += 4;
  }

  if (config.companyWebsite) {
    doc.text(config.companyWebsite, margin, yPos);
    yPos += 4;
  }

  // Invoice title (right side)
  yPos = 20;
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  const invoiceText = 'INVOICE';
  const textWidth = doc.getTextWidth(invoiceText);
  doc.text(invoiceText, pageWidth - margin - textWidth, yPos);
  yPos += 12;

  // Invoice number and date
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  
  const invoiceDetails = [
    `Number: ${invoice.number}`,
    `Date: ${formatDate(invoice.issueDate)}`,
  ];
  
  if (invoice.dueDate) {
    invoiceDetails.push(`Due: ${formatDate(invoice.dueDate)}`);
  }

  invoiceDetails.forEach((detail, i) => {
    const detailWidth = doc.getTextWidth(detail);
    doc.text(detail, pageWidth - margin - detailWidth, yPos + (i * 5));
  });

  // Status badge
  yPos = 45;
  const statusColors: Record<string, [number, number, number]> = {
    DRAFT: [156, 163, 175],
    SENT: [59, 130, 246],
    PAID: [34, 197, 94],
    OVERDUE: [239, 68, 68],
    CANCELLED: [107, 114, 128],
  };
  
  const statusColor = statusColors[invoice.status] || statusColors.DRAFT;
  const statusText = invoice.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 10;
  
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - statusWidth, yPos, statusWidth, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - margin - statusWidth + 5, yPos + 5.5);

  // Client section
  yPos = 70;
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('BILL TO:', margin, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName, margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, margin, yPos);
    yPos += 5;
  }
  
  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, margin, yPos);
    yPos += 5;
  }
  
  if (invoice.clientTaxId) {
    doc.text(`NIF/CIF: ${invoice.clientTaxId}`, margin, yPos);
    yPos += 5;
  }

  // Invoice items table
  yPos = 110;

  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, config.currencySymbol),
    `${item.taxRate}%`,
    formatCurrency(item.total, config.currencySymbol),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Totals section
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - margin - 80;

  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(formatCurrency(invoice.subtotal, config.currencySymbol), pageWidth - margin, finalY, { align: 'right' });
  
  // Tax
  doc.text(`Tax (${invoice.taxRate}%):`, totalsX, finalY + 6);
  doc.text(formatCurrency(invoice.taxAmount, config.currencySymbol), pageWidth - margin, finalY + 6, { align: 'right' });
  
  // Total
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', totalsX, finalY + 15);
  doc.text(formatCurrency(invoice.total, config.currencySymbol), pageWidth - margin, finalY + 15, { align: 'right' });

  // Terms and notes
  let footerY = finalY + 35;
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont('helvetica', 'normal');

  if (invoice.terms) {
    doc.text('Terms & Conditions:', margin, footerY);
    footerY += 5;
    const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, footerY);
    footerY += termsLines.length * 4 + 5;
  }

  if (invoice.notes) {
    doc.text('Notes:', margin, footerY);
    footerY += 5;
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, footerY);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toFixed(2)} ${symbol}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
