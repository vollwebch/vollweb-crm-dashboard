import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const sql = postgres(process.env.DATABASE_URL);

async function seed() {
  console.log('Starting seed...');

  try {
    // Check if companies exist
    const existingCompanies = await sql`SELECT id FROM "companies" LIMIT 1`;
    
    let companyId;
    
    if (existingCompanies.length === 0) {
      // Create default company
      const slug = 'vollweb-demo-' + Math.random().toString(36).substring(2, 8);
      const companies = await sql`
        INSERT INTO "companies" (id, name, slug, plan, "isActive", "createdAt", "updatedAt")
        VALUES (${'clx' + Math.random().toString(36).substring(2, 12)}, ${'Vollweb Demo'}, ${slug}, ${'FREE'}, true, NOW(), NOW())
        RETURNING id
      `;
      companyId = companies[0].id;
      console.log('✓ Created company:', companyId);
    } else {
      companyId = existingCompanies[0].id;
      console.log('✓ Company already exists:', companyId);
    }

    // Update users without companyId
    await sql`
      UPDATE "users" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''
    `;
    console.log('✓ Updated users with companyId');

    // Check if admin user exists
    const existingUsers = await sql`SELECT id FROM "users" WHERE email = 'admin@vollweb.com' LIMIT 1`;
    
    if (existingUsers.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sql`
        INSERT INTO "users" (id, name, email, password, role, "companyId", "isActive", "createdAt", "updatedAt")
        VALUES (${'usr' + Math.random().toString(36).substring(2, 12)}, 'Administrador', 'admin@vollweb.com', ${hashedPassword}, 'ADMIN', ${companyId}, true, NOW(), NOW())
      `;
      console.log('✓ Created admin user');
    } else {
      // Update admin user with companyId
      await sql`
        UPDATE "users" SET "companyId" = ${companyId} WHERE email = 'admin@vollweb.com'
      `;
      console.log('✓ Updated admin user with companyId');
    }

    // Update all other tables with companyId
    await sql`UPDATE "clients" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated clients');

    await sql`UPDATE "client_services" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated client_services');

    await sql`UPDATE "domains" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated domains');

    await sql`UPDATE "hosting" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated hosting');

    await sql`UPDATE "reminders" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated reminders');

    await sql`UPDATE "client_alarms" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated client_alarms');

    await sql`UPDATE "activity_logs" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated activity_logs');

    // Update config tables
    await sql`UPDATE "notification_config" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated notification_config');

    await sql`UPDATE "system_config" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated system_config');

    await sql`UPDATE "trash_config" SET "companyId" = ${companyId} WHERE "companyId" IS NULL OR "companyId" = ''`;
    console.log('✓ Updated trash_config');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Email: admin@vollweb.com');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed();
