import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCompanyId } from '@/lib/auth'

// =====================================================
// CONFIGURACIÓN - GROQ API
// =====================================================
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

function getApiKey(): string | undefined {
  return process.env.GROQ_API_KEY
}

// =====================================================
// TIPOS
// =====================================================
interface LinkRapido {
  tipo: 'cliente' | 'dominio' | 'servicio' | 'pago' | 'hosting'
  id: string
  label: string
  sublabel?: string
  url: string
}

interface DatosContexto {
  resumen: string
  links: LinkRapido[]
  acciones: string[]
}

// =====================================================
// UTILIDADES
// =====================================================
const formatCurrency = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const formatDate = (d: Date | string | null) => d ? new Date(d).toLocaleDateString('es-ES') : 'Sin fecha'
const daysUntil = (d: Date | string | null): number | null => {
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// =====================================================
// FUNCIONES DE DATOS
// =====================================================

async function getResumenGeneral(companyId: string): Promise<DatosContexto> {
  const [clientes, servicios, dominios, hosting, pagos] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.clientService.count({ where: { client: { companyId }, status: 'ACTIVE' } }),
    prisma.domain.count({ where: { client: { companyId }, status: 'ACTIVE' } }),
    prisma.hosting.count({ where: { client: { companyId } } }),
    prisma.payment.count({ where: { client: { companyId }, status: 'PENDING' } })
  ])
  
  const clientesActivos = await prisma.client.count({ where: { companyId, status: 'ACTIVE' } })
  const clientesPausados = await prisma.client.count({ where: { companyId, status: 'PAUSED' } })
  
  // Finanzas
  const clientesData = await prisma.client.findMany({
    where: { companyId, status: 'ACTIVE' },
    include: { services: { where: { status: 'ACTIVE' } } }
  })
  const ingresosMensuales = clientesData.reduce((s, c) => 
    s + c.services.reduce((ss, x) => ss + Number(x.monthlyPrice), 0), 0
  )
  
  // Alertas próximas
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const en7dias = new Date(hoy)
  en7dias.setDate(en7dias.getDate() + 7)
  
  const contratosPorVencer = await prisma.client.count({
    where: { companyId, status: 'ACTIVE', contractEnd: { gte: hoy, lte: en7dias } }
  })
  
  const dominiosPorVencer = await prisma.domain.count({
    where: { client: { companyId }, status: 'ACTIVE', renewalDate: { gte: hoy, lte: en7dias } }
  })
  
  return {
    resumen: `
📊 **RESUMEN GENERAL DEL CRM**

👥 **Clientes:** ${clientes} totales
   • ${clientesActivos} activos
   • ${clientesPausados} pausados

🔧 **Servicios Activos:** ${servicios}
🌐 **Dominios:** ${dominios}
🖥️ **Hosting:** ${hosting}

💰 **Ingresos Mensuales:** ${formatCurrency(ingresosMensuales)}

⚠️ **Alertas Próximas 7 días:**
   • ${contratosPorVencer} contratos por vencer
   • ${dominiosPorVencer} dominios por renovar

📋 **Pagos Pendientes:** ${pagos}
    `,
    links: [],
    acciones: [
      'Dime qué contratos vencen pronto',
      'Qué dominios se renuevan esta semana',
      'Quién me debe dinero',
      'Cuáles son mis mejores clientes'
    ]
  }
}

async function getContratosDetallado(companyId: string, dias: number = 30): Promise<DatosContexto> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const futuro = new Date()
  futuro.setDate(futuro.getDate() + dias)
  
  const [activos, porVencer, vencidos] = await Promise.all([
    prisma.client.count({ 
      where: { companyId, status: 'ACTIVE', contractEnd: { gte: hoy } } 
    }),
    prisma.client.findMany({
      where: { companyId, status: 'ACTIVE', contractEnd: { gte: hoy, lte: futuro } },
      select: { id: true, name: true, company: true, contractEnd: true, email: true },
      orderBy: { contractEnd: 'asc' },
      take: 15
    }),
    prisma.client.findMany({
      where: { companyId, status: 'ACTIVE', contractEnd: { lt: hoy } },
      select: { id: true, name: true, company: true, contractEnd: true },
      orderBy: { contractEnd: 'desc' },
      take: 5
    })
  ])
  
  const links: LinkRapido[] = []
  
  let resumen = `📋 **ESTADO DE CONTRATOS**\n\n`
  resumen += `✅ **Contratos Activos:** ${activos}\n`
  resumen += `⏰ **Por Vencer (${dias} días):** ${porVencer.length}\n`
  if (vencidos.length > 0) {
    resumen += `❌ **Vencidos:** ${vencidos.length}\n`
  }
  
  if (porVencer.length > 0) {
    resumen += `\n---\n\n**🔴 CONTRATOS PRÓXIMOS A VENCER:**\n\n`
    porVencer.forEach(c => {
      const diasRestantes = daysUntil(c.contractEnd)
      const urgente = diasRestantes !== null && diasRestantes <= 7
      resumen += `${urgente ? '⚠️' : '📅'} **${c.name}**${c.company ? ` (${c.company})` : ''}\n`
      resumen += `   Vence: ${formatDate(c.contractEnd)} (${diasRestantes} días)\n\n`
      
      links.push({
        tipo: 'cliente',
        id: c.id,
        label: c.name,
        sublabel: `Vence en ${diasRestantes} días`,
        url: `/clients/${c.id}`
      })
    })
  }
  
  if (vencidos.length > 0) {
    resumen += `\n**❌ CONTRATOS VENCIDOS (requieren atención):**\n\n`
    vencidos.forEach(c => {
      resumen += `🔴 **${c.name}**${c.company ? ` (${c.company})` : ''}\n`
      resumen += `   Vencido: ${formatDate(c.contractEnd)}\n\n`
      
      links.push({
        tipo: 'cliente',
        id: c.id,
        label: c.name,
        sublabel: 'Vencido',
        url: `/clients/${c.id}`
      })
    })
  }
  
  return {
    resumen,
    links,
    acciones: ['Renueva el contrato de...', 'Contacta a...', 'Pausa el cliente...']
  }
}

async function getDominiosDetallado(companyId: string, dias: number = 30): Promise<DatosContexto> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const futuro = new Date()
  futuro.setDate(futuro.getDate() + dias)
  
  const [total, porRenovar] = await Promise.all([
    prisma.domain.count({ where: { client: { companyId }, status: 'ACTIVE' } }),
    prisma.domain.findMany({
      where: { client: { companyId }, status: 'ACTIVE', renewalDate: { gte: hoy, lte: futuro } },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { renewalDate: 'asc' },
      take: 15
    })
  ])
  
  const links: LinkRapido[] = []
  
  let resumen = `🌐 **DOMINIOS**\n\n`
  resumen += `Total dominios activos: ${total}\n`
  resumen += `Próximos a renovar (${dias} días): ${porRenovar.length}\n`
  
  if (porRenovar.length > 0) {
    resumen += `\n---\n\n**📅 DOMINIOS PRÓXIMOS A RENOVAR:**\n\n`
    porRenovar.forEach(d => {
      const diasRestantes = daysUntil(d.renewalDate)
      const urgente = diasRestantes !== null && diasRestantes <= 7
      resumen += `${urgente ? '⚠️' : '🌐'} **${d.domainName}**\n`
      resumen += `   Cliente: ${d.client.name}\n`
      resumen += `   Renovación: ${formatDate(d.renewalDate)} (${diasRestantes} días)\n`
      resumen += `   Costo: ${formatCurrency(Number(d.cost))}\n\n`
      
      links.push({
        tipo: 'dominio',
        id: d.id,
        label: d.domainName,
        sublabel: `${d.client.name} - ${diasRestantes} días`,
        url: `/clients/${d.clientId}`
      })
    })
  }
  
  return {
    resumen,
    links,
    acciones: ['Renueva el dominio...', 'Contacta al cliente...']
  }
}

async function getFinanzasDetallado(companyId: string): Promise<DatosContexto> {
  const clientes = await prisma.client.findMany({
    where: { companyId, status: 'ACTIVE' },
    include: { 
      services: { where: { status: 'ACTIVE' } },
      hosting: true
    }
  })
  
  let ingresos = 0, costos = 0
  clientes.forEach(c => {
    ingresos += c.services.reduce((s, x) => s + Number(x.monthlyPrice), 0)
    costos += c.hosting.reduce((s, x) => s + Number(x.monthlyCost), 0)
  })
  
  const beneficio = ingresos - costos
  const margen = ingresos > 0 ? ((beneficio / ingresos) * 100).toFixed(1) : 0
  
  // Top clientes
  const clientesPorIngreso = clientes
    .map(c => ({
      id: c.id,
      nombre: c.name,
      empresa: c.company,
      ingresos: c.services.reduce((s, x) => s + Number(x.monthlyPrice), 0)
    }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5)
  
  const links: LinkRapido[] = clientesPorIngreso.map(c => ({
    tipo: 'cliente',
    id: c.id,
    label: c.nombre,
    sublabel: formatCurrency(c.ingresos) + '/mes',
    url: `/clients/${c.id}`
  }))
  
  let resumen = `💰 **FINANZAS MENSUALES**\n\n`
  resumen += `📈 **Ingresos:** ${formatCurrency(ingresos)}\n`
  resumen += `📉 **Costos:** ${formatCurrency(costos)}\n`
  resumen += `💵 **Beneficio Neto:** ${formatCurrency(beneficio)}\n`
  resumen += `📊 **Margen:** ${margen}%\n\n`
  resumen += `📅 **Proyección Anual:** ${formatCurrency(beneficio * 12)}\n`
  
  if (clientesPorIngreso.length > 0) {
    resumen += `\n---\n\n**🏆 TOP 5 CLIENTES POR INGRESOS:**\n\n`
    clientesPorIngreso.forEach((c, i) => {
      resumen += `${i + 1}. **${c.nombre}**${c.empresa ? ` (${c.empresa})` : ''}\n`
      resumen += `   ${formatCurrency(c.ingresos)}/mes\n\n`
    })
  }
  
  return {
    resumen,
    links,
    acciones: ['Ver detalle de...', 'Aumentar precio a...']
  }
}

async function getPagosPendientesDetallado(companyId: string): Promise<DatosContexto> {
  const hoy = new Date()
  
  const pagos = await prisma.payment.findMany({
    where: { client: { companyId }, status: 'PENDING' },
    include: { client: { select: { id: true, name: true, company: true, email: true } } },
    orderBy: { dueDate: 'asc' },
    take: 20
  })
  
  const total = pagos.reduce((s, p) => s + Number(p.amount), 0)
  const vencidos = pagos.filter(p => p.dueDate && new Date(p.dueDate) < hoy)
  const totalVencido = vencidos.reduce((s, p) => s + Number(p.amount), 0)
  
  const links: LinkRapido[] = []
  
  let resumen = `💳 **PAGOS PENDIENTES**\n\n`
  resumen += `📋 Total: ${pagos.length} pagos\n`
  resumen += `💰 Monto Total: ${formatCurrency(total)}\n`
  if (vencidos.length > 0) {
    resumen += `❌ Vencidos: ${vencidos.length} (${formatCurrency(totalVencido)})\n`
  }
  
  if (pagos.length > 0) {
    resumen += `\n---\n\n`
    
    // Primero los vencidos
    if (vencidos.length > 0) {
      resumen += `**❌ PAGOS VENCIDOS (URGENTE):**\n\n`
      vencidos.slice(0, 5).forEach(p => {
        resumen += `🔴 **${p.client.name}**\n`
        resumen += `   Monto: ${formatCurrency(Number(p.amount))}\n`
        resumen += `   Vencido: ${formatDate(p.dueDate)}\n\n`
        
        links.push({
          tipo: 'pago',
          id: p.id,
          label: p.client.name,
          sublabel: `${formatCurrency(Number(p.amount))} - VENCIDO`,
          url: `/clients/${p.clientId}`
        })
      })
    }
    
    // Luego los pendientes
    const pendientes = pagos.filter(p => !p.dueDate || new Date(p.dueDate) >= hoy)
    if (pendientes.length > 0) {
      resumen += `**⏳ PENDIENTES PRÓXIMOS:**\n\n`
      pendientes.slice(0, 5).forEach(p => {
        resumen += `📋 **${p.client.name}**\n`
        resumen += `   Monto: ${formatCurrency(Number(p.amount))}\n`
        resumen += `   Vence: ${formatDate(p.dueDate)}\n\n`
        
        links.push({
          tipo: 'pago',
          id: p.id,
          label: p.client.name,
          sublabel: formatCurrency(Number(p.amount)),
          url: `/clients/${p.clientId}`
        })
      })
    }
  }
  
  return {
    resumen,
    links,
    acciones: ['Marcar como pagado...', 'Enviar recordatorio a...', 'Contactar a...']
  }
}

async function getServiciosDetallado(companyId: string): Promise<DatosContexto> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const futuro = new Date()
  futuro.setDate(futuro.getDate() + 30)
  
  const [total, porRenovar] = await Promise.all([
    prisma.clientService.count({ where: { client: { companyId }, status: 'ACTIVE' } }),
    prisma.clientService.findMany({
      where: { client: { companyId }, status: 'ACTIVE', renewalDate: { gte: hoy, lte: futuro } },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { renewalDate: 'asc' },
      take: 10
    })
  ])
  
  // Servicios por tipo
  const porTipo = await prisma.clientService.groupBy({
    by: ['serviceType'],
    where: { client: { companyId }, status: 'ACTIVE' },
    _count: true
  })
  
  const links: LinkRapido[] = []
  
  let resumen = `🔧 **SERVICIOS ACTIVOS**\n\n`
  resumen += `Total: ${total}\n\n`
  
  if (porTipo.length > 0) {
    resumen += `**Por Tipo:**\n`
    porTipo.forEach(t => {
      resumen += `• ${t.serviceType || 'Sin tipo'}: ${t._count}\n`
    })
  }
  
  if (porRenovar.length > 0) {
    resumen += `\n---\n\n**📅 RENOVACIONES PRÓXIMAS (30 días):**\n\n`
    porRenovar.forEach(s => {
      const dias = daysUntil(s.renewalDate)
      resumen += `🔧 **${s.serviceType}** - ${s.client.name}\n`
      resumen += `   Precio: ${formatCurrency(Number(s.monthlyPrice))}/mes\n`
      resumen += `   Renovación: ${formatDate(s.renewalDate)} (${dias} días)\n\n`
      
      links.push({
        tipo: 'servicio',
        id: s.id,
        label: s.serviceType,
        sublabel: `${s.client.name} - ${dias} días`,
        url: `/clients/${s.clientId}`
      })
    })
  }
  
  return {
    resumen,
    links,
    acciones: ['Renovar servicio...', 'Actualizar precio...']
  }
}

async function getClienteEspecifico(companyId: string, query: string): Promise<DatosContexto> {
  const clientes = await prisma.client.findMany({
    where: {
      companyId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      services: { where: { status: 'ACTIVE' } },
      domains: { where: { status: 'ACTIVE' } },
      hosting: true,
      payments: { where: { status: 'PENDING' }, take: 5 }
    },
    take: 5
  })
  
  const links: LinkRapido[] = []
  
  if (clientes.length === 0) {
    return {
      resumen: `🔍 No encontré clientes con "${query}"\n\nIntenta con otro nombre o revisa el listado completo.`,
      links: [],
      acciones: ['Buscar otro cliente...', 'Ver todos los clientes']
    }
  }
  
  let resumen = `🔍 **RESULTADOS PARA "${query}":**\n\n`
  
  clientes.forEach(c => {
    const ingresos = c.services.reduce((s, x) => s + Number(x.monthlyPrice), 0)
    const pagosPendientes = c.payments.reduce((s, p) => s + Number(p.amount), 0)
    
    resumen += `👤 **${c.name}**${c.company ? ` (${c.company})` : ''}\n`
    resumen += `   Estado: ${c.status}\n`
    resumen += `   Email: ${c.email || 'Sin email'}\n`
    resumen += `   Servicios: ${c.services.length} | Dominios: ${c.domains.length}\n`
    resumen += `   Ingresos/mes: ${formatCurrency(ingresos)}\n`
    if (pagosPendientes > 0) {
      resumen += `   ⚠️ Pagos pendientes: ${formatCurrency(pagosPendientes)}\n`
    }
    resumen += `\n`
    
    links.push({
      tipo: 'cliente',
      id: c.id,
      label: c.name,
      sublabel: c.company || c.email || '',
      url: `/clients/${c.id}`
    })
  })
  
  return {
    resumen,
    links,
    acciones: ['Ver detalles de...', 'Editar cliente...']
  }
}

async function getAlertasDelDia(companyId: string): Promise<DatosContexto> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mañana = new Date(hoy)
  mañana.setDate(mañana.getDate() + 1)
  
  const [contratos, dominios, servicios, pagos, recordatorios] = await Promise.all([
    prisma.client.findMany({
      where: { companyId, status: 'ACTIVE', contractEnd: { gte: hoy, lt: mañana } },
      select: { id: true, name: true }
    }),
    prisma.domain.findMany({
      where: { client: { companyId }, status: 'ACTIVE', renewalDate: { gte: hoy, lt: mañana } },
      include: { client: { select: { id: true, name: true } } }
    }),
    prisma.clientService.findMany({
      where: { client: { companyId }, status: 'ACTIVE', renewalDate: { gte: hoy, lt: mañana } },
      include: { client: { select: { id: true, name: true } } }
    }),
    prisma.payment.findMany({
      where: { client: { companyId }, status: 'PENDING', dueDate: { gte: hoy, lt: mañana } },
      include: { client: { select: { id: true, name: true } } }
    }),
    prisma.reminder.findMany({
      where: { client: { companyId }, reminderDate: { gte: hoy, lt: mañana }, status: 'PENDING' },
      include: { client: { select: { id: true, name: true } } }
    })
  ])
  
  const links: LinkRapido[] = []
  const totalAlertas = contratos.length + dominios.length + servicios.length + pagos.length + recordatorios.length
  
  let resumen = `🔔 **ALERTAS DE HOY** (${totalAlertas})\n\n`
  
  if (totalAlertas === 0) {
    resumen += `✅ No tienes alertas para hoy.\n\nDisfruta tu día tranquilo! 🎉`
  } else {
    if (contratos.length > 0) {
      resumen += `📋 **Contratos que vencen hoy:**\n`
      contratos.forEach(c => {
        resumen += `• ${c.name}\n`
        links.push({ tipo: 'cliente', id: c.id, label: c.name, sublabel: 'Vence hoy', url: `/clients/${c.id}` })
      })
      resumen += `\n`
    }
    
    if (dominios.length > 0) {
      resumen += `🌐 **Dominios que renuevan hoy:**\n`
      dominios.forEach(d => {
        resumen += `• ${d.domainName} (${d.client.name})\n`
        links.push({ tipo: 'dominio', id: d.id, label: d.domainName, sublabel: d.client.name, url: `/clients/${d.clientId}` })
      })
      resumen += `\n`
    }
    
    if (servicios.length > 0) {
      resumen += `🔧 **Servicios que renuevan hoy:**\n`
      servicios.forEach(s => {
        resumen += `• ${s.serviceType} (${s.client.name})\n`
        links.push({ tipo: 'servicio', id: s.id, label: s.serviceType, sublabel: s.client.name, url: `/clients/${s.clientId}` })
      })
      resumen += `\n`
    }
    
    if (pagos.length > 0) {
      resumen += `💳 **Pagos que vencen hoy:**\n`
      pagos.forEach(p => {
        resumen += `• ${p.client.name}: ${formatCurrency(Number(p.amount))}\n`
        links.push({ tipo: 'pago', id: p.id, label: p.client.name, sublabel: formatCurrency(Number(p.amount)), url: `/clients/${p.clientId}` })
      })
      resumen += `\n`
    }
    
    if (recordatorios.length > 0) {
      resumen += `📌 **Recordatorios:**\n`
      recordatorios.forEach(r => {
        resumen += `• ${r.client?.name || 'General'}: ${r.message}\n`
      })
    }
  }
  
  return {
    resumen,
    links,
    acciones: ['Marcar como completado...', 'Posponer...']
  }
}

// =====================================================
// DETECTOR DE INTENCIÓN
// =====================================================

function detectarIntencion(mensaje: string): { tipo: string; params: Record<string, any> } {
  const msg = mensaje.toLowerCase().trim()
  
  // Saludo
  if (/^(hola|hey|hi|hello|buenos|buenas)/.test(msg)) {
    return { tipo: 'saludo', params: {} }
  }
  
  // Ayuda
  if (/^(ayuda|help|qué puedes|que puedes|opciones)/.test(msg)) {
    return { tipo: 'ayuda', params: {} }
  }
  
  // Alertas del día
  if (/hoy|alertas?|pendientes? hoy|qué tengo/.test(msg) && !/cliente|contrato|pago/.test(msg)) {
    return { tipo: 'alertas', params: {} }
  }
  
  // Contratos
  if (/contrato/.test(msg)) {
    const diasMatch = msg.match(/(\d+)\s*d[ií]as?/)
    const dias = diasMatch ? parseInt(diasMatch[1]) : 30
    return { tipo: 'contratos', params: { dias } }
  }
  
  // Dominios
  if (/dominio|dominios/.test(msg)) {
    const diasMatch = msg.match(/(\d+)\s*d[ií]as?/)
    const dias = diasMatch ? parseInt(diasMatch[1]) : 30
    return { tipo: 'dominios', params: { dias } }
  }
  
  // Finanzas / Ingresos
  if (/ingreso|dinero|finanza|beneficio|revenue|ganancia|cómo van|cómo est[aá]n|como van|como estan/.test(msg)) {
    return { tipo: 'finanzas', params: {} }
  }
  
  // Pagos
  if (/pago|deben|cobrar|pendiente.*pago|factura/.test(msg)) {
    return { tipo: 'pagos', params: {} }
  }
  
  // Servicios
  if (/servicio|servicios/.test(msg) && !/cliente/.test(msg)) {
    return { tipo: 'servicios', params: {} }
  }
  
  // Top clientes
  if (/(top|mejores?|m[aá]s importante).*cliente|cliente.*(top|mejores?|m[aá]s)/.test(msg)) {
    return { tipo: 'finanzas', params: {} }
  }
  
  // Búsqueda de cliente específico
  if (/busca|encuentra|informaci[oó]n (de|del|sobre)|dime (de|del|sobre)|qui[eé]n es/.test(msg)) {
    const query = msg
      .replace(/busca|encuentra|informaci[oó]n (de|del|sobre)|dime (de|del|sobre)|qui[eé]n es|cliente|clientes/gi, '')
      .trim()
    return { tipo: 'buscar_cliente', params: { query } }
  }
  
  // Clientes general
  if (/cliente|clientes/.test(msg)) {
    return { tipo: 'clientes', params: {} }
  }
  
  // Resumen general
  if (/resumen|general|estado|dashboard|todo/.test(msg)) {
    return { tipo: 'resumen', params: {} }
  }
  
  // Default: resumen
  return { tipo: 'resumen', params: {} }
}

// =====================================================
// LLAMADA A GROQ
// =====================================================

async function chatGroq(mensaje: string, contexto: DatosContexto): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return contexto.resumen
  }
  
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `Eres VollBot, asistente de CRM para agencias web. Responde en español.

FECHA: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

DATOS DEL CRM:
${contexto.resumen}

INSTRUCCIONES:
- Responde de forma clara y útil
- Usa los datos proporcionados
- Sé amable pero directo
- Si hay links disponibles, menciona que el usuario puede hacer clic para acceder rápido
- Los montos están en euros (€)`
        },
        { role: 'user', content: mensaje }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    return contexto.resumen
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || contexto.resumen
}

// =====================================================
// ENDPOINT
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }
    
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ response: '❌ No autenticado', links: [], acciones: [] })
    }
    
    const apiKey = getApiKey()
    if (!apiKey) {
      return NextResponse.json({ 
        response: `⚠️ **Configura GROQ_API_KEY** en Vercel para activar la IA.\n\nEs gratis: console.groq.com`,
        links: [],
        acciones: []
      })
    }
    
    const { tipo, params } = detectarIntencion(message)
    
    // Respuestas rápidas sin IA
    if (tipo === 'saludo') {
      return NextResponse.json({
        response: `¡Hola! 👋 Soy **VollBot**, tu asistente del CRM.\n\nPuedo ayudarte con:\n• 📋 Estado de contratos\n• 🌐 Dominios próximos a renovar\n• 💰 Ingresos y finanzas\n• 💳 Pagos pendientes\n• 🔧 Servicios activos\n• 🔔 Alertas del día\n• 🔍 Buscar clientes\n\n¿Qué necesitas saber?`,
        links: [],
        acciones: ['¿Qué contratos vencen pronto?', '¿Qué dominios renuevan?', '¿Quién me debe dinero?', '¿Qué alertas tengo hoy?']
      })
    }
    
    if (tipo === 'ayuda') {
      return NextResponse.json({
        response: `📚 **COMANDOS DISPONIBLES:**\n\n• "¿Cómo están los contratos?"\n• "¿Qué dominios renuevan esta semana?"\n• "¿Cuáles son mis ingresos?"\n• "¿Quién me debe dinero?"\n• "¿Qué servicios tengo activos?"\n• "¿Qué alertas tengo hoy?"\n• "Busca cliente [nombre]"\n• "Dame un resumen general"`,
        links: [],
        acciones: ['Resumen general', 'Alertas de hoy', 'Contratos próximos', 'Dominios próximos']
      })
    }
    
    // Obtener datos según la intención
    let datos: DatosContexto
    
    switch (tipo) {
      case 'alertas':
        datos = await getAlertasDelDia(companyId)
        break
      case 'contratos':
        datos = await getContratosDetallado(companyId, params.dias || 30)
        break
      case 'dominios':
        datos = await getDominiosDetallado(companyId, params.dias || 30)
        break
      case 'finanzas':
        datos = await getFinanzasDetallado(companyId)
        break
      case 'pagos':
        datos = await getPagosPendientesDetallado(companyId)
        break
      case 'servicios':
        datos = await getServiciosDetallado(companyId)
        break
      case 'buscar_cliente':
        datos = await getClienteEspecifico(companyId, params.query)
        break
      case 'clientes':
        datos = await getResumenGeneral(companyId)
        break
      default:
        datos = await getResumenGeneral(companyId)
    }
    
    // Generar respuesta con IA
    const respuesta = await chatGroq(message, datos)
    
    return NextResponse.json({ 
      response: respuesta,
      links: datos.links,
      acciones: datos.acciones
    })
    
  } catch (error: any) {
    console.error('Error en asistente:', error)
    return NextResponse.json({ 
      response: `❌ Error: ${error.message}`,
      links: [],
      acciones: []
    })
  }
}

export async function GET() {
  const apiKey = getApiKey()
  return NextResponse.json({ 
    status: 'ok', 
    agent: 'VollBot',
    provider: 'Groq',
    model: GROQ_MODEL,
    aiConfigured: !!apiKey
  })
}
