import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { triggerClientWebhook } from '@/lib/webhooks';

// GET /api/clients/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await db.client.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { createdAt: 'desc' },
        },
        hosting: {
          orderBy: { createdAt: 'desc' },
        },
        domains: {
          orderBy: { createdAt: 'desc' },
        },
        alarms: {
          where: { deletedAt: null },
          orderBy: { alarmDate: 'asc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reminders: {
          where: { status: 'PENDING', deletedAt: null },
          orderBy: { reminderDate: 'asc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Calcular ingresos y costes
    const activeServices = client.services.filter((s) => s.status === 'ACTIVE');
    const monthlyRevenue = activeServices.reduce((acc, s) => acc + Number(s.monthlyPrice), 0);
    const monthlyHostingCost = client.hosting.reduce((acc, h) => acc + Number(h.monthlyCost), 0);
    const monthlyDomainCost = client.domains
      .filter((d) => d.status === 'ACTIVE')
      .reduce((acc, d) => acc + Number(d.cost) / 12, 0);

    const clientWithFinances = {
      ...client,
      finances: {
        monthlyRevenue,
        monthlyHostingCost,
        monthlyDomainCost,
        monthlyNetProfit: monthlyRevenue - monthlyHostingCost - monthlyDomainCost,
        annualRevenue: monthlyRevenue * 12,
        annualCosts: (monthlyHostingCost + monthlyDomainCost) * 12,
      },
    };

    return NextResponse.json(clientWithFinances);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, company, email, phone, status, notes, contractStart, contractEnd, contractYears } = body;

    // Verificar si el cliente existe
    const existingClient = await db.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si se cambia el email, verificar que no exista
    if (email && email !== existingClient.email) {
      const emailExists = await db.client.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email' },
          { status: 400 }
        );
      }
    }

    const client = await db.client.update({
      where: { id },
      data: {
        name: name ?? existingClient.name,
        company: company ?? existingClient.company,
        email: email ?? existingClient.email,
        phone: phone ?? existingClient.phone,
        status: (status as ClientStatus) ?? existingClient.status,
        notes: notes ?? existingClient.notes,
        contractStart: contractStart !== undefined ? (contractStart ? new Date(contractStart) : null) : existingClient.contractStart,
        contractEnd: contractEnd !== undefined ? (contractEnd ? new Date(contractEnd) : null) : existingClient.contractEnd,
        contractYears: contractYears !== undefined ? (contractYears ? parseInt(contractYears) : null) : existingClient.contractYears,
      },
      include: {
        services: true,
        hosting: true,
        domains: true,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: client.id,
        action: 'Cliente actualizado',
        description: `Datos del cliente ${client.name} actualizados`,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

// PATCH /api/clients/[id] - Actualizar cliente parcialmente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, company, email, phone, status, notes, contractStart, contractEnd, contractYears } = body;

    // Verificar si el cliente existe
    const existingClient = await db.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si se cambia el email, verificar que no exista
    if (email && email !== existingClient.email) {
      const emailExists = await db.client.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con este email' },
          { status: 400 }
        );
      }
    }

    // Build update data with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status as ClientStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (contractStart !== undefined) updateData.contractStart = contractStart ? new Date(contractStart) : null;
    if (contractEnd !== undefined) updateData.contractEnd = contractEnd ? new Date(contractEnd) : null;
    if (contractYears !== undefined) updateData.contractYears = contractYears ? parseInt(contractYears) : null;

    const client = await db.client.update({
      where: { id },
      data: updateData,
      include: {
        services: true,
        hosting: true,
        domains: true,
      },
    });

    // Crear log de actividad
    await db.activityLog.create({
      data: {
        clientId: client.id,
        action: 'Cliente actualizado',
        description: `Datos del cliente ${client.name} actualizados`,
      },
    });

    // Crear log de auditoría
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog({
        userId: currentUser.id,
        action: 'UPDATE',
        entityType: 'CLIENT',
        entityId: client.id,
        entityName: client.company,
        oldValue: JSON.stringify({ name: existingClient.name, company: existingClient.company, email: existingClient.email, status: existingClient.status }),
        newValue: JSON.stringify(updateData),
        description: `Cliente "${client.company}" actualizado`,
      });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Soft delete cliente (mover a papelera)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await db.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Soft delete - set deletedAt instead of actually deleting
    await db.client.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Crear log de auditoría
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog({
        userId: currentUser.id,
        action: 'DELETE',
        entityType: 'CLIENT',
        entityId: client.id,
        entityName: client.company,
        oldValue: JSON.stringify({ name: client.name, company: client.company, email: client.email }),
        description: `Cliente "${client.company}" movido a papelera`,
      });

      // Trigger webhook
      await triggerClientWebhook('client.deleted', {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email
      }, currentUser.companyId, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      });
    }

    return NextResponse.json({ message: 'Cliente movido a papelera' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
