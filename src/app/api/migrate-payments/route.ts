import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to query the Payment table to see if it exists
    await prisma.$queryRaw`SELECT 1 FROM "payments" LIMIT 1`
    return NextResponse.json({ message: 'Payment table already exists' })
  } catch (error: any) {
    // Table doesn't exist, create it
    if (error.code === 'P2010' || error.message?.includes('does not exist')) {
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "payments" (
            "id" TEXT NOT NULL,
            "clientId" TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" TEXT NOT NULL,
            "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "currency" TEXT NOT NULL DEFAULT 'EUR',
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "stripePaymentId" TEXT,
            "stripeSessionId" TEXT,
            "paymentMethod" TEXT,
            "description" TEXT,
            "dueDate" TIMESTAMP(3),
            "paidAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            
            CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "payments_stripePaymentId_key" UNIQUE ("stripePaymentId"),
            CONSTRAINT "payments_stripeSessionId_key" UNIQUE ("stripeSessionId")
          );
        `
        
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_clientId_idx" ON "payments"("clientId");`
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");`
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_entityType_idx" ON "payments"("entityType");`
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_dueDate_idx" ON "payments"("dueDate");`
        
        return NextResponse.json({ message: 'Payment table created successfully!' })
      } catch (createError: any) {
        return NextResponse.json({ 
          error: 'Failed to create table', 
          details: createError.message 
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error.message 
    }, { status: 500 })
  }
}
