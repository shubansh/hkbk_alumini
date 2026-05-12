-- =============================================================
-- HKBK Connect - Schema Fix v4
-- PURPOSE: Fix profile creation on signup
-- RUN THIS IN: Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================

-- STEP 1: Ensure all required columns exist on profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passout_year INTEGER;

-- STEP 2: Drop ALL existing RLS policies on profiles (covers every naming variant)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can see everyone." ON profiles;
DROP POLICY IF EXISTS "Admins can see everyone" ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible to users." ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible to users" ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users." ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users" ON profiles;

-- STEP 3: Re-create clean RLS policies
-- READ: User can see their own profile
CREATE POLICY "Users can see their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- READ: Admins see all profiles
CREATE POLICY "Admins can see everyone" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- READ: Approved alumni are visible to authenticated users
CREATE POLICY "Approved alumni are visible to users" ON profiles
  FOR SELECT USING (
    role = 'alumni' AND is_approved = true AND auth.uid() IS NOT NULL
  );

-- READ: Students visible to alumni they have a connection with
CREATE POLICY "Students are visible to connected users" ON profiles
  FOR SELECT USING (
    role = 'student' AND (
      EXISTS (
        SELECT 1 FROM mentorship_requests mr
        WHERE mr.student_id = profiles.id AND mr.alumni_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE (c.user1_id = profiles.id AND c.user2_id = auth.uid())
           OR (c.user2_id = profiles.id AND c.user1_id = auth.uid())
      )
    )
  );

-- INSERT: Authenticated users can create their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- UPDATE: Admins can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );


-- STEP 4: Replace the trigger with a bulletproof version
-- This is the PRIMARY mechanism for creating profiles on signup.
-- It runs with SECURITY DEFINER so it bypasses RLS entirely.
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
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'alumni' THEN 'pending' 
      ELSE 'approved' 
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'alumni' THEN false 
      ELSE true 
    END,
    new.raw_user_meta_data->>'course_category',
    new.raw_user_meta_data->>'course_name',
    new.raw_user_meta_data->>'year_of_study',
    NULLIF(new.raw_user_meta_data->>'passout_year', '')::INTEGER,
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'job_title'
  )
  ON CONFLICT (id) DO NOTHING; -- Safe: if profile already exists, do nothing
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is attached (drop and recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
