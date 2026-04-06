import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres',
  prepare: false
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Disabling RLS (using app-level security)...');
    
    const tables = [
      'companies', 'users', 'clients', 'client_services', 'hosting',
      'domains', 'reminders', 'client_alarms', 'activity_logs',
      'notification_config', 'system_config', 'trash_config',
      'monthly_stats', 'audit_logs', 'payments', 'invoices',
      'invoice_items', 'invoice_counter'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
        console.log(`RLS disabled on ${table}`);
      } catch (e) {
        console.log(`RLS skip on ${table}: ${e.message}`);
      }
    }
    
    console.log('RLS disabled - using application-level companyId filtering');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
