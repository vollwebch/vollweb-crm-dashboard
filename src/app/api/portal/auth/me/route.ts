import { NextResponse } from 'next/server'
import { getCurrentClientUserSafe } from '@/lib/client-auth'

export async function GET() {
  try {
    const clientUser = await getCurrentClientUserSafe()
    
    if (!clientUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: clientUser })
  } catch (error) {
    console.error('Get client user error:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}
