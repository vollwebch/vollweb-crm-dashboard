import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  console.log('Starting migration...');

  try {
    // Create companies table
    await sql`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'FREE',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✓ Created companies table');

    // Create unique index on slug
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key" ON "companies"("slug");`;
    console.log('✓ Created companies_slug_key index');

    // Check and add companyId to users
    const usersColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'companyId'
    `;
    if (usersColumns.length === 0) {
      await sql`ALTER TABLE "users" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to users');
    } else {
      console.log('✓ companyId already exists in users');
    }

    // Check and add isActive to users
    const usersActiveCol = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'isActive'
    `;
    if (usersActiveCol.length === 0) {
      await sql`ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN DEFAULT true;`;
      console.log('✓ Added isActive to users');
    }

    // Check and add companyId to clients
    const clientsColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'companyId'
    `;
    if (clientsColumns.length === 0) {
      await sql`ALTER TABLE "clients" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to clients');
    } else {
      console.log('✓ companyId already exists in clients');
    }

    // Check and add companyId to client_services
    const servicesColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'client_services' AND column_name = 'companyId'
    `;
    if (servicesColumns.length === 0) {
      await sql`ALTER TABLE "client_services" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to client_services');
    } else {
      console.log('✓ companyId already exists in client_services');
    }

    // Check and add companyId to domains
    const domainsColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'domains' AND column_name = 'companyId'
    `;
    if (domainsColumns.length === 0) {
      await sql`ALTER TABLE "domains" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to domains');
    } else {
      console.log('✓ companyId already exists in domains');
    }

    // Check and add companyId to hosting
    const hostingColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hosting' AND column_name = 'companyId'
    `;
    if (hostingColumns.length === 0) {
      await sql`ALTER TABLE "hosting" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to hosting');
    } else {
      console.log('✓ companyId already exists in hosting');
    }

    // Check and add companyId to reminders
    const remindersColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'reminders' AND column_name = 'companyId'
    `;
    if (remindersColumns.length === 0) {
      await sql`ALTER TABLE "reminders" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to reminders');
    } else {
      console.log('✓ companyId already exists in reminders');
    }

    // Check and add companyId to client_alarms
    const alarmsColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'client_alarms' AND column_name = 'companyId'
    `;
    if (alarmsColumns.length === 0) {
      await sql`ALTER TABLE "client_alarms" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to client_alarms');
    } else {
      console.log('✓ companyId already exists in client_alarms');
    }

    // Check and add companyId to activity_logs
    const activityColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'activity_logs' AND column_name = 'companyId'
    `;
    if (activityColumns.length === 0) {
      await sql`ALTER TABLE "activity_logs" ADD COLUMN "companyId" TEXT;`;
      console.log('✓ Added companyId to activity_logs');
    } else {
      console.log('✓ companyId already exists in activity_logs');
    }

    // Check and add companyId to notification_config
    const notifColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notification_config' AND column_name = 'companyId'
    `;
    if (notifColumns.length === 0) {
      await sql`ALTER TABLE "notification_config" ADD COLUMN "companyId" TEXT UNIQUE;`;
      console.log('✓ Added companyId to notification_config');
    } else {
      console.log('✓ companyId already exists in notification_config');
    }

    // Check and add companyId to system_config
    const systemColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'system_config' AND column_name = 'companyId'
    `;
    if (systemColumns.length === 0) {
      await sql`ALTER TABLE "system_config" ADD COLUMN "companyId" TEXT UNIQUE;`;
      console.log('✓ Added companyId to system_config');
    } else {
      console.log('✓ companyId already exists in system_config');
    }

    // Check and add companyId to trash_config
    const trashColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'trash_config' AND column_name = 'companyId'
    `;
    if (trashColumns.length === 0) {
      await sql`ALTER TABLE "trash_config" ADD COLUMN "companyId" TEXT UNIQUE;`;
      console.log('✓ Added companyId to trash_config');
    } else {
      console.log('✓ companyId already exists in trash_config');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrate();
