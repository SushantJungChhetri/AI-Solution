// backend/scripts/seed.js
import 'dotenv/config.js';
import bcrypt from 'bcryptjs';
import { pool, assertDatabaseConnectionOk } from '../src/db.js';

async function main() {
  // Helpful diagnostics so we know what this process is using
  console.log('[seed] DATABASE_URL raw =', process.env.DATABASE_URL || '(not set)');
  console.log('[seed] PGHOST/PGUSER =', process.env.PGHOST || '(not set)', '/', process.env.PGUSER || '(not set)');

  // Prove we can talk to the DB (prints redacted URL + db/user/now)
  await assertDatabaseConnectionOk();

  const client = await pool.connect();
  try {
    console.log('[seed] BEGIN');
    await client.query('BEGIN');

    /***********************
     * 1) Admin (idempotent)
     ***********************/
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hash = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash`,
      [email, hash]
    );
    console.log('[seed] admin ensured:', email);

    /***********************
     * 2) Articles
     * schema: (title, slug, content, author, category, featured, published_at)
     ***********************/
    await client.query(
      `INSERT INTO articles (title, slug, content, author, category, featured, published_at)
       VALUES
       ($1,$2,$3,$4,$5,TRUE, now()),
       ($6,$7,$8,$9,$10,TRUE, now())
       ON CONFLICT (slug) DO UPDATE
         SET content    = EXCLUDED.content,
             author     = EXCLUDED.author,
             category   = EXCLUDED.category,
             featured   = EXCLUDED.featured,
             updated_at = now()`,
      [
        'The Future of AI in Healthcare: Revolutionizing Patient Care',
        'future-of-ai-in-healthcare',
        'Explore how AI is transforming healthcare delivery… (seeded)',
        'Dr. Sarah Chen',
        'Healthcare AI',

        'Machine Learning in Financial Services: Detecting Fraud in Real-Time',
        'machine-learning-financial-services',
        'How ML helps financial institutions detect fraud in real time… (seeded)',
        'Michael Rodriguez',
        'FinTech',
      ]
    );
    console.log('[seed] articles seeded/updated');

    /***********************
     * 3) Events
     * schema: (title, description, event_date, location)
     ***********************/
    await client.query(
      `INSERT INTO events (title, description, event_date, location)
       VALUES
       ($1,$2, now() + interval '14 days', $3),
       ($4,$5, now() + interval '30 days', $6)
       ON CONFLICT DO NOTHING`,
      [
        'AI Revolution Summit',
        'Explore the future of AI (seeded).',
        'San Francisco Convention Center',

        'Machine Learning Workshop',
        'Hands-on advanced ML (seeded).',
        'AI-Solutions Training Center',
      ]
    );
    console.log('[seed] events seeded');

    /***********************
     * 4) Feedback
     * schema: (name, comment, rating, verified)
     ***********************/
await client.query(
  `INSERT INTO galleries (title, description)
   VALUES ($1, $2)
   ON CONFLICT DO NOTHING`,
  ['Opening Event', 'Photos from our opening (seeded)']
);

// Insert three images only if they don't already exist
await client.query(
  `INSERT INTO gallery_images (gallery_id, image_url, caption)
   SELECT g.id, v.img, v.cap
   FROM galleries g
   JOIN (
     VALUES
       ('https://picsum.photos/seed/ais1/800/500', 'Ribbon cutting (seeded)'),
       ('https://picsum.photos/seed/ais2/800/500', 'Keynote (seeded)'),
       ('https://picsum.photos/seed/ais3/800/500', 'Audience (seeded)')
   ) AS v(img, cap) ON TRUE
   WHERE g.title = 'Opening Event'
     AND NOT EXISTS (
       SELECT 1
       FROM gallery_images gi
       WHERE gi.gallery_id = g.id
         AND gi.image_url = v.img
     );`
);
console.log('[seed] gallery + images seeded');

    await client.query('COMMIT');
    console.log('[seed] COMMIT — done ✅');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[seed] ROLLBACK — failed:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
