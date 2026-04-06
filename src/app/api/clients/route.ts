import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientStatus } from '@prisma/client';
import { getCurrentUser, getCompanyId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { triggerClientWebhook } from '@/lib/webhooks';

// GET /api/clients - Listar todos los clientes con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ClientStatus | null;
    const search = searchParams.get('search');
    
    // Filtros avanzados
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const dateType = searchParams.get('dateType') || 'createdAt'; // createdAt, contractStart, contractEnd
    const revenueMin = searchParams.get('revenueMin');
    const revenueMax = searchParams.get('revenueMax');
    const serviceType = searchParams.get('serviceType');
    const profitMin = searchParams.get('profitMin');
    const profitMax = searchParams.get('profitMax');

    const where: any = { 
      deletedAt: null,
      companyId // Multi-tenant filter
    };

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

    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      const dateField = dateType as string;
      if (['createdAt', 'contractStart', 'contractEnd'].includes(dateField)) {
        where[dateField] = {};
        if (dateFrom) {
          where[dateField].gte = new Date(dateFrom);
        }
        if (dateTo) {
          // Add one day to include the end date fully
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where[dateField].lte = endDate;
        }
      }
    }

    // Filtro por tipo de servicio - necesita subconsulta
    if (serviceType) {
      where.services = {
        some: {
          serviceType: serviceType,
          status: 'ACTIVE',
        },
      };
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

    // Calcular ingresos mensuales y beneficio neto por cliente
    let clientsWithRevenue = clients.map((client) => {
      // Ingresos: suma de precios mensuales de servicios activos
      const monthlyRevenue = client.services
        .filter((s) => s.status === 'ACTIVE')
        .reduce((acc, s) => acc + Number(s.monthlyPrice), 0);

      // Costos: hosting mensual + dominios anuales/12
      const hostingCosts = client.hosting
        .reduce((acc: number, h: any) => acc + Number(h.monthlyCost || 0), 0);
      const domainCosts = client.domains
        .filter((d: any) => d.status === 'ACTIVE')
        .reduce((acc: number, d: any) => acc + (Number(d.cost || 0) / 12), 0);
      const monthlyCosts = hostingCosts + domainCosts;

      // Beneficio neto
      const monthlyProfit = monthlyRevenue - monthlyCosts;

      return {
        ...client,
        monthlyRevenue,
        monthlyCosts,
        monthlyProfit,
      };
    });

    // Filtro por rango de ingresos (se aplica después de calcular)
    if (revenueMin !== null || revenueMax !== null) {
      const min = revenueMin !== null ? parseFloat(revenueMin) : 0;
      const max = revenueMax !== null ? parseFloat(revenueMax) : Infinity;
      clientsWithRevenue = clientsWithRevenue.filter(
        (c) => c.monthlyRevenue >= min && c.monthlyRevenue <= max
      );
    }

    // Filtro por rango de beneficio (se aplica después de calcular)
    if (profitMin !== null || profitMax !== null) {
      const min = profitMin !== null ? parseFloat(profitMin) : -Infinity;
      const max = profitMax !== null ? parseFloat(profitMax) : Infinity;
      clientsWithRevenue = clientsWithRevenue.filter(
        (c) => c.monthlyProfit >= min && c.monthlyProfit <= max
      );
    }

    return NextResponse.json(clientsWithRevenue);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

// POST /api/clients - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, email, phone, status, notes } = body;

    if (!name || !company || !email) {
      return NextResponse.json(
        { error: 'Nombre, empresa y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe en esta empresa
    const existingClient = await db.client.findFirst({
      where: { 
        email,
        companyId: currentUser.companyId 
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email en tu empresa' },
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
        companyId: currentUser.companyId, // Multi-tenant
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

    // Crear log de auditoría
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'CLIENT',
      entityId: client.id,
      entityName: company,
      newValue: JSON.stringify({ name, company, email, phone, status }),
      description: `Cliente "${company}" creado`,
      companyId: currentUser.companyId,
    });

    // Trigger webhook
    await triggerClientWebhook('client.created', client, currentUser.companyId, {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
