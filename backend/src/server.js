// src/server.js
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';

import publicInquiries from './routes/public/inquiries.js';
import publicArticles from './routes/public/articles.js';
import publicEvents from './routes/public/events.js';
import publicFeedback from './routes/public/feedback.js';
import publicGalleries from './routes/public/galleries.js';

import adminAuth from './routes/admin/auth.js';
import adminInquiries from './routes/admin/inquiries.js';
import adminArticles from './routes/admin/articles.js';
import adminEvents from './routes/admin/events.js';
import adminFeedback from './routes/admin/feedback.js';
import adminMetrics from './routes/admin/metrics.js';
import adminGalleries from './routes/admin/galleries.js';

import { requireAuth } from './middleware/auth.js';
import { notFound, onError } from './middleware/errors.js';
import { assertDatabaseConnectionOk, pool } from './db.js';

// ---- crash logging ----
process.on('uncaughtException', (err) => {
  console.error('[core] Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[core] Unhandled Rejection:', reason);
  process.exit(1);
});

const app = express();

// Ensure req.protocol respects X-Forwarded-Proto (useful when behind reverse proxies/CDNs)
app.set('trust proxy', true);

// Disable ETag for API responses to avoid 304/If-None-Match serving stale data
app.set('etag', false);

// ---------- security + parsing + logs ----------
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman
      if (
        origins.length === 0 ||
        origins.includes(origin) ||
        origin === (process.env.FRONTEND_ORIGIN || 'http://localhost:3001') ||
        origin.startsWith('file://')
      ) return cb(null, true);
      return cb(new Error('CORS: origin not allowed'));
    },
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: false,
  })
);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// ---------- STATIC: serve uploads (match multer's destination) ----------
const uploadsRoot = path.join(process.cwd(), 'uploads');
const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };

ensureDir(uploadsRoot);
ensureDir(path.join(uploadsRoot, 'events'));
ensureDir(path.join(uploadsRoot, 'articles'));
ensureDir(path.join(uploadsRoot, 'galleries'));

console.log('[static] uploads root:', uploadsRoot);

// Publicly serve uploaded files at /uploads (aggressive caching OK because filenames are unique)
app.use(
  '/uploads',
  express.static(uploadsRoot, {
    setHeaders(res, path) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      // Add content-type header based on file extension if missing
      if (!res.getHeader('Content-Type')) {
        if (path.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
        else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
        else if (path.endsWith('.gif')) res.setHeader('Content-Type', 'image/gif');
        else if (path.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
      }
    },
  })
);

// ---------- routes (Base URL: /api) ----------
const api = express.Router();

// Prevent browser/proxy caching for API JSON (so updates show immediately)
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use('/api', api);

api.use('/articles', publicArticles);
api.use('/events', publicEvents);
api.use('/feedback', publicFeedback);
api.use('/inquiries', publicInquiries);
api.use('/galleries', publicGalleries);
api.get('/health', (_req, res) => res.json({ ok: true }));

// Admin auth (login)
api.use('/auth', adminAuth);

// Admin protected routes
const admin = express.Router();
admin.use(requireAuth);
admin.use('/inquiries', adminInquiries);
admin.use('/articles', adminArticles);
admin.use('/events', adminEvents);
admin.use('/feedback', adminFeedback);
admin.use('/metrics', adminMetrics);
api.use('/admin', admin);

// Register admin galleries route
admin.use('/galleries', adminGalleries);

// 404 + errors
app.use(notFound);
app.use(onError);

// ---------- start server only if DB OK + graceful shutdown ----------
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '127.0.0.1';

(async () => {
  try {
    await assertDatabaseConnectionOk();
    console.log('[pg] Database connection OK');

    const server = app.listen(port, host, () => {
      console.log(`API running on http://${host}:${port}`);
    });

    server.on('error', (err) => {
      console.error('[http] server error:', err);
    });

    // small heartbeat to confirm it's alive
    setInterval(() => console.log('[core] heartbeat', new Date().toISOString()), 15000).unref();

    const shutdown = async (signal) => {
      console.log(`\n[core] Received ${signal}, shutting down…`);
      server.close(async () => {
        try { await pool.end(); } catch {}
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[pg] Database connection failed:', err);
    process.exit(1);
  }
})();
