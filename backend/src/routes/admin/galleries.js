import express from 'express';
import multer from 'multer';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { uploadBufferToBlob } from '../../utils/blob.js';

const router = express.Router();
router.use(requireAuth);

// Vercel-safe: no disk writes, use in-memory buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// GET /admin/galleries - list all gallery images
router.get('/', async (_req, res, next) => {
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

// POST /admin/galleries - upload a new gallery image
// Accepts either a multipart file field "image" OR a JSON body { image_url: "https://..." }
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    let publicUrl = null;
    let filenameToStore = null;

    if (req.file) {
      // Upload buffer to Vercel Blob; store public URL
      publicUrl = await uploadBufferToBlob(req.file, 'galleries');
      filenameToStore = null; // filesystem filename not used on Vercel
    } else if (typeof req.body?.image_url === 'string' && req.body.image_url.trim()) {
      publicUrl = req.body.image_url.trim();
      filenameToStore = null;
    } else {
      return res.status(400).json({ error: 'No image provided. Send a file field "image" or "image_url".' });
    }

    const { rows } = await query(
      `
      INSERT INTO gallery_images (filename, url, uploaded_at)
      VALUES ($1, $2, NOW())
      RETURNING id, filename, url, uploaded_at AS "uploadedAt"
      `,
      [filenameToStore, publicUrl]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// GET /admin/galleries/:id - get single gallery image
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, filename, url, uploaded_at AS "uploadedAt"
       FROM gallery_images
       WHERE id = $1`,
      [Number(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Image not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// DELETE /admin/galleries/:id - delete a gallery image (DB row only)
// (If you also want to delete the Blob object, store the blob key and call @vercel/blob del() here.)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await query('DELETE FROM gallery_images WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Image not found' });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
