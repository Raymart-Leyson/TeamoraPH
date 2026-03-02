-- SECURITY: Fix Stripe webhook race condition / double-credit grant.
--
-- Problem 1 — Race condition:
--   addCandidateCredits used SELECT then UPDATE (non-atomic).
--   If Stripe retried the webhook concurrently, both executions could
--   read the same balance and each add credits independently, doubling the grant.
--
-- Problem 2 — No idempotency:
--   If the webhook handler returned 500 after writing credits but before
--   responding 200, Stripe would retry and credits would be added again.
--
-- Fix A: processed_stripe_events table deduplicates on stripe_event_id.
-- Fix B: increment_bought_credits uses a single atomic UPDATE (no SELECT),
--         so concurrent calls safely add the correct total.

-- A. Idempotency table: one row per processed Stripe event.
--    The PRIMARY KEY on stripe_event_id provides the uniqueness guarantee.
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    stripe_event_id  TEXT PRIMARY KEY,
    processed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
-- No user-facing access — only the service role (webhook) touches this table.

-- B. Atomic credit increment — a single UPDATE avoids the SELECT+UPDATE race.
CREATE OR REPLACE FUNCTION public.increment_bought_credits(
    p_candidate_id UUID,
    p_amount       INTEGER
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
    UPDATE public.candidate_profiles
    SET bought_credits = COALESCE(bought_credits, 0) + p_amount
    WHERE id = p_candidate_id;
$$;
