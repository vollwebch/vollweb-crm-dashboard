-- ============================================
-- MULTI-TENANT MIGRATION FOR SUPABASE
-- ============================================
-- This migration adds multi-tenant support with Row Level Security (RLS)
-- Execute this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create companies table
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Add companyId to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Create default company for existing data migration
INSERT INTO companies (id, name, "createdAt", "updatedAt")
SELECT 'cm_default_company', 'Default Company', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 'cm_default_company');

-- Assign existing users to default company
UPDATE users SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;

-- Make companyId required
ALTER TABLE users ALTER COLUMN "companyId" SET NOT NULL;

-- Add foreign key
ALTER TABLE users 
ADD CONSTRAINT fk_users_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 3: Add companyId to clients table
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE clients SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE clients ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE clients 
ADD CONSTRAINT fk_clients_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- Drop old unique constraint on email if exists, add composite unique
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;
ALTER TABLE clients ADD CONSTRAINT clients_company_email_unique UNIQUE ("companyId", email);

-- ============================================
-- STEP 4: Add companyId to system_config
-- ============================================
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE system_config SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
-- Make unique per company
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_pkey;
ALTER TABLE system_config ADD CONSTRAINT system_config_company_unique UNIQUE ("companyId");
ALTER TABLE system_config 
ADD CONSTRAINT fk_system_config_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 5: Add companyId to notification_config
-- ============================================
ALTER TABLE notification_config ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE notification_config SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE notification_config DROP CONSTRAINT IF EXISTS notification_config_pkey;
ALTER TABLE notification_config ADD CONSTRAINT notification_config_company_unique UNIQUE ("companyId");
ALTER TABLE notification_config 
ADD CONSTRAINT fk_notification_config_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 6: Add companyId to trash_config
-- ============================================
ALTER TABLE trash_config ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE trash_config SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE trash_config DROP CONSTRAINT IF EXISTS trash_config_pkey;
ALTER TABLE trash_config ADD CONSTRAINT trash_config_company_unique UNIQUE ("companyId");
ALTER TABLE trash_config 
ADD CONSTRAINT fk_trash_config_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 7: Add companyId to monthly_stats
-- ============================================
ALTER TABLE monthly_stats ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE monthly_stats SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE monthly_stats ALTER COLUMN "companyId" SET NOT NULL;
-- Drop old unique constraint, add composite
ALTER TABLE monthly_stats DROP CONSTRAINT IF EXISTS monthly_stats_year_month_key;
ALTER TABLE monthly_stats ADD CONSTRAINT monthly_stats_company_year_month_unique UNIQUE ("companyId", year, month);
ALTER TABLE monthly_stats 
ADD CONSTRAINT fk_monthly_stats_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 8: Add companyId to audit_logs
-- ============================================
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE audit_logs SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE audit_logs ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 9: Add companyId to invoice_counter
-- ============================================
ALTER TABLE invoice_counter ADD COLUMN IF NOT EXISTS "companyId" TEXT;
UPDATE invoice_counter SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
ALTER TABLE invoice_counter ALTER COLUMN "companyId" SET NOT NULL;
-- Drop old unique constraint, add composite
ALTER TABLE invoice_counter DROP CONSTRAINT IF EXISTS invoice_counter_year_key;
ALTER TABLE invoice_counter ADD CONSTRAINT invoice_counter_company_year_unique UNIQUE ("companyId", year);
ALTER TABLE invoice_counter 
ADD CONSTRAINT fk_invoice_counter_company 
FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- STEP 10: Create indexes for companyId
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_company ON users("companyId");
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients("companyId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs("companyId");
CREATE INDEX IF NOT EXISTS idx_monthly_stats_company ON monthly_stats("companyId");
CREATE INDEX IF NOT EXISTS idx_invoice_counter_company ON invoice_counter("companyId");

-- ============================================
-- STEP 11: Enable Row Level Security
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 12: Create RLS Policies
-- ============================================

-- Helper function to get company_id from JWT token
CREATE OR REPLACE FUNCTION auth.jwt_company_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'companyId',
    current_setting('request.jwt.claims', true)::json->>'company_id'
  );
$$ LANGUAGE SQL STABLE;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = auth.jwt_company_id());

CREATE POLICY "No direct insert" ON companies
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct update" ON companies
  FOR UPDATE USING (false);

CREATE POLICY "No direct delete" ON companies
  FOR DELETE USING (false);

-- Users: Users can only see users in their company
CREATE POLICY "Users can view company users" ON users
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid()::text AND "companyId" = auth.jwt_company_id());

CREATE POLICY "Admins can insert company users" ON users
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Admins can delete company users" ON users
  FOR DELETE USING ("companyId" = auth.jwt_company_id());

-- Clients: Full access within company
CREATE POLICY "Users can view company clients" ON clients
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company clients" ON clients
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company clients" ON clients
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can delete company clients" ON clients
  FOR DELETE USING ("companyId" = auth.jwt_company_id());

-- Client Services: Access through client's company
CREATE POLICY "Users can view company services" ON client_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_services."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company services" ON client_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_services."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company services" ON client_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_services."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company services" ON client_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_services."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Hosting: Access through client's company
CREATE POLICY "Users can view company hosting" ON hosting
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = hosting."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company hosting" ON hosting
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = hosting."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company hosting" ON hosting
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = hosting."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company hosting" ON hosting
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = hosting."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Domains: Access through client's company
CREATE POLICY "Users can view company domains" ON domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = domains."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company domains" ON domains
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = domains."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company domains" ON domains
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = domains."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company domains" ON domains
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = domains."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Client Alarms: Access through client's company
CREATE POLICY "Users can view company alarms" ON client_alarms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_alarms."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company alarms" ON client_alarms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_alarms."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company alarms" ON client_alarms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_alarms."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company alarms" ON client_alarms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = client_alarms."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Activity Logs: Access through client's company
CREATE POLICY "Users can view company activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = activity_logs."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = activity_logs."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Reminders: Access through client's company
CREATE POLICY "Users can view company reminders" ON reminders
  FOR SELECT USING (
    "clientId" IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = reminders."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company reminders" ON reminders
  FOR INSERT WITH CHECK (
    "clientId" IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = reminders."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company reminders" ON reminders
  FOR UPDATE USING (
    "clientId" IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = reminders."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company reminders" ON reminders
  FOR DELETE USING (
    "clientId" IS NULL OR EXISTS (
      SELECT 1 FROM clients WHERE clients.id = reminders."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Payments: Access through client's company
CREATE POLICY "Users can view company payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payments."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payments."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payments."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company payments" ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = payments."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Invoices: Access through client's company
CREATE POLICY "Users can view company invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = invoices."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company invoices" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = invoices."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company invoices" ON invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = invoices."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company invoices" ON invoices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients WHERE clients.id = invoices."clientId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Invoice Items: Access through invoice's client's company
CREATE POLICY "Users can view company invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      JOIN clients ON clients.id = invoices."clientId"
      WHERE invoices.id = invoice_items."invoiceId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can insert company invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      JOIN clients ON clients.id = invoices."clientId"
      WHERE invoices.id = invoice_items."invoiceId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can update company invoice items" ON invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices 
      JOIN clients ON clients.id = invoices."clientId"
      WHERE invoices.id = invoice_items."invoiceId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

CREATE POLICY "Users can delete company invoice items" ON invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM invoices 
      JOIN clients ON clients.id = invoices."clientId"
      WHERE invoices.id = invoice_items."invoiceId" 
      AND clients."companyId" = auth.jwt_company_id()
    )
  );

-- Config tables: Only company's own config
CREATE POLICY "Users can view company notification config" ON notification_config
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company notification config" ON notification_config
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company notification config" ON notification_config
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can view company system config" ON system_config
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company system config" ON system_config
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company system config" ON system_config
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can view company trash config" ON trash_config
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company trash config" ON trash_config
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company trash config" ON trash_config
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

-- Monthly Stats: Only company's own stats
CREATE POLICY "Users can view company monthly stats" ON monthly_stats
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company monthly stats" ON monthly_stats
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company monthly stats" ON monthly_stats
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can delete company monthly stats" ON monthly_stats
  FOR DELETE USING ("companyId" = auth.jwt_company_id());

-- Invoice Counter: Only company's own counter
CREATE POLICY "Users can view company invoice counter" ON invoice_counter
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company invoice counter" ON invoice_counter
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can update company invoice counter" ON invoice_counter
  FOR UPDATE USING ("companyId" = auth.jwt_company_id());

-- Audit Logs: Only company's own logs
CREATE POLICY "Users can view company audit logs" ON audit_logs
  FOR SELECT USING ("companyId" = auth.jwt_company_id());

CREATE POLICY "Users can insert company audit logs" ON audit_logs
  FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id());

-- ============================================
-- COMPLETE
-- ============================================
-- After running this migration:
-- 1. Run: npx prisma generate
-- 2. Update auth.ts to include companyId in JWT
-- 3. Update all API routes to filter by companyId
-- 4. Update register page to ask for company name
