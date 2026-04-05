import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServiceType, ServiceStatus } from '@prisma/client';

// GET /api/services - Listar todos los servicios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ServiceStatus | null;
    const serviceType = searchParams.get('serviceType') as ServiceType | null;
    const clientId = searchParams.get('clientId');

    const where: any = {};

    if (status && Object.values(ServiceStatus).includes(status)) {
      where.status = status;
    }

    if (serviceType && Object.values(ServiceType).includes(serviceType)) {
      where.serviceType = serviceType;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const services = await db.clientService.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}
