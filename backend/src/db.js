// src/db.js
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

function redact(url = '') {
  try {
    const u = new URL(url);
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    return u.toString();
  } catch { return url; }
}

const {
  DATABASE_URL, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGSSLMODE, NODE_ENV, RENDER
} = process.env;

const isProd = NODE_ENV === 'production';
const usingUrl = !!DATABASE_URL;
const isNeonUrl = usingUrl && /neon\.tech/i.test(DATABASE_URL || '');

const pool = usingUrl
  ? new Pool({
      connectionString: DATABASE_URL,
      // Neon/Vercel PG/Render/Railway typically need SSL
      ssl: { rejectUnauthorized: false },
      max: isProd ? 5 : 10,
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
        (PGSSLMODE || '').toLowerCase() === 'require' || /neon\.tech/i.test(PGHOST || '')
          ? { rejectUnauthorized: false }
          : false,
      max: 5,                       // keep modest when using Neon pooled URL
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
  })
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
