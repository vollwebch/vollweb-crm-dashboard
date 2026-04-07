import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { WEBHOOK_EVENTS } from '../route'

// GET - Get single webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const webhook = await prisma.webhook.findFirst({
      where: { 
        id,
        companyId: user.companyId 
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: {
          select: { logs: true }
        }
      }
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error fetching webhook:', error)
    return NextResponse.json({ error: 'Error al obtener webhook' }, { status: 500 })
  }
}

// PUT - Update webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, url, secret, events, description, active } = body

    // Check webhook exists and belongs to company
    const existingWebhook = await prisma.webhook.findFirst({
      where: { id, companyId: user.companyId }
    })

    if (!existingWebhook) {
      return NextResponse.json({ error: 'Webhook no encontrado' }, { status: 404 })
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
      }
    }

    // Validate events if provided
    if (events && events.length > 0) {
      const validEvents = WEBHOOK_EVENTS.map(e => e.id)
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
      if (invalidEvents.length > 0) {
        return NextResponse.json({ 
          error: `Eventos inválidos: ${invalidEvents.join(', ')}` 
        }, { status: 400 })
      }
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        name: name || existingWebhook.name,
        url: url || existingWebhook.url,
        secret: secret !== undefined ? secret || null : existingWebhook.secret,
        events: events ? events.join(',') : existingWebhook.events,
        description: description !== undefined ? description || null : existingWebhook.description,
        active: active !== undefined ? active : existingWebhook.active
      }
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json({ error: 'Error al actualizar webhook' }, { status: 500 })
  }
}

// DELETE - Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Check webhook exists and belongs to company
    const webhook = await prisma.webhook.findFirst({
      where: { id, companyId: user.companyId }
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook no encontrado' }, { status: 404 })
    }

    await prisma.webhook.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json({ error: 'Error al eliminar webhook' }, { status: 500 })
  }
}
