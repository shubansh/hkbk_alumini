-- ==============================================================================
-- JOBS TABLE MIGRATION — Safely add missing columns to production jobs table
-- Run this in your Supabase SQL Editor. Safe to run multiple times.
-- ==============================================================================

-- 1. Add job_type column
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'Full-time';

-- Add CHECK constraint if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'jobs' AND constraint_name = 'jobs_job_type_check'
  ) THEN
    ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
      CHECK (job_type IN ('Full-time', 'Internship', 'Contract', 'Part-time'));
  END IF;
END $$;

-- 2. Add salary column (optional display field e.g. "₹8-12 LPA")
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary TEXT;

-- 3. Add skills column (comma-separated string "React,Node.js,SQL")
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS skills TEXT;

-- 4. Add is_active flag (soft-delete without losing data)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 5. Add updated_at timestamp
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 6. Approve all currently pending jobs so they show on the public jobs page
UPDATE jobs SET status = 'approved' WHERE status = 'pending';

-- 7. Fix INSERT RLS — allow approved alumni to post jobs with status='approved'
DROP POLICY IF EXISTS "Approved alumni can insert jobs" ON jobs;
CREATE POLICY "Approved alumni can insert jobs" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'alumni' AND
    (
      (SELECT is_approved FROM profiles WHERE id = auth.uid()) = TRUE
      OR (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
    )
  );

-- 8. Allow alumni to UPDATE their own jobs
DROP POLICY IF EXISTS "Alumni can update own jobs" ON jobs;
CREATE POLICY "Alumni can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = posted_by);

-- 9. Allow alumni to view their own jobs (regardless of status)
DROP POLICY IF EXISTS "Alumni can view own jobs" ON jobs;
CREATE POLICY "Alumni can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = posted_by);

-- NOTE: Do NOT run ALTER PUBLICATION again if you see:
-- "relation jobs is already member of publication supabase_realtime"
-- That means realtime is already enabled for jobs. That's fine.

-- ==============================================================================
-- DONE! After running, go to Supabase Table Editor > jobs and refresh the page
-- to clear the schema cache before testing job posting.
-- ==============================================================================
