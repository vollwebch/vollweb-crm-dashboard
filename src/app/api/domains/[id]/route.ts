import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DomainStatus } from '@prisma/client';

// GET /api/domains/[id] - Obtener dominio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const domain = await db.domain.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json({ error: 'Error al obtener dominio' }, { status: 500 });
  }
}

// PATCH /api/domains/[id] - Actualizar dominio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { domainName, registrar, registrationDate, renewalDate, cost, status } = body;

    const existingDomain = await db.domain.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    const domain = await db.domain.update({
      where: { id },
      data: {
        domainName: domainName ?? existingDomain.domainName,
        registrar: registrar ?? existingDomain.registrar,
        registrationDate: registrationDate ? new Date(registrationDate) : existingDomain.registrationDate,
        renewalDate: renewalDate ? new Date(renewalDate) : existingDomain.renewalDate,
        cost: cost ?? existingDomain.cost,
        status: (status as DomainStatus) ?? existingDomain.status,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: existingDomain.clientId,
        action: 'Dominio actualizado',
        description: `Dominio ${domain.domainName} actualizado para ${existingDomain.client.name}`,
      },
    });

    return NextResponse.json(domain);
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json({ error: 'Error al actualizar dominio' }, { status: 500 });
  }
}

// DELETE /api/domains/[id] - Eliminar dominio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const domain = await db.domain.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Dominio no encontrado' }, { status: 404 });
    }

    await db.domain.delete({
      where: { id },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: domain.clientId,
        action: 'Dominio eliminado',
        description: `Dominio ${domain.domainName} eliminado de ${domain.client.name}`,
      },
    });

    return NextResponse.json({ message: 'Dominio eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: 'Error al eliminar dominio' }, { status: 500 });
  }
}
