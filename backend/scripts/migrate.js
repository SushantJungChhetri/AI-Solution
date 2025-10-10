// backend/scripts/migrate.js
import 'dotenv/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Where your SQL file lives (adjust if needed)
const sqlFilePath = path.join(__dirname, '..', 'db.sql');

function readDbSql() {
  if (!fs.existsSync(sqlFilePath)) {
    console.warn('[migrate] db.sql not found at', sqlFilePath, '→ continuing with patch + seed only');
    return '';
  }
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('[migrate] Using SQL file:', sqlFilePath);
  return sql;
}

// Compatibility patch to align schema with routes without changing your db.sql
const compatibilityPatch = `
-- === COMPATIBILITY PATCH (idempotent) ===

-- Articles: add columns commonly used by routes
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS content   TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_featured_pub
  ON articles (featured, published_at DESC);

-- Events: add start/end dates used by code, keep your date/time_range too
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_start    ON events (start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events (featured);

-- Galleries: create flat table some routes expect (keep gallery_images too)
CREATE TABLE IF NOT EXISTS galleries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prefill galleries from gallery_images if empty for given URL
INSERT INTO galleries (title, category, image_url)
SELECT COALESCE(filename, 'Image') AS title, NULL AS category, url AS image_url
FROM gallery_images g
WHERE NOT EXISTS (SELECT 1 FROM galleries gg WHERE gg.image_url = g.url);

-- Feedback: verified + date pattern
CREATE INDEX IF NOT EXISTS idx_feedback_verified_date
  ON feedback (verified, date DESC);

-- Inquiries view/table compatibility: ensure a VIEW exists if no table named 'inquiries'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname='public' AND c.relname='inquiries'
  ) THEN
    CREATE OR REPLACE VIEW public.inquiries AS
      SELECT id, name, email, phone, company, country, job_title, job_details, status, submitted_at
      FROM public.customer_inquiries;
  END IF;
END $$;
`;

export async function runMigrations() {
  const dbSql = readDbSql();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Your db.sql (tables, indexes, seed, etc.)
    if (dbSql && dbSql.trim().length > 0) {
      await client.query(dbSql);
    }

    // 2) Compatibility patch (safe/idempotent)
    await client.query(compatibilityPatch);

    // 3) Ensure admin exists (idempotent)
    await client.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash`,
      [
        'sushantkch@gmail.com',
        '$2a$10$pcOiVMbpGBGZJrWXGJ52fuXosNvo02IEqqi9z/7OlzHHSclNxK0cK',
      ]
    );

    await client.query('COMMIT');
    console.log('[migrate] success: db.sql applied, patch applied, admin seeded');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[migrate] failed:', e);
    throw e;
  } finally {
    client.release();
    // DO NOT pool.end(); server needs the pool after boot
  }
}

// Allow: `node backend/scripts/migrate.js`
if (import.meta.url === `file://${__filename}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
