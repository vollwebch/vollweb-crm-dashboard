import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mock user ID for development (skip authentication for now)
export const MOCK_USER_ID = 'dev-user-001';

// Ensure mock user exists in database
export async function ensureMockUser() {
  try {
    const existingUser = await db.user.findUnique({
      where: { id: MOCK_USER_ID },
    });

    if (!existingUser) {
      await db.user.create({
        data: {
          id: MOCK_USER_ID,
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'hashed_password_placeholder',
          role: 'admin',
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring mock user:', error);
  }
}

// API Response helpers
export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { error: message, details },
    { status }
  );
}

// Generate invoice number with auto-increment
export async function generateInvoiceNumber(prefix: string = 'FAC'): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Find or create counter for current year
  let counter = await db.invoiceCounter.findUnique({
    where: { year: currentYear },
  });

  if (!counter) {
    // Get starting number from system config
    const config = await getSystemConfig();
    const startingNumber = config?.invoiceStartingNumber ?? 1;
    
    counter = await db.invoiceCounter.create({
      data: {
        year: currentYear,
        lastNumber: startingNumber - 1,
      },
    });
  }

  // Increment counter
  const nextNumber = counter.lastNumber + 1;
  
  await db.invoiceCounter.update({
    where: { id: counter.id },
    data: { lastNumber: nextNumber },
  });

  // Format: FAC-2024-0001
  const paddedNumber = nextNumber.toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedNumber}`;
}

// Get system configuration
export async function getSystemConfig() {
  let config = await db.systemConfig.findFirst();
  
  if (!config) {
    // Create default config
    config = await db.systemConfig.create({
      data: {
        companyName: 'Mi Empresa',
        companyCountry: 'España',
        invoicePrefix: 'FAC',
        invoiceStartingNumber: 1,
        invoiceDefaultTaxRate: 21,
        invoiceDefaultDueDays: 30,
        currency: 'EUR',
        currencySymbol: '€',
      },
    });
  }
  
  return config;
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  userId: string = MOCK_USER_ID
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

// Calculate invoice totals
export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export function calculateInvoiceTotals(items: InvoiceItemInput[]) {
  let subtotal = 0;
  let totalTax = 0;

  const calculatedItems = items.map((item, index) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemTax = itemTotal * (item.taxRate / 100);
    
    subtotal += itemTotal;
    totalTax += itemTax;

    return {
      ...item,
      total: itemTotal,
      order: index,
    };
  });

  const total = subtotal + totalTax;

  return {
    items: calculatedItems,
    subtotal,
    taxAmount: totalTax,
    total,
  };
}

// Format currency
export function formatCurrency(amount: number, symbol: string = '€'): string {
  return `${amount.toFixed(2)} ${symbol}`;
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
