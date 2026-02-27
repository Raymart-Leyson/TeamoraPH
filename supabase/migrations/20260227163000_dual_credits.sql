-- Migration to split credit_balance into bought_credits and add free_credits
BEGIN;

-- 1. Rename existing credit_balance to bought_credits
ALTER TABLE public.candidate_profiles RENAME COLUMN credit_balance TO bought_credits;

-- 2. Add free_credits and last_credit_refresh
ALTER TABLE public.candidate_profiles 
ADD COLUMN IF NOT EXISTS free_credits INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS last_credit_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Add stripe_customer_id
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 4. Update bought_credits to ensure it defaults to 0 if null (shouldn't happen but for safety)
ALTER TABLE public.candidate_profiles ALTER COLUMN bought_credits SET DEFAULT 0;

COMMIT;
