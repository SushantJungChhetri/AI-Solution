// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1] : null;

  if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // exp enforced if token has it
    req.admin = { id: payload.sub ?? payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}
