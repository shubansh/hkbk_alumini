-- =============================================================
-- HKBK Connect - Schema v8 (Faculty + Jobs Expiry + Full Fix)
-- RUN THIS IN: Supabase SQL Editor → New Query → Run All
-- =============================================================

-- ─── PART 1: Heal profile data inconsistency ──────────────────────────────────
UPDATE public.profiles SET is_approved = true
  WHERE role = 'alumni' AND status = 'approved' AND is_approved = false;
UPDATE public.profiles SET is_approved = false
  WHERE role = 'alumni' AND status = 'pending' AND is_approved = true;
UPDATE public.profiles SET is_approved = true, status = 'approved'
  WHERE role = 'student' AND (is_approved = false OR status != 'approved');
UPDATE public.profiles SET is_approved = true, status = 'approved'
  WHERE role = 'admin';

-- ─── PART 2: Add missing profile columns ──────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio          TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved  BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course_name  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passout_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title    TEXT;

-- ─── PART 3: Jobs table — add expires_at ──────────────────────────────────────
-- NOTE: GENERATED ALWAYS AS fails with "not immutable" because created_at
-- uses now(). Use a plain column + trigger instead.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill existing rows that don't have expires_at yet
UPDATE jobs SET expires_at = created_at + INTERVAL '30 days'
  WHERE expires_at IS NULL;

-- Trigger: auto-set expires_at = created_at + 30 days on every INSERT
CREATE OR REPLACE FUNCTION public.set_job_expiry()
RETURNS trigger AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_job_expiry ON jobs;
CREATE TRIGGER trg_set_job_expiry
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE PROCEDURE public.set_job_expiry();

-- ─── PART 4: Faculty table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faculty (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  department    TEXT,
  designation   TEXT,
  type          TEXT NOT NULL DEFAULT 'faculty',
  image_url     TEXT,
  bio           TEXT,
  email         TEXT,
  linkedin_url  TEXT,
  is_visible    BOOLEAN NOT NULL DEFAULT true,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ADD COLUMNS IF NOT EXISTS — handles the case where the table already existed
-- without these columns (partial run). Safe to run multiple times.
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS department   TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS designation  TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS type         TEXT NOT NULL DEFAULT 'faculty';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS bio          TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS email        TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS is_visible   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS is_featured  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- Enable RLS on faculty
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Drop old faculty policies before recreating
DROP POLICY IF EXISTS "Faculty visible to public" ON faculty;
DROP POLICY IF EXISTS "Admin manages faculty"     ON faculty;
DROP POLICY IF EXISTS "Admin inserts faculty"     ON faculty;
DROP POLICY IF EXISTS "Admin deletes faculty"     ON faculty;

CREATE POLICY "Faculty visible to public" ON faculty
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admin manages faculty" ON faculty
  FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin inserts faculty" ON faculty
  FOR INSERT WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admin deletes faculty" ON faculty
  FOR DELETE USING (public.get_my_role() = 'admin');


-- ─── PART 5: get_my_role() helper (safe non-recursive admin check) ────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- ─── PART 6: Drop all old profile RLS policies ────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone."   ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone"    ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile."         ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"          ON profiles;
DROP POLICY IF EXISTS "Users can update own profile."               ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"                ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile."              ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile"               ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile."            ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile"             ON profiles;
DROP POLICY IF EXISTS "Admins can see everyone."                    ON profiles;
DROP POLICY IF EXISTS "Admins can see everyone"                     ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible to users."       ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible to users"        ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible."                ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible"                 ON profiles;
DROP POLICY IF EXISTS "Approved alumni are publicly visible"        ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users."    ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users"     ON profiles;
DROP POLICY IF EXISTS "Users can read own profile"                  ON profiles;
DROP POLICY IF EXISTS "Anyone authenticated can read profiles"      ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read relevant profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"                 ON profiles;
DROP POLICY IF EXISTS "Admin full profile access"                   ON profiles;
DROP POLICY IF EXISTS "Admin full read access"                      ON profiles;
DROP POLICY IF EXISTS "Students visible to connections"             ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles"                  ON profiles;

-- ─── PART 7: Fresh clean RLS policies for profiles ────────────────────────────

-- Anyone can view approved alumni (public directory)
CREATE POLICY "Approved alumni are publicly visible" ON profiles
  FOR SELECT USING (
    role = 'alumni' AND (is_approved = true OR status = 'approved')
  );

-- Every logged-in user can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin reads ALL (non-recursive via SECURITY DEFINER function)
CREATE POLICY "Admin full read access" ON profiles
  FOR SELECT USING (public.get_my_role() = 'admin');

-- Students visible only to users they have a connection with
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

-- Users insert their own profile (signup fallback)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin updates any profile
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR public.get_my_role() = 'admin');

-- Admin deletes profiles (rejection flow)
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.get_my_role() = 'admin');

-- ─── PART 8: Signup trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role, status, is_approved,
    course_category, course_name, year_of_study, passout_year,
    company, job_title
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
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
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── VERIFICATION ─────────────────────────────────────────────────────────────
-- SELECT id, full_name, role, status, is_approved FROM profiles ORDER BY role;
-- SELECT count(*) FROM profiles WHERE role='alumni' AND (status='approved' OR is_approved=true);
-- SELECT * FROM faculty LIMIT 5;
