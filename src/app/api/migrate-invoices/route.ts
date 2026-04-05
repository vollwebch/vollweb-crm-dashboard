import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/migrate-invoices - Ejecutar migraciones de facturas
export async function POST() {
  const results: any = {
    timestamp: new Date().toISOString(),
    migrations: []
  }

  try {
    // 1. Add taxId and postalCode to clients table
    try {
      await db.$executeRawUnsafe(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS "taxId" TEXT`)
      await db.$executeRawUnsafe(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS "postalCode" TEXT`)
      results.migrations.push({ name: 'Add client fields', status: 'OK' })
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        results.migrations.push({ name: 'Add client fields', status: 'ERROR', error: error.message })
      } else {
        results.migrations.push({ name: 'Add client fields', status: 'SKIPPED (exists)' })
      }
    }

    // 2. Add invoice fields to system_config
    const systemConfigFields = [
      `"companyTaxId" TEXT`,
      `"companyAddress" TEXT`,
      `"companyCity" TEXT`,
      `"companyPostalCode" TEXT`,
      `"companyCountry" TEXT DEFAULT 'España'`,
      `"companyPhone" TEXT`,
      `"companyEmail" TEXT`,
      `"companyWebsite" TEXT`,
      `"invoicePrefix" TEXT DEFAULT 'FAC'`,
      `"invoiceStartingNumber" INTEGER DEFAULT 1`,
      `"invoiceDefaultTaxRate" DECIMAL(5,2) DEFAULT 21.00`,
      `"invoiceDefaultDueDays" INTEGER DEFAULT 30`,
      `"invoiceTerms" TEXT`,
      `"invoiceNotes" TEXT`,
      `"smtpHost" TEXT`,
      `"smtpPort" INTEGER`,
      `"smtpUser" TEXT`,
      `"smtpPassword" TEXT`,
      `"emailFrom" TEXT`,
      `"emailFromName" TEXT`
    ]

    for (const field of systemConfigFields) {
      try {
        await db.$executeRawUnsafe(`ALTER TABLE system_config ADD COLUMN IF NOT EXISTS ${field}`)
      } catch (e) {
        // Ignore if exists
      }
    }
    results.migrations.push({ name: 'Add system_config fields', status: 'OK' })

    // 3. Create InvoiceStatus enum
    try {
      await db.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$
      `)
      results.migrations.push({ name: 'Create InvoiceStatus enum', status: 'OK' })
    } catch (error: any) {
      results.migrations.push({ name: 'Create InvoiceStatus enum', status: 'SKIPPED' })
    }

    // 4. Create invoices table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          number TEXT UNIQUE NOT NULL,
          "clientId" TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          "clientName" TEXT NOT NULL,
          "clientEmail" TEXT,
          "clientAddress" TEXT,
          "clientTaxId" TEXT,
          "issueDate" TIMESTAMP(3) DEFAULT NOW(),
          "dueDate" TIMESTAMP(3),
          subtotal DECIMAL(12,2) DEFAULT 0.00,
          "taxRate" DECIMAL(5,2) DEFAULT 21.00,
          "taxAmount" DECIMAL(12,2) DEFAULT 0.00,
          total DECIMAL(12,2) DEFAULT 0.00,
          status "InvoiceStatus" DEFAULT 'DRAFT',
          "paidAt" TIMESTAMP(3),
          notes TEXT,
          terms TEXT,
          "emailSent" BOOLEAN DEFAULT FALSE,
          "emailSentAt" TIMESTAMP(3),
          "stripePaymentIntentId" TEXT,
          "stripeSessionId" TEXT,
          "createdAt" TIMESTAMP(3) DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
          "deletedAt" TIMESTAMP(3)
        )
      `)
      results.migrations.push({ name: 'Create invoices table', status: 'OK' })
    } catch (error: any) {
      results.migrations.push({ name: 'Create invoices table', status: 'ERROR', error: error.message })
    }

    // 5. Create invoice_items table
    try {
      await db.$executeRawUnsafe(`
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
        )
      `)
      results.migrations.push({ name: 'Create invoice_items table', status: 'OK' })
    } catch (error: any) {
      results.migrations.push({ name: 'Create invoice_items table', status: 'ERROR', error: error.message })
    }

    // 6. Create invoice_counter table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoice_counter (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          year INTEGER UNIQUE NOT NULL,
          "lastNumber" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP(3) DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) DEFAULT NOW()
        )
      `)
      results.migrations.push({ name: 'Create invoice_counter table', status: 'OK' })
    } catch (error: any) {
      results.migrations.push({ name: 'Create invoice_counter table', status: 'ERROR', error: error.message })
    }

    // 7. Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_invoices_clientId ON invoices("clientId")`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_issueDate ON invoices("issueDate")`,
      `CREATE INDEX IF NOT EXISTS idx_invoice_items_invoiceId ON invoice_items("invoiceId")`
    ]

    for (const idx of indexes) {
      try {
        await db.$executeRawUnsafe(idx)
      } catch (e) {
        // Ignore
      }
    }
    results.migrations.push({ name: 'Create indexes', status: 'OK' })

    // 8. Create monthly_stats table if not exists
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS monthly_stats (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          "monthlyRevenue" DECIMAL(12,2) DEFAULT 0.00,
          "monthlyCosts" DECIMAL(12,2) DEFAULT 0.00,
          "monthlyProfit" DECIMAL(12,2) DEFAULT 0.00,
          "activeClients" INTEGER DEFAULT 0,
          "activeServices" INTEGER DEFAULT 0,
          "activeDomains" INTEGER DEFAULT 0,
          "activeHosting" INTEGER DEFAULT 0,
          "createdAt" TIMESTAMP(3) DEFAULT NOW(),
          "updatedAt" TIMESTAMP(3) DEFAULT NOW(),
          CONSTRAINT monthly_stats_year_month_key UNIQUE (year, month)
        )
      `)
      results.migrations.push({ name: 'Create monthly_stats table', status: 'OK' })
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        results.migrations.push({ name: 'Create monthly_stats table', status: 'SKIPPED (exists)' })
      } else {
        results.migrations.push({ name: 'Create monthly_stats table', status: 'ERROR', error: error.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
