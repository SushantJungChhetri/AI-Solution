import express from 'express';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { Parser } from 'json2csv';

const router = express.Router();
router.use(requireAuth);

/** GET /admin/inquiries?page&limit&status&q */
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 20));
    const offset = (page - 1) * limit;

    const params = [];
    const where = [];

    if (req.query.status) { params.push(req.query.status); where.push(`status = $${params.length}`); }
    if (req.query.q) {
      params.push(`%${req.query.q.toLowerCase()}%`);
      where.push(`(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(company) LIKE $${params.length} OR LOWER(job_title) LIKE $${params.length} OR LOWER(country) LIKE $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await query(`
      SELECT id, name, email, phone, company, country, job_title AS "jobTitle",
             job_details AS "jobDetails", submitted_at AS "submittedAt", status
      FROM customer_inquiries
      ${whereSql}
      ORDER BY submitted_at DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json(rows); // keep it as an array; your frontend handles both array or {items}
  } catch (e) { next(e); }
});


router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, name, email, phone, company, country, job_title AS "jobTitle",
             job_details AS "jobDetails", submitted_at AS "submittedAt", status
      FROM customer_inquiries WHERE id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/** PATCH /admin/inquiries/:id {status} */
router.patch('/:id', async (req, res, next) => {
  try {
    const status = req.body.status;
    const ok = ['new','in-progress','completed','archived'].includes(status);
    if (!ok) return res.status(400).json({ error: 'Invalid status' });

    const { rows } = await query(
      `UPDATE customer_inquiries SET status = $1 WHERE id = $2 RETURNING id`,
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/** POST /admin/inquiries/:id/reply {message} */
router.post('/:id/reply', async (req, res, next) => {
  try {
    const inquiryId = req.params.id;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const { rows } = await query(`
      SELECT id, name, email FROM customer_inquiries WHERE id = $1
    `, [inquiryId]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];

    console.log(`Reply logged for inquiry ${inquiryId}: ${message.trim()}`);

    res.json({ ok: true, message: 'Reply logged successfully' });
  } catch (e) {
    next(e);
  }
});

/** CSV export */
router.get('/export.csv', async (req, res) => {
  const { rows } = await query('SELECT * FROM inquiries ORDER BY submitted_at DESC');
  const parser = new Parser();
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment('inquiries.csv');
  res.send(csv);
});

/** Metrics */
router.get('/../metrics', async (_req, res, next) => {
  try {
    const [{ rows: t }, { rows: w }, { rows: s }] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM customer_inquiries'),
      query(`SELECT COUNT(*)::int AS last7
             FROM customer_inquiries
             WHERE submitted_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT status, COUNT(*)::int AS count
             FROM customer_inquiries GROUP BY status`)
    ]);

    const byStatus = {};
    s.forEach(r => { byStatus[r.status] = r.count; });

    res.json({ totalInquiries: t[0].total, last7Days: w[0].last7, byStatus });
  } catch (e) { next(e); }
});

export default router;
