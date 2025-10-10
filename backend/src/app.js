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

  const envAllowlist = parseOrigins(process.env.CORS_ORIGINS);
  // allow your production Vercel domain and all Vercel *preview* subdomains
  const vercelPreview = /^https?:\/\/[a-z0-9-]+-ai-solution-sigma\.vercel\.app$/i;
  // final allowlist: env + (optional) FRONTEND_URL env
  const allowlist = [
    ...envAllowlist,
    process.env.FRONTEND_URL?.trim?.(),
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      // no Origin header = server-to-server, Postman, curl, or same-origin => allow
      if (!origin) return cb(null, true);
      if (allowlist.includes(origin) || vercelPreview.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error('CORS: origin not allowed'));
    },
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    // use true only when sending cookies; your client uses Bearer tokens so false is fine
    credentials: false,
  }));
  // handle preflight quickly
  app.options('*', cors());

   app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
   app.use(express.json({ limit: '2mb' }));
   app.use(morgan('dev'));

-  // No '/api' prefix here — Vercel function is already at /api
+  // No '/api' prefix here — this app is mounted under '/api' in server.js on Render
+  app.get('/', (_req, res) => res.json({ ok: true, service: 'AI-Solution API' }));
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
