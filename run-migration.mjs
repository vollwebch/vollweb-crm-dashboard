import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres'
    }
  }
});

const sql = `
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_bytes(12)::text,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add companyId to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Create default company
INSERT INTO companies (id, name, "createdAt", "updatedAt")
SELECT 'cm_default_company', 'Default Company', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 'cm_default_company');

-- Assign existing users to default company
UPDATE users SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
`;

async function main() {
  try {
    // Execute in parts
    const parts = sql.split(';').filter(p => p.trim());
    for (const part of parts) {
      if (part.trim()) {
        console.log('Executing:', part.substring(0, 50) + '...');
        await prisma.$executeRawUnsafe(part);
      }
    }
    console.log('Migration completed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
