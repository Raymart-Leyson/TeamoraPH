-- Add last_read_at columns to conversations if not already present
ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS employer_last_read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS candidate_last_read_at TIMESTAMPTZ;

-- Single-query unread message count (replaces N+1 loop in layout)
-- Returns the number of messages the given user has not yet read
-- across all their conversations.
CREATE OR REPLACE FUNCTION public.get_unread_message_count(
    p_user_id UUID,
    p_role    TEXT   -- 'employer' | 'candidate'
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(COUNT(m.id), 0)::INTEGER
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE
        -- only conversations belonging to this user
        (
            (p_role = 'employer'  AND c.employer_id  = p_user_id) OR
            (p_role = 'candidate' AND c.candidate_id = p_user_id)
        )
        -- exclude messages sent by this user
        AND m.sender_id != p_user_id
        -- only messages newer than the last time the user read the conversation
        AND m.created_at > COALESCE(
            CASE
                WHEN p_role = 'employer'  THEN c.employer_last_read_at
                WHEN p_role = 'candidate' THEN c.candidate_last_read_at
            END,
            '1970-01-01'::TIMESTAMPTZ
        );
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID, TEXT) TO authenticated;
