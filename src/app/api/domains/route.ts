import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DomainStatus } from '@prisma/client';

// GET /api/domains - Listar todos los dominios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as DomainStatus | null;
    const clientId = searchParams.get('clientId');

    const where: any = {};

    if (status && Object.values(DomainStatus).includes(status)) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const domains = await db.domain.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: {
        renewalDate: 'asc',
      },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Error al obtener dominios' }, { status: 500 });
  }
}
