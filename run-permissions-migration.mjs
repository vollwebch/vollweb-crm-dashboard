import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.mgdrmsgpumouuuzzssxr:260415Jc.chocolate@aws-1-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
  });

  try {
    await client.connect();
    console.log('Connected to database via pooler');

    // Add permissions column
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;`);
    console.log('✓ Added permissions column');

    // Set default permissions for existing users
    const result = await client.query(`
      UPDATE users 
      SET permissions = '{"clients":true,"services":true,"hosting":true,"domains":true,"payments":true,"invoices":true,"alarms":true,"reminders":true,"trash":true,"audit":true,"stats":true,"config":true}'::jsonb 
      WHERE permissions IS NULL;
    `);
    console.log(`✓ Updated ${result.rowCount} users with default permissions`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
