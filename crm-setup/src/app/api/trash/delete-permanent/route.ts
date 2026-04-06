import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { type, ids } = await request.json()

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    switch (type) {
      case 'client':
        await db.client.deleteMany({
          where: { id: { in: ids }, deletedAt: { not: null } }
        })
        break
      case 'reminder':
        await db.reminder.deleteMany({
          where: { id: { in: ids }, deletedAt: { not: null } }
        })
        break
      case 'alarm':
        await db.clientAlarm.deleteMany({
          where: { id: { in: ids }, deletedAt: { not: null } }
        })
        break
      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Error permanently deleting items:', error)
    return NextResponse.json({ error: 'Error al eliminar permanentemente' }, { status: 500 })
  }
}
