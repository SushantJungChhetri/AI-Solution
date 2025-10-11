import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routers
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

export function createApi() {
  const app = express();

  const allowedOrigins = [
    "https://ai-solution-sigma.vercel.app",
    "https://ai-solution-9gw6i3htk-sushant-kunwar-chhetris-projects.vercel.app",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        } else {
          console.warn("[CORS blocked]:", origin);
          return callback(new Error("CORS: origin not allowed"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    })
  );

  // Handle preflight requests
  app.options("*", cors());

  // Security & utilities
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  // Health check
  app.get('/api/', (_req, res) => res.json({ ok: true, service: 'AI-Solution API' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Public routes
  app.use('/api/articles', publicArticles);
  app.use('/api/events', publicEvents);
  app.use('/api/feedback', publicFeedback);
  app.use('/api/inquiries', publicInquiries);
  app.use('/api/galleries', publicGalleries);

  // Admin routes
  app.use('/api/auth', adminAuth);
  app.use('/api/admin/inquiries', adminInquiries);
  app.use('/api/admin/articles', adminArticles);
  app.use('/api/admin/events', adminEvents);
  app.use('/api/admin/feedback', adminFeedback);
  app.use('/api/admin/metrics', adminMetrics);
  app.use('/api/admin/galleries', adminGalleries);

  return app;
}
