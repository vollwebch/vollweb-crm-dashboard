import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  // (números europeos típicamente tienen 9-10 dígitos sin prefijo)
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix) && normalized.length > 10) {
      normalized = normalized.substring(prefix.length)
      break
    }
  }

  return normalized
}

// Función para extraer nombre/email de diferentes formatos de descripción
function extractPaymentInfo(description: string): { name?: string; email?: string; phone?: string } {
  const result: { name?: string; email?: string; phone?: string } = {}

  if (!description) return result

  // Formato 1: "Pago sin asignar - Nombre (email@ejemplo.com)"
  const match1 = description.match(/Pago sin asignar - ([^(]+)(?:\s*\(([^)]+@[^)]+)\))?/)
  if (match1) {
    result.name = match1[1].trim()
    result.email = match1[2]?.trim()
    return result
  }

  // Formato 2: "Pago importado de Stripe - Nombre"
  const match2 = description.match(/Pago importado de Stripe - (.+?)(?:\s*\([^)]+\))?$/)
  if (match2) {
    result.name = match2[1].trim()
    return result
  }

  // Formato 3: "Pago de Nombre" o "Pago de Nombre (email)"
  const match3 = description.match(/Pago de (.+?)(?:\s*\([^)]+\))?$/)
  if (match3) {
    result.name = match3[1].trim()
    return result
  }

  // Formato 4: Buscar email directo en la descripción
  const emailMatch = description.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/)
  if (emailMatch) {
    result.email = emailMatch[1]
  }

  // Formato 5: Buscar nombre después de un guión
  const dashMatch = description.match(/ - ([^(]+?)(?:\s*\(|$)/)
  if (dashMatch) {
    result.name = dashMatch[1].trim()
  }

  // Formato 6: Buscar teléfono en la descripción
  const phoneMatch = description.match(/(?:tel|tf|telefono|phone|tlf)[:\s]*([+\d][\d\s\-\(\)]{7,})/i)
  if (phoneMatch) {
    result.phone = phoneMatch[1].trim()
  }

  return result
}

// Función para buscar cliente por email, nombre o teléfono
async function findMatchingClient(email?: string, name?: string, phone?: string) {
  const matchLog: string[] = []

  // 1. Intentar por email exacto
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
      matchLog.push(`✅ Match por email: ${email}`)
      return { client, matchMethod: 'email', matchLog }
    }
    matchLog.push(`❌ No match por email: ${email}`)
  }

  // 2. Intentar por teléfono (normalizado sin prefijos)
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

        // Uno contiene al otro (por si hay diferencias de dígitos)
        if (clientPhoneNormalized.includes(normalizedPhone) || normalizedPhone.includes(clientPhoneNormalized)) {
          matchLog.push(`✅ Match por teléfono parcial: ${phone} ≈ ${client.phone}`)
          return { client, matchMethod: 'phone', matchLog }
        }
      }
    }
    matchLog.push(`❌ No match por teléfono: ${phone}`)
  }

  // 3. Intentar por nombre similar
  if (name) {
    const nameLower = name.toLowerCase().trim()
    const clients = await prisma.client.findMany()

    // Exact match
    for (const client of clients) {
      if (client.name.toLowerCase().trim() === nameLower) {
        matchLog.push(`✅ Match por nombre exacto: ${name}`)
        return { client, matchMethod: 'name_exact', matchLog }
      }
    }

    // Partial match
    for (const client of clients) {
      const clientNameLower = client.name.toLowerCase().trim()
      if (nameLower.includes(clientNameLower) || clientNameLower.includes(nameLower)) {
        matchLog.push(`✅ Match por nombre parcial: ${name} ≈ ${client.name}`)
        return { client, matchMethod: 'name_partial', matchLog }
      }
    }

    // Match por palabras (al menos 2 palabras de +2 caracteres)
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2)
    for (const client of clients) {
      const clientWords = client.name.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2)
      const matchingWords = nameWords.filter(w => clientWords.includes(w))

      if (matchingWords.length >= 2) {
        matchLog.push(`✅ Match por palabras (${matchingWords.join(', ')}): ${name} ≈ ${client.name}`)
        return { client, matchMethod: 'name_words', matchLog }
      }
    }

    // Match por empresa
    for (const client of clients) {
      const companyLower = client.company.toLowerCase().trim()
      if (companyLower && (nameLower.includes(companyLower) || companyLower.includes(nameLower))) {
        matchLog.push(`✅ Match por empresa: ${name} ≈ ${client.company}`)
        return { client, matchMethod: 'company', matchLog }
      }
    }

    matchLog.push(`❌ No match por nombre: ${name}`)
  }

  return { client: null, matchMethod: 'none', matchLog }
}

// POST - Resincronizar pagos con clientes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentId, forceAll, stripePhone, stripeEmail, stripeName } = body

    // Si se proporciona información de Stripe directamente
    if (stripePhone || stripeEmail || stripeName) {
      console.log(`\n=== RESYNC CON DATOS STRIPE ===`)
      console.log(`Email: ${stripeEmail}`)
      console.log(`Teléfono: ${stripePhone}`)
      console.log(`Nombre: ${stripeName}`)

      const { client, matchMethod, matchLog } = await findMatchingClient(stripeEmail, stripeName, stripePhone)

      matchLog.forEach(log => console.log(`  ${log}`))

      if (client) {
        return NextResponse.json({
          success: true,
          message: `Cliente encontrado: ${client.name}`,
          client: {
            id: client.id,
            name: client.name,
            company: client.company,
            email: client.email,
            phone: client.phone,
          },
          matchMethod,
          matchLog,
        })
      }

      return NextResponse.json({
        success: false,
        message: 'No se encontró cliente coincidente',
        matchLog,
      })
    }

    // Si se proporciona un paymentId específico
    if (paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { client: true },
      })

      if (!payment) {
        return NextResponse.json(
          { error: 'Pago no encontrado' },
          { status: 404 }
        )
      }

      const { name, email, phone } = extractPaymentInfo(payment.description || '')

      console.log(`\n=== RESYNC PAGO ${paymentId} ===`)
      console.log(`Descripción: ${payment.description}`)
      console.log(`Nombre extraído: ${name}`)
      console.log(`Email extraído: ${email}`)
      console.log(`Teléfono extraído: ${phone}`)
      console.log(`Cliente actual: ${payment.client?.name} (${payment.client?.email})`)

      const { client, matchMethod, matchLog } = await findMatchingClient(email, name, phone)

      matchLog.forEach(log => console.log(`  ${log}`))

      if (client && payment.clientId !== client.id) {
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            clientId: client.id,
            description: `Pago de ${client.name}`,
          },
          include: {
            client: {
              select: { id: true, name: true, company: true, email: true },
            },
          },
        })

        console.log(`✅ Pago reasignado a: ${client.name}\n`)

        return NextResponse.json({
          success: true,
          message: `Pago asignado a ${client.name}`,
          payment: updatedPayment,
          matchMethod,
          matchLog,
        })
      }

      return NextResponse.json({
        success: false,
        message: client
          ? 'El pago ya está asignado al cliente correcto'
          : 'No se encontró cliente coincidente',
        currentClient: payment.client,
        extractedInfo: { name, email, phone },
        matchLog,
      })
    }

    // Resincronizar múltiples pagos
    const whereClause = forceAll ? {} : {
      OR: [
        { description: { contains: 'sin asignar' } },
        { description: { contains: 'importado de Stripe' } },
        { description: { contains: 'Pago sin asignar' } },
        { entityId: 'stripe-unassigned' },
        { client: { email: 'unassigned@system.local' } },
      ],
    }

    const paymentsToSync = await prisma.payment.findMany({
      where: whereClause,
      include: { client: true },
    })

    console.log(`\n=== RESYNC MASIVO ===`)
    console.log(`forceAll: ${forceAll}`)
    console.log(`Pagos a verificar: ${paymentsToSync.length}`)

    const results = {
      total: paymentsToSync.length,
      matched: 0,
      unchanged: 0,
      unmatched: 0,
      details: [] as any[],
    }

    for (const payment of paymentsToSync) {
      const { name, email, phone } = extractPaymentInfo(payment.description || '')
      const { client, matchMethod, matchLog } = await findMatchingClient(email, name, phone)

      console.log(`\nPago ${payment.id}:`)
      console.log(`  Descripción: ${payment.description}`)
      console.log(`  Nombre: ${name}, Email: ${email}, Tel: ${phone}`)
      console.log(`  Cliente actual: ${payment.client?.name}`)
      matchLog.forEach(log => console.log(`  ${log}`))

      if (client && payment.clientId !== client.id) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            clientId: client.id,
            description: `Pago de ${client.name}`,
          },
        })

        console.log(`  ✅ REASIGNADO a: ${client.name}`)
        results.matched++
        results.details.push({
          paymentId: payment.id,
          amount: Number(payment.amount),
          description: payment.description,
          extractedInfo: { name, email, phone },
          previousClient: payment.client?.name,
          matchedTo: client.name,
          matchMethod,
        })
      } else if (client) {
        console.log(`  ⏸️ Sin cambios (ya correcto)`)
        results.unchanged++
      } else {
        console.log(`  ❌ Sin match`)
        results.unmatched++
        results.details.push({
          paymentId: payment.id,
          amount: Number(payment.amount),
          description: payment.description,
          extractedInfo: { name, email, phone },
          matchedTo: null,
          matchLog,
        })
      }
    }

    console.log(`\n=== RESULTADOS ===`)
    console.log(`Reasignados: ${results.matched}`)
    console.log(`Sin cambios: ${results.unchanged}`)
    console.log(`Sin match: ${results.unmatched}\n`)

    return NextResponse.json({
      success: true,
      message: `Resincronización completada: ${results.matched} reasignados, ${results.unchanged} sin cambios, ${results.unmatched} sin coincidencia`,
      results,
    })
  } catch (error) {
    console.error('Error resyncing payments:', error)
    return NextResponse.json(
      { error: 'Error al resincronizar pagos' },
      { status: 500 }
    )
  }
}

// GET - Ver pagos sin asignar
export async function GET(req: NextRequest) {
  try {
    const unassignedPayments = await prisma.payment.findMany({
      where: {
        OR: [
          { description: { contains: 'sin asignar' } },
          { description: { contains: 'importado de Stripe' } },
          { entityId: 'stripe-unassigned' },
          { client: { email: 'unassigned@system.local' } },
        ],
      },
      include: {
        client: {
          select: { id: true, name: true, company: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const clients = await prisma.client.findMany({
      where: { NOT: { email: 'unassigned@system.local' } },
      select: { id: true, name: true, company: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      unassignedPayments,
      clients,
    })
  } catch (error) {
    console.error('Error fetching unassigned payments:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos sin asignar' },
      { status: 500 }
    )
  }
}
