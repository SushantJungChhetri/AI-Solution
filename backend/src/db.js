// src/db.js
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const {
  DATABASE_URL, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, NODE_ENV, VERCEL
} = process.env;

const isProd = VERCEL === '1' || NODE_ENV === 'production';

// Build config
const config = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      // Most managed Postgres (Neon, Vercel Postgres, Render, Railway) require SSL
      ssl: { rejectUnauthorized: false },
      // Serverless-friendly pool sizing
      max: isProd ? 5 : 10,
      idleTimeoutMillis: 10_000,
      keepAlive: true
    }
  : {
      host: PGHOST || 'localhost',
      port: Number(PGPORT || 5432),
      database: PGDATABASE || 'ai_solutions_db',
      user: PGUSER || 'ai_user',
      password: String(PGPASSWORD ?? ''),
      ssl: false
    };

export const pool = new Pool(config);

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function assertDatabaseConnectionOk() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[pg] Database connection OK');
  } finally {
    client.release();
  }
}
