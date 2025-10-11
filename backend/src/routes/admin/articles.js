import express from 'express';
import multer from 'multer';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { articleUpsert } from '../../validations/admin.js';
import slugify from '../../utils/slugify.js';
import path from 'path';
import { uploadBufferToBlob } from '../../utils/blob.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'backend', 'uploads', 'articles'));
  },
  filename: function (req, file, cb) {
    // Use a unique filename with timestamp and original extension
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});


const router = express.Router();
router.use(requireAuth);

/** GET /admin/articles - list all articles for admin */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(Math.max(1, Number(req.query.limit || 10)), 100);
    const offset = (page - 1) * limit;

    const params = [];
    const where = [];

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

    const { rows } = await query(`
      SELECT
        id,
        slug,
        title,
        excerpt,
        author,
        published_at AS "publishedAt",
        read_time AS "readTime",
        category,
        tags,
        views,
        featured,
        image,
        created_at,
        updated_at
      FROM articles
      ${whereSql}
      ORDER BY published_at DESC NULLS LAST, id DESC
      LIMIT ${limit} OFFSET ${offset};
    `, params);

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** GET /admin/articles/:id */
router.get('/:id', async (req, res, next) => {
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
        read_time AS "readTime",
        category,
        tags,
        views,
        featured,
        image,
        created_at,
        updated_at
      FROM articles
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Article not found' });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/** GET /admin/articles/slug/:slug */
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
        read_time AS "readTime",
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

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/** CREATE */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    console.log('req.body before processing tags:', req.body);
    // Convert tags string to array if needed
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    console.log('req.body after processing tags:', req.body);

    const data = articleUpsert.parse(req.body);
    const slug = slugify(data.title);
let imageUrl = null;

if (req.file) {
  // upload to Blob, keep public URL
  imageUrl = await uploadBufferToBlob(req.file, 'articles');
} else if (typeof req.body.image_url === 'string' && req.body.image_url.trim()) {
  // allow passing a direct URL too
  imageUrl = req.body.image_url.trim();
}
    const { rows } = await query(`
      INSERT INTO articles (title, slug, excerpt, description, author, published_at,
                            read_time, category, tags, featured, image)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, slug
    `, [
      data.title, slug, data.excerpt ?? null, data.description ?? null, data.author ?? null,
      data.publishedAt ?? null, data.readTime ?? null, data.category ?? null,
      data.tags ?? null, !!data.featured, image
    ]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

/** UPDATE */
router.put('/:id', upload.single('image'), async (req, res, next) => {
  try {
    const data = articleUpsert.parse(req.body);
    const slug = slugify(data.title);
    let image = null;
    if (req.file) {
      image = req.file.filename;
    } else if (typeof req.body.image === 'string' && req.body.image.trim() !== '') {
      image = req.body.image.trim();
    }
    const { rowCount } = await query(`
      UPDATE articles
      SET title=$1, slug=$2, excerpt=$3, description=$4, author=$5, published_at=$6,
          read_time=$7, category=$8, tags=$9, featured=$10, image=$11
      WHERE id=$12
    `, [
      data.title, slug, data.excerpt ?? null, data.description ?? null, data.author ?? null,
      data.publishedAt ?? null, data.readTime ?? null, data.category ?? null,
      data.tags ?? null, !!data.featured, image, req.params.id
    ]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, slug });
  } catch (e) { next(e); }
});

/** DELETE */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query(`DELETE FROM articles WHERE id=$1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
