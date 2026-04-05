import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { type, ids } = await request.json()

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const now = new Date()

    switch (type) {
      case 'client':
        await db.client.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, updatedAt: now }
        })
        break
      case 'reminder':
        await db.reminder.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, updatedAt: now }
        })
        break
      case 'alarm':
        await db.clientAlarm.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, updatedAt: now }
        })
        break
      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Error restoring items:', error)
    return NextResponse.json({ error: 'Error al restaurar' }, { status: 500 })
  }
}
