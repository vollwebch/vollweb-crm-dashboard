import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Asignar manualmente un pago a un cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentId, clientId } = body

    if (!paymentId || !clientId) {
      return NextResponse.json(
        { error: 'Se requiere paymentId y clientId' },
        { status: 400 }
      )
    }

    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el cliente existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el pago
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        clientId: clientId,
        description: payment.description?.replace(/Pago sin asignar - [^-]+/, `Pago de ${client.name}`) || `Pago de ${client.name}`,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Pago asignado correctamente a ${client.name}`,
      payment: updatedPayment,
    })
  } catch (error) {
    console.error('Error assigning payment:', error)
    return NextResponse.json(
      { error: 'Error al asignar el pago' },
      { status: 500 }
    )
  }
}
