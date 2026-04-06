import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AlarmType, AlarmPriority } from '@prisma/client';

// GET /api/alarms - Listar alarmas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type') as AlarmType | null;
    const priority = searchParams.get('priority') as AlarmPriority | null;
    const isActive = searchParams.get('isActive');

    const where: any = { deletedAt: null }; // Excluir alarmas eliminadas

    if (clientId) where.clientId = clientId;
    if (type && Object.values(AlarmType).includes(type)) where.type = type;
    if (priority && Object.values(AlarmPriority).includes(priority)) where.priority = priority;
    if (isActive !== null) where.isActive = isActive === 'true';

    const alarms = await db.clientAlarm.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { alarmDate: 'asc' }
      ],
    });

    return NextResponse.json(alarms);
  } catch (error) {
    console.error('Error fetching alarms:', error);
    return NextResponse.json({ error: 'Error al obtener alarmas' }, { status: 500 });
  }
}

// POST /api/alarms - Crear alarma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, type, title, description, alarmDate, priority, daysBefore, isRecurring } = body;

    if (!clientId || !type || !title || !alarmDate) {
      return NextResponse.json(
        { error: 'Cliente, tipo, título y fecha son requeridos' },
        { status: 400 }
      );
    }

    const alarm = await db.clientAlarm.create({
      data: {
        clientId,
        type: type as AlarmType,
        title,
        description: description || null,
        alarmDate: new Date(alarmDate),
        priority: (priority as AlarmPriority) || AlarmPriority.MEDIUM,
        daysBefore: daysBefore || 7,
        isRecurring: isRecurring || false,
      },
      include: {
        client: { select: { id: true, name: true, company: true } }
      }
    });

    // Crear recordatorio asociado
    const reminderDate = new Date(alarmDate);
    reminderDate.setDate(reminderDate.getDate() - (daysBefore || 7));

    await db.reminder.create({
      data: {
        type: 'CUSTOM_ALARM' as any,
        entityType: 'alarm',
        entityId: alarm.id,
        reminderDate,
        message: `${title} - ${alarm.client.company}`,
        clientId,
        alarmId: alarm.id,
      }
    });

    // Log de actividad
    await db.activityLog.create({
      data: {
        clientId,
        action: 'Alarma creada',
        description: `Alarma "${title}" creada para ${alarm.client.company}`,
      }
    });

    return NextResponse.json(alarm, { status: 201 });
  } catch (error) {
    console.error('Error creating alarm:', error);
    return NextResponse.json({ error: 'Error al crear alarma' }, { status: 500 });
  }
}
