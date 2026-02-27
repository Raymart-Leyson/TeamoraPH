-- 1. Add 'staff' to user_role enum
-- Note: Enum values cannot be added inside a transaction block in some Postgres versions
-- so we do it safely here.
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'candidate';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Create utility function to promote users (Optional but helpful)
-- You can run this in the SQL editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff-email@example.com';
