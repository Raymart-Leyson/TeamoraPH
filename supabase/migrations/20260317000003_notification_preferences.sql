ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notif_messages BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notif_applications BOOLEAN NOT NULL DEFAULT true;
