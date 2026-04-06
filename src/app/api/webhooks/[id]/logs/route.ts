import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET - Get logs for a webhook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const success = searchParams.get('success')

    // Check webhook exists and belongs to company
    const webhook = await prisma.webhook.findFirst({
      where: { id, companyId: user.companyId }
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook no encontrado' }, { status: 404 })
    }

    const where: { webhookId: string; success?: boolean } = { webhookId: id }
    if (success !== null && success !== undefined && success !== '') {
      where.success = success === 'true'
    }

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.webhookLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json({ error: 'Error al obtener logs' }, { status: 500 })
  }
}

// DELETE - Clear all logs for a webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
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

    await prisma.webhookLog.deleteMany({
      where: { webhookId: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing webhook logs:', error)
    return NextResponse.json({ error: 'Error al limpiar logs' }, { status: 500 })
  }
}
