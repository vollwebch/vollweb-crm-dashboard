import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/hosting/[id] - Obtener hosting por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hosting = await db.hosting.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    return NextResponse.json(hosting);
  } catch (error) {
    console.error('Error fetching hosting:', error);
    return NextResponse.json({ error: 'Error al obtener hosting' }, { status: 500 });
  }
}

// PATCH /api/hosting/[id] - Actualizar hosting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { provider, plan, username, panelUrl, renewalDate, monthlyCost, annualCost } = body;

    const existingHosting = await db.hosting.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingHosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    const hosting = await db.hosting.update({
      where: { id },
      data: {
        provider: provider ?? existingHosting.provider,
        plan: plan ?? existingHosting.plan,
        username: username ?? existingHosting.username,
        panelUrl: panelUrl ?? existingHosting.panelUrl,
        renewalDate: renewalDate !== undefined ? (renewalDate ? new Date(renewalDate) : null) : existingHosting.renewalDate,
        monthlyCost: monthlyCost ?? existingHosting.monthlyCost,
        annualCost: annualCost ?? existingHosting.annualCost,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: existingHosting.clientId,
        action: 'Hosting actualizado',
        description: `Hosting ${hosting.provider} actualizado para ${existingHosting.client.name}`,
      },
    });

    return NextResponse.json(hosting);
  } catch (error) {
    console.error('Error updating hosting:', error);
    return NextResponse.json({ error: 'Error al actualizar hosting' }, { status: 500 });
  }
}

// DELETE /api/hosting/[id] - Eliminar hosting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hosting = await db.hosting.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!hosting) {
      return NextResponse.json({ error: 'Hosting no encontrado' }, { status: 404 });
    }

    await db.hosting.delete({
      where: { id },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: hosting.clientId,
        action: 'Hosting eliminado',
        description: `Hosting ${hosting.provider} eliminado de ${hosting.client.name}`,
      },
    });

    return NextResponse.json({ message: 'Hosting eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting hosting:', error);
    return NextResponse.json({ error: 'Error al eliminar hosting' }, { status: 500 });
  }
}
