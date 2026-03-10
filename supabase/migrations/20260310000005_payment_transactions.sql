-- Create payment_transactions table.
-- The Stripe webhook handler inserts into this table on successful checkout,
-- but the table was never created — causing every subscription purchase to
-- fail silently after the subscription was already upserted.

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id          UUID        REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_invoice_id    TEXT,
    amount               NUMERIC(10, 2) NOT NULL,
    currency             TEXT        NOT NULL DEFAULT 'usd',
    status               TEXT        NOT NULL DEFAULT 'paid',
    billing_period_start TIMESTAMPTZ,
    billing_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Employers can view their own payment history
CREATE POLICY "Employers view own transactions"
ON public.payment_transactions FOR SELECT
USING (employer_id = auth.uid());

-- Admin / staff / owner can view all transactions
CREATE POLICY "Admin can view all transactions"
ON public.payment_transactions FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    )
);
