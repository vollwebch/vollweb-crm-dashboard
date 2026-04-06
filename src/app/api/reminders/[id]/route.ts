import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReminderStatus } from '@prisma/client';

// PATCH /api/reminders/[id] - Actualizar estado del recordatorio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(ReminderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    const reminder = await db.reminder.update({
      where: { id },
      data: { status: status as ReminderStatus },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Error al actualizar recordatorio' }, { status: 500 });
  }
}

// GET /api/reminders/[id] - Obtener recordatorio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reminder = await db.reminder.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, company: true }
        }
      }
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json({ error: 'Error al obtener recordatorio' }, { status: 500 });
  }
}

// DELETE /api/reminders/[id] - Soft delete recordatorio (mover a papelera)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - set deletedAt instead of actually deleting
    await db.reminder.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: 'Recordatorio movido a papelera' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Error al eliminar recordatorio' }, { status: 500 });
  }
}
