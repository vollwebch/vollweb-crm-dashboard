import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres',
  prepare: false
});

const sql = `
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add companyId to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'companyId') THEN
    ALTER TABLE users ADD COLUMN "companyId" TEXT;
  END IF;
END $$;

-- Create default company
INSERT INTO companies (id, name, "createdAt", "updatedAt")
SELECT 'cm_default_company', 'Default Company', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 'cm_default_company');

-- Assign existing users to default company
UPDATE users SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
`;

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    await client.query(sql);
    console.log('Migration part 1 completed!');
    
    // Part 2: Add companyId to clients
    const sql2 = `
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'companyId') THEN
        ALTER TABLE clients ADD COLUMN "companyId" TEXT;
      END IF;
    END $$;
    UPDATE clients SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
    `;
    await client.query(sql2);
    console.log('Migration part 2 completed!');
    
    // Part 3: Add companyId to other tables
    const tables = ['system_config', 'notification_config', 'trash_config', 'monthly_stats', 'audit_logs', 'invoice_counter'];
    for (const table of tables) {
      try {
        const sql3 = `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'companyId') THEN
            ALTER TABLE "${table}" ADD COLUMN "companyId" TEXT;
          END IF;
        END $$;
        UPDATE "${table}" SET "companyId" = 'cm_default_company' WHERE "companyId" IS NULL;
        `;
        await client.query(sql3);
        console.log(`Updated ${table}`);
      } catch (e) {
        console.log(`Skipped ${table}: ${e.message}`);
      }
    }
    
    console.log('All migrations completed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
