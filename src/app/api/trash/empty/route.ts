import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Delete all soft-deleted items
    const [clients, reminders, alarms] = await Promise.all([
      db.client.deleteMany({ where: { deletedAt: { not: null } } }),
      db.reminder.deleteMany({ where: { deletedAt: { not: null } } }),
      db.clientAlarm.deleteMany({ where: { deletedAt: { not: null } } })
    ])

    return NextResponse.json({
      success: true,
      deleted: {
        clients: clients.count,
        reminders: reminders.count,
        alarms: alarms.count
      }
    })
  } catch (error) {
    console.error('Error emptying trash:', error)
    return NextResponse.json({ error: 'Error al vaciar papelera' }, { status: 500 })
  }
}
