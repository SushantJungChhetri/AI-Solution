// backend/scripts/migrate.js
import 'dotenv/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Back-compat: single SQL file at backend/db.sql (optional)
const sqlFilePath = path.join(__dirname, '..', 'db.sql');

// Optional: directory with versioned migrations (e.g., 001_init.sql, 002_indexes.sql)
const MIG_DIR = path.join(__dirname, '..', 'db', 'migrations');

function readDbSqlIfAny() {
  if (!fs.existsSync(sqlFilePath)) {
    console.warn('[migrate] db.sql not found at', sqlFilePath, '→ skipping legacy file');
    return '';
  }
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  console.log('[migrate] Using legacy SQL file:', sqlFilePath);
  return sql;
}

function readMigrationFilesIfAny() {
  if (!fs.existsSync(MIG_DIR)) {
    console.warn('[migrate] migrations dir not found:', MIG_DIR, '→ skipping foldered migrations');
    return [];
  }
  const files = fs
    .readdirSync(MIG_DIR)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort(); // assumes filenames are prefixed with sortable order (001_, 002_, etc.)
  if (files.length === 0) {
    console.warn('[migrate] no *.sql files in', MIG_DIR);
    return [];
  }
  console.log('[migrate] Found migration files:', files.join(', '));
  return files.map((f) => ({
    name: f,
    sql: fs.readFileSync(path.join(MIG_DIR, f), 'utf8'),
  }));
}

/**
 * Compatibility patch (idempotent)
 * - Ensures all required tables exist in prod (Neon) without erroring if they already do.
 * - Safe to run repeatedly because of IF NOT EXISTS.
 */
const compatibilityPatch = `
-- === ADMINS (OTP-ready)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === CUSTOMER INQUIRIES
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

-- === ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  author TEXT,
  category TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === EVENTS
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === FEEDBACK / TESTIMONIALS
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === GALLERIES
CREATE TABLE IF NOT EXISTS galleries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === GALLERY IMAGES
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  gallery_id INT REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function runMigrations() { // <-- NAMED EXPORT preserved
  const legacySql = readDbSqlIfAny();
  const fileMigrations = readMigrationFilesIfAny();

  const client = await pool.connect();
  try {
    const startedAt = Date.now();
    console.log('[migrate] Starting transaction…');
    await client.query('BEGIN');

    // 1) Optional legacy db.sql
    if (legacySql && legacySql.trim()) {
      console.log('[migrate] Applying legacy db.sql…');
      await client.query(legacySql);
      console.log('[migrate] Legacy db.sql applied');
    }

    // 2) Optional foldered *.sql migrations in order
    for (const { name, sql } of fileMigrations) {
      console.log(`[migrate] Applying ${name}…`);
      await client.query(sql);
      console.log(`[migrate] ${name} applied`);
    }

    // 3) Compatibility patch to guarantee required tables exist
    console.log('[migrate] Applying compatibility patch…');
    await client.query(compatibilityPatch);
    console.log('[migrate] Compatibility patch applied');

    // 4) Seed (idempotent) — ensure admin user exists
    console.log('[migrate] Seeding admin user (idempotent)…');
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
    console.log('[migrate] Admin seed applied');

    await client.query('COMMIT');
    console.log(`[migrate] Success in ${Date.now() - startedAt}ms`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[migrate] Failed → rolled back. Error:', e.message);
    throw e;
  } finally {
    client.release();
  }
}

// Allow `npm run migrate`
if (import.meta.url === `file://${__filename}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
