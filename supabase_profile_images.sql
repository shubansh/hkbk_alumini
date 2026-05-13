-- ==============================================================================
-- PROFILE IMAGES STORAGE SETUP
-- Run this script in your Supabase SQL Editor to initialize the bucket
-- for the Profile Image system.
-- ==============================================================================

-- 1. Create the new storage bucket
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

-- 2. Allow public access to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'profile-images' );

-- 3. Allow authenticated users to upload their own images
create policy "Authenticated users can upload"
on storage.objects for insert
with check (
  bucket_id = 'profile-images' AND 
  auth.role() = 'authenticated'
);

-- 4. Allow users to update/delete their own images
create policy "Users can update own images"
on storage.objects for update
using ( bucket_id = 'profile-images' AND auth.uid() = owner );

create policy "Users can delete own images"
on storage.objects for delete
using ( bucket_id = 'profile-images' AND auth.uid() = owner );
