import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function update() {
  try {
    // Get the company
    const companies = await sql`SELECT id FROM "companies" LIMIT 1`;
    if (companies.length === 0) {
      console.log('No company found');
      return;
    }
    const companyId = companies[0].id;
    console.log('Company ID:', companyId);

    // Update the admin user
    await sql`
      UPDATE "users" SET "companyId" = ${companyId} 
      WHERE email = 'admin@vollweb.com'
    `;
    console.log('✓ Updated admin user with companyId');

    // Verify
    const users = await sql`
      SELECT id, name, email, role, "companyId" FROM "users" WHERE email = 'admin@vollweb.com'
    `;
    console.log('User:', users[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

update();
