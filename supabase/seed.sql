-- Seed Demo Data

-- We can't easily seed auth.users in plain SQL without hashing passwords, 
-- but in local dev, Supabase has the auth schema exposed and we can use a known bcrypt hash or let the user sign up.
-- However, for a complete demo, we will insert users into auth.users.
-- The password for these test users will be 'password123'.
-- The bcrypt hash for 'password123' is '$2a$10$T1K7.5lI.0y.v7tYdEwMfeTlkGvRn/2Yn/s2i/G49X/l/W5g5lYgK'

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'employer@demo.com', '$2a$10$T1K7.5lI.0y.v7tYdEwMfeTlkGvRn/2Yn/s2i/G49X/l/W5g5lYgK', NOW(), '{"provider":"email","providers":["email"]}', '{"role":"employer"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'candidate1@demo.com', '$2a$10$T1K7.5lI.0y.v7tYdEwMfeTlkGvRn/2Yn/s2i/G49X/l/W5g5lYgK', NOW(), '{"provider":"email","providers":["email"]}', '{"role":"candidate"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'candidate2@demo.com', '$2a$10$T1K7.5lI.0y.v7tYdEwMfeTlkGvRn/2Yn/s2i/G49X/l/W5g5lYgK', NOW(), '{"provider":"email","providers":["email"]}', '{"role":"candidate"}', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'employer@demo.com')::jsonb, 'email', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'candidate1@demo.com')::jsonb, 'email', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', format('{"sub":"%s","email":"%s"}', '33333333-3333-3333-3333-333333333333', 'candidate2@demo.com')::jsonb, 'email', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Because of our trigger on_auth_user_created, inserting into auth.users automatically inserts into profiles, candidate_profiles, and employer_profiles.
-- However, we can update them with seed data.

UPDATE public.employer_profiles
SET first_name = 'Jane', last_name = 'Doe', position = 'CTO'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.candidate_profiles
SET first_name = 'Alice', last_name = 'Smith', bio = 'Frontend Developer', skills = ARRAY['React', 'Next.js', 'Tailwind']
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.candidate_profiles
SET first_name = 'Bob', last_name = 'Johnson', bio = 'Backend Developer', skills = ARRAY['Node.js', 'PostgreSQL', 'Express']
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Insert a company
INSERT INTO public.companies (id, name, website, description)
VALUES 
  ('12345678-1234-1234-1234-123456789012', 'Acme Corp', 'https://acme.com', 'A great company to work for.')
ON CONFLICT DO NOTHING;

-- Link employer to company
UPDATE public.employer_profiles
SET company_id = '12345678-1234-1234-1234-123456789012'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Insert Job Posts
INSERT INTO public.job_posts (id, company_id, author_id, title, description, location, job_type, salary_range, status)
VALUES
  ('aaaa1111-bbbb-cccc-dddd-eeeeffff0000', '12345678-1234-1234-1234-123456789012', '11111111-1111-1111-1111-111111111111', 'Senior Frontend Engineer', 'Looking for an experienced React developer.', 'Remote', 'Full-time', '$120k - $150k', 'published'),
  ('aaaa2222-bbbb-cccc-dddd-eeeeffff0000', '12345678-1234-1234-1234-123456789012', '11111111-1111-1111-1111-111111111111', 'Backend Developer', 'Looking for a Node.js wizard.', 'Remote', 'Full-time', '$100k - $130k', 'published')
ON CONFLICT DO NOTHING;

-- Insert Application
INSERT INTO public.applications (id, job_id, candidate_id, status, cover_letter)
VALUES
  ('bbbb1111-cccc-dddd-eeee-ffff00001111', 'aaaa1111-bbbb-cccc-dddd-eeeeffff0000', '22222222-2222-2222-2222-222222222222', 'pending', 'I would love to work here!')
ON CONFLICT DO NOTHING;

-- Insert Subscription (Active)
INSERT INTO public.subscriptions (employer_id, status, current_period_end)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'active', (NOW() + interval '30 days'))
ON CONFLICT DO NOTHING;
