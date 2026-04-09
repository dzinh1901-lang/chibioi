-- Chibi Creator — Initial Database Schema
-- Run this in your Supabase SQL Editor to set up the database.

-- ─────────────────────────────────────────
-- Enable required extensions
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- Profiles table
-- Extends Supabase auth.users with plan info
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  plan        TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'STUDIO')),
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- Quota usage table
-- Tracks daily generation counts per user
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  count       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Upsert-friendly unique constraint: one row per user per day
  CONSTRAINT quota_usage_user_date_unique UNIQUE (user_id, date)
);

-- ─────────────────────────────────────────
-- Generations table
-- Stores generated chibi images
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  model       TEXT NOT NULL DEFAULT 'dall-e-3',
  size        TEXT NOT NULL DEFAULT '1024x1024',
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Row Level Security (RLS)
-- Users can only read/write their own data
-- ─────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Quota: users read their own quota; service role writes
CREATE POLICY "Users can view own quota"
  ON public.quota_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Generations: users manage their own generations
CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Indexes for query performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_date
  ON public.quota_usage (user_id, date);

CREATE INDEX IF NOT EXISTS idx_generations_user_id
  ON public.generations (user_id, created_at DESC);
