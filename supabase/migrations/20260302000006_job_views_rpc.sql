-- Atomic job view increment
-- Increments job_posts.views for a given job ID.
-- Uses SECURITY DEFINER so anon visitors can trigger it without direct table write access.
-- Called from: /jobs/[id]/page.tsx via supabase.rpc('increment_job_views', { job_id })

-- Ensure the views column exists (safe to run multiple times)
ALTER TABLE public.job_posts
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_job_views(job_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.job_posts
    SET views = COALESCE(views, 0) + 1
    WHERE id = job_id;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_job_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_job_views(UUID) TO authenticated;
