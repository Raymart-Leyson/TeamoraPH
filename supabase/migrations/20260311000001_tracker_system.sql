-- =================================================================
-- Desktop Tracker System
-- Architecture: Pairing Code → Device Token → Service API
--
-- Flow:
--   1. User visits /candidate/tracker on the web → clicks "Pair Device"
--   2. Server generates a short-lived pairing code (8 chars, 10 min TTL)
--   3. User types the code into the desktop Electron app
--   4. Desktop calls POST /api/tracker/auth/exchange → gets a device_token
--   5. Desktop stores device_token locally (electron-store / safeStorage)
--   6. All subsequent tracker API calls use: Authorization: Bearer <device_token>
--   7. User can revoke any device from the web dashboard at any time
-- =================================================================

-- ── Enums ─────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE tracker_session_status AS ENUM ('active', 'ended', 'abandoned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE screenshot_upload_status AS ENUM ('pending', 'uploading', 'uploaded', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── 1. tracker_devices ────────────────────────────────────────────
-- One row per paired device. Raw token is NEVER stored — only its
-- SHA-256 hash. Revoke by setting is_active = false.

CREATE TABLE IF NOT EXISTS public.tracker_devices (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    device_name       TEXT        NOT NULL DEFAULT 'Desktop Tracker',
    device_token_hash TEXT        NOT NULL UNIQUE,  -- SHA-256(raw_token)
    last_seen_at      TIMESTAMPTZ,
    last_ip           TEXT,
    is_active         BOOLEAN     NOT NULL DEFAULT true,
    revoked_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracker_devices_user_id
    ON public.tracker_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_devices_token_hash
    ON public.tracker_devices(device_token_hash);
CREATE INDEX IF NOT EXISTS idx_tracker_devices_active
    ON public.tracker_devices(user_id, is_active);

ALTER TABLE public.tracker_devices ENABLE ROW LEVEL SECURITY;

-- Web dashboard: owner can read their own devices
CREATE POLICY "Users view own tracker devices"
    ON public.tracker_devices FOR SELECT
    USING (auth.uid() = user_id);

-- Admin/owner/staff can view all
CREATE POLICY "Admin view all tracker devices"
    ON public.tracker_devices FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    ));

-- All writes happen exclusively via service-role API routes

-- ── 2. tracker_pairing_codes ──────────────────────────────────────
-- Short-lived one-time codes. Raw code is shown once on the web;
-- only its hash is persisted. Expires in 10 minutes and is single-use.

CREATE TABLE IF NOT EXISTS public.tracker_pairing_codes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code_hash   TEXT        NOT NULL UNIQUE,         -- SHA-256(raw_code)
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    used_at     TIMESTAMPTZ,                         -- NULL = not yet used
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_codes_user_id
    ON public.tracker_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_expires_at
    ON public.tracker_pairing_codes(expires_at);

ALTER TABLE public.tracker_pairing_codes ENABLE ROW LEVEL SECURITY;
-- No direct client access — all operations via service-role API routes

-- ── 3. tracker_sessions ───────────────────────────────────────────
-- One row per work session started from the desktop tracker.
-- Heartbeats keep last_heartbeat_at updated.
-- Sessions with no heartbeat for >5 min are auto-abandoned by a cron job.

CREATE TABLE IF NOT EXISTS public.tracker_sessions (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           UUID                    REFERENCES public.tracker_devices(id) ON DELETE CASCADE NOT NULL,
    user_id             UUID                    REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    employer_id         UUID                    REFERENCES public.profiles(id) ON DELETE SET NULL,
    job_id              UUID                    REFERENCES public.job_posts(id) ON DELETE SET NULL,
    started_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,
    status              tracker_session_status  NOT NULL DEFAULT 'active',
    total_seconds       INTEGER,                -- computed on session end
    last_heartbeat_at   TIMESTAMPTZ,
    memo                TEXT,                   -- optional label e.g. "Working on design"
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracker_sessions_user_id
    ON public.tracker_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_employer_id
    ON public.tracker_sessions(employer_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_device_id
    ON public.tracker_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_status
    ON public.tracker_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tracker_sessions_date
    ON public.tracker_sessions(user_id, started_at DESC);

ALTER TABLE public.tracker_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own sessions"
    ON public.tracker_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Employers view assigned sessions"
    ON public.tracker_sessions FOR SELECT
    USING (auth.uid() = employer_id);

CREATE POLICY "Admin view all sessions"
    ON public.tracker_sessions FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    ));

-- ── 4. screenshots ────────────────────────────────────────────────
-- Screenshot metadata row. The actual file lives in Supabase Storage
-- bucket "tracker-screenshots" (private).
-- Status lifecycle: pending → uploading → uploaded (or failed)
-- Retryable: desktop can re-request a signed URL for a failed row.

CREATE TABLE IF NOT EXISTS public.screenshots (
    id                  UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID                     REFERENCES public.tracker_sessions(id) ON DELETE CASCADE NOT NULL,
    device_id           UUID                     REFERENCES public.tracker_devices(id) ON DELETE CASCADE NOT NULL,
    user_id             UUID                     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    employer_id         UUID                     REFERENCES public.profiles(id) ON DELETE SET NULL,
    storage_path        TEXT,                    -- set after upload confirmed
    status              screenshot_upload_status NOT NULL DEFAULT 'pending',
    captured_at         TIMESTAMPTZ              NOT NULL,  -- desktop clock when captured
    upload_attempted_at TIMESTAMPTZ,
    upload_confirmed_at TIMESTAMPTZ,
    file_size_bytes     INTEGER,
    created_at          TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenshots_session_id
    ON public.screenshots(session_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id
    ON public.screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_employer_id
    ON public.screenshots(employer_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_status
    ON public.screenshots(status);
CREATE INDEX IF NOT EXISTS idx_screenshots_date
    ON public.screenshots(user_id, captured_at DESC);

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Employers view assigned screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.uid() = employer_id);

CREATE POLICY "Admin view all screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'staff', 'owner')
    ));

-- ── 5. activity_logs ──────────────────────────────────────────────
-- Heartbeat + activity metrics logged by the desktop app every ~30s.
-- Stores per-interval keyboard/mouse event counts and active window info.

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        REFERENCES public.tracker_sessions(id) ON DELETE CASCADE NOT NULL,
    device_id       UUID        REFERENCES public.tracker_devices(id) ON DELETE CASCADE NOT NULL,
    user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    employer_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    logged_at       TIMESTAMPTZ NOT NULL,       -- client-side interval timestamp
    keyboard_events INTEGER     NOT NULL DEFAULT 0,
    mouse_events    INTEGER     NOT NULL DEFAULT 0,
    active_app      TEXT,
    active_window   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id
    ON public.activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
    ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_logged_at
    ON public.activity_logs(logged_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own activity"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Employers view assigned activity"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = employer_id);

-- ── 6. Stale session cleanup function ─────────────────────────────
-- Abandons any active session with no heartbeat for >5 minutes.
-- Call via pg_cron every 5 minutes, or from a Next.js /api/cron route.

CREATE OR REPLACE FUNCTION public.abandon_stale_tracker_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.tracker_sessions
    SET
        status        = 'abandoned',
        ended_at      = NOW(),
        total_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    WHERE
        status = 'active'
        AND last_heartbeat_at < NOW() - INTERVAL '5 minutes';
END;
$$;

-- ── Manual steps (run after applying this migration) ──────────────
--
-- 1. Create a PRIVATE Supabase Storage bucket named "tracker-screenshots"
--    Dashboard → Storage → New bucket → Name: tracker-screenshots → Private: ON
--
-- 2. (Optional) Enable pg_cron for automatic stale session cleanup:
--    Dashboard → Extensions → Enable pg_cron
--    Then run:
--    SELECT cron.schedule(
--      'abandon-stale-tracker-sessions',
--      '*/5 * * * *',
--      'SELECT public.abandon_stale_tracker_sessions()'
--    );
