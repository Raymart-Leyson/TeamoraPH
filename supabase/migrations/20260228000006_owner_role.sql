-- Add 'owner' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';

-- Note: In a real production environment, you might need to handle enum modifications outside a single transaction block.

-- Utility function to easily assign the owner role (Run this in Supabase SQL editor):
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'your-email@example.com';

-- Update RLS policies to include 'owner' wherever 'admin' and 'staff' have access

-- 1. job_posts (view all)
DROP POLICY IF EXISTS "Staff and Admin can view all job posts" ON public.job_posts;
CREATE POLICY "Staff and Admin can view all job posts" 
ON public.job_posts FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));

-- 2. job_posts (update all)
DROP POLICY IF EXISTS "Staff and Admin can update all job posts" ON public.job_posts;
CREATE POLICY "Staff and Admin can update all job posts"
ON public.job_posts FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));

-- 3. platform_reports (view all)
DROP POLICY IF EXISTS "Staff and Admin can view all reports" ON public.platform_reports;
CREATE POLICY "Staff and Admin can view all reports" 
ON public.platform_reports FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));

-- 4. platform_reports (update all)
DROP POLICY IF EXISTS "Staff and Admin can update all reports" ON public.platform_reports;
CREATE POLICY "Staff and Admin can update all reports"
ON public.platform_reports FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));

-- 5. manage objects via reports rls
DROP POLICY IF EXISTS "Staff and Admin can manage target objects" ON public.platform_reports;
CREATE POLICY "Staff and Admin can manage target objects"
ON public.platform_reports FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));

-- 6. job_reporting_updates specific (if any duplicates, drop handles it)
DROP POLICY IF EXISTS "Staff and admin can view all reports" ON public.platform_reports;
CREATE POLICY "Staff and admin can view all reports" 
ON public.platform_reports FOR SELECT 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('owner', 'admin', 'staff')));
