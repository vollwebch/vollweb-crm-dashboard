import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import crypto from 'crypto'

// POST - Test a webhook by sending a test payload
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Check webhook exists and belongs to company
    const webhook = await prisma.webhook.findFirst({
      where: { id, companyId: user.companyId }
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook no encontrado' }, { status: 404 })
    }

    // Create test payload
    const testPayload = {
      id: `test_${Date.now()}`,
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook',
        triggeredBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        company: {
          id: user.companyId
        }
      }
    }

    const startTime = Date.now()
    let success = false
    let responseStatus: number | null = null
    let responseBody: string | null = null
    let error: string | null = null

    try {
      // Generate signature if secret exists
      const payloadString = JSON.stringify(testPayload)
      const signature = webhook.secret 
        ? crypto
            .createHmac('sha256', webhook.secret)
            .update(payloadString)
            .digest('hex')
        : null

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'test',
        'X-Webhook-Timestamp': new Date().toISOString(),
        'X-Webhook-ID': testPayload.id
      }

      if (signature) {
        headers['X-Webhook-Signature'] = `sha256=${signature}`
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      responseStatus = response.status
      responseBody = await response.text()
      success = response.status >= 200 && response.status < 300

      if (!success) {
        error = `HTTP ${response.status}: ${responseBody.substring(0, 200)}`
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error desconocido'
    }

    const duration = Date.now() - startTime

    // Log the test
    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: 'test',
        payload: JSON.stringify(testPayload),
        responseStatus,
        responseBody: responseBody?.substring(0, 2000),
        success,
        error,
        duration
      }
    })

    // Update webhook last triggered
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { 
        lastTriggeredAt: new Date(),
        failureCount: success ? 0 : webhook.failureCount + 1
      }
    })

    return NextResponse.json({
      success,
      responseStatus,
      responseBody: responseBody?.substring(0, 500),
      error,
      duration
    })
  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json({ error: 'Error al probar webhook' }, { status: 500 })
  }
}
