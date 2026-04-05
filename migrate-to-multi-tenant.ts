import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration...');

  try {
    // Create companies table
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('✓ Created companies table');

    // Create unique index on slug
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key" ON "companies"("slug");
    `);
    console.log('✓ Created companies_slug_key index');

    // Add companyId to users
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'companyId') THEN
          ALTER TABLE "users" ADD COLUMN "companyId" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isActive') THEN
          ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to users');

    // Add companyId to clients
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'companyId') THEN
          ALTER TABLE "clients" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to clients');

    // Add companyId to client_services
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_services' AND column_name = 'companyId') THEN
          ALTER TABLE "client_services" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to client_services');

    // Add companyId to domains
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'companyId') THEN
          ALTER TABLE "domains" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to domains');

    // Add companyId to hosting
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hosting' AND column_name = 'companyId') THEN
          ALTER TABLE "hosting" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to hosting');

    // Add companyId to reminders
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'companyId') THEN
          ALTER TABLE "reminders" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to reminders');

    // Add companyId to client_alarms
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_alarms' AND column_name = 'companyId') THEN
          ALTER TABLE "client_alarms" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to client_alarms');

    // Add companyId to activity_logs
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'companyId') THEN
          ALTER TABLE "activity_logs" ADD COLUMN "companyId" TEXT;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to activity_logs');

    // Add companyId to notification_config
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_config' AND column_name = 'companyId') THEN
          ALTER TABLE "notification_config" ADD COLUMN "companyId" TEXT UNIQUE;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to notification_config');

    // Add companyId to system_config
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_config' AND column_name = 'companyId') THEN
          ALTER TABLE "system_config" ADD COLUMN "companyId" TEXT UNIQUE;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to system_config');

    // Add companyId to trash_config
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trash_config' AND column_name = 'companyId') THEN
          ALTER TABLE "trash_config" ADD COLUMN "companyId" TEXT UNIQUE;
        END IF;
      END $$;
    `);
    console.log('✓ Added companyId to trash_config');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
