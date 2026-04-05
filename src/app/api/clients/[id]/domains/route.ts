import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DomainStatus } from '@prisma/client';

// GET /api/clients/[id]/domains - Obtener dominios del cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const domains = await db.domain.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching client domains:', error);
    return NextResponse.json({ error: 'Error al obtener dominios' }, { status: 500 });
  }
}

// POST /api/clients/[id]/domains - Crear dominio para cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { domainName, registrar, registrationDate, renewalDate, cost, status } = body;

    if (!domainName || !registrar || !registrationDate || !renewalDate) {
      return NextResponse.json(
        { error: 'Nombre de dominio, registrador y fechas son requeridos' },
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

    const domain = await db.domain.create({
      data: {
        clientId: id,
        domainName,
        registrar,
        registrationDate: new Date(registrationDate),
        renewalDate: new Date(renewalDate),
        cost: cost || 0,
        status: (status as DomainStatus) || DomainStatus.ACTIVE,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: id,
        action: 'Dominio añadido',
        description: `Dominio ${domainName} añadido al cliente ${client.name}`,
      },
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json({ error: 'Error al crear dominio' }, { status: 500 });
  }
}
