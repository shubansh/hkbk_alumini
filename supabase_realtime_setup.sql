-- ==============================================================================
-- SUPABASE REALTIME ENABLEMENT
-- Run this script in your Supabase SQL Editor to enable realtime events.
-- ==============================================================================

-- 1. Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Enable realtime for the profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Note: If you get a "relation already exists in publication" warning, it just means
-- realtime is already turned on for that table, which is perfectly fine.

-- 3. Enable realtime for the jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
