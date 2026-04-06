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

// GET - Obtener datos de Stripe de un pago
export async function GET(req: NextRequest) {
  try {
    const stripe = getStripe()
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')
    const sessionId = searchParams.get('sessionId')

    let session: Stripe.Checkout.Session | null = null
    let paymentIntent: Stripe.PaymentIntent | null = null

    // Si tenemos sessionId, obtener la sesión de Stripe
    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'payment_intent', 'line_items'],
      })
    }

    // Si tenemos paymentId, buscar en la DB y luego en Stripe
    if (paymentId && !sessionId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      })

      if (payment?.stripeSessionId) {
        session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId, {
          expand: ['customer', 'payment_intent', 'line_items'],
        })
      }

      if (payment?.stripePaymentId) {
        paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId)
      }
    }

    if (!session && !paymentIntent) {
      return NextResponse.json(
        { error: 'No se encontraron datos en Stripe' },
        { status: 404 }
      )
    }

    // Extraer datos del cliente
    const customerData = {
      email: session?.customer_details?.email || session?.customer_email || paymentIntent?.receipt_email,
      name: session?.customer_details?.name,
      phone: session?.customer_details?.phone,
      country: session?.customer_details?.address?.country,
      city: session?.customer_details?.address?.city,
      line1: session?.customer_details?.address?.line1,
      postalCode: session?.customer_details?.address?.postal_code,
    }

    // Datos del pago
    const paymentData = {
      amount: session?.amount_total ? session.amount_total / 100 : (paymentIntent?.amount ? paymentIntent.amount / 100 : 0),
      currency: session?.currency || paymentIntent?.currency,
      status: session?.payment_status || paymentIntent?.status,
      created: session?.created ? new Date(session.created * 1000) : (paymentIntent?.created ? new Date(paymentIntent.created * 1000) : null),
      description: session?.metadata?.description || paymentIntent?.description,
      productId: session?.metadata?.productId,
      clientId: session?.metadata?.clientId,
    }

    // Items comprados
    const items = session?.line_items?.data?.map(item => ({
      name: item.description || item.price?.product?.toString(),
      amount: item.amount_total ? item.amount_total / 100 : 0,
      quantity: item.quantity,
    })) || []

    // Si hay customer de Stripe, obtener más datos
    let stripeCustomer = null
    if (session?.customer && typeof session.customer !== 'string') {
      stripeCustomer = {
        id: (session.customer as Stripe.Customer).id,
        email: (session.customer as Stripe.Customer).email,
        name: (session.customer as Stripe.Customer).name,
        phone: (session.customer as Stripe.Customer).phone,
      }
    }

    return NextResponse.json({
      success: true,
      customer: customerData,
      payment: paymentData,
      items,
      stripeCustomer,
      sessionId: session?.id,
      paymentIntentId: paymentIntent?.id,
      metadata: session?.metadata || {},
    })
  } catch (error: any) {
    console.error('Error fetching Stripe data:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos de Stripe' },
      { status: 500 }
    )
  }
}
