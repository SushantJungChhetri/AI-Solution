// backend/src/routes/admin/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../db.js';
import { sendOTP } from '../../utils/email.js';

const router = express.Router();

// POST /auth/login  -> send OTP to the single allowed admin
router.post('/login', async (req, res, next) => {
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

    // Generate OTP and store with expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `UPDATE admins SET otp_code = $1, otp_expires_at = $2 WHERE email = $3`,
      [otp, expiresAt, email]
    );

    // Send OTP (do NOT throw on failure; return a clear error)
    const result = await sendOTP(email, otp);
    if (!result?.ok) {
      return res.status(500).json({ ok: false, error: result?.error || 'MAIL_SEND_FAILED' });
    }

    return res.json({ ok: true, message: 'OTP_SENT' });
  } catch (err) {
    console.error('[auth/login] error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

router.post('/login-direct', async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });
    }

    email = String(email).toLowerCase();

    if (email !== 'sushantkch@gmail.com' || password !== 'Admin@123') {
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }

    const { rows } = await query(
      `SELECT id, email FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ ok: false, error: 'ADMIN_NOT_FOUND' });
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
    console.error('[auth/login-direct] error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    }

    email = String(email).toLowerCase();

    const { rows } = await query(
      `SELECT id, email, otp_code, otp_expires_at FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ ok: false, error: 'ADMIN_NOT_FOUND' });
    }

    if (!admin.otp_code || !admin.otp_expires_at) {
      return res.status(401).json({ ok: false, error: 'OTP_MISSING' });
    }

    const now = new Date();
    if (admin.otp_code !== String(otp) || now > new Date(admin.otp_expires_at)) {
      return res.status(401).json({ ok: false, error: 'OTP_INVALID_OR_EXPIRED' });
    }

    // Clear OTP
    await query(
      `UPDATE admins SET otp_code = NULL, otp_expires_at = NULL WHERE email = $1`,
      [email]
    );

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
    console.error('[auth/verify-otp] error:', err?.message || err);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;
