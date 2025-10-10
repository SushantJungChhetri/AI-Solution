import express from 'express';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';


const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    // total
    const totalRes = await query('SELECT COUNT(*)::int AS total FROM inquiries');
    const totalInquiries = totalRes.rows[0]?.total ?? 0;

    // last 7 days time-series
    const last7Res = await query(`
      WITH days AS (
        SELECT generate_series(
          (CURRENT_DATE - INTERVAL '6 days')::date,
          CURRENT_DATE::date,
          '1 day'
        )::date AS day
      )
      SELECT
        d.day::text AS date,
        COALESCE(COUNT(i.id), 0)::int AS count
      FROM days d
      LEFT JOIN inquiries i ON i.submitted_at::date = d.day
      GROUP BY d.day
      ORDER BY d.day;
    `);
    const last7Days = last7Res.rows;

    // by status
    const byStatusRes = await query(`
      SELECT status::text AS status, COUNT(*)::int AS count
      FROM inquiries
      GROUP BY status
    `);
    const byStatus = { new: 0, 'in-progress': 0, completed: 0, archived: 0 };
    for (const r of byStatusRes.rows) {
      if (byStatus[r.status] !== undefined) byStatus[r.status] = r.count;
    }

    res.json({ totalInquiries, last7Days, byStatus });
  } catch (e) {
    next(e);
  }
});

export default router;
