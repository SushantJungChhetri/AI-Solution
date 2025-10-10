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

export default router;
