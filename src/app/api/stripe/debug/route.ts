import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const logs: string[] = []
  
  try {
    logs.push(`1. Iniciando...`)
    
    const body = await req.json()
    logs.push(`2. Body recibido: ${JSON.stringify(body)}`)
    
    const { clientId, entityType, entityId, amount, description } = body
    
    // Validate
    if (!clientId || !entityType || !amount) {
      return NextResponse.json({ error: 'Faltan campos', logs })
    }
    logs.push(`3. Validación OK`)
    
    // Check env
    const stripeKey = process.env.STRIPE_SECRET_KEY
    logs.push(`4. STRIPE_SECRET_KEY existe: ${!!stripeKey}`)
    logs.push(`5. STRIPE_SECRET_KEY empieza con: ${stripeKey?.substring(0, 20)}...`)
    
    if (!stripeKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY no configurada', logs })
    }
    
    // Init Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-02-25.clover',
    })
    logs.push(`6. Stripe inicializado`)
    
    // Get client
    logs.push(`7. Buscando cliente: ${clientId}`)
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })
    logs.push(`8. Cliente encontrado: ${client ? client.company : 'NO'}`)
    
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado', logs })
    }
    
    // Create payment record
    logs.push(`9. Creando registro de pago...`)
    const payment = await prisma.payment.create({
      data: {
        clientId,
        entityType: entityType as any,
        entityId: entityId || 'custom',
        amount: Number(amount),
        currency: 'EUR',
        status: 'PENDING',
        description: description || `Pago para ${client.company}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    logs.push(`10. Payment creado: ${payment.id}`)
    
    // Create Stripe session
    logs.push(`11. Creando sesión de Stripe...`)
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmail = client.email && emailRegex.test(client.email) ? client.email : undefined
    logs.push(`11b. Email válido: ${validEmail || 'No se usará email'}`)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: validEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Servicio',
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || 'https://vollweb-dashboard.vercel.app'}/?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://vollweb-dashboard.vercel.app'}/?payment=cancelled`,
      metadata: {
        paymentId: payment.id,
        clientId,
        entityType,
        entityId: entityId || 'custom',
      },
    })
    logs.push(`12. Sesión creada: ${session.id}`)
    
    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    })
    logs.push(`13. Payment actualizado`)
    
    return NextResponse.json({
      success: true,
      url: session.url,
      paymentId: payment.id,
      logs
    })
    
  } catch (error: any) {
    logs.push(`ERROR: ${error.message}`)
    logs.push(`Stack: ${error.stack?.substring(0, 500)}`)
    return NextResponse.json({ 
      error: error.message,
      logs 
    }, { status: 500 })
  }
}
