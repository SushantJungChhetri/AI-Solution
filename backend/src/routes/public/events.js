// backend/src/routes/public/events.js
import { Router } from 'express';
import { query } from '../../db.js';

const r = Router();

// GET /api/events?limit=10
r.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);

    const { rows } = await query(
      `
      SELECT
        id,
        title,
        description,
        event_date,
        event_date::date AS date, -- alias for frontend
        location,
        created_at,
        updated_at
      FROM events
      ORDER BY event_date DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json(rows);
  } catch (err) {
    console.error('[API ERROR]', err);
    next(err);
  }
});

export default r;
