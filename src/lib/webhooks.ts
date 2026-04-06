import { prisma } from './prisma'
import crypto from 'crypto'

export type WebhookEvent = 
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.cancelled'
  | 'payment.received'
  | 'payment.failed'
  | 'alarm.triggered'
  | 'alarm.created'
  | 'service.created'
  | 'service.updated'
  | 'service.renewed'
  | 'domain.expiring'
  | 'hosting.expiring'
  | 'contract.ending'
  | 'user.created'
  | 'user.deleted'

interface WebhookPayload {
  id: string
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  company?: {
    id: string
  }
  triggeredBy?: {
    id: string
    name: string
    email: string
  } | null
}

interface TriggerWebhookOptions {
  event: WebhookEvent
  data: Record<string, unknown>
  companyId: string
  triggeredBy?: {
    id: string
    name: string
    email: string
  } | null
}

/**
 * Trigger webhooks for a specific event and company
 */
export async function triggerWebhooks(options: TriggerWebhookOptions): Promise<void> {
  const { event, data, companyId, triggeredBy } = options

  try {
    // Get all active webhooks for this company that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        companyId,
        active: true,
        events: {
          contains: event
        }
      }
    })

    if (webhooks.length === 0) {
      return
    }

    // Prepare the payload
    const payload: WebhookPayload = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      event,
      timestamp: new Date().toISOString(),
      data,
      company: { id: companyId },
      triggeredBy
    }

    // Send to all webhooks in parallel (fire and forget)
    await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, payload))
    )
  } catch (error) {
    console.error('Error triggering webhooks:', error)
  }
}

interface WebhookRecord {
  id: string
  url: string
  secret: string | null
  failureCount: number
}

/**
 * Send a webhook to a specific URL
 */
async function sendWebhook(webhook: WebhookRecord, payload: WebhookPayload): Promise<void> {
  const startTime = Date.now()
  let success = false
  let responseStatus: number | null = null
  let responseBody: string | null = null
  let errorMessage: string | null = null

  try {
    const payloadString = JSON.stringify(payload)
    
    // Generate signature if secret exists
    const signature = webhook.secret 
      ? crypto
          .createHmac('sha256', webhook.secret)
          .update(payloadString)
          .digest('hex')
      : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      'X-Webhook-ID': payload.id
    }

    if (signature) {
      headers['X-Webhook-Signature'] = `sha256=${signature}`
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    responseStatus = response.status
    responseBody = await response.text()
    success = response.status >= 200 && response.status < 300

    if (!success) {
      errorMessage = `HTTP ${response.status}: ${responseBody.substring(0, 200)}`
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Error desconocido'
  }

  const duration = Date.now() - startTime

  // Log the webhook delivery
  try {
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload: JSON.stringify(payload),
        responseStatus,
        responseBody: responseBody?.substring(0, 2000),
        success,
        error: errorMessage,
        duration
      }
    })

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: success ? 0 : webhook.failureCount + 1
      }
    })
  } catch (logError) {
    console.error('Error logging webhook delivery:', logError)
  }
}

/**
 * Trigger webhook for client events
 */
export async function triggerClientWebhook(
  event: 'client.created' | 'client.updated' | 'client.deleted',
  client: Record<string, unknown>,
  companyId: string,
  user?: { id: string; name: string; email: string } | null
): Promise<void> {
  await triggerWebhooks({
    event,
    data: { client },
    companyId,
    triggeredBy: user
  })
}

/**
 * Trigger webhook for invoice events
 */
export async function triggerInvoiceWebhook(
  event: 'invoice.created' | 'invoice.sent' | 'invoice.paid' | 'invoice.cancelled',
  invoice: Record<string, unknown>,
  companyId: string,
  user?: { id: string; name: string; email: string } | null
): Promise<void> {
  await triggerWebhooks({
    event,
    data: { invoice },
    companyId,
    triggeredBy: user
  })
}

/**
 * Trigger webhook for payment events
 */
export async function triggerPaymentWebhook(
  event: 'payment.received' | 'payment.failed',
  payment: Record<string, unknown>,
  companyId: string,
  user?: { id: string; name: string; email: string } | null
): Promise<void> {
  await triggerWebhooks({
    event,
    data: { payment },
    companyId,
    triggeredBy: user
  })
}

/**
 * Trigger webhook for alarm events
 */
export async function triggerAlarmWebhook(
  event: 'alarm.triggered' | 'alarm.created',
  alarm: Record<string, unknown>,
  companyId: string,
  user?: { id: string; name: string; email: string } | null
): Promise<void> {
  await triggerWebhooks({
    event,
    data: { alarm },
    companyId,
    triggeredBy: user
  })
}

/**
 * Trigger webhook for service events
 */
export async function triggerServiceWebhook(
  event: 'service.created' | 'service.updated' | 'service.renewed',
  service: Record<string, unknown>,
  companyId: string,
  user?: { id: string; name: string; email: string } | null
): Promise<void> {
  await triggerWebhooks({
    event,
    data: { service },
    companyId,
    triggeredBy: user
  })
}

/**
 * Trigger webhook for domain expiring
 */
export async function triggerDomainExpiringWebhook(
  domain: Record<string, unknown>,
  daysUntilExpiry: number,
  companyId: string
): Promise<void> {
  await triggerWebhooks({
    event: 'domain.expiring',
    data: { domain, daysUntilExpiry },
    companyId,
    triggeredBy: null
  })
}

/**
 * Trigger webhook for hosting expiring
 */
export async function triggerHostingExpiringWebhook(
  hosting: Record<string, unknown>,
  daysUntilExpiry: number,
  companyId: string
): Promise<void> {
  await triggerWebhooks({
    event: 'hosting.expiring',
    data: { hosting, daysUntilExpiry },
    companyId,
    triggeredBy: null
  })
}

/**
 * Trigger webhook for contract ending
 */
export async function triggerContractEndingWebhook(
  client: Record<string, unknown>,
  daysUntilEnd: number,
  companyId: string
): Promise<void> {
  await triggerWebhooks({
    event: 'contract.ending',
    data: { client, daysUntilEnd },
    companyId,
    triggeredBy: null
  })
}
