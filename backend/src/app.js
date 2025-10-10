// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// routers
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

function parseOrigins(str) {
  return (str || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function createApi() {
  const app = express();

  // CORS (env-driven)
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
      cb(new Error('CORS: origin not allowed'));
    },
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: false,
  }));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  // No '/api' prefix here — Vercel function is already at /api
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Public
  app.use('/articles', publicArticles);
  app.use('/events', publicEvents);
  app.use('/feedback', publicFeedback);
  app.use('/inquiries', publicInquiries);
  app.use('/galleries', publicGalleries);

  // Admin
  app.use('/auth', adminAuth);
  app.use('/admin/inquiries', adminInquiries);
  app.use('/admin/articles', adminArticles);
  app.use('/admin/events', adminEvents);
  app.use('/admin/feedback', adminFeedback);
  app.use('/admin/metrics', adminMetrics);
  app.use('/admin/galleries', adminGalleries);

  return app;
}
