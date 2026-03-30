-- ============================================================
-- Chibi Creator — Initial Database Schema
-- Migration: 20260330000000_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE','PRO','STUDIO')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_name   TEXT NOT NULL DEFAULT 'Anonymous',
  title          TEXT NOT NULL DEFAULT 'My Chibi',
  image_url      TEXT NOT NULL,
  prompt         TEXT,
  style          TEXT,
  background     TEXT,
  visibility     TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','PRIVATE')),
  likes          INTEGER NOT NULL DEFAULT 0,
  downloads      INTEGER NOT NULL DEFAULT 0,
  demo_gradient  TEXT,
  demo_emoji     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- generations table
CREATE TABLE IF NOT EXISTS generations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL DEFAULT 'anonymous',
  prompt           TEXT NOT NULL,
  profession       TEXT NOT NULL DEFAULT 'general',
  style            TEXT,
  background       TEXT,
  softness         INTEGER NOT NULL DEFAULT 50,
  sparkle          INTEGER NOT NULL DEFAULT 50,
  source_image_url TEXT,
  output_image_url TEXT,
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCEEDED','FAILED','DEMO')),
  downloads        INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- quota_usage table
CREATE TABLE IF NOT EXISTS quota_usage (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  count      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

-- notify_subscribers table (used by landing page)
CREATE TABLE IF NOT EXISTS notify_subscribers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  source     TEXT NOT NULL DEFAULT 'landing_notify',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notify_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Gallery: public items visible to all, private only to owner
CREATE POLICY "Public gallery items are viewable by all" ON gallery
  FOR SELECT USING (visibility = 'PUBLIC');

CREATE POLICY "Users can manage their own gallery items" ON gallery
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users: only the authenticated user can see/update their own row
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Quota: only the user themselves
CREATE POLICY "Users manage their own quotas" ON quota_usage
  FOR ALL USING (auth.uid() = user_id);

-- Generations: users see their own; anonymous see nothing
CREATE POLICY "Users see their own generations" ON generations
  FOR SELECT USING (auth.uid()::text = user_id);

-- Notify subscribers: insert only (no RLS read needed for public)
CREATE POLICY "Anyone can subscribe" ON notify_subscribers
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_visibility ON gallery(visibility);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_likes ON gallery(likes DESC);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_date ON quota_usage(user_id, date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_updated_at BEFORE UPDATE ON gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
