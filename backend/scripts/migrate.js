import 'dotenv/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js'; // reuse the working pool

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, '..', 'db.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('[migrate] Missing SQL file at:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
console.log('[migrate] Using SQL file:', sqlPath);

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[migrate] success');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[migrate] failed:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
