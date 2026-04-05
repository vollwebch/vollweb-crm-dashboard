// Utility functions for exporting data to CSV and Excel formats

/**
 * Converts an array of objects to CSV string
 */
export function objectsToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  delimiter: string = ';'
): string {
  // Create header row with separator line
  const header = columns.map(col => `"${col.header}"`).join(delimiter)
  const separator = columns.map(() => '"──────────"').join(delimiter)
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      // Handle different value types
      if (value === null || value === undefined) {
        return '""'
      }
      if (typeof value === 'number') {
        // Format numbers with comma for decimals (European format)
        return `"${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`
      }
      if (value instanceof Date) {
        return `"${value.toLocaleDateString('es-ES')}"`
      }
      // Escape quotes and handle strings
      const stringValue = String(value).replace(/"/g, '""')
      return `"${stringValue}"`
    }).join(delimiter)
  })
  
  return [header, separator, ...rows].join('\n')
}

/**
 * Downloads a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exports data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  const csv = objectsToCSV(data, columns)
  // Add BOM for Excel to recognize UTF-8
  const bom = '\uFEFF'
  downloadFile(bom + csv, filename, 'text/csv;charset=utf-8')
}

/**
 * Generates a professional HTML table for Excel export
 * This creates an .xls file that Excel can open with beautiful formatting
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
  title?: string,
  options?: {
    showTotals?: boolean
    currencyColumns?: (keyof T)[]
    dateColumns?: (keyof T)[]
    statusColumns?: (keyof T)[]
  }
) {
  const { 
    showTotals = true, 
    currencyColumns = [],
    dateColumns = [],
    statusColumns = []
  } = options || {}

  // Calculate totals for numeric columns
  const totals: Record<string, number> = {}
  if (showTotals && data.length > 0) {
    columns.forEach(col => {
      const values = data.map(item => item[col.key])
      if (values.every(v => typeof v === 'number')) {
        totals[col.key as string] = values.reduce((sum: number, val: any) => sum + (val || 0), 0)
      }
    })
  }

  // Get date for report header
  const reportDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Title section with branding
  const titleSection = title ? `
    <tr>
      <td colspan="${columns.length}" style="
        background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
        color: white;
        font-size: 18px;
        font-weight: bold;
        padding: 16px 12px;
        text-align: center;
        border: none;
      ">
        <div style="font-size: 22px; margin-bottom: 4px;">📊 ${title}</div>
        <div style="font-size: 11px; font-weight: normal; opacity: 0.9;">Vollweb CRM • ${reportDate}</div>
      </td>
    </tr>
    <tr><td colspan="${columns.length}" style="height: 8px; background: white; border: none;"></td></tr>
  ` : ''

  // Header row with modern styling
  const headerRow = `
    <tr style="background-color: #7c3aed;">
      ${columns.map(col => `
        <th style="
          background-color: #7c3aed;
          color: white;
          font-weight: bold;
          padding: 12px 10px;
          text-align: left;
          border: 1px solid #6d28d9;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">${col.header}</th>
      `).join('')}
    </tr>
  `

  // Data rows with alternating colors and conditional formatting
  const dataRows = data.map((item, index) => {
    const isEven = index % 2 === 0
    const bgColor = isEven ? '#faf5ff' : '#ffffff'
    const hoverColor = isEven ? '#f3e8ff' : '#faf5ff'
    
    return `
      <tr style="background-color: ${bgColor};">
        ${columns.map(col => {
          const value = item[col.key]
          const key = col.key as string
          let displayValue = ''
          let cellStyle = `
            padding: 10px;
            border: 1px solid #e9d5ff;
            font-size: 12px;
          `

          // Handle different value types with formatting
          if (value === null || value === undefined || value === '-') {
            displayValue = '<span style="color: #9ca3af;">—</span>'
          } else if (currencyColumns.includes(key)) {
            // Currency formatting
            displayValue = `<span style="font-weight: 600; color: #059669;">${formatCurrencyForExport(value)}</span>`
            cellStyle += 'text-align: right;'
          } else if (typeof value === 'number') {
            displayValue = `<span style="font-weight: 500;">${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>`
            if (key.toLowerCase().includes('profit') || key.toLowerCase().includes('beneficio')) {
              cellStyle += 'text-align: right;'
              displayValue = `<span style="font-weight: 600; color: ${value >= 0 ? '#059669' : '#dc2626'};">${formatCurrencyForExport(value)}</span>`
            } else if (key.toLowerCase().includes('margin') || key.toLowerCase().includes('margen')) {
              cellStyle += 'text-align: right;'
              const color = value >= 50 ? '#059669' : value >= 30 ? '#d97706' : '#dc2626'
              displayValue = `<span style="font-weight: 600; color: ${color};">${value}%</span>`
            } else {
              cellStyle += 'text-align: right;'
            }
          } else if (dateColumns.includes(key)) {
            displayValue = `<span style="color: #6b7280;">${value}</span>`
          } else if (statusColumns.includes(key)) {
            // Status badges with colors
            const statusColors: Record<string, string> = {
              'Activo': 'background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;',
              'Active': 'background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;',
              'Pausado': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
              'Paused': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
              'Cancelado': 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;',
              'Cancelled': 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;',
              'Expirado': 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;',
              'Expired': 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;',
              'Pendiente': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
              'Pending': 'background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
            }
            const badgeStyle = statusColors[value] || 'background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db;'
            displayValue = `<span style="${badgeStyle} padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${value}</span>`
          } else {
            displayValue = String(value)
          }

          return `<td style="${cellStyle}">${displayValue}</td>`
        }).join('')}
      </tr>
    `
  }).join('')

  // Totals row
  let totalsRow = ''
  if (showTotals && data.length > 0 && Object.keys(totals).length > 0) {
    totalsRow = `
      <tr><td colspan="${columns.length}" style="height: 4px; background: white; border: none;"></td></tr>
      <tr style="background-color: #f5f3ff;">
        ${columns.map((col, index) => {
          const key = col.key as string
          if (index === 0) {
            return `<td style="
              padding: 12px 10px;
              border: 1px solid #e9d5ff;
              font-weight: bold;
              font-size: 12px;
              background-color: #ede9fe;
              color: #5b21b6;
            ">📊 TOTALES (${data.length} registros)</td>`
          }
          const total = totals[key]
          if (total !== undefined) {
            const isCurrency = currencyColumns.includes(key)
            const formatted = isCurrency 
              ? formatCurrencyForExport(total)
              : total.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
            return `<td style="
              padding: 12px 10px;
              border: 1px solid #e9d5ff;
              font-weight: bold;
              font-size: 12px;
              text-align: right;
              background-color: #ede9fe;
              color: #5b21b6;
            ">${formatted}</td>`
          }
          return `<td style="
            padding: 12px 10px;
            border: 1px solid #e9d5ff;
            background-color: #ede9fe;
          "></td>`
        }).join('')}
      </tr>
    `
  }

  // Footer with generation info
  const footerSection = `
    <tr><td colspan="${columns.length}" style="height: 12px; background: white; border: none;"></td></tr>
    <tr>
      <td colspan="${columns.length}" style="
        padding: 8px 12px;
        font-size: 10px;
        color: #9ca3af;
        text-align: center;
        border: none;
        border-top: 1px solid #e5e7eb;
      ">
        Generado automáticamente por Vollweb CRM • ${new Date().toLocaleString('es-ES')}
      </td>
    </tr>
  `

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Reporte</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { 
          border-collapse: collapse; 
          width: 100%; 
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        tr:hover td {
          background-color: #f3e8ff !important;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
      <table style="
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">
        ${titleSection}
        ${headerRow}
        ${dataRows}
        ${totalsRow}
        ${footerSection}
      </table>
    </body>
    </html>
  `
  
  downloadFile(html, filename, 'application/vnd.ms-excel;charset=utf-8')
}

/**
 * Format date for export
 */
export function formatDateForExport(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Client export columns configuration
 */
export const clientExportColumns = [
  { key: 'company' as const, header: 'Empresa' },
  { key: 'name' as const, header: 'Contacto' },
  { key: 'email' as const, header: 'Email' },
  { key: 'phone' as const, header: 'Teléfono' },
  { key: 'status' as const, header: 'Estado' },
  { key: 'monthlyRevenue' as const, header: 'Ingresos Mensuales' },
  { key: 'monthlyCosts' as const, header: 'Costos Mensuales' },
  { key: 'monthlyProfit' as const, header: 'Beneficio Mensual' },
  { key: 'servicesCount' as const, header: 'Servicios' },
  { key: 'domainsCount' as const, header: 'Dominios' },
  { key: 'hostingCount' as const, header: 'Hosting' },
  { key: 'contractStart' as const, header: 'Inicio Contrato' },
  { key: 'contractEnd' as const, header: 'Fin Contrato' },
  { key: 'createdAt' as const, header: 'Fecha Alta' },
]

/**
 * Service export columns configuration
 */
export const serviceExportColumns = [
  { key: 'clientCompany' as const, header: 'Cliente' },
  { key: 'serviceType' as const, header: 'Tipo de Servicio' },
  { key: 'description' as const, header: 'Descripción' },
  { key: 'status' as const, header: 'Estado' },
  { key: 'monthlyPrice' as const, header: 'Precio Mensual' },
  { key: 'annualPrice' as const, header: 'Precio Anual' },
  { key: 'startDate' as const, header: 'Fecha Inicio' },
  { key: 'renewalDate' as const, header: 'Fecha Renovación' },
]

/**
 * Domain export columns configuration
 */
export const domainExportColumns = [
  { key: 'clientCompany' as const, header: 'Cliente' },
  { key: 'domainName' as const, header: 'Dominio' },
  { key: 'registrar' as const, header: 'Registrador' },
  { key: 'status' as const, header: 'Estado' },
  { key: 'cost' as const, header: 'Coste Anual' },
  { key: 'registrationDate' as const, header: 'Fecha Registro' },
  { key: 'renewalDate' as const, header: 'Fecha Renovación' },
]

/**
 * Hosting export columns configuration
 */
export const hostingExportColumns = [
  { key: 'clientCompany' as const, header: 'Cliente' },
  { key: 'provider' as const, header: 'Proveedor' },
  { key: 'plan' as const, header: 'Plan' },
  { key: 'monthlyCost' as const, header: 'Coste Mensual' },
  { key: 'annualCost' as const, header: 'Coste Anual' },
  { key: 'renewalDate' as const, header: 'Fecha Renovación' },
]

/**
 * Finance summary export columns
 */
export const financeExportColumns = [
  { key: 'clientCompany' as const, header: 'Cliente' },
  { key: 'status' as const, header: 'Estado' },
  { key: 'revenue' as const, header: 'Ingresos Mensuales' },
  { key: 'costs' as const, header: 'Costos Mensuales' },
  { key: 'profit' as const, header: 'Beneficio Mensual' },
  { key: 'margin' as const, header: 'Margen (%)' },
]

/**
 * Prepare client data for export
 */
export function prepareClientsForExport(clients: any[]) {
  return clients.map(client => ({
    company: client.company || '',
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '-',
    status: getStatusLabel(client.status),
    monthlyRevenue: client.monthlyRevenue || 0,
    monthlyCosts: client.monthlyCosts || 0,
    monthlyProfit: client.monthlyProfit ?? client.monthlyRevenue - (client.monthlyCosts || 0),
    servicesCount: client._count?.services || client.services?.length || 0,
    domainsCount: client._count?.domains || client.domains?.length || 0,
    hostingCount: client._count?.hosting || client.hosting?.length || 0,
    contractStart: formatDateForExport(client.contractStart),
    contractEnd: formatDateForExport(client.contractEnd),
    createdAt: formatDateForExport(client.createdAt),
  }))
}

/**
 * Prepare services data for export
 */
export function prepareServicesForExport(clients: any[]) {
  const services: any[] = []
  clients.forEach(client => {
    (client.services || []).forEach((service: any) => {
      services.push({
        clientCompany: client.company,
        serviceType: getServiceTypeLabel(service.serviceType),
        description: service.description || '-',
        status: getStatusLabel(service.status),
        monthlyPrice: service.monthlyPrice || 0,
        annualPrice: service.annualPrice || 0,
        startDate: formatDateForExport(service.startDate),
        renewalDate: formatDateForExport(service.renewalDate),
      })
    })
  })
  return services
}

/**
 * Prepare domains data for export
 */
export function prepareDomainsForExport(clients: any[]) {
  const domains: any[] = []
  clients.forEach(client => {
    (client.domains || []).forEach((domain: any) => {
      domains.push({
        clientCompany: client.company,
        domainName: domain.domainName,
        registrar: domain.registrar,
        status: getDomainStatusLabel(domain.status),
        cost: domain.cost || 0,
        registrationDate: formatDateForExport(domain.registrationDate),
        renewalDate: formatDateForExport(domain.renewalDate),
      })
    })
  })
  return domains
}

/**
 * Prepare hosting data for export
 */
export function prepareHostingForExport(clients: any[]) {
  const hostings: any[] = []
  clients.forEach(client => {
    (client.hosting || []).forEach((hosting: any) => {
      hostings.push({
        clientCompany: client.company,
        provider: hosting.provider,
        plan: hosting.plan,
        monthlyCost: hosting.monthlyCost || 0,
        annualCost: hosting.annualCost || (hosting.monthlyCost * 12),
        renewalDate: formatDateForExport(hosting.renewalDate),
      })
    })
  })
  return hostings
}

/**
 * Prepare finance data for export
 */
export function prepareFinanceForExport(clients: any[], monthlyRevenue: number) {
  return clients
    .filter(c => c.status === 'ACTIVE')
    .map(client => {
      const revenue = client.monthlyRevenue || 0
      const costs = client.monthlyCosts || 0
      const profit = client.monthlyProfit ?? (revenue - costs)
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
      
      return {
        clientCompany: client.company,
        status: getStatusLabel(client.status),
        revenue,
        costs,
        profit,
        margin,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    PAUSED: 'Pausado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

function getDomainStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    EXPIRED: 'Expirado',
    PENDING: 'Pendiente',
  }
  return labels[status] || status
}

function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WEB: 'Página Web',
    HOSTING: 'Hosting',
    MAINTENANCE: 'Mantenimiento',
    SEO: 'SEO',
    DOMAIN: 'Dominio',
    EMAIL: 'Email',
    OTHER: 'Otro',
  }
  return labels[type] || type
}
