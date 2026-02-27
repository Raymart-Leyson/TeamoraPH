-- Admin Reports RLS Policies
-- Allow admin and staff roles to view and manage reports

BEGIN;

-- 1. Reports: Admins and Staff can view all reports
DROP POLICY IF EXISTS "Admins and Staff can view all reports" ON public.reports;
CREATE POLICY "Admins and Staff can view all reports"
ON public.reports FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

-- 2. Reports: Admins and Staff can delete reports (resolution)
DROP POLICY IF EXISTS "Admins and Staff can manage reports" ON public.reports;
CREATE POLICY "Admins and Staff can manage reports"
ON public.reports FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

-- 3. Moderation Logs: Admins and Staff can view all logs
DROP POLICY IF EXISTS "Admins and Staff can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins and Staff can view moderation logs"
ON public.moderation_logs FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
  )
);

COMMIT;
