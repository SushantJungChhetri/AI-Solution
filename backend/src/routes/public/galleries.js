import express from 'express';
import { query } from '../../db.js';

const router = express.Router();

// GET /api/galleries - list all gallery images for public view
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, filename, url, uploaded_at AS "uploadedAt"
      FROM gallery_images
      ORDER BY uploaded_at DESC
    `);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** GET /api/galleries/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT id, filename, url, uploaded_at AS "uploadedAt"
      FROM gallery_images
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Gallery image not found' });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
