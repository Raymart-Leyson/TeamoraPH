-- Atomic company view increment — increments both:
--   companies.profile_views           (company-specific counter)
--   profiles.views_count              (global counter shown on employer dashboard)
--
-- Looks up the employer who owns the company and increments their profiles.views_count.
-- Prevents race conditions from the old SELECT+UPDATE pattern on the company page.
-- Called from: /companies/[id]/page.tsx via supabase.rpc('increment_company_views', ...)

CREATE OR REPLACE FUNCTION public.increment_company_views(company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Increment company-level counter
    UPDATE public.companies
    SET profile_views = COALESCE(profile_views, 0) + 1
    WHERE id = company_id;

    -- Increment the employer's global views_count on profiles
    UPDATE public.profiles
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id IN (
        SELECT ep.id
        FROM public.employer_profiles ep
        WHERE ep.company_id = increment_company_views.company_id
        LIMIT 1
    );
END;
$$;
