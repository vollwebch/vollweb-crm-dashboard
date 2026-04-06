import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClientStatus, ServiceStatus, DomainStatus } from '@prisma/client';
import { getCompanyId } from '@/lib/auth';

// GET /api/dashboard - Obtener estadísticas y KPIs
export async function GET() {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener conteos de clientes por estado (excluyendo eliminados) - filtrado por empresa
    const clientsByStatus = await db.client.groupBy({
      by: ['status'],
      where: { deletedAt: null, companyId },
      _count: true,
    });

    const totalClients = await db.client.count({ where: { deletedAt: null, companyId } });
    const activeClients = clientsByStatus.find((c) => c.status === ClientStatus.ACTIVE)?._count || 0;
    const pausedClients = clientsByStatus.find((c) => c.status === ClientStatus.PAUSED)?._count || 0;
    const cancelledClients = clientsByStatus.find((c) => c.status === ClientStatus.CANCELLED)?._count || 0;

    // Calcular ingresos mensuales (servicios activos de clientes NO eliminados) - filtrado por empresa
    const activeServices = await db.clientService.findMany({
      where: { 
        status: ServiceStatus.ACTIVE,
        client: { deletedAt: null, companyId }
      },
      select: { monthlyPrice: true },
    });
    const monthlyRevenue = activeServices.reduce((acc, s) => acc + Number(s.monthlyPrice), 0);

    // Calcular costes mensuales de hosting (solo de clientes NO eliminados) - filtrado por empresa
    const hostingCosts = await db.hosting.findMany({
      where: {
        client: { deletedAt: null, companyId }
      },
      select: { monthlyCost: true },
    });
    const monthlyHostingCost = hostingCosts.reduce((acc, h) => acc + Number(h.monthlyCost), 0);

    // Calcular costes de dominios (anual / 12) - solo de clientes NO eliminados - filtrado por empresa
    const domainCosts = await db.domain.findMany({
      where: { 
        status: DomainStatus.ACTIVE,
        client: { deletedAt: null, companyId }
      },
      select: { cost: true },
    });
    const monthlyDomainCost = domainCosts.reduce((acc, d) => acc + Number(d.cost) / 12, 0);

    const monthlyCosts = monthlyHostingCost + monthlyDomainCost;
    const monthlyProfit = monthlyRevenue - monthlyCosts;

    // Guardar snapshot del mes actual si no existe
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    try {
      const existingSnapshot = await db.monthlyStats.findUnique({
        where: { companyId_year_month: { companyId, year: currentYear, month: currentMonth } }
      });

      if (!existingSnapshot) {
        await db.monthlyStats.create({
          data: {
            year: currentYear,
            month: currentMonth,
            monthlyRevenue,
            monthlyCosts,
            monthlyProfit,
            activeClients,
            activeServices: activeServices.length,
            activeDomains: domainCosts.length,
            activeHosting: hostingCosts.length,
            companyId,
          }
        });
      } else {
        // Update existing snapshot with current values
        await db.monthlyStats.update({
          where: { id: existingSnapshot.id },
          data: {
            monthlyRevenue,
            monthlyCosts,
            monthlyProfit,
            activeClients,
            activeServices: activeServices.length,
            activeDomains: domainCosts.length,
            activeHosting: hostingCosts.length,
          }
        });
      }
    } catch (snapshotError) {
      console.error('Error saving monthly snapshot:', snapshotError);
      // Continue without failing the request
    }

    // Obtener clientes añadidos recientemente (excluyendo eliminados) - filtrado por empresa
    const recentClients = await db.client.findMany({
      take: 5,
      where: { deletedAt: null, companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        services: {
          where: { status: ServiceStatus.ACTIVE },
          select: { monthlyPrice: true },
        },
        hosting: {
          select: { monthlyCost: true },
        },
        domains: {
          where: { status: DomainStatus.ACTIVE },
          select: { cost: true },
        },
      },
    });

    const recentClientsWithRevenue = recentClients.map((client) => {
      const monthlyRevenue = client.services.reduce((acc, s) => acc + Number(s.monthlyPrice), 0);
      const hostingCosts = client.hosting.reduce((acc, h) => acc + Number(h.monthlyCost || 0), 0);
      const domainCosts = client.domains.reduce((acc, d) => acc + (Number(d.cost || 0) / 12), 0);
      const monthlyCosts = hostingCosts + domainCosts;
      const monthlyProfit = monthlyRevenue - monthlyCosts;
      
      return {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        status: client.status,
        createdAt: client.createdAt,
        monthlyRevenue,
        monthlyCosts,
        monthlyProfit,
      };
    });

    // Obtener próximas renovaciones (servicios, dominios, hosting) - filtrado por empresa
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingServiceRenewals = await db.clientService.findMany({
      where: {
        status: ServiceStatus.ACTIVE,
        client: { deletedAt: null, companyId },
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
        client: { deletedAt: null, companyId },
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
        client: { deletedAt: null, companyId },
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

    // Obtener recordatorios pendientes (excluyendo eliminados) - filtrado por empresa
    const pendingReminders = await db.reminder.findMany({
      where: { 
        status: 'PENDING', 
        deletedAt: null,
        client: { companyId }
      },
      include: {
        client: { select: { id: true, name: true, company: true } }
      },
      orderBy: { reminderDate: 'asc' },
      take: 10,
    });

    // Calcular datos para el gráfico de los últimos 6 meses
    const chartData = await calculateHistoricalData(companyId);

    // Distribución de servicios por tipo (excluyendo clientes en papelera) - filtrado por empresa
    const activeClientIds = await db.client.findMany({
      where: { deletedAt: null, companyId },
      select: { id: true },
    });
    const clientIdList = activeClientIds.map(c => c.id);

    const servicesByType = await db.clientService.groupBy({
      by: ['serviceType'],
      _count: true,
      where: { 
        status: ServiceStatus.ACTIVE,
        clientId: { in: clientIdList }
      },
    });

    const servicesDistribution = servicesByType.map((s) => ({
      type: s.serviceType,
      count: s._count,
    }));

    const revenueByServiceType = await db.clientService.groupBy({
      by: ['serviceType'],
      _sum: { monthlyPrice: true },
      where: { 
        status: ServiceStatus.ACTIVE,
        clientId: { in: clientIdList }
      },
    });

    const revenueDistribution = revenueByServiceType.map((r) => ({
      type: r.serviceType,
      revenue: Number(r._sum.monthlyPrice || 0),
    }));

    // === NUEVOS KPIs ===
    
    // 1. Clientes nuevos este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newClientsThisMonth = await db.client.count({
      where: {
        deletedAt: null,
        companyId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Clientes nuevos del mes anterior (para comparación)
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0);
    endOfLastMonth.setHours(23, 59, 59, 999);
    
    const newClientsLastMonth = await db.client.count({
      where: {
        deletedAt: null,
        companyId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 2. Tasa de retención (clientes que siguen activos vs total histórico)
    const totalClientsEver = await db.client.count({ where: { companyId } });
    const clientsThatLeft = await db.client.count({
      where: { status: ClientStatus.CANCELLED, companyId },
    });
    const retentionRate = totalClientsEver > 0 
      ? Math.round(((totalClientsEver - clientsThatLeft) / totalClientsEver) * 100) 
      : 100;

    // 3. Ticket medio por cliente (ingreso promedio por cliente activo)
    const avgTicketPerClient = activeClients > 0 
      ? Math.round(monthlyRevenue / activeClients) 
      : 0;

    // 4. Servicios próximos a renovar (próximos 30 días) - ya calculados pero lo formateamos mejor
    const upcomingRenewalsCount = upcomingServiceRenewals.length + 
                                  upcomingDomainRenewals.length + 
                                  upcomingHostingRenewals.length;

    // Servicios próximos a renovar agrupados por urgencia
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    const urgentRenewals = [...upcomingServiceRenewals, ...upcomingDomainRenewals, ...upcomingHostingRenewals]
      .filter(item => new Date(item.renewalDate) <= sevenDaysFromNow).length;

    return NextResponse.json({
      clients: {
        total: totalClients,
        active: activeClients,
        paused: pausedClients,
        cancelled: cancelledClients,
        recent: recentClientsWithRevenue,
        newThisMonth: newClientsThisMonth,
        newLastMonth: newClientsLastMonth,
      },
      finances: {
        monthlyRevenue,
        monthlyCosts,
        monthlyProfit,
        annualRevenue: monthlyRevenue * 12,
        annualCosts: monthlyCosts * 12,
        annualProfit: monthlyProfit * 12,
        avgTicketPerClient,
      },
      kpis: {
        newClientsThisMonth,
        newClientsLastMonth,
        retentionRate,
        avgTicketPerClient,
        upcomingRenewalsCount,
        urgentRenewals,
      },
      renewals: {
        services: upcomingServiceRenewals,
        domains: upcomingDomainRenewals,
        hosting: upcomingHostingRenewals,
      },
      reminders: pendingReminders,
      chart: chartData,
      servicesDistribution,
      revenueDistribution,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del dashboard', details: String(error) }, { status: 500 });
  }
}

// Helper function to calculate historical data based on service creation dates
async function calculateHistoricalData(companyId: string) {
  const lastSixMonths: { month: string; revenue: number; costs: number; profit: number }[] = [];
  
  // Try to get saved snapshots first (handle case where table doesn't exist)
  let snapshots: any[] = [];
  try {
    snapshots = await db.monthlyStats.findMany({
      where: {
        companyId,
        OR: Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return {
            year: date.getFullYear(),
            month: date.getMonth() + 1
          };
        })
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    });
  } catch (error: any) {
    // Table doesn't exist yet, will calculate from scratch
    console.log('Monthly stats table not found, calculating from service data');
  }

  // Get all services with their creation dates to estimate historical data
  const allServices = await db.clientService.findMany({
    where: {
      client: { deletedAt: null, companyId }
    },
    select: {
      monthlyPrice: true,
      status: true,
      createdAt: true,
      startDate: true,
    }
  });

  const allHosting = await db.hosting.findMany({
    where: {
      client: { deletedAt: null, companyId }
    },
    select: {
      monthlyCost: true,
      createdAt: true,
    }
  });

  const allDomains = await db.domain.findMany({
    where: {
      client: { deletedAt: null, companyId },
      status: DomainStatus.ACTIVE
    },
    select: {
      cost: true,
      createdAt: true,
    }
  });

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthName = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
    
    // Check if we have a saved snapshot for this month
    const snapshot = snapshots.find(s => s.year === year && s.month === month);
    
    if (snapshot) {
      lastSixMonths.push({
        month: monthName,
        revenue: Number(snapshot.monthlyRevenue),
        costs: Number(snapshot.monthlyCosts),
        profit: Number(snapshot.monthlyProfit),
      });
    } else {
      // Calculate estimated historical data based on service creation dates
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      
      // Services that existed in this month (created before or during this month)
      const servicesInMonth = allServices.filter(s => {
        const serviceDate = s.startDate ? new Date(s.startDate) : new Date(s.createdAt);
        return serviceDate <= monthEnd && s.status === 'ACTIVE';
      });
      
      // Only count services that were created by that month
      const revenueInMonth = servicesInMonth
        .filter(s => {
          const serviceDate = s.startDate ? new Date(s.startDate) : new Date(s.createdAt);
          return serviceDate <= monthEnd;
        })
        .reduce((acc, s) => acc + Number(s.monthlyPrice), 0);
      
      // Hosting that existed in this month
      const hostingInMonth = allHosting.filter(h => new Date(h.createdAt) <= monthEnd);
      const hostingCostsInMonth = hostingInMonth.reduce((acc, h) => acc + Number(h.monthlyCost), 0);
      
      // Domains that existed in this month
      const domainsInMonth = allDomains.filter(d => new Date(d.createdAt) <= monthEnd);
      const domainCostsInMonth = domainsInMonth.reduce((acc, d) => acc + Number(d.cost) / 12, 0);
      
      const costsInMonth = hostingCostsInMonth + domainCostsInMonth;
      
      lastSixMonths.push({
        month: monthName,
        revenue: revenueInMonth,
        costs: costsInMonth,
        profit: revenueInMonth - costsInMonth,
      });
    }
  }
  
  return lastSixMonths;
}
