-- Add permissions column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;

-- Set default permissions for existing users (all allowed)
UPDATE users SET permissions = '{"clients":true,"services":true,"hosting":true,"domains":true,"payments":true,"invoices":true,"alarms":true,"reminders":true,"trash":true,"audit":true,"stats":true,"config":true}'::jsonb WHERE permissions IS NULL;
