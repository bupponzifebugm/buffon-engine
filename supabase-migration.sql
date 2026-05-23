-- ============================================================
-- BUFFON Execution Engine v4.0 — Database Migration
-- Master Context Expansion (May 2026)
-- ============================================================
-- Run this ENTIRE script in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. ADD EMOTION & VIOLATION COLUMNS TO POSITIONS
ALTER TABLE positions ADD COLUMN IF NOT EXISTS emotion TEXT DEFAULT 'calm';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS is_violation BOOLEAN DEFAULT FALSE;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS violation_reason TEXT DEFAULT '';

-- 2. CREATE MISTAKE RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS mistake_receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL DEFAULT '',
  mistake_date DATE DEFAULT CURRENT_DATE,
  mistake_type TEXT NOT NULL,
  notes TEXT DEFAULT '',
  action_plan TEXT DEFAULT '',
  tuition_loss BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mistake_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own mistake receipts" ON mistake_receipts;
CREATE POLICY "Users can manage own mistake receipts"
  ON mistake_receipts FOR ALL
  USING (auth.uid() = user_id);

-- 3. CREATE CONFIDENT RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS confident_receipts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE confident_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own confident receipts" ON confident_receipts;
CREATE POLICY "Users can manage own confident receipts"
  ON confident_receipts FOR ALL
  USING (auth.uid() = user_id);
