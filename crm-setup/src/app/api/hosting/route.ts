import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/hosting - Listar todo el hosting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    const clientId = searchParams.get('clientId');

    const where: any = {};

    if (provider) {
      where.provider = { contains: provider, mode: 'insensitive' };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const hosting = await db.hosting.findMany({
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json(hosting);
  } catch (error) {
    console.error('Error fetching hosting:', error);
    return NextResponse.json({ error: 'Error al obtener hosting' }, { status: 500 });
  }
}
