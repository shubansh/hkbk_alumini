-- ==============================================================================
-- FINAL FIXES MIGRATION — Single Device Login & Unread Messages
-- Run this in your Supabase SQL Editor. Safe to run multiple times.
-- ==============================================================================

-- 1. Add current_session_token to profiles for Single Device Login
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_session_token UUID;

-- 2. Add is_read to messages for Unread Badge System
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 3. Update existing messages to be read by default to prevent sudden massive badge counts
UPDATE messages SET is_read = TRUE WHERE is_read = FALSE;

-- ==============================================================================
-- DONE! After running, your backend will support Single Device Login and Unread Badges.
-- ==============================================================================
