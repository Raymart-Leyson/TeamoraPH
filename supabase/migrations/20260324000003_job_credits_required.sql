-- Employers can optionally require candidates to spend more than the default
-- 1 credit when applying. 0 = free (no credits deducted), NULL falls back to
-- the platform default (1 credit). Values > 0 must be whole numbers ≥ 0.
ALTER TABLE public.job_posts
    ADD COLUMN IF NOT EXISTS credits_required INTEGER NOT NULL DEFAULT 1
        CONSTRAINT credits_required_min CHECK (credits_required >= 0);
