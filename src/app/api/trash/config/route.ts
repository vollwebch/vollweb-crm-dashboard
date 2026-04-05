import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let config = await db.trashConfig.findFirst()
    if (!config) {
      config = await db.trashConfig.create({
        data: { autoDeleteDays: 10, autoDeleteEnabled: true }
      })
    }
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching trash config:', error)
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()
    
    let config = await db.trashConfig.findFirst()
    if (!config) {
      config = await db.trashConfig.create({
        data: {
          autoDeleteDays: updates.autoDeleteDays ?? 10,
          autoDeleteEnabled: updates.autoDeleteEnabled ?? true
        }
      })
    } else {
      config = await db.trashConfig.update({
        where: { id: config.id },
        data: updates
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating trash config:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
