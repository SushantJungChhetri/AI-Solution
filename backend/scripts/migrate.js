// backend/scripts/migrate.js
import 'dotenv/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const compatibilityPatch = `
-- (same patch as before; omitted here for brevity)
`;

export async function runMigrations() {           // <-- NAMED EXPORT
  const dbSql = readDbSql();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (dbSql && dbSql.trim()) await client.query(dbSql);
    await client.query(compatibilityPatch);
    await client.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash`,
      ['sushantkch@gmail.com', '$2a$10$pcOiVMbpGBGZJrWXGJ52fuXosNvo02IEqqi9z/7OlzHHSclNxK0cK']
    );
    await client.query('COMMIT');
    console.log('[migrate] success');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[migrate] failed:', e);
    throw e;
  } finally {
    client.release();
  }
}

// Allow `npm run migrate`
if (import.meta.url === `file://${__filename}`) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}
