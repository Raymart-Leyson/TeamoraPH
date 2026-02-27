-- Add published_at column to job_posts
ALTER TABLE public.job_posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- Initialize published_at for existing jobs that are already published
UPDATE public.job_posts 
SET published_at = created_at 
WHERE status = 'published' AND published_at IS NULL;

-- Create an index for performance on the public job list
CREATE INDEX IF NOT EXISTS idx_job_posts_status_published_at ON public.job_posts(status, published_at);
