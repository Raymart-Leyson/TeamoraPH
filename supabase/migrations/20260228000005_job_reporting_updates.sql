-- Add 'flagged' status to job_status enum
-- Since ALTER TYPE ADD VALUE cannot be inside a transaction block in some scenarios, we do it safely
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'flagged';

-- RLS for reports: ALLOW authenticated users to create reports
DROP POLICY IF EXISTS "Anyone can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" 
ON public.reports FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Ensure staff/admin can see and update reports (already handled in initial schema or previous migrations, but reinforcing)
DROP POLICY IF EXISTS "Staff and Admin can view all reports" ON public.reports;
CREATE POLICY "Staff and Admin can view all reports" 
ON public.reports FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

-- Note: We don't need to change the public job list query here 
-- because it already filters for .eq("status", "published")
-- and adding .lte("published_at", NOW())
-- 'flagged' status will naturally be excluded from these lists.
