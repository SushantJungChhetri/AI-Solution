// src/routes/public/articles.js
import express from 'express';
import { query } from '../../db.js';

const router = express.Router();

// Build absolute URL from a stored filename (or return the URL unchanged if it's already absolute)
function makeImageUrl(req, value) {
  if (!value) return null;
  const v = String(value);
  if (/^https?:\/\//i.test(v)) return v; // already a full URL
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host  = req.get('host');
  // Files are served from /uploads/articles
  return `${proto}://${host}/uploads/articles/${v}`;
}

/** GET /articles?featured&category&search&page&limit */
router.get('/', async (req, res, next) => {
  try {
    const page   = Math.max(1, Number(req.query.page || 1));
    const limit  = Math.min(Math.max(1, Number(req.query.limit || 10)), 100);
    const offset = (page - 1) * limit;

    const params = [];
    const where  = [];

    if (req.query.featured === 'true') where.push('featured = TRUE');

    if (req.query.category) {
      params.push(String(req.query.category));
      where.push(`LOWER(category) = LOWER($${params.length})`);
    }

    if (req.query.search) {
      const s = String(req.query.search).trim();
      params.push(`%${s}%`);
      where.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // Prefer image_filename; keep legacy image for backward compatibility.
    const sql = `
      SELECT
        id,
        slug,
        title,
        excerpt,
        author,
        published_at AS "publishedAt",
        read_time    AS "readTime",
        category,
        tags,
        views,
        featured,
        image
      FROM articles
      ${whereSql}
      ORDER BY published_at DESC NULLS LAST, id DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const { rows } = await query(sql, params);

    const data = rows.map(r => {
      const first = r.image_filename || r.image || null;
      return {
        ...r,
        imageUrl: makeImageUrl(req, first), // ✅ render-ready absolute URL
      };
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** GET /articles/slug/:slug */
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT
        id,
        slug,
        title,
        excerpt,
        description,
        author,
        published_at AS "publishedAt",
        read_time    AS "readTime",
        category,
        tags,
        views,
        featured,
        image,
        created_at,
        updated_at
      FROM articles
      WHERE slug = $1
      `,
      [req.params.slug]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Article not found' });

    const r = rows[0];
    const first = r.image_filename || r.image || null;

    res.json({
      ...r,
      imageUrl: makeImageUrl(req, first), // ✅ render-ready absolute URL
    });
  } catch (e) {
    next(e);
  }
});

export default router;
