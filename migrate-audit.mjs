import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://postgres:260415Jc.chocolate@db.mgdrmsgpumouuuzzssxr.supabase.co:5432/postgres'
})

async function migrate() {
  try {
    await pool.query(`
      -- Create audit_logs table
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

    await pool.query(`CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS audit_logs_entityType_idx ON audit_logs("entityType");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS audit_logs_entityId_idx ON audit_logs("entityId");`)
    await pool.query(`CREATE INDEX IF NOT EXISTS audit_logs_createdAt_idx ON audit_logs("createdAt");`)
    console.log('✓ Índices creados')

    await pool.end()
    console.log('✓ Migración completada')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

migrate()
