-- ==============================================================================
-- UNIFIED SOCIAL FEED DATABASE SETUP
-- Run this script in your Supabase SQL Editor to initialize the tables required 
-- for the Social Media Feed Management System.
-- ==============================================================================

-- 1. Create Social Posts Table
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('instagram', 'linkedin')),
  post_url text NOT NULL,
  embed_url text,
  caption text,
  thumbnail text,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  is_auto_fetched boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Social Settings Table
CREATE TABLE IF NOT EXISTS public.social_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_enabled boolean DEFAULT false,
  linkedin_enabled boolean DEFAULT false,
  instagram_access_token text,
  instagram_user_id text,
  auto_sync_enabled boolean DEFAULT false,
  sync_interval integer DEFAULT 60
);

-- 3. Initialize default settings row if it doesn't exist
INSERT INTO public.social_settings (instagram_enabled) 
SELECT false WHERE NOT EXISTS (SELECT 1 FROM public.social_settings);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Posts)
-- Public can view active posts
CREATE POLICY "Public can view visible social posts" ON public.social_posts
  FOR SELECT USING (is_visible = true);

-- Authenticated admins can do everything
CREATE POLICY "Authenticated admins manage social posts" ON public.social_posts
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 6. Create Policies (Settings)
-- Authenticated admins can manage settings
CREATE POLICY "Authenticated admins manage social settings" ON public.social_settings
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 7. Enable Realtime triggers
alter publication supabase_realtime add table public.social_posts;
alter publication supabase_realtime add table public.social_settings;

-- 8. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_posts_modtime
BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
