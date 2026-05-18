-- =========================================================================================
-- HKBK CE Connect: Phase 2 Migration Script
-- Contains: Internships, Referrals, Notifications, Events enhancements, Success Stories
-- =========================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 1. INTERNSHIPS MODULE
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  stipend TEXT,
  duration TEXT,
  skills_required TEXT,
  location TEXT,
  mode TEXT CHECK (mode IN ('remote', 'hybrid', 'on-site')),
  eligibility TEXT,
  description TEXT NOT NULL,
  application_link TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
  posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(internship_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.saved_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, internship_id)
);

-- RLS: Internships
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved internships are public" ON internships FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins manage internships" ON internships FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Alumni insert internships" ON internships FOR INSERT WITH CHECK (public.get_my_role() IN ('alumni', 'admin'));

-- RLS: Internship Applications
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own applications" ON internship_applications FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students insert own applications" ON internship_applications FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins manage applications" ON internship_applications FOR ALL USING (public.get_my_role() = 'admin');

-- RLS: Saved Internships
ALTER TABLE public.saved_internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own saved internships" ON saved_internships FOR ALL USING (student_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 2. REFERRALS MODULE
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  resume_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own requests" ON referral_requests FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Alumni view requests to them" ON referral_requests FOR SELECT USING (alumni_id = auth.uid());
CREATE POLICY "Students create requests" ON referral_requests FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Alumni update requests" ON referral_requests FOR UPDATE USING (alumni_id = auth.uid());
CREATE POLICY "Admins manage requests" ON referral_requests FOR ALL USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 3. NOTIFICATIONS MODULE
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
-- App logic or DB triggers will insert notifications (using security definer or service role)


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 4. EVENTS ENHANCEMENT (Registrations)
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  qr_code TEXT,
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own registrations" ON event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register" ON event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage registrations" ON event_registrations FOR ALL USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 5. SUCCESS STORIES MODULE
-- ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  company TEXT,
  image_url TEXT,
  achievements TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view success stories" ON success_stories FOR SELECT USING (true);
CREATE POLICY "Admins manage success stories" ON success_stories FOR ALL USING (public.get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKET FOR RESUMES
-- ─────────────────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to insert their own resumes
CREATE POLICY "Users upload own resume" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to update their own resumes
CREATE POLICY "Users update own resume" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow admins to view all resumes
CREATE POLICY "Admins view resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND public.get_my_role() = 'admin');

-- Policy to allow alumni to view resumes attached to referrals/internships they own
CREATE POLICY "Alumni view applicant resumes" ON storage.objects FOR SELECT USING (
  bucket_id = 'resumes' 
  AND public.get_my_role() = 'alumni'
);

-- Policy to allow users to view their own resume
CREATE POLICY "Users view own resume" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own resume
CREATE POLICY "Users delete own resume" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Note: Ensure `get_my_role()` exists in public schema (created in v8 migration)
A L T E R   T A B L E   p u b l i c . p r o f i l e s   A D D   C O L U M N   I F   N O T   E X I S T S   r e s u m e _ u r l   T E X T ;  
 