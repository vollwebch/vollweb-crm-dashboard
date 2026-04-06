import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType y entityId son requeridos' }, { status: 400 })
    }

    let client = null

    if (entityType === 'CLIENT') {
      client = await db.client.findUnique({
        where: { id: entityId },
        select: { id: true, name: true, company: true }
      })
    } else if (entityType === 'SERVICE') {
      const service = await db.clientService.findUnique({
        where: { id: entityId },
        select: {
          client: { select: { id: true, name: true, company: true } }
        }
      })
      client = service?.client || null
    } else if (entityType === 'HOSTING') {
      const hosting = await db.hosting.findUnique({
        where: { id: entityId },
        select: {
          client: { select: { id: true, name: true, company: true } }
        }
      })
      client = hosting?.client || null
    } else if (entityType === 'DOMAIN') {
      const domain = await db.domain.findUnique({
        where: { id: entityId },
        select: {
          client: { select: { id: true, name: true, company: true } }
        }
      })
      client = domain?.client || null
    } else if (entityType === 'ALARM') {
      const alarm = await db.clientAlarm.findUnique({
        where: { id: entityId },
        select: {
          client: { select: { id: true, name: true, company: true } }
        }
      })
      client = alarm?.client || null
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error fetching client by entity:', error)
    return NextResponse.json({ client: null })
  }
}
