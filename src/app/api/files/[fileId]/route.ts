import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getCompanyId } from '@/lib/auth'

// GET - Download a file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { fileId } = await params

    const file = await prisma.clientFile.findUnique({
      where: { id: fileId },
      include: {
        client: {
          select: { companyId: true }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verify file belongs to user's company
    if (file.client.companyId !== companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Return file with proper headers
    return new NextResponse(file.data, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': file.size.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: 'Error al descargar archivo' }, { status: 500 })
  }
}

// DELETE - Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { fileId } = await params

    const file = await prisma.clientFile.findUnique({
      where: { id: fileId },
      include: {
        client: {
          select: { companyId: true }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verify file belongs to user's company
    if (file.client.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.clientFile.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Error al eliminar archivo' }, { status: 500 })
  }
}

// PATCH - Update file metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { fileId } = await params
    const data = await request.json()

    const file = await prisma.clientFile.findUnique({
      where: { id: fileId },
      include: {
        client: {
          select: { companyId: true }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verify file belongs to user's company
    if (file.client.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const updatedFile = await prisma.clientFile.update({
      where: { id: fileId },
      data: {
        description: data.description,
        category: data.category
      },
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
      }
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json({ error: 'Error al actualizar archivo' }, { status: 500 })
  }
}
