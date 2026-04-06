import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

// GET /api/company - Obtener información de la empresa
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const company = await db.company.findUnique({
      where: { id: currentUser.companyId },
      include: {
        _count: {
          select: { users: true, clients: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        usersCount: company._count.users,
        clientsCount: company._count.clients
      }
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Error al obtener empresa' }, { status: 500 })
  }
}

// PATCH /api/company - Actualizar nombre de la empresa
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Only admins can update company name
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden actualizar la empresa' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 })
    }

    const oldCompany = await db.company.findUnique({
      where: { id: currentUser.companyId }
    })

    const company = await db.company.update({
      where: { id: currentUser.companyId },
      data: { name: name.trim() }
    })

    // Also update system config
    await db.systemConfig.updateMany({
      where: { companyId: currentUser.companyId },
      data: { companyName: name.trim() }
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'SYSTEM_CONFIG',
      entityId: company.id,
      entityName: oldCompany?.name || 'Empresa',
      oldValue: JSON.stringify({ name: oldCompany?.name }),
      newValue: JSON.stringify({ name: company.name }),
      description: `Nombre de empresa actualizado de "${oldCompany?.name}" a "${company.name}"`,
      companyId: currentUser.companyId
    })

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        updatedAt: company.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 })
  }
}
