import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const articleUpsert = z.object({
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  author: z.string().max(120).optional().nullable(),
  publishedAt: z.string().optional().nullable(), // ISO date
  readTime: z.coerce.number().int().optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  tags: z.union([
    z.array(z.string()),
    z.string()
  ]).optional().nullable(),
  featured: z.coerce.boolean().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const eventUpsert = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional().nullable(),
  date: z.string(), // YYYY-MM-DD
  timeRange: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  type: z.enum(['conference','workshop','webinar','demo']),
  status: z.enum(['upcoming','past']).nullable(),
  attendees: z.coerce.number().int().optional().nullable(),
  max_attendees: z.coerce.number().int().optional().nullable(),
  image_filename: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  clearImage: z.string().optional().nullable(),
  featured: z.coerce.boolean().optional().nullable()
});

export const galleryUpsert = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  cover_image: z.string().url().optional().nullable()
});

export const validateGallery = (req, res, next) => {
  try {
    galleryUpsert.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};

export const galleryImageUpsert = z.object({
  url: z.string().url(),
  caption: z.string().optional().nullable()
});
