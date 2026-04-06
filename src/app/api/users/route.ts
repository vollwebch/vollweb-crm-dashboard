import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

// Default permissions for new users (all allowed)
const DEFAULT_PERMISSIONS = {
  clients: true,
  services: true,
  hosting: true,
  domains: true,
  payments: true,
  invoices: true,
  alarms: true,
  reminders: true,
  trash: true,
  audit: true,
  stats: true,
  config: true
}

// GET /api/users - Listar empleados de la empresa
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const users = await db.user.findMany({
      where: { companyId: currentUser.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Ensure all users have permissions object
    const usersWithPermissions = users.map(user => ({
      ...user,
      permissions: user.permissions || DEFAULT_PERMISSIONS
    }))

    return NextResponse.json({
      success: true,
      users: usersWithPermissions
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
  }
}

// DELETE /api/users - Eliminar empleado
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar empleados' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Cannot delete yourself
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Verify user belongs to same company
    const userToDelete = await db.user.findFirst({
      where: { 
        id: userId,
        companyId: currentUser.companyId 
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Delete user
    await db.user.delete({
      where: { id: userId }
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'USER',
      entityId: userId,
      entityName: userToDelete.name,
      newValue: JSON.stringify({ name: userToDelete.name, email: userToDelete.email, role: userToDelete.role }),
      description: `Empleado "${userToDelete.name}" eliminado`,
      companyId: currentUser.companyId
    })

    return NextResponse.json({
      success: true,
      message: 'Empleado eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar empleado' }, { status: 500 })
  }
}

// PATCH /api/users - Actualizar empleado (nombre, rol, permisos)
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo administradores pueden actualizar empleados' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, role, permissions } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Verify user belongs to same company
    const userToUpdate = await db.user.findFirst({
      where: { 
        id,
        companyId: currentUser.companyId 
      }
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Cannot change your own role
    if (id === currentUser.id && role && role !== currentUser.role) {
      return NextResponse.json({ error: 'No puedes cambiar tu propio rol' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (permissions) updateData.permissions = permissions

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        permissions: true,
        updatedAt: true
      }
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: id,
      entityName: userToUpdate.name,
      oldValue: JSON.stringify({ name: userToUpdate.name, role: userToUpdate.role, permissions: userToUpdate.permissions }),
      newValue: JSON.stringify(updateData),
      description: `Empleado "${userToUpdate.name}" actualizado`,
      companyId: currentUser.companyId
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar empleado' }, { status: 500 })
  }
}
