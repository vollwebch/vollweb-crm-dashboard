import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Get first user
    const user = await db.user.findFirst()

    if (!user) {
      return NextResponse.json({ error: 'No hay usuarios' }, { status: 400 })
    }

    // Create test audit log
    const log = await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'CLIENT',
        entityId: 'test-' + Date.now(),
        entityName: 'Cliente de Prueba',
        description: 'Log de prueba creado',
      }
    })

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    console.error('Error creating test log:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
