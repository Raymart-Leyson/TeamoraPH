-- Adapt payment_proofs for Wise auto-detection flow
-- screenshot_url becomes nullable (Wise payments don't need screenshots)
-- wise_reference is the unique code employer puts in their transfer description
-- wise_transfer_id is set by the webhook when Wise confirms payment

ALTER TABLE public.payment_proofs
    ALTER COLUMN screenshot_url DROP NOT NULL;

ALTER TABLE public.payment_proofs
    ADD COLUMN IF NOT EXISTS wise_reference  TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS wise_transfer_id TEXT,
    ADD COLUMN IF NOT EXISTS payment_method  TEXT NOT NULL DEFAULT 'manual'
        CHECK (payment_method IN ('manual', 'wise'));

-- Index for webhook lookups by wise_reference
CREATE UNIQUE INDEX IF NOT EXISTS payment_proofs_wise_reference_idx
    ON public.payment_proofs (wise_reference)
    WHERE wise_reference IS NOT NULL;
