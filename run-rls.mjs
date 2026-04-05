import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres',
  prepare: false
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Enabling RLS...');
    
    // Enable RLS on all tables
    const tables = [
      'companies', 'users', 'clients', 'client_services', 'hosting',
      'domains', 'reminders', 'client_alarms', 'activity_logs',
      'notification_config', 'system_config', 'trash_config',
      'monthly_stats', 'audit_logs', 'payments', 'invoices',
      'invoice_items', 'invoice_counter'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
        console.log(`RLS enabled on ${table}`);
      } catch (e) {
        console.log(`RLS skipped on ${table}: ${e.message}`);
      }
    }
    
    // Create helper function for JWT company_id
    console.log('Creating helper function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION auth.jwt_company_id() RETURNS TEXT AS $$
        SELECT COALESCE(
          current_setting('request.jwt.claims', true)::json->>'companyId',
          current_setting('request.jwt.claims', true)::json->>'company_id'
        );
      $$ LANGUAGE SQL STABLE;
    `);
    console.log('Helper function created');
    
    // Create basic policies - first drop existing ones
    console.log('Creating policies...');
    
    // Companies policies
    await client.query(`DROP POLICY IF EXISTS "Users can view own company" ON companies`);
    await client.query(`CREATE POLICY "Users can view own company" ON companies FOR SELECT USING (id = auth.jwt_company_id())`);
    
    // Users policies
    await client.query(`DROP POLICY IF EXISTS "Users can view company users" ON users`);
    await client.query(`CREATE POLICY "Users can view company users" ON users FOR SELECT USING ("companyId" = auth.jwt_company_id())`);
    
    // Clients policies  
    await client.query(`DROP POLICY IF EXISTS "Users can view company clients" ON clients`);
    await client.query(`CREATE POLICY "Users can view company clients" ON clients FOR SELECT USING ("companyId" = auth.jwt_company_id())`);
    await client.query(`DROP POLICY IF EXISTS "Users can insert company clients" ON clients`);
    await client.query(`CREATE POLICY "Users can insert company clients" ON clients FOR INSERT WITH CHECK ("companyId" = auth.jwt_company_id())`);
    await client.query(`DROP POLICY IF EXISTS "Users can update company clients" ON clients`);
    await client.query(`CREATE POLICY "Users can update company clients" ON clients FOR UPDATE USING ("companyId" = auth.jwt_company_id())`);
    await client.query(`DROP POLICY IF EXISTS "Users can delete company clients" ON clients`);
    await client.query(`CREATE POLICY "Users can delete company clients" ON clients FOR DELETE USING ("companyId" = auth.jwt_company_id())`);
    
    console.log('Basic policies created!');
    console.log('RLS migration completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
