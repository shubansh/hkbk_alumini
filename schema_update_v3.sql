-- Schema Update v3 for Course System Integration
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_category TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passout_year INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update the handle_new_user trigger function to map the new course fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    role, 
    status,
    is_approved,
    course_category,
    course_name,
    year_of_study,
    passout_year,
    company,
    job_title
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN new.raw_user_meta_data->>'role' = 'alumni' THEN 'pending' ELSE 'approved' END,
    CASE WHEN new.raw_user_meta_data->>'role' = 'alumni' THEN false ELSE true END,
    new.raw_user_meta_data->>'course_category',
    new.raw_user_meta_data->>'course_name',
    new.raw_user_meta_data->>'year_of_study',
    NULLIF(new.raw_user_meta_data->>'passout_year', '')::INTEGER,
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'job_title'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
