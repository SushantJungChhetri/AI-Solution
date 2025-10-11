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
        date,                 -- real column (timestamptz)
        date AS event_date,   -- compat alias for older frontend
        "time",               -- real column (time)
        location,
        type,
        status,
        image_url,
        created_at,
        updated_at
      FROM events
      ORDER BY date DESC, "time" DESC NULLS LAST
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
