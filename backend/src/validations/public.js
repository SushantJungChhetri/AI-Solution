import { z } from 'zod';

export const inquirySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9\s-]{7,20}$/).optional().nullable(),
  company: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
  jobDetails: z.string().min(10).max(5000)
});

export const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});
