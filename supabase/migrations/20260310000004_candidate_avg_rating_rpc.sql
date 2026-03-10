-- Public RPC to get aggregate employer ratings for a candidate.
-- Uses SECURITY DEFINER to bypass RLS on the applications table,
-- exposing only the aggregated (anonymous) avg + count — never individual ratings.
CREATE OR REPLACE FUNCTION public.get_candidate_avg_rating(p_candidate_id UUID)
RETURNS TABLE(avg_rating NUMERIC, rating_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(a.rating)::numeric, 1),
        COUNT(a.rating)
    FROM public.applications a
    WHERE a.candidate_id = p_candidate_id
      AND a.rating IS NOT NULL;
END;
$$;
