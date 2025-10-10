import express from 'express';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { eventUpsert } from '../../validations/admin.js';
import multer from 'multer';
import { uploadBufferToBlob } from '../../utils/blob.js';

const router = express.Router();
router.use(requireAuth);

// ---- Multer (memory) ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// Helper to decide final image fields from inputs
async function resolveImageFields({ file, body, existing }) {
  // existing: row with current image fields (for UPDATE), or null (for CREATE)
  const clear = body?.clearImage === 'true' || body?.clearImage === true;

  if (clear) {
    return { image_filename: null, image_url: null };
  }

  // 1) New file uploaded → upload to Blob, store URL, filename=NULL
  if (file) {
    const url = await uploadBufferToBlob(file, 'events');
    return { image_filename: null, image_url: url };
  }

  // 2) External image_url provided → store it; filename=NULL
  if (typeof body?.image_url === 'string' && body.image_url.trim()) {
    return { image_filename: null, image_url: body.image_url.trim() };
  }

  // 3) Otherwise keep existing (on UPDATE) or null (on CREATE)
  if (existing) {
    return {
      image_filename: existing.image_filename ?? null,
      image_url: existing.image_url ?? null,
    };
  }

  return { image_filename: null, image_url: null };
}

// ---- CREATE ----
// expects multipart/form-data with field name "imageFile"
router.post('/', upload.single('imageFile'), async (req, res, next) => {
  try {
    const d = eventUpsert.parse(req.body);

    const { image_filename, image_url } = await resolveImageFields({
      file: req.file,
      body: req.body,
      existing: null,
    });

    const { rows } = await query(
      `
      INSERT INTO events (
        title, description, date, time_range, location, type,
        attendees, max_attendees, image_filename, image_url, featured, status,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW(), NOW())
      RETURNING id, title, description, date, time_range, location, type,
                attendees, max_attendees, image_filename, image_url, featured, status
      `,
      [
        d.title,
        d.description ?? null,
        d.date,
        d.time_range ?? null,
        d.location ?? null,
        d.type,
        d.attendees ?? 0,
        d.max_attendees ?? null,
        image_filename,       // will be null on Vercel
        image_url,            // Blob or external URL or null
        !!d.featured,
        d.status ?? 'upcoming',
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ---- UPDATE ----
// only replace image if a new file is provided / image_url sent / clearImage=true
router.put('/:id', upload.single('imageFile'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const d = eventUpsert.parse(req.body);

    // Fetch current to preserve fields if no new image instruction is given
    const { rows: currentRows } = await query(
      `SELECT id, image_filename, image_url FROM events WHERE id = $1`,
      [id]
    );
    if (!currentRows[0]) return res.status(404).json({ error: 'Not found' });

    const { image_filename, image_url } = await resolveImageFields({
      file: req.file,
      body: req.body,
      existing: currentRows[0],
    });

    const { rows } = await query(
      `
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
        featured      = $12,
        updated_at    = NOW()
      WHERE id        = $13
      RETURNING id, title, description, date, time_range, location, type,
                attendees, max_attendees, image_filename, image_url, featured, status
      `,
      [
        d.title,
        d.description ?? null,
        d.date,
        d.time_range ?? null,
        d.location ?? null,
        d.type,
        d.status ?? 'upcoming',
        Number(d.attendees ?? 0),
        d.max_attendees !== undefined && d.max_attendees !== null ? Number(d.max_attendees) : null,
        image_filename,  // likely null
        image_url,       // Blob/external/kept/null
        !!d.featured,
        id,
      ]
    );

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ---- DELETE ----
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await query('DELETE FROM events WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    // (Optional) If you want to delete Blob objects too, store blob keys and call @vercel/blob del()
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---- GET single event by id ----
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT id, title, description, date, time_range, location, type,
             attendees, max_attendees, image_filename, image_url, featured, status
      FROM events
      WHERE id = $1
      `,
      [Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ---- LIST ----
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `
      SELECT id, title, description, date, time_range, location, type,
             attendees, max_attendees, image_filename, image_url, featured, status
      FROM events
      ORDER BY date DESC NULLS LAST, id DESC
      `
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
