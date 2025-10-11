import express from 'express';
import rateLimit from 'express-rate-limit';
import { inquirySchema } from '../../validations/public.js';
import { query } from '../../db.js';

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(Math.max(1, Number(req.query.limit || 10)), 100);
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `
      SELECT id, name, email, phone, company, country, job_title AS "jobTitle", job_details AS "jobDetails", submitted_at AS "submittedAt"
      FROM customer_inquiries
      ORDER BY submitted_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** GET /inquiries/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT id, name, email, phone, company, country, job_title AS "jobTitle", job_details AS "jobDetails", submitted_at AS "submittedAt"
      FROM customer_inquiries
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Inquiry not found' });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post('/', limiter, async (req, res, next) => {
  try {
    const parsed = inquirySchema.parse(req.body);
    const { name, email, phone, company, country, jobTitle, jobDetails } = parsed;

    const sql = `
      INSERT INTO customer_inquiries
        (name,email,phone,company,country,job_title,job_details)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, submitted_at;
    `;
    const { rows } = await query(sql, [
      name, email, phone ?? null, company ?? null, country ?? null,
      jobTitle ?? null, jobDetails
    ]);
    res.status(201).json({ id: rows[0].id, submittedAt: rows[0].submitted_at });
  } catch (e) {
    next(e);
  }
});

export default router;
