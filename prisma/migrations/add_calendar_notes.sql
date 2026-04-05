-- Create calendar_notes table for personal notes on calendar
CREATE TABLE IF NOT EXISTS calendar_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'brand',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "companyId" TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS calendar_notes_company_id_idx ON calendar_notes("companyId");
CREATE INDEX IF NOT EXISTS calendar_notes_date_idx ON calendar_notes(date);
