import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getCompanyId } from '@/lib/auth'

// GET - Get all calendar notes for a date range
export async function GET(request: NextRequest) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { companyId }
    
    if (from && to) {
      where.date = {
        gte: new Date(from),
        lte: new Date(to)
      }
    }

    const notes = await prisma.calendarNote.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching calendar notes:', error)
    return NextResponse.json({ error: 'Error al obtener notas' }, { status: 500 })
  }
}

// POST - Create a new calendar note
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    
    const note = await prisma.calendarNote.create({
      data: {
        date: new Date(data.date),
        title: data.title,
        description: data.description || null,
        color: data.color || 'brand',
        companyId: currentUser.companyId
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating calendar note:', error)
    return NextResponse.json({ error: 'Error al crear nota' }, { status: 500 })
  }
}
