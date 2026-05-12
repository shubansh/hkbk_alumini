-- LinkedIn Feed v2 Migration
-- Run this in Supabase SQL Editor (safe to run multiple times)

ALTER TABLE linkedin_posts ADD COLUMN IF NOT EXISTS embed_url TEXT;
