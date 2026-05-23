-- ============================================================
-- BUFFON Execution Engine v4.0 — Supabase Database Setup
-- ============================================================
-- Run this ENTIRE script in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT 'Trader',
  active_capital BIGINT DEFAULT 10000000,
  current_tier TEXT DEFAULT 'survival_10m',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. POSITIONS TABLE
CREATE TABLE positions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  lots INTEGER NOT NULL,
  entry_price INTEGER NOT NULL,
  sl_price INTEGER NOT NULL,
  tp1_price INTEGER DEFAULT 0,
  tp2_price INTEGER DEFAULT 0,
  exit_price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','tp1','closed','sl')),
  pnl BIGINT DEFAULT 0,
  notes TEXT DEFAULT '',
  trade_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions"
  ON positions FOR ALL
  USING (auth.uid() = user_id);


-- 3. CHALLENGE TRADES TABLE
CREATE TABLE challenge_trades (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trade_index INTEGER NOT NULL CHECK (trade_index BETWEEN 0 AND 29),
  status INTEGER DEFAULT 0 CHECK (status IN (0,1,2,3)),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trade_index)
);

ALTER TABLE challenge_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own challenge trades"
  ON challenge_trades FOR ALL
  USING (auth.uid() = user_id);


-- 4. MORNING GATES TABLE
CREATE TABLE morning_gates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gate_date DATE DEFAULT CURRENT_DATE,
  focus_score INTEGER NOT NULL CHECK (focus_score BETWEEN 1 AND 10),
  usd_idr_rate INTEGER NOT NULL,
  macro_env TEXT NOT NULL CHECK (macro_env IN ('green','mixed','red')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gate_date)
);

ALTER TABLE morning_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own morning gates"
  ON morning_gates FOR ALL
  USING (auth.uid() = user_id);


-- 5. JOURNAL ENTRIES TABLE
CREATE TABLE journal_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Entry',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);


-- 6. STORAGE BUCKET FOR JOURNAL IMAGES
-- Note: Run this in a SEPARATE query if the above succeeds
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-images' AND auth.uid()::text = (storage.foldername(name))[1]);
