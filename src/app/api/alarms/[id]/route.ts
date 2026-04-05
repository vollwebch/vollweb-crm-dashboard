import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AlarmPriority } from '@prisma/client';

// GET /api/alarms/[id] - Obtener alarma por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alarm = await db.clientAlarm.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true }
        }
      }
    });

    if (!alarm) {
      return NextResponse.json({ error: 'Alarma no encontrada' }, { status: 404 });
    }

    return NextResponse.json(alarm);
  } catch (error) {
    console.error('Error fetching alarm:', error);
    return NextResponse.json({ error: 'Error al obtener alarma' }, { status: 500 });
  }
}

// PATCH /api/alarms/[id] - Actualizar alarma
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, alarmDate, priority, isActive, daysBefore, isRecurring } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (alarmDate !== undefined) updateData.alarmDate = new Date(alarmDate);
    if (priority !== undefined) updateData.priority = priority as AlarmPriority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (daysBefore !== undefined) updateData.daysBefore = daysBefore;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;

    const alarm = await db.clientAlarm.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } }
      }
    });

    return NextResponse.json(alarm);
  } catch (error) {
    console.error('Error updating alarm:', error);
    return NextResponse.json({ error: 'Error al actualizar alarma' }, { status: 500 });
  }
}

// DELETE /api/alarms/[id] - Soft delete alarma (mover a papelera)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - set deletedAt instead of actually deleting
    await db.clientAlarm.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: 'Alarma movida a papelera' });
  } catch (error) {
    console.error('Error deleting alarm:', error);
    return NextResponse.json({ error: 'Error al eliminar alarma' }, { status: 500 });
  }
}
