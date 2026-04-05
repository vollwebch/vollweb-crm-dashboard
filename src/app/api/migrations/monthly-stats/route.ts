import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/migrations/monthly-stats - Create monthly_stats table if not exists
export async function POST() {
  try {
    // Try to query the table to check if it exists
    try {
      await db.monthlyStats.findFirst();
      return NextResponse.json({ message: 'Table already exists', success: true });
    } catch (error: any) {
      // Table doesn't exist, we need to create it
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        // Execute raw SQL to create the table (separate statements)
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "monthly_stats" (
            "id" TEXT NOT NULL,
            "year" INTEGER NOT NULL,
            "month" INTEGER NOT NULL,
            "monthlyRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "monthlyCosts" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "monthlyProfit" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "activeClients" INTEGER NOT NULL DEFAULT 0,
            "activeServices" INTEGER NOT NULL DEFAULT 0,
            "activeDomains" INTEGER NOT NULL DEFAULT 0,
            "activeHosting" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "monthly_stats_pkey" PRIMARY KEY ("id")
          )
        `);
        
        await db.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "monthly_stats_year_month_key" ON "monthly_stats"("year", "month")
        `);
        
        return NextResponse.json({ message: 'Table created successfully', success: true });
      }
      throw error;
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Failed to run migration', 
      details: String(error) 
    }, { status: 500 });
  }
}

// GET - Check if table exists
export async function GET() {
  try {
    const count = await db.monthlyStats.count();
    return NextResponse.json({ 
      exists: true, 
      recordCount: count,
      message: 'monthly_stats table is ready' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      exists: false, 
      error: error.message,
      message: 'Table does not exist. Call POST to create it.' 
    });
  }
}
