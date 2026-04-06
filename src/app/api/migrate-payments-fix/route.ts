import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Create enum types
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PaymentEntityType" AS ENUM ('SERVICE', 'HOSTING', 'DOMAIN', 'CUSTOM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    
    // Drop existing table if it has wrong type
    await prisma.$executeRaw`DROP TABLE IF EXISTS "payments";`
    
    // Recreate table with correct types
    await prisma.$executeRaw`
      CREATE TABLE "payments" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "entityType" "PaymentEntityType" NOT NULL,
        "entityId" TEXT NOT NULL,
        "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'EUR',
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "stripePaymentId" TEXT,
        "stripeSessionId" TEXT,
        "paymentMethod" TEXT,
        "description" TEXT,
        "dueDate" TIMESTAMP(3),
        "paidAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
      );
    `
    
    // Add foreign key
    await prisma.$executeRaw`
      ALTER TABLE "payments" 
      ADD CONSTRAINT "payments_clientId_fkey" 
      FOREIGN KEY ("clientId") REFERENCES "clients"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_clientId_idx" ON "payments"("clientId");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_entityType_idx" ON "payments"("entityType");`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_dueDate_idx" ON "payments"("dueDate");`
    
    return NextResponse.json({ 
      success: true, 
      message: 'Enums and table created successfully!' 
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 })
  }
}
