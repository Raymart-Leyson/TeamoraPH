-- payment_proofs: manual GCash/bank transfer payment verification
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id     UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
    plan            TEXT NOT NULL CHECK (plan IN ('pro', 'premium')),
    reference_number TEXT NOT NULL,
    screenshot_url  TEXT NOT NULL,
    amount          NUMERIC(10, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'PHP',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes           TEXT,
    reviewed_by     UUID REFERENCES public.profiles(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick admin queries (pending first)
CREATE INDEX IF NOT EXISTS payment_proofs_status_idx ON public.payment_proofs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_proofs_employer_idx ON public.payment_proofs (employer_id, created_at DESC);

-- RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Employer can view and insert their own proofs
CREATE POLICY "Employer can view own payment proofs"
    ON public.payment_proofs FOR SELECT
    USING (
        employer_id = auth.uid()
    );

CREATE POLICY "Employer can submit payment proof"
    ON public.payment_proofs FOR INSERT
    WITH CHECK (
        employer_id = auth.uid()
        -- Prevent spam: only allow new submission if no pending proof exists
        AND NOT EXISTS (
            SELECT 1 FROM public.payment_proofs pp
            WHERE pp.employer_id = auth.uid() AND pp.status = 'pending'
        )
    );

-- Admin / owner can view and update all proofs
CREATE POLICY "Moderators can view all payment proofs"
    ON public.payment_proofs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff', 'owner')
        )
    );

CREATE POLICY "Moderators can update payment proofs"
    ON public.payment_proofs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff', 'owner')
        )
    );

-- Storage bucket for payment screenshots (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Employer can upload to their own folder
CREATE POLICY "Employer can upload payment screenshot"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment-proofs'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Employer can view their own screenshots
CREATE POLICY "Employer can view own payment screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can view all payment screenshots
CREATE POLICY "Moderators can view all payment screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'payment-proofs'
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff', 'owner')
        )
    );
