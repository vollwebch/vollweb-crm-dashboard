-- ============================================
-- MIGRACIÓN: Sistema de Facturación
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Añadir campos nuevos a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

-- 2. Añadir campos de facturación a system_config
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyTaxId" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyCity" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyPostalCode" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyCountry" TEXT DEFAULT 'España';
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyPhone" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyEmail" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoicePrefix" TEXT DEFAULT 'FAC';
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoiceStartingNumber" INTEGER DEFAULT 1;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoiceDefaultTaxRate" DECIMAL(5,2) DEFAULT 21.00;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoiceDefaultDueDays" INTEGER DEFAULT 30;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoiceTerms" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "invoiceNotes" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "smtpHost" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "smtpPort" INTEGER;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "smtpUser" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "smtpPassword" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "emailFrom" TEXT;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS "emailFromName" TEXT;

-- 3. Crear enum InvoiceStatus
DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Crear tabla invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT UNIQUE NOT NULL,
    "clientId" TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Datos del cliente en el momento de la factura
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientAddress" TEXT,
    "clientTaxId" TEXT,
    
    -- Fechas
    "issueDate" TIMESTAMP(3) DEFAULT NOW(),
    "dueDate" TIMESTAMP(3),
    
    -- Totales
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    "taxRate" DECIMAL(5,2) DEFAULT 21.00,
    "taxAmount" DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) DEFAULT 0.00,
    
    -- Estado
    status "InvoiceStatus" DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    
    -- Notas
    notes TEXT,
    terms TEXT,
    
    -- Email
    "emailSent" BOOLEAN DEFAULT FALSE,
    "emailSentAt" TIMESTAMP(3),
    
    -- Stripe
    "stripePaymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    
    "createdAt" TIMESTAMP(3) DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
    "deletedAt" TIMESTAMP(3)
);

-- 5. Crear tabla invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceId" TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1.00,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) DEFAULT 21.00,
    total DECIMAL(12,2) NOT NULL,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- 6. Crear tabla invoice_counter
CREATE TABLE IF NOT EXISTS invoice_counter (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER UNIQUE NOT NULL,
    "lastNumber" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) DEFAULT NOW()
);

-- 7. Crear índices
CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON invoices("clientId");
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issueDate ON invoices("issueDate");
CREATE INDEX IF NOT EXISTS idx_invoices_deletedAt ON invoices("deletedAt");
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items("invoiceId");

-- 8. Crear triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_counter_updated_at ON invoice_counter;
CREATE TRIGGER update_invoice_counter_updated_at
    BEFORE UPDATE ON invoice_counter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Listo! Verificar que las tablas se crearon correctamente
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'invoice_counter');
