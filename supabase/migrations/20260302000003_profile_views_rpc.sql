-- Atomic profile view increment — increments both:
--   candidate_profiles.profile_views  (candidate-specific counter)
--   profiles.views_count              (global counter shown on dashboard)
-- Prevents race conditions when multiple visitors load a profile simultaneously.
-- Called from: /candidates/[id]/page.tsx via supabase.rpc('increment_profile_views', ...)

CREATE OR REPLACE FUNCTION public.increment_profile_views(candidate_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.candidate_profiles
    SET profile_views = COALESCE(profile_views, 0) + 1
    WHERE id = candidate_id;

    UPDATE public.profiles
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = candidate_id;
END;
$$;
