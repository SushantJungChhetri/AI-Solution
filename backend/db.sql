

-- 1) ADMINS (OTP-based login compatible)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;


-- Ensure an admin user exists (hash can be updated later by seed script)
INSERT INTO admins (email, password_hash)
VALUES ('sushantkch@gmail.com', '$2a$10$pcOiVMbpGBGZJrWXGJ52fuXosNvo02IEqqi9z/7OlzHHSclNxK0cK')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- 2) CUSTOMER INQUIRIES
CREATE TABLE IF NOT EXISTS customer_inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  country TEXT,
  job_title TEXT,
  job_details TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) ARTICLES (fields used by backend/public APIs)
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  description TEXT,
  author TEXT,
  category TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_time INT,
  tags TEXT[],
  views INT DEFAULT 0,
  image TEXT
);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- 4) EVENTS (as expected by admin/public routes)
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  time_range TEXT,
  location TEXT,
  type TEXT,
  status TEXT,
  attendees INT DEFAULT 0,
  max_attendees INT DEFAULT 0,
  image_filename TEXT,
  image_url TEXT, -- new column for external image URL
  featured BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_date_time_range ON events(date DESC, time_range DESC);

-- 5) GALLERIES IMAGES (flat table for gallery images)
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_images_uploaded_at ON gallery_images(uploaded_at DESC);

-- Galleries removed (using gallery_images as flat structure)

-- Gallery images removed (integrated into gallery_images)

-- 7) FEEDBACK (public submit + admin moderation)
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  project TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT DEFAULT 'pending',
  is_approved BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column to existing tables if not present
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Migrate existing data: set status based on verified
UPDATE feedback SET status = 'approved' WHERE verified = true AND status = 'pending';
-- Note: denied status will be set when admin denies feedback

CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date DESC);

-- Replace the old single-column index with a composite one (name was reused previously)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='idx_feedback_approved') THEN
    EXECUTE 'DROP INDEX IF EXISTS idx_feedback_approved';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_feedback_approved_date
  ON feedback(is_approved, date DESC);

-- 8) Compatibility view for metrics and some queries
CREATE OR REPLACE VIEW public.inquiries AS
SELECT id, name, email, phone, company, country, job_title, job_details, status, submitted_at
FROM public.customer_inquiries;

-- 9) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_submitted ON customer_inquiries (submitted_at DESC);

-- 10) Ownership and privileges (only if role ai_user exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_user') THEN
    EXECUTE 'ALTER SCHEMA public OWNER TO ai_user';
    -- Transfer ownership of tables
    PERFORM
      (SELECT string_agg(format('ALTER TABLE public.%I OWNER TO ai_user;', t.tablename), E' ')
       FROM pg_tables t WHERE t.schemaname='public');
    -- Transfer ownership of sequences
    PERFORM
      (SELECT string_agg(format('ALTER SEQUENCE public.%I OWNER TO ai_user;', s.sequence_name), E' ')
       FROM information_schema.sequences s WHERE s.sequence_schema='public');
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ai_user';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ai_user';
  END IF;
END $$;
