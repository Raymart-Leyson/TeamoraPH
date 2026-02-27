-- Add hours_per_week to job_posts
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS hours_per_week INTEGER;
