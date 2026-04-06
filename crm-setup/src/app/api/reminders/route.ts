import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReminderStatus, ReminderType } from '@prisma/client';

// GET /api/reminders - Listar recordatorios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ReminderStatus | null;
    const type = searchParams.get('type') as ReminderType | null;

    const where: any = { deletedAt: null }; // Excluir recordatorios eliminados

    if (status && Object.values(ReminderStatus).includes(status)) {
      where.status = status;
    }

    if (type && Object.values(ReminderType).includes(type)) {
      where.type = type;
    }

    const reminders = await db.reminder.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true }
        },
        service: {
          select: { id: true, serviceType: true, description: true }
        },
        hosting: {
          select: { id: true, provider: true, plan: true }
        },
        domain: {
          select: { id: true, domainName: true }
        }
      },
      orderBy: { reminderDate: 'asc' },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Error al obtener recordatorios' }, { status: 500 });
  }
}

// POST /api/reminders - Crear recordatorio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, entityType, entityId, reminderDate, message, clientId, serviceId, hostingId, domainId } = body;

    if (!type || !entityType || !entityId || !reminderDate || !message) {
      return NextResponse.json(
        { error: 'Tipo, entidad, fecha y mensaje son requeridos' },
        { status: 400 }
      );
    }

    const reminder = await db.reminder.create({
      data: {
        type: type as ReminderType,
        entityType,
        entityId,
        reminderDate: new Date(reminderDate),
        message,
        clientId: clientId || null,
        serviceId: serviceId || null,
        hostingId: hostingId || null,
        domainId: domainId || null,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Error al crear recordatorio' }, { status: 500 });
  }
}
