import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stats/clients-by-month - Get active clients for a specific month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Create date boundaries for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Get all clients (excluding deleted ones)
    const allClients = await db.client.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        services: {
          where: {
            status: 'ACTIVE',
          }
        },
        hosting: true,
        domains: {
          where: {
            status: 'ACTIVE',
          }
        },
      }
    });

    // Filter clients that were active during that month
    const activeClients = allClients.filter(client => {
      // A client is considered active in a month if:
      // 1. They were created before or during that month
      // 2. They have active services during that month
      // 3. Their status is ACTIVE or they were ACTIVE during that period

      const clientCreatedAt = new Date(client.createdAt);
      const clientCreatedBeforeOrDuringMonth = clientCreatedAt <= endDate;

      // Check if client was active during this month
      let wasActive = false;

      if (client.status === 'ACTIVE') {
        wasActive = clientCreatedBeforeOrDuringMonth;
      } else if (client.status === 'PAUSED') {
        // They were active at some point, check if created before this month
        wasActive = clientCreatedBeforeOrDuringMonth;
      } else if (client.status === 'CANCELLED') {
        // Check if contract ended after this month or if client was created during/before
        if (client.contractEnd) {
          const contractEndDate = new Date(client.contractEnd);
          wasActive = contractEndDate >= startDate && clientCreatedBeforeOrDuringMonth;
        } else {
          // No contract end date, consider them potentially active
          wasActive = clientCreatedBeforeOrDuringMonth;
        }
      }

      // Also check if they have any services that started before or during this month
      const hasActiveServices = client.services.some(service => {
        const serviceStart = new Date(service.startDate);
        return serviceStart <= endDate && service.status === 'ACTIVE';
      });

      return wasActive || hasActiveServices;
    });

    // Calculate revenue and costs for each active client
    const clientsWithData = activeClients.map(client => {
      // Calculate monthly revenue from active services
      const monthlyRevenue = client.services
        .filter(s => s.status === 'ACTIVE')
        .reduce((sum, s) => sum + Number(s.monthlyPrice), 0);

      // Calculate monthly costs from hosting
      const monthlyCosts = client.hosting.reduce((sum, h) => sum + Number(h.monthlyCost), 0);

      // Calculate domain costs (annual, so divide by 12)
      const domainCostsMonthly = client.domains
        .filter(d => d.status === 'ACTIVE')
        .reduce((sum, d) => sum + Number(d.cost) / 12, 0);

      return {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        status: client.status,
        contractStart: client.contractStart,
        contractEnd: client.contractEnd,
        monthlyRevenue,
        monthlyCosts: monthlyCosts + domainCostsMonthly,
        profit: monthlyRevenue - monthlyCosts - domainCostsMonthly,
        servicesCount: client.services.length,
        domainsCount: client.domains.length,
        hostingCount: client.hosting.length,
        services: client.services.map(s => ({
          id: s.id,
          type: s.serviceType,
          description: s.description,
          monthlyPrice: Number(s.monthlyPrice),
          startDate: s.startDate,
        })),
        createdAt: client.createdAt,
      };
    });

    // Sort by company name
    clientsWithData.sort((a, b) => a.company.localeCompare(b.company));

    // Calculate totals
    const totals = {
      totalClients: clientsWithData.length,
      totalRevenue: clientsWithData.reduce((sum, c) => sum + c.monthlyRevenue, 0),
      totalCosts: clientsWithData.reduce((sum, c) => sum + c.monthlyCosts, 0),
      totalProfit: clientsWithData.reduce((sum, c) => sum + c.profit, 0),
      totalServices: clientsWithData.reduce((sum, c) => sum + c.servicesCount, 0),
      totalDomains: clientsWithData.reduce((sum, c) => sum + c.domainsCount, 0),
      totalHosting: clientsWithData.reduce((sum, c) => sum + c.hostingCount, 0),
      activeClients: clientsWithData.filter(c => c.status === 'ACTIVE').length,
      pausedClients: clientsWithData.filter(c => c.status === 'PAUSED').length,
      cancelledClients: clientsWithData.filter(c => c.status === 'CANCELLED').length,
    };

    return NextResponse.json({
      year,
      month,
      monthName: getMonthName(month),
      clients: clientsWithData,
      totals,
    });
  } catch (error) {
    console.error('Error fetching clients by month:', error);
    return NextResponse.json({ error: 'Error al obtener clientes por mes' }, { status: 500 });
  }
}

function getMonthName(month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
}
