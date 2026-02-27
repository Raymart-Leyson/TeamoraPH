-- Add missing verification columns to profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS id_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS social_verified BOOLEAN NOT NULL DEFAULT false;

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'id_doc', 'selfie', 'social_link'
    documents TEXT[] DEFAULT '{}',
    notes TEXT, -- used for social URL or review notes
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users view own verification requests" ON public.verification_requests;
CREATE POLICY "Users view own verification requests"
    ON public.verification_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Users can submit their own requests
DROP POLICY IF EXISTS "Users submit verification requests" ON public.verification_requests;
CREATE POLICY "Users submit verification requests"
    ON public.verification_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins/staff/owner can view all
DROP POLICY IF EXISTS "Admins view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins view all verification requests"
    ON public.verification_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff')
        )
    );

-- Admins/staff/owner can update (approve/reject)
DROP POLICY IF EXISTS "Admins update verification requests" ON public.verification_requests;
CREATE POLICY "Admins update verification requests"
    ON public.verification_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner', 'staff')
        )
    );
