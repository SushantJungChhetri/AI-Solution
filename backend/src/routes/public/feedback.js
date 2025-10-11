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
        company,
        project,
        comment,
        rating,
        is_approved AS verified,  -- compat alias for frontend
        date
      FROM feedback
      WHERE ($1::boolean IS FALSE) OR (is_approved = TRUE)
      ORDER BY date DESC
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
