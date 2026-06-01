-- Supabase Schema for HKBK Connect

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  avatar_url TEXT,
  company TEXT,
  job_title TEXT,
  location TEXT,
  graduation_year INTEGER,
  bio TEXT,
  course_category TEXT,
  course_name TEXT,
  year_of_study TEXT,
  passout_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add new columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can see everyone" ON profiles;
DROP POLICY IF EXISTS "Approved alumni are visible to users" ON profiles;
DROP POLICY IF EXISTS "Students are visible to connected users" ON profiles;


-- ==========================================
-- 2. CONVERSATIONS & MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can see their conversations" ON conversations
  FOR SELECT USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));


-- Messages Table (Preserving legacy columns)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT, -- Legacy support
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add new columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS text TEXT;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can see their messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- ==========================================
-- 3. MENTORSHIP REQUESTS
-- ==========================================
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, alumni_id)
);

ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their mentorship requests" ON mentorship_requests;
DROP POLICY IF EXISTS "Students can create mentorship requests" ON mentorship_requests;
DROP POLICY IF EXISTS "Alumni can update their mentorship requests" ON mentorship_requests;

CREATE POLICY "Users can see their mentorship requests" ON mentorship_requests
  FOR SELECT USING (auth.uid() IN (student_id, alumni_id));

CREATE POLICY "Students can create mentorship requests" ON mentorship_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Alumni can update their mentorship requests" ON mentorship_requests
  FOR UPDATE USING (auth.uid() = alumni_id);


-- ==========================================
-- 4. STRICT PROFILES RLS POLICIES
-- ==========================================
-- (Must be created after conversations & mentorship tables exist)

CREATE POLICY "Users can see their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can see everyone" ON profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved alumni are visible to users" ON profiles
  FOR SELECT USING (
    role = 'alumni' AND is_approved = true AND auth.uid() IS NOT NULL
  );

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

-- Profile mutation policies
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );


-- ==========================================
-- 5. OTHER TABLES
-- ==========================================

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  link TEXT,
  posted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approved jobs are viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
DROP POLICY IF EXISTS "Approved alumni can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;

CREATE POLICY "Approved jobs are viewable by everyone" ON jobs
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can view all jobs" ON jobs
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved alumni can insert jobs" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'alumni' AND
    (SELECT status FROM profiles WHERE id = auth.uid()) = 'approved'
  );

CREATE POLICY "Admins can update jobs" ON jobs
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );


-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;

CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON events 
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- People Table
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    department TEXT NOT NULL,
    image_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('faculty', 'alumni')),
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view people" ON people;
DROP POLICY IF EXISTS "Admins can manage people" ON people;

CREATE POLICY "Anyone can view people" ON people FOR SELECT USING (true);
CREATE POLICY "Admins can manage people" ON people FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('campus', 'events')),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON platform_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON platform_settings;

CREATE POLICY "Settings are viewable by everyone" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON platform_settings
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN COALESCE(new.raw_user_meta_data->>'role', 'student') = 'alumni' THEN 'pending' ELSE 'approved' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
