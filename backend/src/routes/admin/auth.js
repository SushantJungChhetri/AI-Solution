import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../db.js';
import { loginSchema } from '../../validations/admin.js';
import { sendOTP } from '../../utils/email.js';

const router = express.Router();

// Send OTP
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Restrict to only sushantkch@gmail.com
    if (email !== 'sushantkch@gmail.com') return res.status(401).json({ error: 'Invalid credentials' });

    const { rows } = await query(
      `SELECT id, email, password_hash FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      `UPDATE admins SET otp_code = $1, otp_expires_at = $2 WHERE email = $3`,
      [otp, expiresAt, email]
    );

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (e) { next(e); }
});

// Direct login for specific admin
router.post('/login-direct', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Only allow sushantkch@gmail.com with Admin@123
    if (email !== 'sushantkch@gmail.com' || password !== 'Admin@123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { rows } = await query(
      `SELECT id, email FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not set in environment variables' });
    }
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (e) { next(e); }
});

// Verify OTP
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const { rows } = await query(
      `SELECT id, email, otp_code, otp_expires_at FROM admins WHERE email = $1`,
      [email]
    );
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

    if (admin.otp_code !== otp || new Date() > admin.otp_expires_at) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    await query(
      `UPDATE admins SET otp_code = NULL, otp_expires_at = NULL WHERE email = $1`,
      [email]
    );

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not set in environment variables' });
    }
    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (e) { next(e); }
});

export default router;
