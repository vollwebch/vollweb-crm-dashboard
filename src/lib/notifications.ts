import { db } from './db'

export type NotificationType = 
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'TICKET_NEW'
  | 'TICKET_REPLY'
  | 'TICKET_ASSIGNED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'CONTRACT_ENDING'
  | 'DOMAIN_EXPIRING'
  | 'PAYMENT_RECEIVED'
  | 'ALARM_TRIGGERED'

interface CreateNotificationOptions {
  type: NotificationType
  title: string
  message: string
  userId?: string
  clientUserId?: string
  entityType?: string
  entityId?: string
  data?: Record<string, unknown>
}

/**
 * Create a notification for a user or client user
 */
export async function createNotification(options: CreateNotificationOptions): Promise<void> {
  try {
    await db.notification.create({
      data: {
        type: options.type,
        title: options.title,
        message: options.message,
        userId: options.userId || null,
        clientUserId: options.clientUserId || null,
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        data: options.data || null
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

/**
 * Create notification for new ticket
 */
export async function notifyNewTicket(
  ticketId: string,
  ticketSubject: string,
  clientName: string,
  assignedUserId?: string
): Promise<void> {
  // Notify assigned user if exists
  if (assignedUserId) {
    await createNotification({
      type: 'TICKET_NEW',
      title: 'Nuevo ticket asignado',
      message: `Se te ha asignado el ticket "${ticketSubject}" de ${clientName}`,
      userId: assignedUserId,
      entityType: 'TICKET',
      entityId: ticketId
    })
  }
}

/**
 * Create notification for ticket reply
 */
export async function notifyTicketReply(
  ticketId: string,
  ticketSubject: string,
  replyAuthor: string,
  recipientUserId?: string,
  recipientClientUserId?: string
): Promise<void> {
  if (recipientUserId) {
    await createNotification({
      type: 'TICKET_REPLY',
      title: 'Nueva respuesta en ticket',
      message: `${replyAuthor} ha respondido en "${ticketSubject}"`,
      userId: recipientUserId,
      entityType: 'TICKET',
      entityId: ticketId
    })
  }
  
  if (recipientClientUserId) {
    await createNotification({
      type: 'TICKET_REPLY',
      title: 'Nueva respuesta en tu ticket',
      message: `Hay una nueva respuesta en "${ticketSubject}"`,
      clientUserId: recipientClientUserId,
      entityType: 'TICKET',
      entityId: ticketId
    })
  }
}

/**
 * Create notification for invoice created
 */
export async function notifyInvoiceCreated(
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  clientUserIds: string[]
): Promise<void> {
  for (const clientUserId of clientUserIds) {
    await createNotification({
      type: 'INVOICE_CREATED',
      title: 'Nueva factura',
      message: `Se ha creado la factura ${invoiceNumber}`,
      clientUserId,
      entityType: 'INVOICE',
      entityId: invoiceId
    })
  }
}

/**
 * Create notification for invoice paid
 */
export async function notifyInvoicePaid(
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      type: 'INVOICE_PAID',
      title: 'Factura pagada',
      message: `La factura ${invoiceNumber} por ${amount.toFixed(2)}€ ha sido pagada`,
      userId,
      entityType: 'INVOICE',
      entityId: invoiceId
    })
  }
}

/**
 * Create notification for quote accepted
 */
export async function notifyQuoteAccepted(
  quoteId: string,
  quoteNumber: string,
  clientName: string,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      type: 'QUOTE_ACCEPTED',
      title: 'Cotización aceptada',
      message: `${clientName} ha aceptado la cotización ${quoteNumber}`,
      userId,
      entityType: 'QUOTE',
      entityId: quoteId
    })
  }
}

/**
 * Create notification for quote rejected
 */
export async function notifyQuoteRejected(
  quoteId: string,
  quoteNumber: string,
  clientName: string,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      type: 'QUOTE_REJECTED',
      title: 'Cotización rechazada',
      message: `${clientName} ha rechazado la cotización ${quoteNumber}`,
      userId,
      entityType: 'QUOTE',
      entityId: quoteId
    })
  }
}

/**
 * Create notification for alarm triggered
 */
export async function notifyAlarmTriggered(
  alarmId: string,
  alarmTitle: string,
  userIds: string[]
): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      type: 'ALARM_TRIGGERED',
      title: 'Alarma activada',
      message: alarmTitle,
      userId,
      entityType: 'ALARM',
      entityId: alarmId
    })
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      read: false
    }
  })
}

/**
 * Get unread notification count for a client user
 */
export async function getUnreadClientNotificationCount(clientUserId: string): Promise<number> {
  return db.notification.count({
    where: {
      clientUserId,
      read: false
    }
  })
}
