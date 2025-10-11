// backend/src/health.js
import { Router } from 'express';
import { query } from './db.js';

const r = Router();

r.get('/db', async (_req, res) => {
  try {
    // simple liveness
    const nowRow = await query('select now() as now');
    const now = nowRow.rows[0]?.now;

    // tables you care about — add/remove as needed
    const tables = ['admins', 'articles', 'events', 'feedback', 'customer_inquiries', 'galleries', 'gallery_images'];

    const counts = {};
    for (const t of tables) {
      // does the table exist?
      const existsRow = await query('select to_regclass($1) as t', [`public.${t}`]);
      const exists = !!existsRow.rows[0]?.t;
      if (!exists) {
        counts[t] = null; // table missing
        continue;
      }
      const cRow = await query(`select count(*)::int as c from ${t}`);
      counts[t] = cRow.rows[0]?.c ?? 0;
    }

    res.json({ ok: true, now, counts });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

export default r;
