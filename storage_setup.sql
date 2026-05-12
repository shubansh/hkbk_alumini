-- =============================================================
-- HKBK Connect — Storage Setup SQL
-- Run in Supabase SQL Editor → New Query
-- =============================================================

-- ─── Ensure gallery_images table exists ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'campus', -- 'campus' | 'events'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Gallery policies
DROP POLICY IF EXISTS "Gallery images are public"      ON gallery_images;
DROP POLICY IF EXISTS "Admin inserts gallery images"   ON gallery_images;
DROP POLICY IF EXISTS "Admin deletes gallery images"   ON gallery_images;

CREATE POLICY "Gallery images are public" ON gallery_images
  FOR SELECT USING (true);

CREATE POLICY "Admin inserts gallery images" ON gallery_images
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admin deletes gallery images" ON gallery_images
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── Storage buckets (run each statement separately if any fail) ──────────────
-- Create buckets via Supabase Dashboard > Storage > New Bucket, OR via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('faculty', 'faculty', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─── Storage RLS policies ─────────────────────────────────────────────────────

-- avatars: public read, authenticated upload
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar"           ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar"           ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- faculty: public read, admin upload/delete
DROP POLICY IF EXISTS "Faculty images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload faculty images"        ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete faculty images"        ON storage.objects;

CREATE POLICY "Faculty images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'faculty');

CREATE POLICY "Admin can upload faculty images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'faculty' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete faculty images" ON storage.objects
  FOR DELETE USING (bucket_id = 'faculty' AND auth.role() = 'authenticated');

-- gallery: public read, admin upload/delete
DROP POLICY IF EXISTS "Gallery images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload gallery images"        ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete gallery images"        ON storage.objects;

CREATE POLICY "Gallery images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Admin can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete gallery images" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
