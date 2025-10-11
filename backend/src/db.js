// src/db.js
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

function sanitizeUrl(url) {
  if (!url) return url;
  let s = String(url).trim();
  s = s.replace(/^['"]|['"]$/g, ''); // drop surrounding quotes if present
  s = s.replace(/([?&])channel_binding=require(&|$)/, (_, sep, tail) => (tail ? sep : ''));
  return s;
}

function redact(url = '') {
  try {
    const u = new URL(sanitizeUrl(url));
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}

const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  PGSSLMODE,
  NODE_ENV,
} = process.env;

const isProd = NODE_ENV === 'production';
const usingUrl = !!DATABASE_URL;

// Helpful guard for local scripts / misconfig on Render
if (!usingUrl && !PGHOST) {
  console.warn(
    '[DB] No DATABASE_URL and no PGHOST provided. ' +
      'Set DATABASE_URL to your Neon *pooled* URL (no quotes), e.g.:\n' +
      'DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require'
  );
}

const pool = usingUrl
  ? new Pool({
      connectionString: sanitizeUrl(DATABASE_URL),
      // Neon requires SSL; Render/Vercel/Railway too
      ssl: { rejectUnauthorized: false },
      max: 5, // modest pool size works best with Neon pooled connections
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    })
  : new Pool({
      host: PGHOST || 'localhost',
      port: Number(PGPORT || 5432),
      database: PGDATABASE || 'ai_solutions_db',
      user: PGUSER || 'ai_user',
      password: String(PGPASSWORD ?? ''),
      ssl:
        (PGSSLMODE || '').toLowerCase() === 'require' ||
        /neon\.tech/i.test(PGHOST || '')
          ? { rejectUnauthorized: false }
          : false,
      max: isProd ? 5 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });

export async function assertDatabaseConnectionOk() {
  try {
    const how = usingUrl
      ? `DATABASE_URL=${redact(DATABASE_URL)}`
      : `PGHOST=${PGHOST} PGPORT=${PGPORT} PGDATABASE=${PGDATABASE}`;
    console.log('[pg] Connecting with', how);
    const { rows } = await pool.query(`
      select current_database() as db,
             current_user      as usr,
             now()             as now
    `);
    console.log('[pg] Database connection OK:', rows[0]);
  } catch (err) {
    console.error('[pg] Connection error:', err);
    throw err;
  }
}

export async function query(text, params) {
  // use pool.query directly; avoids extra connect/release churn
  return pool.query(text, params);
}

export { pool };
