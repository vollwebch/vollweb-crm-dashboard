import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/clients/[id]/hosting - Obtener hosting del cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hosting = await db.hosting.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(hosting);
  } catch (error) {
    console.error('Error fetching client hosting:', error);
    return NextResponse.json({ error: 'Error al obtener hosting' }, { status: 500 });
  }
}

// POST /api/clients/[id]/hosting - Crear hosting para cliente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { provider, plan, username, panelUrl, renewalDate, monthlyCost, annualCost } = body;

    if (!provider || !plan) {
      return NextResponse.json(
        { error: 'Proveedor y plan son requeridos' },
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

    const hosting = await db.hosting.create({
      data: {
        clientId: id,
        provider,
        plan,
        username: username || null,
        panelUrl: panelUrl || null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        monthlyCost: monthlyCost || 0,
        annualCost: annualCost || null,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: id,
        action: 'Hosting añadido',
        description: `Hosting ${provider} (${plan}) añadido al cliente ${client.name}`,
      },
    });

    return NextResponse.json(hosting, { status: 201 });
  } catch (error) {
    console.error('Error creating hosting:', error);
    return NextResponse.json({ error: 'Error al crear hosting' }, { status: 500 });
  }
}
