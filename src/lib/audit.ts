import { db } from './db'
import { headers } from 'next/headers'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE'
export type EntityType = 'CLIENT' | 'SERVICE' | 'DOMAIN' | 'HOSTING' | 'ALARM' | 'REMINDER' | 'MONTHLY_STATS' | 'USER' | 'SYSTEM_CONFIG' | 'NOTIFICATION_CONFIG' | 'TRASH' | 'INVOICE' | 'PAYMENT'

interface AuditLogData {
  userId: string
  action: AuditAction
  entityType: EntityType
  entityId: string
  entityName: string
  oldValue?: string
  newValue?: string
  description: string
  companyId: string // Required for multi-tenant
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        description: data.description,
        companyId: data.companyId,
        ipAddress,
        userAgent,
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
  }
}

// Helper function to format entity changes
export function formatChanges(oldData: any, newData: any): { oldValue: string; newValue: string } {
  const changes: { old: any; new: any } = { old: {}, new: {} }
  
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changes.old[key] = oldData[key]
      changes.new[key] = newData[key]
    }
  }
  
  return {
    oldValue: JSON.stringify(changes.old),
    newValue: JSON.stringify(changes.new)
  }
}

// Get action label in Spanish
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE: 'Creación',
    UPDATE: 'Actualización',
    DELETE: 'Eliminación',
    RESTORE: 'Restauración',
    LOGIN: 'Inicio de sesión',
    LOGOUT: 'Cierre de sesión',
    PASSWORD_CHANGE: 'Cambio de contraseña'
  }
  return labels[action] || action
}

// Get entity type label in Spanish
export function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    CLIENT: 'Cliente',
    SERVICE: 'Servicio',
    DOMAIN: 'Dominio',
    HOSTING: 'Hosting',
    ALARM: 'Alarma',
    REMINDER: 'Recordatorio',
    MONTHLY_STATS: 'Estadísticas mensuales',
    USER: 'Usuario',
    SYSTEM_CONFIG: 'Configuración del sistema',
    NOTIFICATION_CONFIG: 'Configuración de notificaciones',
    TRASH: 'Papelera',
    INVOICE: 'Factura',
    PAYMENT: 'Pago'
  }
  return labels[entityType] || entityType
}
