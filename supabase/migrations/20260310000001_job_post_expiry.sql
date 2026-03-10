-- Job post 30-day lifecycle management
-- Rules:
--   1. If a job post is 30+ days old (from published_at) and has NO hired application → DELETE it
--   2. If a job post is 30+ days old (from published_at) and HAS a hired application → archive it (hidden from candidates)

CREATE OR REPLACE FUNCTION public.process_expired_job_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
    -- Archive jobs that have a hired application (hide from candidates)
    UPDATE public.job_posts jp
    SET status = 'archived', updated_at = NOW()
    WHERE jp.status = 'published'
      AND COALESCE(jp.published_at, jp.created_at) < cutoff
      AND EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.job_id = jp.id
            AND a.status = 'hired'
      );

    -- Delete jobs that have no hired application
    DELETE FROM public.job_posts jp
    WHERE jp.status = 'published'
      AND COALESCE(jp.published_at, jp.created_at) < cutoff
      AND NOT EXISTS (
          SELECT 1 FROM public.applications a
          WHERE a.job_id = jp.id
            AND a.status = 'hired'
      );
END;
$$;

-- NOTE: Run the following AFTER enabling pg_cron in Supabase Dashboard → Database → Extensions:
--
-- SELECT cron.schedule(
--     'expire-old-job-posts',
--     '0 2 * * *',
--     'SELECT public.process_expired_job_posts()'
-- );
