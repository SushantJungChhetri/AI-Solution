import express from 'express';
import rateLimit from 'express-rate-limit';
import { inquirySchema } from '../../validations/public.js';
import { query } from '../../db.js';

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

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
