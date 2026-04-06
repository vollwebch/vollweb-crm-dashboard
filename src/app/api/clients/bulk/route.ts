import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { action, ids } = await request.json()

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const now = new Date()

    switch (action) {
      case 'delete':
        // Soft delete - set deletedAt
        await db.client.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: now, updatedAt: now }
        })
        return NextResponse.json({ success: true, action: 'deleted', count: ids.length })

      case 'restore':
        // Restore from trash
        await db.client.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null, updatedAt: now }
        })
        return NextResponse.json({ success: true, action: 'restored', count: ids.length })

      case 'setStatus':
        const { status } = await request.json()
        await db.client.updateMany({
          where: { id: { in: ids } },
          data: { status, updatedAt: now }
        })
        return NextResponse.json({ success: true, action: 'statusUpdated', count: ids.length })

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in bulk client action:', error)
    return NextResponse.json({ error: 'Error en acción masiva' }, { status: 500 })
  }
}
