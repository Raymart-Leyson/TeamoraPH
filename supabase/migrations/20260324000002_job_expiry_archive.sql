-- Function: archive all published jobs whose expires_at has passed
CREATE OR REPLACE FUNCTION public.archive_expired_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE public.job_posts
    SET    status = 'archived'
    WHERE  status = 'published'
      AND  expires_at IS NOT NULL
      AND  expires_at < NOW();

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_expired_jobs() TO service_role;

-- Schedule via pg_cron (runs every hour at :00)
-- pg_cron is enabled by default on Supabase Pro; safe to skip if not available.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.schedule(
            'archive-expired-jobs',
            '0 * * * *',
            'SELECT public.archive_expired_jobs()'
        );
    END IF;
END;
$$;
