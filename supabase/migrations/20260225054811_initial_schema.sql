-- Create roles enum
CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE job_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'rejected', 'hired');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- 1) profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'candidate',
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) candidate_profiles
CREATE TABLE public.candidate_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  resume_url TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) employer_profiles
CREATE TABLE public.employer_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) job_posts
CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  job_type TEXT,
  salary_range TEXT,
  status job_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_posts(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  cover_letter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- 7) conversations & messages
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8) subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9) admin reports/moderation
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL, -- can be job_id or user_id
  target_type TEXT NOT NULL, -- 'job' or 'user'
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Anyone can read profiles. Users can update their own profile.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Candidate Profiles: viewable by everyone, updatable by themselves
CREATE POLICY "Candidate profiles are viewable by everyone" ON public.candidate_profiles FOR SELECT USING (true);
CREATE POLICY "Candidates can insert own profile" ON public.candidate_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Candidates can update own profile" ON public.candidate_profiles FOR UPDATE USING (auth.uid() = id);

-- Companies: viewable by everyone, insert/update by verified employers (simpified: any authenticated user)
CREATE POLICY "Companies viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Employers can update their company" ON public.companies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.employer_profiles WHERE employer_profiles.company_id = id AND employer_profiles.id = auth.uid())
);

-- Employer Profiles: viewable by everyone, updatable by themselves
CREATE POLICY "Employer profiles viewable by everyone" ON public.employer_profiles FOR SELECT USING (true);
CREATE POLICY "Employers can insert own profile" ON public.employer_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Employers can update own profile" ON public.employer_profiles FOR UPDATE USING (auth.uid() = id);

-- Job Posts: Viewable by everyone if published, or if employer owns it. Insert/Update by employer of that company.
CREATE POLICY "View published jobs" ON public.job_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Employers view own jobs" ON public.job_posts FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Employers insert jobs" ON public.job_posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Employers update own jobs" ON public.job_posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Employers delete own jobs" ON public.job_posts FOR DELETE USING (author_id = auth.uid());

-- Applications: candidate views own, employer views for their jobs
CREATE POLICY "Candidates view own applications" ON public.applications FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Employers view applications to their jobs" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.job_posts WHERE job_posts.id = public.applications.job_id AND job_posts.author_id = auth.uid())
);
CREATE POLICY "Candidates can apply" ON public.applications FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Employers can update application status" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.job_posts WHERE job_posts.id = public.applications.job_id AND job_posts.author_id = auth.uid())
);

-- Conversations
CREATE POLICY "Participants can view conversations" ON public.conversations FOR SELECT USING (
  employer_id = auth.uid() OR candidate_id = auth.uid()
);
CREATE POLICY "Employers can start conversation" ON public.conversations FOR INSERT WITH CHECK (
  employer_id = auth.uid()
);

-- Messages
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = public.messages.conversation_id AND (conversations.employer_id = auth.uid() OR conversations.candidate_id = auth.uid()))
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = public.messages.conversation_id AND (conversations.employer_id = auth.uid() OR conversations.candidate_id = auth.uid()))
);

-- Subscriptions: Employer views own
CREATE POLICY "Employers view own subs" ON public.subscriptions FOR SELECT USING (employer_id = auth.uid());
-- Only service role (webhook) should insert/update subscriptions, so no public insert rules needed

-- Reports: Authenticated create, admins view (no admin rule here, assume full access by RLS bypass or explicit later)
CREATE POLICY "Authenticated users can report" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Create function to handle new auth user
CREATE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidate'::user_role)
  );
  
  -- Also initialize specific profile based on role
  IF (new.raw_user_meta_data->>'role') = 'employer' THEN
    INSERT INTO public.employer_profiles (id) VALUES (new.id);
  ELSE
    INSERT INTO public.candidate_profiles (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$;

-- Trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable replication for realtime (subscriptions, messages)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
