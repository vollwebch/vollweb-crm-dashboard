import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres',
  prepare: false
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== CHECKING DATABASE ===\n');
    
    // Check companies
    const companies = await client.query('SELECT * FROM companies');
    console.log('Companies:', companies.rows.length);
    companies.rows.forEach(c => console.log(`  - ${c.id}: ${c.name}`));
    
    // Check users
    const users = await client.query('SELECT id, email, role, "companyId" FROM users');
    console.log('\nUsers:', users.rows.length);
    users.rows.forEach(u => console.log(`  - ${u.email} (${u.role}) - Company: ${u.companyId}`));
    
    // Check clients
    const clients = await client.query('SELECT id, name, "companyId" FROM clients LIMIT 5');
    console.log('\nClients (first 5):', clients.rows.length);
    clients.rows.forEach(c => console.log(`  - ${c.name} - Company: ${c.companyId}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
