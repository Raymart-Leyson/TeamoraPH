-- 1. Create Time Sessions Table (Tracks the start and stop of a shift)
CREATE TABLE public.time_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- Time Sessions Policies
CREATE POLICY "Candidates can insert their own sessions" ON public.time_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can view their own sessions" ON public.time_sessions
    FOR SELECT TO authenticated USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can view sessions for their hired candidates" ON public.time_sessions
    FOR SELECT TO authenticated USING (auth.uid() = employer_id);

CREATE POLICY "Candidates can update their own sessions" ON public.time_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = candidate_id);


-- 2. Create Time Proofs Table (Tracks the individual 10-minute screenshots)
CREATE TABLE public.time_proof_screenshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.time_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    keyboard_strokes INTEGER DEFAULT 0,
    mouse_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.time_proof_screenshots ENABLE ROW LEVEL SECURITY;

-- Time Proofs Policies
CREATE POLICY "Candidates can insert their own proofs" ON public.time_proof_screenshots
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates can view their own proofs" ON public.time_proof_screenshots
    FOR SELECT TO authenticated USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can view proofs for their hired candidates" ON public.time_proof_screenshots
    FOR SELECT TO authenticated USING (auth.uid() = employer_id);


-- 3. Create Storage Bucket for Screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('time_proofs', 'time_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies
CREATE POLICY "Authenticated users can upload time proofs" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'time_proofs');

CREATE POLICY "Public can view time proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'time_proofs');
