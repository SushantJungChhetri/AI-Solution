// backend/src/routes/public/articles.js
import { Router } from 'express';
import { query } from '../../db.js';

const r = Router();

// GET /api/articles?limit=3&page=1
r.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `
      SELECT
        id,
        title,
        slug,
        LEFT(COALESCE(content, ''), 180) AS excerpt, -- derived, since column doesn't exist
        content,
        author,
        category,
        featured,
        published_at,
        created_at,
        updated_at
      FROM articles
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error('[API ERROR]', err);
    next(err);
  }
});

// GET /api/articles/slug/:slug
r.get('/slug/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { rows } = await query(
      `
      SELECT
        id,
        title,
        slug,
        LEFT(COALESCE(content, ''), 180) AS excerpt, -- keep shape consistent
        content,
        author,
        category,
        featured,
        published_at,
        created_at,
        updated_at
      FROM articles
      WHERE slug = $1
      `,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not Found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[API ERROR]', err);
    next(err);
  }
});

export default r;
