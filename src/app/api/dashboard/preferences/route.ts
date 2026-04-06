import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

// Default widget configuration
const DEFAULT_LAYOUT = [
  { id: 'stats-overview', type: 'stats', x: 0, y: 0, w: 4, h: 1, visible: true },
  { id: 'revenue-chart', type: 'chart', x: 0, y: 1, w: 2, h: 2, visible: true },
  { id: 'pending-payments', type: 'list', x: 2, y: 1, w: 2, h: 2, visible: true },
  { id: 'upcoming-renewals', type: 'list', x: 0, y: 3, w: 2, h: 2, visible: true },
  { id: 'recent-clients', type: 'list', x: 2, y: 3, w: 2, h: 2, visible: true },
  { id: 'today-events', type: 'events', x: 0, y: 5, w: 4, h: 1, visible: true },
]

// GET - Fetch user dashboard preferences
export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let preferences = await prisma.userDashboardPreference.findUnique({
      where: { userId }
    })

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userDashboardPreference.create({
        data: {
          userId,
          layout: DEFAULT_LAYOUT,
          theme: 'default'
        }
      })
    }

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('Error fetching dashboard preferences:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update user dashboard preferences
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { layout, theme } = body

    const preferences = await prisma.userDashboardPreference.upsert({
      where: { userId },
      update: {
        layout: layout || undefined,
        theme: theme || undefined,
      },
      create: {
        userId,
        layout: layout || DEFAULT_LAYOUT,
        theme: theme || 'default'
      }
    })

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('Error updating dashboard preferences:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Reset to default layout
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const preferences = await prisma.userDashboardPreference.upsert({
      where: { userId },
      update: {
        layout: DEFAULT_LAYOUT,
        theme: 'default'
      },
      create: {
        userId,
        layout: DEFAULT_LAYOUT,
        theme: 'default'
      }
    })

    return NextResponse.json({ message: 'Dashboard reseteado', preferences })
  } catch (error: any) {
    console.error('Error resetting dashboard:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
