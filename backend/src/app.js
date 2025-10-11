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
   * CORS (step 6A)
   * - Allow your exact Vercel prod domain(s) + localhost.
   * - Also allow *.vercel.app previews via regex.
   ***********************/
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'https://ai-solution-sigma.vercel.app',
    'https://ai-solution-9gw6i3htk-sushant-kunwar-chhetris-projects.vercel.app',
  ]);
  const vercelPreviewRegex = /\.vercel\.app$/i;

  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin requests (no Origin header), curl, server-to-server
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
    })
  );

  // Handle preflight globally
  app.options('*', cors());

  /***********************
   * Security & utilities (step 6B)
   ***********************/
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('tiny'));

  /***********************
   * Simple ping
   * NOTE: app is mounted under /api from server.js,
   * so this responds at GET /api/
   ***********************/
  app.get('/', (_req, res) => res.json({ ok: true, service: 'AI-Solution API' }));

  /***********************
   * Health routes (step 3/4)
   * - /api/health/db returns DB now + table counts
   ***********************/
  app.use('/health', health);

  /***********************
   * Public routes
   * (will be available under /api/<route>)
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
   * 404 handler (step 6C)
   * - For any unknown path under this app (/api/*)
   ***********************/
  app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  /***********************
   * Global error handler (step 6D)
   * - Logs on server, returns safe JSON to client
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
