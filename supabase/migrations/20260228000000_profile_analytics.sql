-- Drop the old function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.increment_profile_views(uuid);

-- Function to safely increment profile views without requiring public UPDATE permissions on the table
CREATE OR REPLACE FUNCTION increment_profile_views(candidate_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.candidate_profiles
    SET profile_views = profile_views + 1
    WHERE id = candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage:
-- SELECT increment_profile_views('your-candidate-id-here');
