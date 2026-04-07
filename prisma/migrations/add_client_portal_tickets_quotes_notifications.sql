-- Add Client Portal, Tickets, Quotes and Notifications tables

-- ============================================
-- CLIENT USERS - Portal de Clientes
-- ============================================
CREATE TABLE IF NOT EXISTS client_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    "lastLoginAt" TIMESTAMP(3),
    active BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT client_users_client_fkey FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS client_users_clientId_idx ON client_users("clientId");
CREATE INDEX IF NOT EXISTS client_users_email_idx ON client_users(email);

-- ============================================
-- TICKETS - Sistema de Soporte
-- ============================================
CREATE TYPE ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_STAFF', 'RESOLVED', 'CLOSED');
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'OPEN',
    priority ticket_priority NOT NULL DEFAULT 'MEDIUM',
    category TEXT NOT NULL DEFAULT 'general',
    "clientId" TEXT NOT NULL,
    "clientUserId" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    
    CONSTRAINT tickets_client_fkey FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT tickets_client_user_fkey FOREIGN KEY ("clientUserId") REFERENCES client_users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT tickets_assigned_to_fkey FOREIGN KEY ("assignedToId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS tickets_clientId_idx ON tickets("clientId");
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);
CREATE INDEX IF NOT EXISTS tickets_assignedToId_idx ON tickets("assignedToId");
CREATE INDEX IF NOT EXISTS tickets_createdAt_idx ON tickets("createdAt");

-- ============================================
-- TICKET MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    attachments JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ticket_messages_ticket_fkey FOREIGN KEY ("ticketId") REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticketId_idx ON ticket_messages("ticketId");
CREATE INDEX IF NOT EXISTS ticket_messages_createdAt_idx ON ticket_messages("createdAt");

-- ============================================
-- QUOTES - Cotizaciones/Presupuestos
-- ============================================
CREATE TYPE quote_status AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientAddress" TEXT,
    "clientTaxId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    language TEXT NOT NULL DEFAULT 'es',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status quote_status NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    terms TEXT,
    "internalNotes" TEXT,
    "invoiceId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    
    CONSTRAINT quotes_client_fkey FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS quotes_clientId_idx ON quotes("clientId");
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_issueDate_idx ON quotes("issueDate");

-- ============================================
-- QUOTE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "quoteId" TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    total DECIMAL(12,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT quote_items_quote_fkey FOREIGN KEY ("quoteId") REFERENCES quotes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS quote_items_quoteId_idx ON quote_items("quoteId");

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TYPE notification_type AS ENUM (
    'INFO', 'SUCCESS', 'WARNING', 'ERROR', 
    'TICKET_NEW', 'TICKET_REPLY', 'TICKET_ASSIGNED',
    'INVOICE_CREATED', 'INVOICE_PAID', 'INVOICE_OVERDUE',
    'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
    'CONTRACT_ENDING', 'DOMAIN_EXPIRING', 'PAYMENT_RECEIVED', 'ALARM_TRIGGERED'
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    "userId" TEXT,
    "clientUserId" TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    emailed BOOLEAN NOT NULL DEFAULT false,
    "emailedAt" TIMESTAMP(3),
    pushed BOOLEAN NOT NULL DEFAULT false,
    "pushedAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT notifications_user_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT notifications_client_user_fkey FOREIGN KEY ("clientUserId") REFERENCES client_users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS notifications_userId_idx ON notifications("userId");
CREATE INDEX IF NOT EXISTS notifications_clientUserId_idx ON notifications("clientUserId");
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications("createdAt");

-- Add comments
COMMENT ON TABLE client_users IS 'Portal client users - customers can login to view their data';
COMMENT ON TABLE tickets IS 'Support ticket system for client requests';
COMMENT ON TABLE ticket_messages IS 'Messages and replies in support tickets';
COMMENT ON TABLE quotes IS 'Quotes/estimates before converting to invoices';
COMMENT ON TABLE quote_items IS 'Line items for quotes';
COMMENT ON TABLE notifications IS 'Push and email notifications for users and clients';
