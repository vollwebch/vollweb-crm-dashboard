import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/debug - Diagnosticar problemas de base de datos
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: []
  }

  // 1. Test basic connection
  try {
    await db.$queryRaw`SELECT 1`
    results.checks.push({ name: 'Database connection', status: 'OK' })
  } catch (error: any) {
    results.checks.push({ name: 'Database connection', status: 'ERROR', error: error.message })
    return NextResponse.json(results, { status: 500 })
  }

  // 2. Check clients table
  try {
    const clients = await db.client.count()
    results.checks.push({ name: 'Clients table', status: 'OK', count: clients })
  } catch (error: any) {
    results.checks.push({ name: 'Clients table', status: 'ERROR', error: error.message })
  }

  // 3. Check system_config table
  try {
    const config = await db.systemConfig.findFirst()
    results.checks.push({ name: 'SystemConfig table', status: 'OK', hasConfig: !!config })
  } catch (error: any) {
    results.checks.push({ name: 'SystemConfig table', status: 'ERROR', error: error.message })
  }

  // 4. Check monthly_stats table
  try {
    const stats = await db.monthlyStats.count()
    results.checks.push({ name: 'MonthlyStats table', status: 'OK', count: stats })
  } catch (error: any) {
    results.checks.push({ name: 'MonthlyStats table', status: 'ERROR', error: error.message })
  }

  // 5. Check invoices tables
  try {
    const invoices = await db.invoice.count()
    results.checks.push({ name: 'Invoices table', status: 'OK', count: invoices })
  } catch (error: any) {
    results.checks.push({ name: 'Invoices table', status: 'ERROR', error: error.message })
  }

  // 6. Check invoice_items table
  try {
    const items = await db.invoiceItem.count()
    results.checks.push({ name: 'InvoiceItems table', status: 'OK', count: items })
  } catch (error: any) {
    results.checks.push({ name: 'InvoiceItems table', status: 'ERROR', error: error.message })
  }

  // 7. Check invoice_counter table
  try {
    const counter = await db.invoiceCounter.count()
    results.checks.push({ name: 'InvoiceCounter table', status: 'OK', count: counter })
  } catch (error: any) {
    results.checks.push({ name: 'InvoiceCounter table', status: 'ERROR', error: error.message })
  }

  // 8. Check users table
  try {
    const users = await db.user.count()
    results.checks.push({ name: 'Users table', status: 'OK', count: users })
  } catch (error: any) {
    results.checks.push({ name: 'Users table', status: 'ERROR', error: error.message })
  }

  // 9. Check audit_logs table
  try {
    const logs = await db.auditLog.count()
    results.checks.push({ name: 'AuditLog table', status: 'OK', count: logs })
  } catch (error: any) {
    results.checks.push({ name: 'AuditLog table', status: 'ERROR', error: error.message })
  }

  return NextResponse.json(results, { status: 200 })
}
