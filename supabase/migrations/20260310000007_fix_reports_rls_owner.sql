-- Fix reports RLS to include 'owner' role.
--
-- Migration 20260228000003_admin_reports_rls.sql created SELECT/DELETE policies
-- for 'admin' and 'staff' on the reports table, but the 'owner' role was added
-- later (20260228000006) and was never included. Owners could not see reports.
--
-- Recreate both policies with 'owner' included.

DROP POLICY IF EXISTS "Admins and Staff can view all reports" ON public.reports;
CREATE POLICY "Admins and Staff can view all reports"
ON public.reports FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    )
);

DROP POLICY IF EXISTS "Admins and Staff can manage reports" ON public.reports;
CREATE POLICY "Admins and Staff can manage reports"
ON public.reports FOR DELETE
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    )
);
