import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientStatus } from '@prisma/client';

// GET /api/clients - Listar todos los clientes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ClientStatus | null;
    const search = searchParams.get('search');

    const where: any = { deletedAt: null }; // Excluir clientes eliminados

    if (status && Object.values(ClientStatus).includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await db.client.findMany({
      where,
      include: {
        services: true,
        hosting: true,
        domains: true,
        _count: {
          select: {
            services: true,
            hosting: true,
            domains: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular ingresos mensuales por cliente
    const clientsWithRevenue = clients.map((client) => {
      const monthlyRevenue = client.services
        .filter((s) => s.status === 'ACTIVE')
        .reduce((acc, s) => acc + Number(s.monthlyPrice), 0);

      return {
        ...client,
        monthlyRevenue,
      };
    });

    return NextResponse.json(clientsWithRevenue);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

// POST /api/clients - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, email, phone, status, notes } = body;

    if (!name || !company || !email) {
      return NextResponse.json(
        { error: 'Nombre, empresa y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingClient = await db.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email' },
        { status: 400 }
      );
    }

    const client = await db.client.create({
      data: {
        name,
        company,
        email,
        phone: phone || null,
        status: status || ClientStatus.ACTIVE,
        notes: notes || null,
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
        action: 'Cliente creado',
        description: `Cliente ${name} (${company}) añadido al sistema`,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
