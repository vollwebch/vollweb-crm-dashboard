import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Create ENUM type first (drop if exists for clean slate)
    await db.$executeRawUnsafe(`DROP TYPE IF EXISTS "AuditAction" CASCADE;`)
    await db.$executeRawUnsafe(`
      CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE');
    `)
    console.log('✓ ENUM AuditAction creado')

    // Create audit_logs table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action "AuditAction" NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "entityName" TEXT NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,
        description TEXT NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ Tabla audit_logs creada')

    // Create indexes
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_entityType_idx ON audit_logs("entityType");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_entityId_idx ON audit_logs("entityId");`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_createdAt_idx ON audit_logs("createdAt");`)
    console.log('✓ Índices creados')

    return NextResponse.json({ success: true, message: 'Tabla audit_logs creada correctamente con ENUM' })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
