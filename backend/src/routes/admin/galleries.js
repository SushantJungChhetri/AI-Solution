import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
router.use(requireAuth);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../uploads/galleries');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Helper to delete image file from disk
function deleteImageFile(filename) {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Failed to delete file:', err);
    }
  });
}

// GET /admin/galleries - list all gallery images
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

// POST /admin/galleries - upload a new gallery image
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const filename = req.file.filename;
    const url = `/uploads/galleries/${filename}`;

    const { rows } = await query(`
      INSERT INTO gallery_images (filename, url)
      VALUES ($1, $2)
      RETURNING id, filename, url, uploaded_at AS "uploadedAt"
    `, [filename, url]);

    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// DELETE /admin/galleries/:id - delete a gallery image
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Get filename to delete file
    const { rows: selectRows } = await query(
      'SELECT filename FROM gallery_images WHERE id = $1',
      [id]
    );

    if (selectRows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const filename = selectRows[0].filename;

    // Delete from DB
    await query('DELETE FROM gallery_images WHERE id = $1', [id]);

    // Delete file from disk
    deleteImageFile(filename);

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
