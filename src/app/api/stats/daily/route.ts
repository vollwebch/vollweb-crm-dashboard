import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServiceStatus, DomainStatus } from '@prisma/client';

// GET /api/stats/daily - Get daily stats for a specific month
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Get all active services with their start dates
    const services = await db.clientService.findMany({
      where: {
        status: ServiceStatus.ACTIVE,
        client: { deletedAt: null }
      },
      select: {
        monthlyPrice: true,
        startDate: true,
        createdAt: true,
        serviceType: true,
        client: {
          select: { company: true }
        }
      }
    });

    // Get hosting costs
    const hosting = await db.hosting.findMany({
      where: {
        client: { deletedAt: null }
      },
      select: {
        monthlyCost: true,
        createdAt: true,
        provider: true,
        client: {
          select: { company: true }
        }
      }
    });

    // Get domain costs
    const domains = await db.domain.findMany({
      where: {
        status: DomainStatus.ACTIVE,
        client: { deletedAt: null }
      },
      select: {
        cost: true,
        createdAt: true,
        domainName: true,
        client: {
          select: { company: true }
        }
      }
    });

    // Calculate daily breakdown
    const dailyStats = [];
    const dailyRevenueByClient: Record<string, { client: string; revenue: number }[]> = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate revenue for services active on this date
      let dayRevenue = 0;
      let dayCosts = 0;
      
      services.forEach(service => {
        const serviceDate = service.startDate ? new Date(service.startDate) : new Date(service.createdAt);
        if (serviceDate <= date) {
          const dailyPrice = Number(service.monthlyPrice) / daysInMonth;
          dayRevenue += dailyPrice;
        }
      });

      hosting.forEach(h => {
        const hostDate = new Date(h.createdAt);
        if (hostDate <= date) {
          dayCosts += Number(h.monthlyCost) / daysInMonth;
        }
      });

      domains.forEach(d => {
        const domainDate = new Date(d.createdAt);
        if (domainDate <= date) {
          dayCosts += Number(d.cost) / 12 / daysInMonth;
        }
      });

      dailyStats.push({
        day,
        date: dateStr,
        dayName: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        revenue: Math.round(dayRevenue * 100) / 100,
        costs: Math.round(dayCosts * 100) / 100,
        profit: Math.round((dayRevenue - dayCosts) * 100) / 100,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // Get client revenue breakdown for the month
    const clientRevenue = services.reduce((acc, s) => {
      const client = s.client.company;
      if (!acc[client]) {
        acc[client] = 0;
      }
      acc[client] += Number(s.monthlyPrice);
      return acc;
    }, {} as Record<string, number>);

    const clientBreakdown = Object.entries(clientRevenue)
      .map(([client, revenue]) => ({ client, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      year,
      month,
      monthName: getMonthName(month),
      daysInMonth,
      dailyStats,
      clientBreakdown,
      totals: {
        revenue: dailyStats.reduce((sum, d) => sum + d.revenue, 0),
        costs: dailyStats.reduce((sum, d) => sum + d.costs, 0),
        profit: dailyStats.reduce((sum, d) => sum + d.profit, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas diarias' }, { status: 500 });
  }
}

function getMonthName(month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
}
