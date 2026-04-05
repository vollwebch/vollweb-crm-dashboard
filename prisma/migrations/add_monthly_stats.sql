-- Migration: Add MonthlyStats table for historical chart data
-- Run this in Supabase SQL Editor or via migration

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
);

-- Create unique index on year+month combination
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_stats_year_month_key" ON "monthly_stats"("year", "month");

-- Add comment
COMMENT ON TABLE "monthly_stats" IS 'Stores monthly snapshots of financial and client data for historical charts';
