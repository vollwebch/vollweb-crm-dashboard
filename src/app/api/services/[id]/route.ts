import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServiceStatus } from '@prisma/client';

// GET /api/services/[id] - Obtener servicio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await db.clientService.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Error al obtener servicio' }, { status: 500 });
  }
}

// PATCH /api/services/[id] - Actualizar servicio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceType, description, startDate, renewalDate, monthlyPrice, annualPrice, status } = body;

    const existingService = await db.clientService.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const service = await db.clientService.update({
      where: { id },
      data: {
        serviceType: serviceType ?? existingService.serviceType,
        description: description ?? existingService.description,
        startDate: startDate ? new Date(startDate) : existingService.startDate,
        renewalDate: renewalDate !== undefined ? (renewalDate ? new Date(renewalDate) : null) : existingService.renewalDate,
        monthlyPrice: monthlyPrice ?? existingService.monthlyPrice,
        annualPrice: annualPrice ?? existingService.annualPrice,
        status: (status as ServiceStatus) ?? existingService.status,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: existingService.clientId,
        action: 'Servicio actualizado',
        description: `Servicio ${service.serviceType} actualizado para ${existingService.client.name}`,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Eliminar servicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await db.clientService.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    await db.clientService.delete({
      where: { id },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: service.clientId,
        action: 'Servicio eliminado',
        description: `Servicio ${service.serviceType} eliminado de ${service.client.name}`,
      },
    });

    return NextResponse.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
  }
}
