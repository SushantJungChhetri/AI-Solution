// src/routes/public/events.js
import express from 'express';
import { query } from '../../db.js';

const router = express.Router();

// Build a full, absolute URL for the stored filename
function makeImageUrl(req, filename) {
  if (!filename) return null;
  const proto = req.headers['x-forwarded-proto'] || req.protocol; // honors proxy/CDN
  const host  = req.get('host');
  return `${proto}://${host}/uploads/events/${filename}`;
}


router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [];

    if (req.query.status) {
      params.push(String(req.query.status));
      where.push(`status = $${params.length}`);
    }
    if (req.query.from) {
      params.push(String(req.query.from));
      where.push(`date >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(String(req.query.to));
      where.push(`date <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await query(
      `
      SELECT
        id,
        title,
        description,
        date,
        time_range,
        location,
        type,
        status,               -- prefer stored status
        attendees,
        max_attendees,
        image_filename,
        image_url,
        featured
      FROM events
      ${whereSql}
      ORDER BY date DESC NULLS LAST, id DESC
      `,
      params
    );

    // Normalize for frontend consumption
    const today = new Date().toISOString().slice(0, 10);
    const data = rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      date: r.date,                               // ISO 8601 from PG
      timeRange: r.time_range ?? null,            // camelCase
      location: r.location,
      type: r.type,
      status: r.status ?? (r.date >= today ? 'upcoming' : 'past'),
      attendees: r.attendees,
      maxAttendees: r.max_attendees,
      featured: !!r.featured,
      imageUrl: r.image_url || makeImageUrl(req, r.image_filename), // ✅ absolute URL to render in <img src=...>
    }));

    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** GET /events/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        id,
        title,
        description,
        date,
        time_range,
        location,
        type,
        status,
        attendees,
        max_attendees,
        image_filename,
        image_url,
        featured
      FROM events
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Event not found' });

    const r = rows[0];
    const today = new Date().toISOString().slice(0, 10);
    const data = {
      id: r.id,
      title: r.title,
      description: r.description,
      date: r.date,
      timeRange: r.time_range ?? null,
      location: r.location,
      type: r.type,
      status: r.status ?? (r.date >= today ? 'upcoming' : 'past'),
      attendees: r.attendees,
      maxAttendees: r.max_attendees,
      featured: !!r.featured,
      imageUrl: r.image_url || makeImageUrl(req, r.image_filename),
    };

    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
