// backend/src/routes/admin/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../db.js';

const router = express.Router();

// POST /auth/login -> direct login for admin
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });
    }

    email = String(email).toLowerCase();

    // Restrict to the single admin
    if (email !== 'sushantkch@gmail.com') {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    // Find admin
    const { rows } = await query(
      `SELECT id, email, password_hash FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, error: 'JWT_SECRET_MISSING' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ ok: true, token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error('[auth/login] error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;
