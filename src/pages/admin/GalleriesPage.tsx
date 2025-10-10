import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminGalleriesAPI } from '../../utils/api';

interface GalleryImage {
  id: number;
  filename: string;
  url: string;
  uploadedAt: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const GalleriesPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await adminGalleriesAPI.list();
      setImages(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await adminGalleriesAPI.upload(formData);
      setImages(prev => [...prev, res]);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await adminGalleriesAPI.delete(id);
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (e: any) {
      alert('Delete failed: ' + (e?.message || e));
    }
  };

  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Galleries</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
          className="flex-1"
          disabled={uploading}
        />
        <button
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="relative overflow-hidden">
              <img
                src={`${BACKEND_BASE_URL}${img.url}`}
                alt={img.filename}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">{img.filename}</p>
              <p className="text-xs text-gray-500">{new Date(img.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {!images.length && (
          <div className="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl border">
            No gallery images yet. Upload some images to get started.
          </div>
        )}
      </div>
    </section>
  );
};

export default GalleriesPage;
