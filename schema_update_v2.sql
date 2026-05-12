-- Schema Update v2 for Signup Page Expansion
-- Please run this in your Supabase SQL Editor to add the new columns

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch TEXT;
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

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update the handle_new_user trigger function to map these fields if using Supabase Auth Triggers
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
    department,
    branch,
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
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'branch',
    new.raw_user_meta_data->>'year_of_study',
    NULLIF(new.raw_user_meta_data->>'passout_year', '')::INTEGER,
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'job_title'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
