-- ============================================================
-- LinkedIn Feed Table for HKBK Connect
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS linkedin_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_url    TEXT NOT NULL,
  title       TEXT,
  description TEXT,
  thumbnail   TEXT,
  is_active   BOOLEAN DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe re-run)
DROP POLICY IF EXISTS "Active linkedin posts visible to all"  ON linkedin_posts;
DROP POLICY IF EXISTS "Admins manage linkedin posts"          ON linkedin_posts;
DROP POLICY IF EXISTS "Admins read all linkedin posts"        ON linkedin_posts;

-- Anyone (including anonymous visitors) can read active posts
CREATE POLICY "Active linkedin posts visible to all" ON linkedin_posts
  FOR SELECT USING (is_active = true);

-- Admins can read ALL posts (including inactive)
CREATE POLICY "Admins read all linkedin posts" ON linkedin_posts
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can insert, update, delete
CREATE POLICY "Admins manage linkedin posts" ON linkedin_posts
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Optional: index for ordering
CREATE INDEX IF NOT EXISTS linkedin_posts_created_at_idx
  ON linkedin_posts (created_at DESC);
