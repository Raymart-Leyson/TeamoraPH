-- Track how many times an employer has manually checked their payment today
ALTER TABLE public.payment_proofs
    ADD COLUMN IF NOT EXISTS check_attempts    INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_check_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_check_date   DATE; -- UTC date for daily reset
