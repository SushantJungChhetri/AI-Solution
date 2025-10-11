// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import health from './health.js';

// Public routers
import publicInquiries from './routes/public/inquiries.js';
import publicArticles from './routes/public/articles.js';
import publicEvents from './routes/public/events.js';
import publicFeedback from './routes/public/feedback.js';
import publicGalleries from './routes/public/galleries.js';

// Admin routers
import adminAuth from './routes/admin/auth.js';
import adminInquiries from './routes/admin/inquiries.js';
import adminArticles from './routes/admin/articles.js';
import adminEvents from './routes/admin/events.js';
import adminFeedback from './routes/admin/feedback.js';
import adminMetrics from './routes/admin/metrics.js';
import adminGalleries from './routes/admin/galleries.js';

export function createApi() {
  const app = express();

  /***********************
   * CORS
   * - Allow exact prod origins via env ALLOWED_ORIGINS
   * - Allow *.vercel.app previews
   * - Allow localhost:5173
   ***********************/
  const envList =
    (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  // Normalize (strip trailing /)
  const allowedOrigins = new Set(
    [
      'http://localhost:5173',
      // Add your primary Vercel domain(s) here or via ALLOWED_ORIGINS
      'https://ai-solutionwebsite.vercel.app',
      ...envList,
    ].map(o => o.replace(/\/+$/g, ''))
  );

  const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/i;

  app.use(
    cors({
      origin(origin, cb) {
        // same-origin, curl, server-to-server
        if (!origin) return cb(null, true);

        const normalized = origin.replace(/\/+$/g, '');
        const allowed =
          allowedOrigins.has(normalized) || vercelPreviewRegex.test(normalized);

        if (allowed) return cb(null, true);

        console.warn('[CORS blocked]:', origin);
        return cb(new Error(`CORS: origin not allowed: ${origin}`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false, // set true only if you actually use cookies across origins
      maxAge: 86400, // cache preflight 24h
    })
  );

  // Handle preflight quickly
  app.options('*', (req, res) => {
    res.set('Access-Control-Max-Age', '86400');
    res.sendStatus(204);
  });

  /***********************
   * Security & utilities
   ***********************/
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('tiny'));

  // Optional: simple health/ping at /api/
  app.get('/', (_req, res) => res.json({ ok: true, service: 'AI-Solution API' }));

  /***********************
   * Health
   ***********************/
  app.use('/health', health);

  /***********************
   * Public routes
   ***********************/
  app.use('/articles', publicArticles);
  app.use('/events', publicEvents);
  app.use('/feedback', publicFeedback);
  app.use('/inquiries', publicInquiries);
  app.use('/galleries', publicGalleries);

  /***********************
   * Admin routes
   ***********************/
  app.use('/auth', adminAuth);
  app.use('/admin/inquiries', adminInquiries);
  app.use('/admin/articles', adminArticles);
  app.use('/admin/events', adminEvents);
  app.use('/admin/feedback', adminFeedback);
  app.use('/admin/metrics', adminMetrics);
  app.use('/admin/galleries', adminGalleries);

  /***********************
   * 404 handler
   ***********************/
  app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  /***********************
   * Global error handler
   ***********************/
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[API ERROR]', err);
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
  });

  return app;
}
