import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// Available webhook events
export const WEBHOOK_EVENTS = [
  { id: 'client.created', name: 'Cliente creado', description: 'Cuando se crea un nuevo cliente' },
  { id: 'client.updated', name: 'Cliente actualizado', description: 'Cuando se actualiza un cliente' },
  { id: 'client.deleted', name: 'Cliente eliminado', description: 'Cuando se elimina un cliente' },
  { id: 'invoice.created', name: 'Factura creada', description: 'Cuando se crea una nueva factura' },
  { id: 'invoice.sent', name: 'Factura enviada', description: 'Cuando se envía una factura' },
  { id: 'invoice.paid', name: 'Factura pagada', description: 'Cuando se marca una factura como pagada' },
  { id: 'invoice.cancelled', name: 'Factura cancelada', description: 'Cuando se cancela una factura' },
  { id: 'payment.received', name: 'Pago recibido', description: 'Cuando se recibe un pago' },
  { id: 'payment.failed', name: 'Pago fallido', description: 'Cuando falla un pago' },
  { id: 'alarm.triggered', name: 'Alarma activada', description: 'Cuando se activa una alarma' },
  { id: 'alarm.created', name: 'Alarma creada', description: 'Cuando se crea una alarma' },
  { id: 'service.created', name: 'Servicio creado', description: 'Cuando se crea un servicio' },
  { id: 'service.updated', name: 'Servicio actualizado', description: 'Cuando se actualiza un servicio' },
  { id: 'service.renewed', name: 'Servicio renovado', description: 'Cuando se renueva un servicio' },
  { id: 'domain.expiring', name: 'Dominio por expirar', description: 'Cuando un dominio está próximo a expirar' },
  { id: 'hosting.expiring', name: 'Hosting por expirar', description: 'Cuando un hosting está próximo a expirar' },
  { id: 'contract.ending', name: 'Contrato por terminar', description: 'Cuando un contrato está próximo a terminar' },
  { id: 'user.created', name: 'Usuario creado', description: 'Cuando se crea un nuevo usuario' },
  { id: 'user.deleted', name: 'Usuario eliminado', description: 'Cuando se elimina un usuario' },
] as const

// GET - List all webhooks for company
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: {
          select: { logs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json({ error: 'Error al obtener webhooks' }, { status: 500 })
  }
}

// POST - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, secret, events, description, active } = body

    // Validate required fields
    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json({ 
        error: 'Nombre, URL y al menos un evento son requeridos' 
      }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    // Validate events
    const validEvents = WEBHOOK_EVENTS.map(e => e.id)
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Eventos inválidos: ${invalidEvents.join(', ')}` 
      }, { status: 400 })
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        secret: secret || null,
        events: events.join(','),
        description: description || null,
        active: active !== false,
        companyId: user.companyId
      }
    })

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json({ error: 'Error al crear webhook' }, { status: 500 })
  }
}
