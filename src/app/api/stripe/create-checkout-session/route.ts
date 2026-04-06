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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, entityType, entityId, amount, description, clientEmail, clientName } = body

    // Validate required fields
    if (!clientId || !entityType || !amount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        clientId,
        entityType: entityType as 'SERVICE' | 'HOSTING' | 'DOMAIN' | 'CUSTOM',
        entityId: entityId || 'custom',
        amount,
        currency: 'EUR',
        status: 'PENDING',
        description: description || `Pago para ${client.company}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Get entity details for the product name
    let productName = description || 'Servicio'
    let productDescription = ''

    if (entityType === 'SERVICE' && entityId) {
      const service = await prisma.clientService.findUnique({
        where: { id: entityId },
        include: { client: true },
      })
      if (service) {
        const serviceTypes: Record<string, string> = {
          WEB: 'Diseño Web',
          HOSTING: 'Hosting',
          MAINTENANCE: 'Mantenimiento',
          SEO: 'SEO',
          DOMAIN: 'Dominio',
          EMAIL: 'Email',
          OTHER: 'Otro',
        }
        productName = `${serviceTypes[service.serviceType] || 'Servicio'} - ${service.client.company}`
        productDescription = service.description || `Servicio mensual para ${service.client.company}`
      }
    } else if (entityType === 'HOSTING' && entityId) {
      const hosting = await prisma.hosting.findUnique({
        where: { id: entityId },
        include: { client: true },
      })
      if (hosting) {
        productName = `Hosting ${hosting.provider} - ${hosting.plan}`
        productDescription = `Hosting para ${hosting.client.company}`
      }
    } else if (entityType === 'DOMAIN' && entityId) {
      const domain = await prisma.domain.findUnique({
        where: { id: entityId },
        include: { client: true },
      })
      if (domain) {
        productName = `Dominio ${domain.domainName}`
        productDescription = `Renovación de dominio para ${domain.client.company}`
      }
    }

    // Create Stripe checkout session
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: clientEmail || client.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: Math.round(Number(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?payment=cancelled`,
      metadata: {
        paymentId: payment.id,
        clientId,
        entityType,
        entityId: entityId || 'custom',
      },
    })

    // Update payment with Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    )
  }
}
