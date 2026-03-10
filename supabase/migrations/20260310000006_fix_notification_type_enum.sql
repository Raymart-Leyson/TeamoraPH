-- Add 'new_application' to the notification_type enum.
--
-- The applyAction server action inserts a notification with type = 'new_application'
-- but that value was never added to the enum, causing every application to throw
-- an "invalid input value for enum notification_type" error and silently swallow it.
--
-- Using ADD VALUE IF NOT EXISTS so this migration is safe to re-run.

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_application';
