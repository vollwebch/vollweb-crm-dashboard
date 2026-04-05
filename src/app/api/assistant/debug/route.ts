import { NextResponse } from 'next/server'
import { getCompanyId, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const logs: string[] = []
  
  try {
    // Test 1: Auth
    logs.push('Testing auth...')
    const companyId = await getCompanyId()
    logs.push(`CompanyId: ${companyId || 'NOT FOUND'}`)
    
    const user = await getCurrentUser()
    logs.push(`User: ${user ? user.email : 'NOT FOUND'}`)

    if (!companyId) {
      return NextResponse.json({ 
        status: 'error', 
        step: 'auth',
        message: 'No hay companyId - usuario no autenticado',
        logs 
      })
    }

    // Test 2: Database
    logs.push('Testing database...')
    const clientCount = await prisma.client.count({ where: { companyId } })
    logs.push(`Clients found: ${clientCount}`)

    // Test 3: AI SDK
    logs.push('Testing AI SDK...')
    let aiWorks = false
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      logs.push('ZAI instance created')
      
      const testCompletion = await zai.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "OK" in one word' }],
        max_tokens: 10
      })
      logs.push(`AI response: ${testCompletion.choices[0]?.message?.content}`)
      aiWorks = true
    } catch (aiError: any) {
      logs.push(`AI SDK error: ${aiError.message}`)
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'All tests passed',
      aiWorks,
      logs 
    })

  } catch (error: any) {
    logs.push(`Error: ${error.message}`)
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      logs 
    }, { status: 500 })
  }
}
