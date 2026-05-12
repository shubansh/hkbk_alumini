-- =============================================================
-- HKBK Connect - Schema Fix v7
-- PURPOSE: Fix alumni directory visibility
-- PROBLEM: Alumni with status='approved' but is_approved=false
--          are blocked by RLS because policy checks is_approved=true
-- FIX:     1. Heal data inconsistency
--          2. Fix RLS to check BOTH fields (OR logic)
--          3. Re-create clean non-recursive policies
-- RUN THIS IN: Supabase SQL Editor (New Query)
-- =============================================================

-- ─── STEP 1: Heal data inconsistency ─────────────────────────────────────────
-- Some rows may have status='approved' but is_approved=false (or vice versa).
-- Sync both columns to be consistent.
UPDATE public.profiles
  SET is_approved = true
  WHERE role = 'alumni' AND status = 'approved' AND is_approved = false;

UPDATE public.profiles
  SET is_approved = false
  WHERE role = 'alumni' AND status = 'pending' AND is_approved = true;

-- Ensure students always have is_approved = true and status = 'approved'
UPDATE public.profiles
  SET is_approved = true, status = 'approved'
  WHERE role = 'student' AND (is_approved = false OR status != 'approved');

-- ─── STEP 2: Helper function (non-recursive admin check) ──────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- ─── STEP 3: Drop ALL existing RLS policies on profiles ───────────────────────
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
DROP POLICY IF EXISTS "Approved alumni are visible." ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible" ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users." ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin full profile access" ON profiles;
DROP POLICY IF EXISTS "Students visible to connections" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- ─── STEP 4: Re-create clean RLS policies ─────────────────────────────────────

-- POLICY 1: Anyone (even unauthenticated) can browse approved alumni directory
-- This is PUBLIC data — same as LinkedIn profiles.
CREATE POLICY "Approved alumni are publicly visible" ON profiles
  FOR SELECT USING (
    role = 'alumni'
    AND (is_approved = true OR status = 'approved')
  );

-- POLICY 2: Own profile always readable (for dashboard, sidebar, etc.)
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

-- POLICY 3: Admin can read ALL profiles (uses SECURITY DEFINER fn — no recursion)
CREATE POLICY "Admin full read access" ON profiles
  FOR SELECT USING (
    public.get_my_role() = 'admin'
  );

-- POLICY 4: Students visible to users they have a mentorship/conversation with
CREATE POLICY "Students visible to connections" ON profiles
  FOR SELECT USING (
    role = 'student'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM mentorship_requests mr
        WHERE mr.student_id = profiles.id AND mr.alumni_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM conversations c
        WHERE (c.user1_id = profiles.id AND c.user2_id = auth.uid())
           OR (c.user2_id = profiles.id AND c.user1_id = auth.uid())
      )
    )
  );

-- POLICY 5: INSERT — users create their own profile (signup)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- POLICY 6: UPDATE — users update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- POLICY 7: UPDATE — admin can update any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  );

-- POLICY 8: DELETE — admin can delete profiles (for rejection)
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );

-- ─── STEP 5: Bulletproof signup trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role, status, is_approved,
    course_category, course_name, year_of_study, passout_year,
    company, job_title
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── VERIFICATION ─────────────────────────────────────────────────────────────
-- Run these separately to check your data:
-- SELECT id, full_name, role, status, is_approved FROM profiles ORDER BY role;
-- SELECT count(*) FROM profiles WHERE role='alumni' AND (status='approved' OR is_approved=true);
