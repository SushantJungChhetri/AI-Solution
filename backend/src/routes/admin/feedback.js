import express from 'express';
import { query } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/admin/feedback?approved=true|false&page=1&limit=50
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 50));
    const offset = (page - 1) * limit;

    const params = [];
    const where = [];

    if (typeof req.query.approved !== 'undefined') {
      params.push(req.query.approved === 'true');
      where.push(`verified = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT id, name, company, project, rating, comment, date, verified, status
         FROM feedback
         ${whereSql}
         ORDER BY date DESC, id DESC
         LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json(rows);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['pending', 'approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { rowCount } = await query(
      `UPDATE feedback SET status = $1 WHERE id = $2`,
      [status, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: `Feedback status updated to ${status}` });
  } catch (e) { next(e); }
});

// DELETE /api/admin/feedback/:id - delete feedback
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { rowCount } = await query(
      `DELETE FROM feedback WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted' });
  } catch (e) { next(e); }
});

export default router;
