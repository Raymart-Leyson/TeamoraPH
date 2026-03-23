CREATE TABLE IF NOT EXISTS public.candidate_credit_purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE NOT NULL,
    package_key     TEXT NOT NULL CHECK (package_key IN ('basic', 'standard', 'premium')),
    credits         INTEGER NOT NULL,
    amount          NUMERIC(10, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'PHP' CHECK (currency IN ('PHP', 'USD')),
    wise_reference  TEXT UNIQUE,
    wise_transfer_id TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes           TEXT,
    screenshot_url  TEXT,
    reviewed_by     UUID REFERENCES public.profiles(id),
    reviewed_at     TIMESTAMPTZ,
    check_attempts  INTEGER NOT NULL DEFAULT 0,
    last_check_date DATE,
    last_check_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_credit_purchases_candidate_idx
    ON public.candidate_credit_purchases (candidate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS candidate_credit_purchases_wise_ref_idx
    ON public.candidate_credit_purchases (wise_reference)
    WHERE wise_reference IS NOT NULL;

ALTER TABLE public.candidate_credit_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidate can view own purchases" ON public.candidate_credit_purchases;
DROP POLICY IF EXISTS "Candidate can insert own purchase" ON public.candidate_credit_purchases;
DROP POLICY IF EXISTS "Candidate can update own purchase" ON public.candidate_credit_purchases;
DROP POLICY IF EXISTS "Moderators can view all candidate purchases" ON public.candidate_credit_purchases;
DROP POLICY IF EXISTS "Moderators can update candidate purchases" ON public.candidate_credit_purchases;

CREATE POLICY "Candidate can view own purchases"
    ON public.candidate_credit_purchases FOR SELECT
    USING (candidate_id = auth.uid());

CREATE POLICY "Candidate can insert own purchase"
    ON public.candidate_credit_purchases FOR INSERT
    WITH CHECK (
        candidate_id = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.candidate_credit_purchases p
            WHERE p.candidate_id = auth.uid() AND p.status = 'pending'
        )
    );

-- Candidates need UPDATE to allow check_attempts to be recorded
CREATE POLICY "Candidate can update own purchase"
    ON public.candidate_credit_purchases FOR UPDATE
    USING (candidate_id = auth.uid());

CREATE POLICY "Moderators can view all candidate purchases"
    ON public.candidate_credit_purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff', 'owner')
        )
    );

CREATE POLICY "Moderators can update candidate purchases"
    ON public.candidate_credit_purchases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff', 'owner')
        )
    );
