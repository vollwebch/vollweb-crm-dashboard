import { NextResponse } from 'next/server'
import { getCurrentUserSafe } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUserSafe()
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}
