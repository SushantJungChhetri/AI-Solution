import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../../db.js';

const router = express.Router();

// GET /feedback - list approved feedback with pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(
      `SELECT id, name, company, rating, comment, verified, date, status
       FROM feedback
       WHERE status = 'approved'
       ORDER BY date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/** GET /feedback/:id */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, company, rating, comment, verified, date, status
       FROM feedback
       WHERE id = $1 AND status = 'approved'`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Feedback not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error('Failed to fetch feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// POST /feedback - submit new feedback for admin approval
router.post(
  '/',
  [
    body('name').isString().notEmpty(),
    body('company').optional().isString(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').isString().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, rating, comment } = req.body;

    try {
      const result = await db.query(
      `INSERT INTO feedback (name, company, rating, comment, verified, date)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING id, name, company, rating, comment, verified, date`,
        [name, company || null, rating, comment]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Failed to insert feedback:', err);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }
);

export default router;
