import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientStatus, ServiceStatus, DomainStatus } from '@prisma/client';

// GET /api/dashboard - Obtener estadísticas y KPIs
export async function GET() {
  try {
    // Obtener conteos de clientes por estado (excluyendo eliminados)
    const clientsByStatus = await db.client.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });

    const totalClients = await db.client.count({ where: { deletedAt: null } });
    const activeClients = clientsByStatus.find((c) => c.status === ClientStatus.ACTIVE)?._count || 0;
    const pausedClients = clientsByStatus.find((c) => c.status === ClientStatus.PAUSED)?._count || 0;
    const cancelledClients = clientsByStatus.find((c) => c.status === ClientStatus.CANCELLED)?._count || 0;

    // Calcular ingresos mensuales (servicios activos)
    const activeServices = await db.clientService.findMany({
      where: { status: ServiceStatus.ACTIVE },
      select: { monthlyPrice: true },
    });
    const monthlyRevenue = activeServices.reduce((acc, s) => acc + Number(s.monthlyPrice), 0);

    // Calcular costes mensuales de hosting
    const hostingCosts = await db.hosting.findMany({
      select: { monthlyCost: true },
    });
    const monthlyHostingCost = hostingCosts.reduce((acc, h) => acc + Number(h.monthlyCost), 0);

    // Calcular costes de dominios (anual / 12)
    const domainCosts = await db.domain.findMany({
      where: { status: DomainStatus.ACTIVE },
      select: { cost: true },
    });
    const monthlyDomainCost = domainCosts.reduce((acc, d) => acc + Number(d.cost) / 12, 0);

    const monthlyCosts = monthlyHostingCost + monthlyDomainCost;
    const monthlyProfit = monthlyRevenue - monthlyCosts;

    // Obtener clientes añadidos recientemente (excluyendo eliminados)
    const recentClients = await db.client.findMany({
      take: 5,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        services: {
          where: { status: ServiceStatus.ACTIVE },
          select: { monthlyPrice: true },
        },
      },
    });

    const recentClientsWithRevenue = recentClients.map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      status: client.status,
      createdAt: client.createdAt,
      monthlyRevenue: client.services.reduce((acc, s) => acc + Number(s.monthlyPrice), 0),
    }));

    // Obtener próximas renovaciones (servicios, dominios, hosting)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingServiceRenewals = await db.clientService.findMany({
      where: {
        status: ServiceStatus.ACTIVE,
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { renewalDate: 'asc' },
      take: 10,
    });

    const upcomingDomainRenewals = await db.domain.findMany({
      where: {
        status: DomainStatus.ACTIVE,
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { renewalDate: 'asc' },
      take: 10,
    });

    const upcomingHostingRenewals = await db.hosting.findMany({
      where: {
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
      orderBy: { renewalDate: 'asc' },
      take: 10,
    });

    // Obtener recordatorios pendientes (excluyendo eliminados)
    const pendingReminders = await db.reminder.findMany({
      where: { status: 'PENDING', deletedAt: null },
      include: {
        client: { select: { id: true, name: true, company: true } }
      },
      orderBy: { reminderDate: 'asc' },
      take: 10,
    });

    // Calcular datos para el gráfico de los últimos 6 meses
    const lastSixMonths: { month: string; revenue: number; costs: number; profit: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
      
      // Para simplificar, usamos los valores actuales (en producción se calcularía por mes)
      lastSixMonths.push({
        month: monthName,
        revenue: monthlyRevenue,
        costs: monthlyCosts,
        profit: monthlyProfit,
      });
    }

    // Distribución de servicios por tipo
    const servicesByType = await db.clientService.groupBy({
      by: ['serviceType'],
      _count: true,
      where: { status: ServiceStatus.ACTIVE },
    });

    const servicesDistribution = servicesByType.map((s) => ({
      type: s.serviceType,
      count: s._count,
    }));

    // Distribución de ingresos por tipo de servicio
    const revenueByServiceType = await db.clientService.groupBy({
      by: ['serviceType'],
      _sum: { monthlyPrice: true },
      where: { status: ServiceStatus.ACTIVE },
    });

    const revenueDistribution = revenueByServiceType.map((r) => ({
      type: r.serviceType,
      revenue: Number(r._sum.monthlyPrice || 0),
    }));

    return NextResponse.json({
      clients: {
        total: totalClients,
        active: activeClients,
        paused: pausedClients,
        cancelled: cancelledClients,
        recent: recentClientsWithRevenue,
      },
      finances: {
        monthlyRevenue,
        monthlyCosts,
        monthlyProfit,
        annualRevenue: monthlyRevenue * 12,
        annualCosts: monthlyCosts * 12,
        annualProfit: monthlyProfit * 12,
      },
      renewals: {
        services: upcomingServiceRenewals,
        domains: upcomingDomainRenewals,
        hosting: upcomingHostingRenewals,
      },
      reminders: pendingReminders,
      chart: lastSixMonths,
      servicesDistribution,
      revenueDistribution,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard', details: String(error) }, { status: 500 });
  }
}
