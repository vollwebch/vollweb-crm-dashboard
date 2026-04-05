import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServiceStatus, DomainStatus, ReminderType } from '@prisma/client';

// POST /api/notifications/generate - Generate automatic reminders
// Logic: Generate for ANYTHING expiring in 30 days OR LESS (not just exactly 30 days)
// Re-notify: If dismissed and <= 7 days left, create again
export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date 30 days from now (end of window)
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    let remindersCreated = 0;

    // =====================
    // DOMAINS - Dominios que vencen en 30 días o menos (DESDE HOY)
    // =====================
    const domains = await db.domain.findMany({
      where: {
        status: DomainStatus.ACTIVE,
        renewalDate: {
          gte: today,              // Desde HOY
          lte: thirtyDaysFromNow,  // Hasta 30 días
        },
        client: { deletedAt: null },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });

    for (const domain of domains) {
      const existing = await db.reminder.findFirst({
        where: {
          type: ReminderType.DOMAIN_EXPIRY,
          domainId: domain.id,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (!existing) {
        const daysLeft = Math.ceil((new Date(domain.renewalDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await db.reminder.create({
          data: {
            type: ReminderType.DOMAIN_EXPIRY,
            entityType: 'domain',
            entityId: domain.id,
            reminderDate: domain.renewalDate,
            message: `El dominio "${domain.domainName}" de ${domain.client.company} vence en ${daysLeft} días`,
            clientId: domain.clientId,
            domainId: domain.id,
            status: 'PENDING',
          },
        });
        remindersCreated++;
      }
    }

    // =====================
    // HOSTING - Hosting que vence en 30 días o menos
    // =====================
    const hostings = await db.hosting.findMany({
      where: {
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        client: { deletedAt: null },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });

    for (const hosting of hostings) {
      if (!hosting.renewalDate) continue;
      
      const existing = await db.reminder.findFirst({
        where: {
          type: ReminderType.HOSTING_RENEWAL,
          hostingId: hosting.id,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (!existing) {
        const daysLeft = Math.ceil((new Date(hosting.renewalDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await db.reminder.create({
          data: {
            type: ReminderType.HOSTING_RENEWAL,
            entityType: 'hosting',
            entityId: hosting.id,
            reminderDate: hosting.renewalDate,
            message: `El hosting "${hosting.provider} - ${hosting.plan}" de ${hosting.client.company} vence en ${daysLeft} días`,
            clientId: hosting.clientId,
            hostingId: hosting.id,
            status: 'PENDING',
          },
        });
        remindersCreated++;
      }
    }

    // =====================
    // CONTRACTS - Contratos que terminan en 30 días o menos
    // =====================
    const clients = await db.client.findMany({
      where: {
        deletedAt: null,
        contractEnd: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
    });

    for (const client of clients) {
      if (!client.contractEnd) continue;
      
      const existing = await db.reminder.findFirst({
        where: {
          type: ReminderType.CONTRACT_END,
          clientId: client.id,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (!existing) {
        const daysLeft = Math.ceil((new Date(client.contractEnd).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await db.reminder.create({
          data: {
            type: ReminderType.CONTRACT_END,
            entityType: 'client',
            entityId: client.id,
            reminderDate: client.contractEnd,
            message: `El contrato de ${client.name} (${client.company}) termina en ${daysLeft} días`,
            clientId: client.id,
            status: 'PENDING',
          },
        });
        remindersCreated++;
      }
    }

    // =====================
    // SERVICES - Servicios que renuevan en 30 días o menos
    // =====================
    const services = await db.clientService.findMany({
      where: {
        status: ServiceStatus.ACTIVE,
        renewalDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        client: { deletedAt: null },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });

    for (const service of services) {
      if (!service.renewalDate) continue;
      
      const existing = await db.reminder.findFirst({
        where: {
          type: ReminderType.SERVICE_RENEWAL,
          serviceId: service.id,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (!existing) {
        const daysLeft = Math.ceil((new Date(service.renewalDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await db.reminder.create({
          data: {
            type: ReminderType.SERVICE_RENEWAL,
            entityType: 'service',
            entityId: service.id,
            reminderDate: service.renewalDate,
            message: `El servicio "${service.description || service.serviceType}" de ${service.client.company} renueva en ${daysLeft} días`,
            clientId: service.clientId,
            serviceId: service.id,
            status: 'PENDING',
          },
        });
        remindersCreated++;
      }
    }

    // =====================
    // RE-NOTIFY: Dismissed reminders with <= 7 days left
    // =====================
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);
    
    const dismissedReminders = await db.reminder.findMany({
      where: {
        status: 'DISMISSED',
        deletedAt: null,
        reminderDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
    });

    for (const dismissed of dismissedReminders) {
      const existingPending = await db.reminder.findFirst({
        where: {
          type: dismissed.type,
          domainId: dismissed.domainId,
          hostingId: dismissed.hostingId,
          serviceId: dismissed.serviceId,
          clientId: dismissed.clientId,
          status: 'PENDING',
          deletedAt: null,
        },
      });

      if (!existingPending) {
        const daysLeft = Math.ceil((new Date(dismissed.reminderDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let newMessage = dismissed.message;
        newMessage = newMessage.replace(/en \d+ días/, `en ${daysLeft} días`);
        
        await db.reminder.create({
          data: {
            type: dismissed.type,
            entityType: dismissed.entityType,
            entityId: dismissed.entityId,
            reminderDate: dismissed.reminderDate,
            message: newMessage,
            clientId: dismissed.clientId,
            domainId: dismissed.domainId,
            hostingId: dismissed.hostingId,
            serviceId: dismissed.serviceId,
            status: 'PENDING',
          },
        });
        remindersCreated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersCreated,
      message: `Se generaron ${remindersCreated} recordatorios`,
      stats: {
        domains: domains.length,
        hostings: hostings.length,
        clients: clients.length,
        services: services.length,
        reNotified: dismissedReminders.length,
      }
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    return NextResponse.json({ error: 'Error al generar notificaciones', details: String(error) }, { status: 500 });
  }
}

// GET - Check and generate notifications (can be called by cron)
export async function GET() {
  return POST();
}
