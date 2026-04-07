-- Migration: Portal de Clientes, Tickets, Cotizaciones, Notificaciones
-- Run this in Supabase SQL Editor

-- ============================================
-- CLIENT USER - Portal de Clientes
-- ============================================
CREATE TABLE IF NOT EXISTS client_users (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(191),
  last_login_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  client_id VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_client_users_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);

-- ============================================
-- TICKETS - Sistema de Soporte
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'OPEN',
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  category VARCHAR(50) DEFAULT 'general',
  client_id VARCHAR(191) NOT NULL,
  client_user_id VARCHAR(191),
  assigned_to_id VARCHAR(191),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  
  CONSTRAINT fk_tickets_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_tickets_client_user FOREIGN KEY (client_user_id) REFERENCES client_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_id ON tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- ============================================
-- TICKET MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  ticket_id VARCHAR(191) NOT NULL,
  author_id VARCHAR(191) NOT NULL,
  author_type VARCHAR(50) NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- ============================================
-- QUOTES - Cotizaciones/Presupuestos
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(191) UNIQUE NOT NULL,
  client_id VARCHAR(191) NOT NULL,
  client_name VARCHAR(191) NOT NULL,
  client_email VARCHAR(191),
  client_address VARCHAR(191),
  client_tax_id VARCHAR(191),
  issue_date TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  language VARCHAR(10) DEFAULT 'es',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 21,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'DRAFT',
  notes TEXT,
  terms TEXT,
  internal_notes TEXT,
  invoice_id VARCHAR(191),
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  CONSTRAINT fk_quotes_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON quotes(issue_date);

-- ============================================
-- QUOTE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS quote_items (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2),
  tax_rate DECIMAL(5,2) DEFAULT 21,
  total DECIMAL(12,2),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id VARCHAR(191),
  client_user_id VARCHAR(191),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  emailed BOOLEAN DEFAULT false,
  emailed_at TIMESTAMP,
  pushed BOOLEAN DEFAULT false,
  pushed_at TIMESTAMP,
  entity_type VARCHAR(50),
  entity_id VARCHAR(191),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_client_user FOREIGN KEY (client_user_id) REFERENCES client_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_user_id ON notifications(client_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- QUOTE COUNTER (for generating quote numbers)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_counter (
  id VARCHAR(191) PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  company_id VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_quote_counter_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT quote_counter_company_year_unique UNIQUE (company_id, year)
);

-- Add relation to Company for webhooks if not exists
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhooks_count INTEGER DEFAULT 0;

-- Add quote counter relation to Company
ALTER TABLE companies ADD COLUMN IF NOT EXISTS quote_counters_count INTEGER DEFAULT 0;
