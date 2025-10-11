// backend/scripts/seed.js
import 'dotenv/config.js';
import bcrypt from 'bcryptjs';
import { pool, assertDatabaseConnectionOk } from '../src/db.js';

async function main() {
  console.log('[seed] DATABASE_URL raw =', process.env.DATABASE_URL || '(not set)');
  await assertDatabaseConnectionOk();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin
    const email = process.env.ADMIN_EMAIL || 'admin@ai-solutions.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1,$2)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash`,
      [email, hash]
    );

    // Articles
    await client.query(
      `INSERT INTO articles (title, slug, description, excerpt, author, category, featured, published_at)
       VALUES
       ($1,$2,$3,$4,$5,$6,TRUE, NOW()),
       ($7,$8,$9,$10,$11,$12,TRUE, NOW())
       ON CONFLICT (slug) DO UPDATE
         SET description = EXCLUDED.description,
             excerpt = EXCLUDED.excerpt,
             author = EXCLUDED.author,
             category = EXCLUDED.category,
             featured = EXCLUDED.featured,
             updated_at = NOW()`,
      [
        'The Future of AI in Healthcare: Revolutionizing Patient Care',
        'future-of-ai-in-healthcare',
        'Explore how AI is transforming healthcare delivery… (seeded)',
        'Explore how AI is transforming healthcare delivery… (seeded)'.slice(0, 200),
        'Dr. Sarah Chen',
        'Healthcare AI',

        'Machine Learning in Financial Services: Detecting Fraud in Real-Time',
        'machine-learning-financial-services',
        'How ML helps financial institutions detect fraud in real time… (seeded)',
        'How ML helps financial institutions detect fraud in real time… (seeded)'.slice(0, 200),
        'Michael Rodriguez',
        'FinTech',
      ]
    );

    // Events
    await client.query(
      `INSERT INTO events (title, description, date, "time", location, type, status, image_url)
       VALUES
       ($1,$2, NOW() + interval '14 days', '09:00', $3, 'conference', 'scheduled', $4),
       ($5,$6, NOW() + interval '30 days', '10:00', $7, 'workshop',  'scheduled', $8)
       ON CONFLICT DO NOTHING`,
      [
        'AI Revolution Summit',
        'Explore the future of AI (seeded).',
        'San Francisco Convention Center',
        'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800',

        'Machine Learning Workshop',
        'Hands-on advanced ML (seeded).',
        'AI-Solutions Training Center',
        'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
      ]
    );

    // Feedback
    await client.query(
      `INSERT INTO feedback (name, company, project, comment, rating, is_approved, date)
       VALUES
       ($1,$2,$3,$4,5, TRUE, NOW()),
       ($5,$6,$7,$8,5, TRUE, NOW())
       ON CONFLICT DO NOTHING`,
      [
        'Dr. Sarah Johnson', 'MediCare Solutions', 'Healthcare AI Diagnostic System', 'Outstanding work! (seeded)',
        'Michael Chen', 'SecureBank Corp', 'Financial Fraud Detection Platform', 'Exceptional fraud detection platform. (seeded)',
      ]
    );

    // Galleries + images
    await client.query(
      `INSERT INTO galleries (title, description, name)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      ['Opening Event', 'Photos from our opening (seeded)', 'Opening Event']
    );

    await client.query(
      `INSERT INTO gallery_images (gallery_id, filename, url)
       SELECT g.id,
              v.fn,
              v.url
       FROM galleries g
       JOIN (
         VALUES
           ('image-1.png','/uploads/galleries/image-1.png'),
           ('image-2.jpg','/uploads/galleries/image-2.jpg'),
           ('image-3.jpeg','/uploads/galleries/image-3.jpeg')
       ) AS v(fn, url) ON TRUE
       WHERE g.title = 'Opening Event'
         AND NOT EXISTS (
           SELECT 1 FROM gallery_images gi
           WHERE gi.gallery_id = g.id AND gi.url = v.url
         )`
    );

    await client.query('COMMIT');
    console.log('[seed] done ✅');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[seed] failed → rolled back:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
