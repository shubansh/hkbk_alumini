-- =============================================================
-- HKBK Connect - Schema Fix v6
-- PURPOSE: Fix admin visibility of pending alumni using a
--          SECURITY DEFINER helper function (non-recursive approach)
-- RUN THIS IN: Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================

-- STEP 1: Ensure all required columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passout_year INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Create a SECURITY DEFINER helper function
-- This function bypasses RLS entirely and reads the role directly.
-- This is the ONLY safe, non-recursive way to check if the current user is admin.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Drop ALL existing RLS policies on profiles (every naming variant)
-- ─────────────────────────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "Authenticated users can read relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Create clean, non-recursive RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- READ POLICY 1: Admins can read ALL profiles (uses security definer fn — no recursion)
CREATE POLICY "Admin full profile access" ON profiles
  FOR SELECT USING (
    public.get_my_role() = 'admin'
  );

-- READ POLICY 2: Any authenticated user can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

-- READ POLICY 3: Approved alumni are visible to authenticated users (for directory/mentorship)
CREATE POLICY "Approved alumni are visible" ON profiles
  FOR SELECT USING (
    role = 'alumni'
    AND is_approved = true
    AND auth.uid() IS NOT NULL
  );

-- READ POLICY 4: Students are visible to users they have a connection with
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

-- INSERT: Users can create their own profile (needed for signup)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- UPDATE: Admins can update any profile (uses security definer fn — no recursion)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() = 'admin'
  );

-- DELETE: Admins can delete profiles (for rejection flow)
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.get_my_role() = 'admin'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Bulletproof trigger for auto-creating profiles on signup
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES (run these separately to check your data)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT * FROM profiles WHERE status = 'pending';
-- SELECT * FROM profiles WHERE role = 'admin';
-- SELECT * FROM profiles WHERE role = 'alumni' AND is_approved = false;
