-- ==============================================================================
-- SIDEBAR & CONTACT MESSAGES SYSTEM UPGRADE
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enforce Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view and manage contact messages" ON public.contact_messages;

-- Create Policies
-- Public/Authenticated users can insert messages
CREATE POLICY "Anyone can insert contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

-- Only Admins can view and update contact messages
-- Assuming 'role' is checked in profiles
CREATE POLICY "Admins can view and manage contact messages"
    ON public.contact_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ==============================================================================
-- DONE!
-- ==============================================================================
