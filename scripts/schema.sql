-- ==========================================================
-- NEXUS Database Schema for Neon PostgreSQL
-- Dev Brief v2 Specification (§5)
-- ==========================================================

-- 1. Daily Vitals & Metrics
CREATE TABLE IF NOT EXISTS vitals (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  filed_today INT DEFAULT 7,
  leads_found INT DEFAULT 19,
  leads_killed INT DEFAULT 10,
  leads_refused INT DEFAULT 2,
  spent_today NUMERIC(6, 2) DEFAULT 3.87,
  budget_limit NUMERIC(6, 2) DEFAULT 10.00,
  uplink_status TEXT DEFAULT 'filing live',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dispatches (The Crossing)
CREATE TABLE IF NOT EXISTS dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL, -- e.g. #104
  stamp TEXT NOT NULL CHECK (stamp IN ('flash', 'bulletin', 'urgent', 'routine', 'killed', 'refused')),
  time_utc TEXT NOT NULL, -- e.g. 02:47 UTC
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thread_a TEXT NOT NULL, -- e.g. dollar funding
  thread_b TEXT NOT NULL, -- e.g. stablecoin supply
  sources TEXT[] DEFAULT '{}',
  confidence TEXT NOT NULL DEFAULT 'conf 0.81',
  rejected_by TEXT CHECK (rejected_by IN ('scout', 'analyst')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispatches_created_at ON dispatches (created_at DESC);

-- 3. Live stdout Stream (Machine Output §3)
CREATE TABLE IF NOT EXISTS agent_stdout (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  time_str TEXT NOT NULL, -- e.g. 02:47:18
  cycle_id INT DEFAULT 41,
  actor TEXT NOT NULL CHECK (actor IN ('scout', 'analyst', 'system')),
  glyph TEXT, -- ▸ · ⟡ ✕ → ✎ ✓
  message TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('ok', 'dim', 'hit', 'kill', 'err')),
  cost_usd NUMERIC(8, 4),
  tag TEXT CHECK (tag IN ('scanned', 'crossed', 'filed', 'killed', 'refused', 'kept', 'thought')),
  lead_id TEXT -- e.g. #104, nullable for lines not tied to a specific lead
);
CREATE INDEX IF NOT EXISTS idx_agent_stdout_created_at ON agent_stdout (created_at DESC);

-- Migration for existing databases created before tag/lead_id existed
ALTER TABLE agent_stdout ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE agent_stdout ADD COLUMN IF NOT EXISTS lead_id TEXT;

-- 4. The Weave (Longform Editorial §4)
CREATE TABLE IF NOT EXISTS weaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number INT UNIQUE NOT NULL, -- e.g. 4 for WEAVE 004
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  dek TEXT NOT NULL,
  content TEXT[] NOT NULL,
  reading_minutes INT DEFAULT 6,
  threads_summary TEXT DEFAULT '7 threads woven · 14 sources',
  tags TEXT[] DEFAULT '{"macro", "crypto", "liquidity"}',
  status TEXT DEFAULT 'published' CHECK (status IN ('writing', 'published', 'refused')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  cost_usd NUMERIC(6, 4) DEFAULT 0.2500
);

-- 5. Weave Threads Junction (Traceability Chain)
CREATE TABLE IF NOT EXISTS weave_threads (
  id SERIAL PRIMARY KEY,
  weave_slug TEXT NOT NULL REFERENCES weaves(slug) ON DELETE CASCADE,
  dispatch_lead_id TEXT NOT NULL, -- e.g. #104
  crossing_title TEXT NOT NULL,
  dispatch_date TEXT NOT NULL
);

-- 6. The Quarter — periodic landscape map + self-scorecard (Dev Brief "The Quarter" §7)
CREATE TABLE IF NOT EXISTS quarter_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT CHECK (kind IN ('monthly', 'quarterly')),
  period_label TEXT,          -- "Sep 2026" / "Q3 2026"
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  title TEXT,
  dek TEXT,
  what_changed TEXT,
  forces JSONB,               -- [{category, description, dispatch_ids[]}]
  tensions JSONB,             -- [{title, pulling_up, pulling_down, decider, dispatch_ids[]}]
  watch_list JSONB,           -- [string]
  status TEXT DEFAULT 'writing' CHECK (status IN ('writing', 'published', 'skipped')),
  skip_reason TEXT,           -- filled when status='skipped' (not enough signal this period)
  cost_usd NUMERIC(8, 4)
);

-- Scorecard: each entry grades the entry before it
CREATE TABLE IF NOT EXISTS quarter_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES quarter_entries(id),        -- the entry doing the scoring
  scored_entry_id UUID REFERENCES quarter_entries(id), -- the entry being scored
  item TEXT,                  -- the observation/variable being graded
  verdict TEXT CHECK (verdict IN ('hit', 'partial', 'miss', 'blind_spot')),
  note TEXT
);

-- Links a Quarter entry back to the dispatches it was synthesized from
CREATE TABLE IF NOT EXISTS quarter_sources (
  entry_id UUID REFERENCES quarter_entries(id),
  dispatch_id UUID REFERENCES dispatches(id),
  PRIMARY KEY (entry_id, dispatch_id)
);
