import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getCompanyId } from '@/lib/auth'

// GET - List all files for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify client belongs to company
    const client = await prisma.client.findFirst({
      where: { id, companyId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const files = await prisma.clientFile.findMany({
      where: { clientId: id },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        description: true,
        category: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Error al obtener archivos' }, { status: 500 })
  }
}

// POST - Upload a new file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify client belongs to company
    const client = await prisma.client.findFirst({
      where: { id, companyId: currentUser.companyId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string || null
    const category = formData.get('category') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 })
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB' }, { status: 400 })
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const name = `${timestamp}_${sanitizedName}`

    const clientFile = await prisma.clientFile.create({
      data: {
        clientId: id,
        name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data: buffer,
        description,
        category
      }
    })

    // Return without the data field
    return NextResponse.json({
      id: clientFile.id,
      name: clientFile.name,
      originalName: clientFile.originalName,
      mimeType: clientFile.mimeType,
      size: clientFile.size,
      description: clientFile.description,
      category: clientFile.category,
      createdAt: clientFile.createdAt,
      updatedAt: clientFile.updatedAt
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
