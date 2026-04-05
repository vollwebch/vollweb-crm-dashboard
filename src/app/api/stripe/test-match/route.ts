import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint para probar el sistema de matching
export async function POST(req: NextRequest) {
  const results: string[] = []
  
  try {
    const { email, phone, name } = await req.json()
    
    results.push(`=== PROBANDO MATCHING ===`)
    results.push(`Email: ${email || 'No proporcionado'}`)
    results.push(`Phone: ${phone || 'No proporcionado'}`)
    results.push(`Name: ${name || 'No proporcionado'}`)
    results.push('')
    
    // 1. Por email
    if (email) {
      const client = await prisma.client.findFirst({
        where: { email: email.toLowerCase() },
      })
      if (client) {
        results.push(`✅ MATCH por email: ${client.name} (${client.company})`)
        return NextResponse.json({ match: true, method: 'email', client, results })
      }
      results.push(`❌ No match por email`)
    }
    
    // 2. Por teléfono
    if (phone) {
      const normalizedPhone = phone.replace(/[\s\-\(\)\+]/g, '')
      const clients = await prisma.client.findMany({
        where: { phone: { not: null } },
      })
      
      for (const client of clients) {
        if (client.phone) {
          const clientPhone = client.phone.replace(/[\s\-\(\)\+]/g, '')
          if (clientPhone === normalizedPhone || 
              clientPhone.includes(normalizedPhone) || 
              normalizedPhone.includes(clientPhone)) {
            results.push(`✅ MATCH por teléfono: ${client.name} (${client.company})`)
            return NextResponse.json({ match: true, method: 'phone', client, results })
          }
        }
      }
      results.push(`❌ No match por teléfono`)
    }
    
    // 3. Por nombre
    if (name) {
      const nameLower = name.toLowerCase().trim()
      const clients = await prisma.client.findMany()
      
      for (const client of clients) {
        const clientNameLower = client.name.toLowerCase().trim()
        
        if (clientNameLower === nameLower) {
          results.push(`✅ MATCH por nombre exacto: ${client.name} (${client.company})`)
          return NextResponse.json({ match: true, method: 'name_exact', client, results })
        }
        
        if (nameLower.includes(clientNameLower) || clientNameLower.includes(nameLower)) {
          results.push(`✅ MATCH por nombre parcial: ${client.name} (${client.company})`)
          return NextResponse.json({ match: true, method: 'name_partial', client, results })
        }
        
        const nameWords = nameLower.split(/\s+/)
        const clientWords = clientNameLower.split(/\s+/)
        const matchingWords = nameWords.filter(w => clientWords.includes(w) && w.length > 2)
        
        if (matchingWords.length >= 2) {
          results.push(`✅ MATCH por nombre (palabras): ${client.name} (${client.company})`)
          return NextResponse.json({ match: true, method: 'name_words', client, results })
        }
      }
      results.push(`❌ No match por nombre`)
    }
    
    results.push(`❌ NO SE ENCONTRÓ CLIENTE`)
    return NextResponse.json({ match: false, results })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message, results }, { status: 500 })
  }
}
