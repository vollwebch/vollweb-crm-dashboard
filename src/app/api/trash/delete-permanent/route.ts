import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { type, ids } = await request.json()

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    let deletedCount = 0

    switch (type) {
      case 'client':
        // El schema tiene onDelete: Cascade, así que al eliminar el cliente
        // se eliminan automáticamente sus servicios, hosting, dominios, alarmas, etc.
        const clientResult = await db.client.deleteMany({
          where: { id: { in: ids } }
        })
        deletedCount = clientResult.count
        break

      case 'reminder':
        const reminderResult = await db.reminder.deleteMany({
          where: { id: { in: ids } }
        })
        deletedCount = reminderResult.count
        break

      case 'alarm':
        const alarmResult = await db.clientAlarm.deleteMany({
          where: { id: { in: ids } }
        })
        deletedCount = alarmResult.count
        break

      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      count: deletedCount,
      message: `Se eliminaron ${deletedCount} elementos permanentemente`
    })
  } catch (error) {
    console.error('Error permanently deleting items:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ 
      error: 'Error al eliminar permanentemente', 
      details: errorMessage 
    }, { status: 500 })
  }
}
