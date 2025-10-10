// src/db.js
import 'dotenv/config';
import pg from 'pg';

const {
  DATABASE_URL, PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
} = process.env;

const config = DATABASE_URL
  ? { connectionString: DATABASE_URL }
  : {
      host: PGHOST || 'localhost',
      port: Number(PGPORT || 5432),
      database: PGDATABASE || 'ai_solutions_db',
      user: PGUSER || 'ai_user',
      password: String(PGPASSWORD ?? ''), // ensure it's a string
    };

export const pool = new pg.Pool(config);

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
