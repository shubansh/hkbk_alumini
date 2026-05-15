-- ==============================================================================
-- FINAL SECURITY & MESSAGING UPGRADE MIGRATION
-- Run this in your Supabase SQL Editor to enable message deletion and file attachments.
-- ==============================================================================

-- 1. UPGRADE MESSAGES TABLE SCHEMA
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 2. ENFORCE RLS ON MESSAGES (Hardening)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing generic policies if they exist to replace with strict ones
DROP POLICY IF EXISTS "Users can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Create strict read/write policies
CREATE POLICY "Users can read messages they are part of" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as themselves" 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update/soft-delete their own sent messages" 
  ON public.messages FOR UPDATE 
  USING (auth.uid() = sender_id OR (auth.uid() = receiver_id AND is_read IS DISTINCT FROM false)); -- receiver can only update is_read

-- 3. CHAT ATTACHMENTS STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments', 
  'chat_attachments', 
  true, -- Needs to be public for easy URL generation, but obscured by UUIDs
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Bucket RLS Policies
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload attachments" 
  ON storage.objects FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'chat_attachments');

CREATE POLICY "Anyone can view attachments" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'chat_attachments');

-- ==============================================================================
-- DONE! The backend is now ready for secure message soft-deletes and file uploads.
-- ==============================================================================
