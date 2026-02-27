-- 1. Add 'interviewing' to application_status if not exists
COMMIT;
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'interviewing';

-- 2. Modify job_posts to include skills_required and remote_region
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS skills_required TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS remote_region TEXT;

-- 3. Create saved_jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.job_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);

-- 4. Create notifications table
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('message', 'application_update', 'job_alert', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  read_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create candidate_experience table
CREATE TABLE IF NOT EXISTS public.candidate_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  responsibilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create candidate_education table
CREATE TABLE IF NOT EXISTS public.candidate_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  school_name TEXT NOT NULL,
  degree_level TEXT NOT NULL,
  field_of_study TEXT,
  start_year TEXT NOT NULL,
  end_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create candidate_certifications table
CREATE TABLE IF NOT EXISTS public.candidate_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuing_org TEXT NOT NULL,
  issue_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create candidate_projects table
CREATE TABLE IF NOT EXISTS public.candidate_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  role_in_project TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create candidate_skills table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Create application_notes table
CREATE TABLE IF NOT EXISTS public.application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for all new tables
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Policies macro-equivalent for candidate specific items: Viewable by anyone, Editable by self
DO $$
DECLARE
  table_names text[] := ARRAY['candidate_experience', 'candidate_education', 'candidate_certifications', 'candidate_projects', 'candidate_skills'];
  t text;
BEGIN
  FOREACH t IN ARRAY table_names
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Public view for ' || t || '" ON public.' || t;
    EXECUTE 'CREATE POLICY "Public view for ' || t || '" ON public.' || t || ' FOR SELECT USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Candidates manage their own ' || t || '" ON public.' || t;
    EXECUTE 'CREATE POLICY "Candidates manage their own ' || t || '" ON public.' || t || ' FOR ALL USING (auth.uid() = candidate_id)';
  END LOOP;
END $$;

-- Policies for saved_jobs
DROP POLICY IF EXISTS "Candidates view own saved jobs" ON public.saved_jobs;
CREATE POLICY "Candidates view own saved jobs" ON public.saved_jobs FOR SELECT USING (auth.uid() = candidate_id);
DROP POLICY IF EXISTS "Candidates insert own saved jobs" ON public.saved_jobs;
CREATE POLICY "Candidates insert own saved jobs" ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = candidate_id);
DROP POLICY IF EXISTS "Candidates delete own saved jobs" ON public.saved_jobs;
CREATE POLICY "Candidates delete own saved jobs" ON public.saved_jobs FOR DELETE USING (auth.uid() = candidate_id);

-- Policies for notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System and Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "System and Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for application_notes
DROP POLICY IF EXISTS "Employers view notes for their applications" ON public.application_notes;
CREATE POLICY "Employers view notes for their applications" ON public.application_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications a JOIN public.job_posts jp ON a.job_id = jp.id WHERE a.id = application_notes.application_id AND jp.author_id = auth.uid())
);
DROP POLICY IF EXISTS "Employers insert notes for their applications" ON public.application_notes;
CREATE POLICY "Employers insert notes for their applications" ON public.application_notes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications a JOIN public.job_posts jp ON a.job_id = jp.id WHERE a.id = application_notes.application_id AND jp.author_id = auth.uid())
);
DROP POLICY IF EXISTS "Employers update their own notes" ON public.application_notes;
CREATE POLICY "Employers update their own notes" ON public.application_notes FOR UPDATE USING (auth.uid() = employer_id);
DROP POLICY IF EXISTS "Employers delete their own notes" ON public.application_notes;
CREATE POLICY "Employers delete their own notes" ON public.application_notes FOR DELETE USING (auth.uid() = employer_id);

-- Add notification table to realtime publications safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
