-- Atomic credit deduction for job applications.
--
-- Problem (race condition):
--   applyAction does: SELECT credits → INSERT application → UPDATE credits
--   If two concurrent requests both read the same balance (e.g., 1 credit),
--   both pass the credit check, both insert applications, and both deduct —
--   leaving the candidate at -1 credits (or the second deduct fails after
--   the first already set the balance to 0, meaning one application is "free").
--
-- Fix:
--   A single SECURITY DEFINER function that locks the candidate_profiles row
--   (SELECT ... FOR UPDATE) before checking and deducting.
--   PostgreSQL's row lock serializes concurrent calls so only one can proceed
--   at a time — the second call sees the already-deducted balance and fails.
--
-- Returns JSONB:
--   { "success": true }
--   { "success": false, "error": "<reason>", "available": <n> }

CREATE OR REPLACE FUNCTION public.deduct_application_credit(
    p_candidate_id    UUID,
    p_credits_to_deduct INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_free_credits   INTEGER;
    v_bought_credits INTEGER;
    v_total          INTEGER;
    v_new_free       INTEGER;
    v_new_bought     INTEGER;
    v_to_deduct      INTEGER;
BEGIN
    -- Lock the row to prevent concurrent deductions
    SELECT free_credits, bought_credits
    INTO   v_free_credits, v_bought_credits
    FROM   public.candidate_profiles
    WHERE  id = p_candidate_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
    END IF;

    v_total := COALESCE(v_free_credits, 0) + COALESCE(v_bought_credits, 0);

    IF v_total < p_credits_to_deduct THEN
        RETURN jsonb_build_object(
            'success',   false,
            'error',     'Insufficient credits',
            'available', v_total
        );
    END IF;

    -- Deduct free credits first, then bought credits
    v_to_deduct  := p_credits_to_deduct;
    v_new_free   := COALESCE(v_free_credits, 0);
    v_new_bought := COALESCE(v_bought_credits, 0);

    IF v_new_free >= v_to_deduct THEN
        v_new_free  := v_new_free - v_to_deduct;
        v_to_deduct := 0;
    ELSE
        v_to_deduct  := v_to_deduct - v_new_free;
        v_new_free   := 0;
        v_new_bought := v_new_bought - v_to_deduct;
    END IF;

    UPDATE public.candidate_profiles
    SET    free_credits   = v_new_free,
           bought_credits = v_new_bought
    WHERE  id = p_candidate_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
