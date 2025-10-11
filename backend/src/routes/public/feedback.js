// backend/src/routes/public/feedback.js
import { Router } from 'express';
import { query } from '../../db.js';

const r = Router();

// GET /api/feedback?verified=true&limit=3&page=1
r.get('/', async (req, res, next) => {
  try {
    const verified = String(req.query.verified || '').toLowerCase() === 'true';
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `
      SELECT
        id,
        name,
        comment,
        rating,
        verified,
        created_at AS date,         -- alias for frontend "date"
        NULL::text AS company,      -- alias (not in schema)
        NULL::text AS project       -- alias (not in schema)
      FROM feedback
      WHERE ($1::boolean IS FALSE) OR (verified = TRUE)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [verified, limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch feedback:', err);
    next(err);
  }
});

export default r;
