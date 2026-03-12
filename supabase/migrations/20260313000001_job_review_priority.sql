-- Add review_priority to job_posts
-- 1 = Premium (highest, reviewed first)
-- 2 = Pro
-- 3 = Free (lowest)
ALTER TABLE public.job_posts
    ADD COLUMN IF NOT EXISTS review_priority INTEGER NOT NULL DEFAULT 3;

-- Add stripe_price_id to subscriptions if not already present (stored by webhook)
ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Index to make priority-sorted review queue fast
CREATE INDEX IF NOT EXISTS idx_job_posts_review_priority
    ON public.job_posts (review_priority ASC, created_at ASC)
    WHERE status = 'pending_review';
