import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no está configurada')
  }
  return new Stripe(key, {
    apiVersion: '2026-02-25.clover',
  })
}

// Función para normalizar teléfono quitando prefijos internacionales
function normalizePhone(phone: string): string {
  if (!phone) return ''

  // Quitar todos los caracteres no numéricos
  let normalized = phone.replace(/[^\d]/g, '')

  // Prefijos internacionales comunes a quitar
  const prefixes = [
    '34',   // España
    '49',   // Alemania
    '41',   // Suiza
    '33',   // Francia
    '39',   // Italia
    '44',   // UK
    '1',    // USA/Canadá
    '52',   // México
    '54',   // Argentina
    '55',   // Brasil
    '56',   // Chile
    '57',   // Colombia
    '51',   // Perú
  ]

  // Si empieza con 00, quitarlo
  if (normalized.startsWith('00')) {
    normalized = normalized.substring(2)
  }

  // Intentar quitar prefijo si el número resultante tiene 9+ dígitos
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix) && normalized.length > 10) {
      normalized = normalized.substring(prefix.length)
      break
    }
  }

  return normalized
}

// Función para buscar cliente con múltiples lógicas
async function findClient(session: Stripe.Checkout.Session, customerEmail?: string, customerName?: string, customerPhone?: string) {
  const matchLog: string[] = []

  // 1. Intentar por metadata (si viene del CRM)
  const clientIdFromMetadata = session.metadata?.clientId
  if (clientIdFromMetadata) {
    const client = await prisma.client.findUnique({
      where: { id: clientIdFromMetadata },
    })
    if (client) {
      matchLog.push('✅ Match por metadata (clientId)')
      return { client, matchMethod: 'metadata', matchLog }
    }
  }

  // 2. Intentar por email exacto
  const email = customerEmail || session.customer_details?.email || session.customer_email
  if (email) {
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { email: email },
        ]
      },
    })
    if (client) {
      matchLog.push(`✅ Match por email exacto: ${email}`)
      return { client, matchMethod: 'email_exact', matchLog }
    }
    matchLog.push(`❌ No match por email: ${email}`)
  }

  // 3. Intentar por teléfono (normalizado sin prefijos)
  const phone = customerPhone || session.customer_details?.phone
  if (phone) {
    const normalizedPhone = normalizePhone(phone)
    matchLog.push(`📞 Teléfono normalizado: ${phone} → ${normalizedPhone}`)

    const clients = await prisma.client.findMany({
      where: { phone: { not: null } },
    })

    for (const client of clients) {
      if (client.phone) {
        const clientPhoneNormalized = normalizePhone(client.phone)

        // Coincidencia exacta de números normalizados
        if (clientPhoneNormalized === normalizedPhone) {
          matchLog.push(`✅ Match por teléfono exacto: ${phone} = ${client.phone}`)
          return { client, matchMethod: 'phone', matchLog }
        }

        // Uno contiene al otro
        if (clientPhoneNormalized.includes(normalizedPhone) || normalizedPhone.includes(clientPhoneNormalized)) {
          matchLog.push(`✅ Match por teléfono parcial: ${phone} ≈ ${client.phone}`)
          return { client, matchMethod: 'phone', matchLog }
        }
      }
    }
    matchLog.push(`❌ No match por teléfono: ${phone}`)
  }

  // 4. Intentar por nombre similar (fuzzy match)
  const name = customerName || session.customer_details?.name
  if (name) {
    const nameLower = name.toLowerCase().trim()

    const clients = await prisma.client.findMany()

    // Coincidencia exacta de nombre
    for (const client of clients) {
      const clientNameLower = client.name.toLowerCase().trim()
      if (clientNameLower === nameLower) {
        matchLog.push(`✅ Match por nombre exacto: ${name}`)
        return { client, matchMethod: 'name_exact', matchLog }
      }
    }

    // Coincidencia parcial de nombre
    for (const client of clients) {
      const clientNameLower = client.name.toLowerCase().trim()
      if (nameLower.includes(clientNameLower) || clientNameLower.includes(nameLower)) {
        matchLog.push(`✅ Match por nombre parcial: ${name} ≈ ${client.name}`)
        return { client, matchMethod: 'name_partial', matchLog }
      }
    }

    // Coincidencia por palabras (al menos 2 palabras coinciden)
    const nameWords = nameLower.split(/\s+/)
    for (const client of clients) {
      const clientWords = client.name.toLowerCase().trim().split(/\s+/)
      const matchingWords = nameWords.filter(w => clientWords.includes(w) && w.length > 2)

      if (matchingWords.length >= 2) {
        matchLog.push(`✅ Match por nombre (palabras): ${name} ≈ ${client.name}`)
        return { client, matchMethod: 'name_words', matchLog }
      }
    }

    matchLog.push(`❌ No match por nombre: ${name}`)
  }

  // 5. Intentar por empresa similar
  const companyName = session.customer_details?.name || name
  if (companyName) {
    const companyLower = companyName.toLowerCase().trim()

    const clients = await prisma.client.findMany()

    for (const client of clients) {
      const clientCompanyLower = client.company.toLowerCase().trim()

      if (clientCompanyLower === companyLower ||
          clientCompanyLower.includes(companyLower) ||
          companyLower.includes(clientCompanyLower)) {
        matchLog.push(`✅ Match por empresa: ${companyName} ≈ ${client.company}`)
        return { client, matchMethod: 'company', matchLog }
      }
    }
  }

  matchLog.push('❌ No se encontró cliente con ningún método')
  return { client: null, matchMethod: 'none', matchLog }
}

// Función para crear pago sin cliente asignado
async function createUnassignedPayment(session: Stripe.Checkout.Session, matchLog: string[]) {
  const amount = session.amount_total ? session.amount_total / 100 : 0
  const email = session.customer_details?.email || session.customer_email || ''
  const name = session.customer_details?.name || ''
  const phone = session.customer_details?.phone || ''

  // Crear un cliente temporal para el pago no asignado
  const tempClient = await prisma.client.findFirst({
    where: { email: 'unassigned@system.local' },
  })

  let clientId = tempClient?.id

  if (!clientId) {
    // Crear cliente especial para pagos no asignados
    const newClient = await prisma.client.create({
      data: {
        name: 'Pagos Sin Asignar',
        company: 'Sistema',
        email: 'unassigned@system.local',
        status: 'ACTIVE',
      },
    })
    clientId = newClient.id
  }

  // Incluir teléfono en la descripción si está disponible
  let description = `Pago sin asignar - ${name}`
  if (email) description += ` (${email})`
  if (phone) description += ` [Tel: ${phone}]`

  const payment = await prisma.payment.create({
    data: {
      clientId,
      entityType: 'CUSTOM',
      entityId: 'stripe-unassigned',
      amount,
      currency: session.currency?.toUpperCase() || 'EUR',
      status: 'PAID',
      stripePaymentId: session.payment_intent as string,
      stripeSessionId: session.id,
      description,
      paidAt: new Date(),
    },
  })

  return { payment, clientId }
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('=== NUEVO PAGO RECIBIDO ===')
        console.log(`Session ID: ${session.id}`)
        console.log(`Amount: ${session.amount_total! / 100} ${session.currency}`)
        console.log(`Email: ${session.customer_details?.email || session.customer_email}`)
        console.log(`Name: ${session.customer_details?.name}`)
        console.log(`Phone: ${session.customer_details?.phone}`)
        console.log(`Metadata: ${JSON.stringify(session.metadata)}`)

        // Buscar cliente con múltiples lógicas
        const { client, matchMethod, matchLog } = await findClient(session)

        console.log('Match log:')
        matchLog.forEach(log => console.log(`  ${log}`))

        if (client) {
          console.log(`✅ Cliente encontrado: ${client.name} (${client.company})`)

          // Crear o actualizar pago
          const paymentId = session.metadata?.paymentId

          if (paymentId) {
            // Actualizar pago existente
            await prisma.payment.update({
              where: { id: paymentId },
              data: {
                status: 'PAID',
                stripePaymentId: session.payment_intent as string,
                paidAt: new Date(),
                paymentMethod: session.payment_method_types[0],
              },
            })
          } else {
            // Crear nuevo pago
            await prisma.payment.create({
              data: {
                clientId: client.id,
                entityType: (session.metadata?.entityType as any) || 'CUSTOM',
                entityId: session.metadata?.entityId || 'stripe',
                amount: session.amount_total! / 100,
                currency: session.currency?.toUpperCase() || 'EUR',
                status: 'PAID',
                stripePaymentId: session.payment_intent as string,
                stripeSessionId: session.id,
                description: session.metadata?.description || `Pago de ${client.name}`,
                paidAt: new Date(),
              },
            })
          }

        } else {
          console.log('⚠️ Cliente no encontrado, creando pago sin asignar')

          // Crear pago sin cliente asignado
          const { payment } = await createUnassignedPayment(session, matchLog)
          console.log(`Pago creado ID: ${payment.id}`)
        }

        // Actualizar fechas de renovación si hay entityId
        const entityType = session.metadata?.entityType
        const entityId = session.metadata?.entityId

        if (entityType === 'SERVICE' && entityId) {
          const service = await prisma.clientService.findUnique({
            where: { id: entityId },
          })
          if (service && service.renewalDate) {
            const newRenewalDate = new Date(service.renewalDate)
            newRenewalDate.setMonth(newRenewalDate.getMonth() + 1)
            await prisma.clientService.update({
              where: { id: entityId },
              data: { renewalDate: newRenewalDate },
            })
          }
        }

        if (entityType === 'HOSTING' && entityId) {
          const hosting = await prisma.hosting.findUnique({
            where: { id: entityId },
          })
          if (hosting && hosting.renewalDate) {
            const newRenewalDate = new Date(hosting.renewalDate)
            newRenewalDate.setMonth(newRenewalDate.getMonth() + 1)
            await prisma.hosting.update({
              where: { id: entityId },
              data: { renewalDate: newRenewalDate },
            })
          }
        }

        if (entityType === 'DOMAIN' && entityId) {
          const domain = await prisma.domain.findUnique({
            where: { id: entityId },
          })
          if (domain) {
            const newRenewalDate = new Date(domain.renewalDate)
            newRenewalDate.setFullYear(newRenewalDate.getFullYear() + 1)
            await prisma.domain.update({
              where: { id: entityId },
              data: { renewalDate: newRenewalDate },
            })
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: paymentIntent.id },
        })

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          })
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        const payment = await prisma.payment.findFirst({
          where: { stripePaymentId: charge.payment_intent as string },
        })

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' },
          })
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
