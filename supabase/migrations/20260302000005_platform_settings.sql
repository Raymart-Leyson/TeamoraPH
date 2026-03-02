-- platform_settings table: stores global platform configuration as key-value pairs.
-- Only one row per key. Readable by authenticated users (admins query it server-side).
-- Writable only via SECURITY DEFINER functions or the service_role key.

CREATE TABLE IF NOT EXISTS public.platform_settings (
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id),
    CONSTRAINT platform_settings_pkey PRIMARY KEY (key)
);

-- Seed default values
INSERT INTO public.platform_settings (key, value) VALUES
    ('site_name', 'TeamoraPH'),
    ('support_email', 'support@teamora.ph'),
    ('meta_description', 'Premium Remote Job Marketplace for Filipinos'),
    ('auto_publish_verified', 'false'),
    ('flagged_notifications', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS: only admin/owner/staff can read; only admin/owner can write
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_owner_can_read_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "admin_owner_can_update_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "admin_owner_can_insert_settings" ON public.platform_settings;

CREATE POLICY "admin_owner_can_read_settings"
    ON public.platform_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'staff')
        )
    );

CREATE POLICY "admin_owner_can_update_settings"
    ON public.platform_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "admin_owner_can_insert_settings"
    ON public.platform_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );
