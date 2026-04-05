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

-- Create indexes
CREATE INDEX IF NOT EXISTS audit_logs_userId_idx ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS audit_logs_entityType_idx ON audit_logs("entityType");
CREATE INDEX IF NOT EXISTS audit_logs_entityId_idx ON audit_logs("entityId");
CREATE INDEX IF NOT EXISTS audit_logs_createdAt_idx ON audit_logs("createdAt");

-- Add relation to users table (auditLogs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auditLogs TEXT[];
