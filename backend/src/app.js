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

        if (allowedOrigins.includes(origin)) {
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
  app.get('/', (_req, res) => res.json({ ok: true, service: 'AI-Solution API' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Public routes
  app.use('/articles', publicArticles);
  app.use('/events', publicEvents);
  app.use('/feedback', publicFeedback);
  app.use('/inquiries', publicInquiries);
  app.use('/galleries', publicGalleries);

  // Admin routes
  app.use('/auth', adminAuth);
  app.use('/admin/inquiries', adminInquiries);
  app.use('/admin/articles', adminArticles);
  app.use('/admin/events', adminEvents);
  app.use('/admin/feedback', adminFeedback);
  app.use('/admin/metrics', adminMetrics);
  app.use('/admin/galleries', adminGalleries);

  return app;
}
