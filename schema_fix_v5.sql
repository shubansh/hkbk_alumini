-- =============================================================
-- HKBK Connect - Schema Fix v5
-- PURPOSE: Fix recursive RLS policies causing role detection failure
-- CRITICAL FIX: Remove recursive subqueries from SELECT policies
-- RUN THIS IN: Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================

-- STEP 1: Ensure all required columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passout_year INTEGER;

-- STEP 2: Drop ALL existing RLS policies on profiles (every naming variant)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
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
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON profiles;

-- STEP 3: Re-create clean, non-recursive RLS policies
-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL: The admin policy previously used:
--   (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
-- This is RECURSIVE — to check if you're admin, Postgres reads profiles,
-- which triggers the same policy, which reads profiles... causing NULL return.
-- FIX: Combine all read access into a single non-recursive policy.
-- ─────────────────────────────────────────────────────────────────────────────

-- READ: Any authenticated user can read profiles that belong to:
--   1. Themselves (covers all roles including admin)
--   2. Approved alumni (visible to all authenticated users)
--   3. Students who have a mentorship or conversation connection
CREATE POLICY "Authenticated users can read relevant profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      -- Own profile (this is the critical one for role detection)
      id = auth.uid()
      OR
      -- Approved alumni visible to everyone
      (role = 'alumni' AND is_approved = true)
      OR
      -- Students visible to connected users (mentorship or chat)
      (role = 'student' AND (
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
      ))
    )
  );

-- INSERT: Users can create their own profile (needed for signup fallback upsert)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- UPDATE: Admins can update any profile
-- NOTE: We use auth.jwt() to get the role claim instead of a recursive subquery.
-- If your Supabase project does not expose role in the JWT, the simpler
-- "auth.uid() = id" update policy is sufficient — admins also match that.
-- This policy uses a safe approach: check the JWT app_metadata.
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );


-- STEP 4: Bulletproof trigger for auto-creating profiles on signup
-- Runs SECURITY DEFINER so it always bypasses RLS
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
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
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
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
