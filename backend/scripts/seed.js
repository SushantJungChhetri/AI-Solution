import 'dotenv/config.js';
import bcrypt from 'bcryptjs';
import { query, pool } from '../src/db.js';

async function main() {
  // Admin
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO admins (email, password_hash)
     VALUES ($1,$2)
     ON CONFLICT (email) DO NOTHING`,
    [email, hash]
  );

  // Articles (minimal examples)
  await query(`
    INSERT INTO articles (title,slug,excerpt,description,author,published_at,read_time,category,tags,views,featured,image)
    VALUES
    ('The Future of AI in Healthcare: Revolutionizing Patient Care', 'future-of-ai-in-healthcare', 'Explore how artificial intelligence is transforming healthcare delivery...',
     'Full article content...',
     'Dr. Sarah Chen','2024-01-20',8,'Healthcare AI',ARRAY['AI','Healthcare','Machine Learning','Innovation'],2850,TRUE,'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800'),
    ('Machine Learning in Financial Services: Detecting Fraud in Real-Time', 'machine-learning-financial-services', 'Learn how advanced ML algorithms are helping financial institutions...',
     'Full article content...',
     'Michael Rodriguez','2024-01-18',6,'FinTech',ARRAY['Machine Learning','Fraud Detection','Finance','Security'],1920,TRUE,'https://images.pexels.com/photos/6693655/pexels-photo-6693655.jpeg?auto=compress&cs=tinysrgb&w=800')
  ON CONFLICT DO NOTHING;
  `);

  // Events
  await query(`
    INSERT INTO events (title,description,date,time_range,location,type,attendees,max_attendees,featured,image_url)
    VALUES
    ('AI Revolution Summit 2024','Explore the future of AI','2024-03-15','09:00 - 17:00','San Francisco Convention Center','conference',450,500,TRUE,'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800'),
    ('Machine Learning Workshop: From Theory to Practice','Hands-on advanced ML','2024-02-28','10:00 - 16:00','AI-Solutions Training Center','workshop',25,30,FALSE,'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800')
  ON CONFLICT DO NOTHING;
  `);

  // Feedback
  await query(`
    INSERT INTO feedback (name,company,project,rating,comment,date,verified)
    VALUES
    ('Dr. Sarah Johnson','MediCare Solutions','Healthcare AI Diagnostic System',5,'Outstanding work!','2024-01-15',TRUE),
    ('Michael Chen','SecureBank Corp','Financial Fraud Detection Platform',5,'Exceptional fraud detection platform.','2024-01-10',TRUE)
  ON CONFLICT DO NOTHING;
  `);

  // Gallery Images (sample data for gallery_images table)
  await query(`
    INSERT INTO gallery_images (filename, url)
    VALUES
    ('image-1706764598-123456789.png', '/uploads/galleries/image-1706764598-123456789.png'),
    ('image-1706764600-987654321.jpg', '/uploads/galleries/image-1706764600-987654321.jpg'),
    ('image-1706764605-111222333.jpeg', '/uploads/galleries/image-1706764605-111222333.jpeg')
  ON CONFLICT DO NOTHING;
  `);

  console.log('Seed complete.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
