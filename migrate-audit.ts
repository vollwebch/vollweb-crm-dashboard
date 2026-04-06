import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE')),
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

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_entityType_idx ON audit_logs("entityType");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_entityId_idx ON audit_logs("entityId");`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_createdAt_idx ON audit_logs("createdAt");`)
    console.log('✓ Índices creados')

    await prisma.$disconnect()
    console.log('✓ Migración completada')
  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

migrate()
