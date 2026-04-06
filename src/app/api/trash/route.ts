import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all deleted clients
    const deletedClients = await db.client.findMany({
      where: { deletedAt: { not: null } },
      include: {
        services: true,
        hosting: true,
        domains: true,
        _count: { select: { services: true, hosting: true, domains: true } }
      },
      orderBy: { deletedAt: 'desc' }
    })

    // Get all deleted reminders
    const deletedReminders = await db.reminder.findMany({
      where: { deletedAt: { not: null } },
      include: {
        client: { select: { id: true, name: true, company: true } }
      },
      orderBy: { deletedAt: 'desc' }
    })

    // Get all deleted alarms
    const deletedAlarms = await db.clientAlarm.findMany({
      where: { deletedAt: { not: null } },
      include: {
        client: { select: { id: true, name: true, company: true } }
      },
      orderBy: { deletedAt: 'desc' }
    })

    // Get or create trash config
    let config = await db.trashConfig.findFirst()
    if (!config) {
      config = await db.trashConfig.create({
        data: { autoDeleteDays: 10, autoDeleteEnabled: true }
      })
    }

    return NextResponse.json({
      clients: deletedClients,
      reminders: deletedReminders,
      alarms: deletedAlarms,
      config
    })
  } catch (error) {
    console.error('Error fetching trash:', error)
    return NextResponse.json({ error: 'Error al obtener papelera' }, { status: 500 })
  }
}
