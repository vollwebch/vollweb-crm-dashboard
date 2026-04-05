import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/config/notifications - Obtener configuración de notificaciones
export async function GET() {
  try {
    let config = await db.notificationConfig.findFirst();
    
    if (!config) {
      config = await db.notificationConfig.create({
        data: {
          serviceRenewalEnabled: true,
          serviceRenewalDays: '30',
          domainExpiryEnabled: true,
          domainExpiryDays: '30',
          hostingRenewalEnabled: true,
          hostingRenewalDays: '30',
          contractEndEnabled: true,
          contractEndDays: '30',
          anniversaryEnabled: true,
          anniversaryYears: '1,2,3,4,5,10',
          inactiveClientEnabled: true,
          inactiveClientDays: 90,
          customAlarmsEnabled: true,
          emailNotifications: false,
          pushNotifications: true,
        },
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching notification config:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

// PATCH /api/config/notifications - Actualizar configuración
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    let config = await db.notificationConfig.findFirst();
    
    if (!config) {
      config = await db.notificationConfig.create({ data: body });
    } else {
      config = await db.notificationConfig.update({
        where: { id: config.id },
        data: body,
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating notification config:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
