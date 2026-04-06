import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServiceType, ServiceStatus } from '@prisma/client';

// GET /api/clients/[id]/services - Obtener servicios del cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const services = await db.clientService.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching client services:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}

// POST /api/clients/[id]/services - Crear servicio para cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceType, description, startDate, renewalDate, monthlyPrice, annualPrice, status } = body;

    if (!serviceType || !startDate) {
      return NextResponse.json(
        { error: 'Tipo de servicio y fecha de inicio son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    const client = await db.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const service = await db.clientService.create({
      data: {
        clientId: id,
        serviceType: serviceType as ServiceType,
        description: description || null,
        startDate: new Date(startDate),
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        monthlyPrice: monthlyPrice || 0,
        annualPrice: annualPrice || null,
        status: (status as ServiceStatus) || ServiceStatus.ACTIVE,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: id,
        action: 'Servicio añadido',
        description: `Servicio ${serviceType} añadido al cliente ${client.name}`,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}
