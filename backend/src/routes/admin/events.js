import express from 'express';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { eventUpsert } from '../../validations/admin.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
router.use(requireAuth);

// ---- Multer storage ----
const uploadsDir = path.join(process.cwd(), 'uploads');
const eventsDir = path.join(uploadsDir, 'events');
if (!fs.existsSync(eventsDir)) fs.mkdirSync(eventsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, eventsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// Helper: build absolute URL for a filename
function makeImageUrl(req, filename) {
  if (!filename) return null;
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${proto}://${host}/uploads/events/${filename}`;
}

// Helper: delete image file from disk
function deleteImageFile(filename) {
  if (!filename) return;
  const filePath = path.join(eventsDir, filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error('Failed to delete image file:', err);
  });
}

// ---- CREATE ----
// expects multipart/form-data with field name "imageFile"
router.post('/', upload.single('imageFile'), async (req, res, next) => {
  try {
    const d = eventUpsert.parse(req.body);

    const imageFilename = req.file?.filename ?? null;

    const { rows } = await query(`
      INSERT INTO events (
        title, description, date, time_range, location, type,
        attendees, max_attendees, image_filename, image_url, featured, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, title, description, date, time_range, location, type,
                attendees, max_attendees, image_filename, image_url, featured, status
    `, [
      d.title,
      d.description ?? null,
      d.date,
      d.time_range ?? null,
      d.location ?? null,
      d.type,
      d.attendees ?? 0,
      d.max_attendees ?? null,
      imageFilename,
      d.image_url ?? null,
      !!d.featured,
      d.status ?? 'upcoming'
    ]);

    const row = rows[0];
    // Use external image_url if present, else build URL from filename
    row.image_url = row.image_url || makeImageUrl(req, row.image_filename);

    return res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

// ---- UPDATE ----
// only replace image if a new file is provided; otherwise keep existing
router.put('/:id', upload.single('imageFile'), async (req, res, next) => {
  try {
    const d = eventUpsert.parse(req.body);
    const newFile = req.file?.filename ?? null;

    // Get current image_filename to delete old file if needed
    const { rows: currentRows } = await query(`
      SELECT image_filename FROM events WHERE id = $1
    `, [Number(req.params.id)]);
    const currentImageFilename = currentRows[0]?.image_filename;

    let imageFilenameToStore = newFile;
    let imageUrlToStore = d.image_url || null;

    if (d.clearImage) {
      // Clear both image_filename and image_url
      imageFilenameToStore = null;
      imageUrlToStore = null;
      // Delete the old file if it exists
      if (currentImageFilename) {
        deleteImageFile(currentImageFilename);
      }
    } else if (d.image_url && !newFile) {
      // External URL provided, clear filename
      imageFilenameToStore = null;
      // Delete the old file if it exists
      if (currentImageFilename) {
        deleteImageFile(currentImageFilename);
      }
    } else if (newFile) {
      // New file uploaded, clear URL
      imageUrlToStore = null;
      // Delete the old file if it exists and is different
      if (currentImageFilename && currentImageFilename !== newFile) {
        deleteImageFile(currentImageFilename);
      }
    }

    const { rows } = await query(`
      UPDATE events
      SET
        title         = $1,
        description   = $2,
        date          = $3,
        time_range    = $4,
        location      = $5,
        type          = $6,
        status        = $7,
        attendees     = $8,
        max_attendees = $9,
        image_filename = $10,
        image_url     = $11,
        featured      = $12
      WHERE id        = $13
      RETURNING id, title, description, date, time_range, location, type,
                attendees, max_attendees, image_filename, image_url, featured, status
    `, [
      d.title,
      d.description ?? null,
      d.date,
      d.time_range ?? null,
      d.location ?? null,
      d.type,
      d.status ?? 'upcoming',
      Number(d.attendees ?? 0),
      d.max_attendees !== undefined && d.max_attendees !== null ? Number(d.max_attendees) : null,
      imageFilenameToStore,                // can be string or null
      imageUrlToStore,                     // can be string or null
      !!d.featured,
      Number(req.params.id)
    ]);

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const row = rows[0];
    // Use external image_url if present, else build URL from filename
    row.image_url = row.image_url || makeImageUrl(req, row.image_filename);

    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ---- DELETE ----
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM events WHERE id=$1', [Number(req.params.id)]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---- GET single event by id ----
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, title, description, date, time_range, location, type,
             attendees, max_attendees, image_filename, image_url, featured, status
      FROM events
      WHERE id = $1
    `, [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const row = rows[0];
    // Use external image_url if present, else build from image_filename
    row.image_url = row.image_url || makeImageUrl(req, row.image_filename);
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ---- LIST (handy for debugging the image URL) ----
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, title, description, date, time_range, location, type,
             attendees, max_attendees, image_filename, image_url, featured, status
      FROM events
      ORDER BY date DESC NULLS LAST, id DESC
    `);
    const mapped = rows.map(r => ({
      ...r,
      image_url: r.image_url || makeImageUrl(req, r.image_filename),
    }));
    res.json(mapped);
  } catch (e) {
    next(e);
  }
});

export default router;
