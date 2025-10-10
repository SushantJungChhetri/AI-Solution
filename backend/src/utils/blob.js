import { put } from '@vercel/blob';

function sanitize(name) {
  return name.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
}

// file: { originalname, mimetype, buffer }
export async function uploadBufferToBlob(file, folder='misc') {
  const key = `${folder}/${Date.now()}_${sanitize(file.originalname || 'file')}`;
  const { url } = await put(key, file.buffer, {
    access: 'public',
    contentType: file.mimetype || 'application/octet-stream',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  return url; // public HTTPS URL
}
