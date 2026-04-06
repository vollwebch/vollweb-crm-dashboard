-- Add Webhooks tables for external integrations

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,
    events TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT webhooks_company_fkey FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "webhookId" TEXT NOT NULL,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    error TEXT,
    duration INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT webhook_logs_webhook_fkey FOREIGN KEY ("webhookId") REFERENCES webhooks(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS webhooks_companyId_idx ON webhooks("companyId");
CREATE INDEX IF NOT EXISTS webhooks_active_idx ON webhooks(active);
CREATE INDEX IF NOT EXISTS webhook_logs_webhookId_idx ON webhook_logs("webhookId");
CREATE INDEX IF NOT EXISTS webhook_logs_createdAt_idx ON webhook_logs("createdAt");
CREATE INDEX IF NOT EXISTS webhook_logs_success_idx ON webhook_logs(success);

-- Add comment to tables
COMMENT ON TABLE webhooks IS 'Webhook endpoints for external integrations';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook deliveries';
