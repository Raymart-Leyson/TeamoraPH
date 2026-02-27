-- Admin & Staff Operations Schema Updates

BEGIN;

-- 1. Add 'pending_review' to job_status enum safely
-- Enum values can't be added in a transaction in some versions of Postgres,
-- but adding it before the block or using a separate script is better if it fails.
-- However, for the SQL editor, we can try this:
-- Note: 'dropped' and 'rejected' are also useful for moderation
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'pending_review';

-- 2. Add moderation fields to job_posts
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);

-- 3. Add moderation fields to profiles (for user verifications)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- 4. Create an audit log for moderation actions (Optional but recommended)
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES public.profiles(id) NOT NULL,
    target_id UUID NOT NULL, -- ID of the job or profile
    target_type TEXT NOT NULL, -- 'job' or 'verification'
    action TEXT NOT NULL, -- 'approve', 'reject', 'flag'
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Admin and Staff
-- Admins and Staff can see all jobs (even pending/draft)
-- We need to check if existing policies restrict this.

-- Generic policy for staff/admin to view everything in important tables
-- (Adjusting existing policies might be better, but this is a fail-safe)
DROP POLICY IF EXISTS "Staff and Admin can view all job posts" ON public.job_posts;
CREATE POLICY "Staff and Admin can view all job posts" 
ON public.job_posts FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

DROP POLICY IF EXISTS "Staff and Admin can update all job posts" ON public.job_posts;
CREATE POLICY "Staff and Admin can update all job posts"
ON public.job_posts FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

COMMIT;
