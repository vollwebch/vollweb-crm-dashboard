import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCompanyId } from '@/lib/auth';

// GET /api/stats/monthly - Get all monthly stats
export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    const whereClause: any = { companyId }; // Multi-tenant filter
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    const stats = await db.monthlyStats.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Get available years for this company
    const years = await db.monthlyStats.findMany({
      where: { companyId },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({
      stats: stats.map(s => ({
        id: s.id,
        year: s.year,
        month: s.month,
        monthName: getMonthName(s.month),
        revenue: Number(s.monthlyRevenue),
        costs: Number(s.monthlyCosts),
        profit: Number(s.monthlyProfit),
        activeClients: s.activeClients,
        activeServices: s.activeServices,
        activeDomains: s.activeDomains,
        activeHosting: s.activeHosting,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      years: years.map(y => y.year),
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas mensuales' }, { status: 500 });
  }
}

// POST /api/stats/monthly - Create or update monthly stat
export async function POST(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      year, 
      month, 
      revenue, 
      costs, 
      profit, 
      activeClients, 
      activeServices, 
      activeDomains, 
      activeHosting 
    } = body;

    if (!year || !month) {
      return NextResponse.json({ error: 'Año y mes son requeridos' }, { status: 400 });
    }

    // Calculate profit if not provided
    const calculatedProfit = profit ?? (Number(revenue || 0) - Number(costs || 0));

    let stat;
    
    // Try to find by ID or by year/month for this company
    if (id) {
      // Verify stat belongs to this company
      const existingStat = await db.monthlyStats.findFirst({
        where: { id, companyId }
      });
      
      if (!existingStat) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }

      stat = await db.monthlyStats.update({
        where: { id },
        data: {
          monthlyRevenue: revenue,
          monthlyCosts: costs,
          monthlyProfit: calculatedProfit,
          activeClients: activeClients || 0,
          activeServices: activeServices || 0,
          activeDomains: activeDomains || 0,
          activeHosting: activeHosting || 0,
          updatedAt: new Date(),
        }
      });
    } else {
      // Check if exists by year/month for this company
      const existing = await db.monthlyStats.findUnique({
        where: { companyId_year_month: { companyId, year, month } }
      });

      if (existing) {
        stat = await db.monthlyStats.update({
          where: { id: existing.id },
          data: {
            monthlyRevenue: revenue,
            monthlyCosts: costs,
            monthlyProfit: calculatedProfit,
            activeClients: activeClients || 0,
            activeServices: activeServices || 0,
            activeDomains: activeDomains || 0,
            activeHosting: activeHosting || 0,
            updatedAt: new Date(),
          }
        });
      } else {
        // Create new
        stat = await db.monthlyStats.create({
          data: {
            year,
            month,
            monthlyRevenue: revenue || 0,
            monthlyCosts: costs || 0,
            monthlyProfit: calculatedProfit,
            activeClients: activeClients || 0,
            activeServices: activeServices || 0,
            activeDomains: activeDomains || 0,
            activeHosting: activeHosting || 0,
            companyId,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      id: stat.id,
      year: stat.year,
      month: stat.month,
      monthName: getMonthName(stat.month),
      revenue: Number(stat.monthlyRevenue),
      costs: Number(stat.monthlyCosts),
      profit: Number(stat.monthlyProfit),
      activeClients: stat.activeClients,
      activeServices: stat.activeServices,
      activeDomains: stat.activeDomains,
      activeHosting: stat.activeHosting,
    });
  } catch (error) {
    console.error('Error saving monthly stat:', error);
    return NextResponse.json({ error: 'Error al guardar estadística mensual' }, { status: 500 });
  }
}

// DELETE /api/stats/monthly - Delete a monthly stat
export async function DELETE(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // Verify stat belongs to this company
    const stat = await db.monthlyStats.findFirst({
      where: { id, companyId }
    });

    if (!stat) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    await db.monthlyStats.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monthly stat:', error);
    return NextResponse.json({ error: 'Error al eliminar estadística mensual' }, { status: 500 });
  }
}

function getMonthName(month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] || '';
}
