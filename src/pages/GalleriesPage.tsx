import React, { useEffect, useState } from 'react';
import { galleriesPublicAPI } from '../utils/api';

interface GalleryImage {
  id: number;
  filename: string;
  url: string;
  uploadedAt: string;
}

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const GalleriesPage: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const res = await galleriesPublicAPI.list();
        setImages(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load gallery images');
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const openFullScreen = (url: string) => {
    setFullScreenImage(url);
  };

  const closeFullScreen = () => {
    setFullScreenImage(null);
  };

  return (
    <section className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {images.map((img: GalleryImage) => (
          <div key={img.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="relative overflow-hidden cursor-pointer" onClick={() => openFullScreen(`${BACKEND_BASE_URL}${img.url}`)}>
              <img
                src={`${BACKEND_BASE_URL}${img.url}`}
                alt={img.filename}
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="p-4">
              {/* Removed filename display */}
              <p className="text-xs text-gray-500">{new Date(img.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {!images.length && !loading && (
          <div className="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl border">
            No gallery images available.
          </div>
        )}
      </div>

      {/* Full screen modal */}
      {fullScreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeFullScreen}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={fullScreenImage}
            alt="Full screen"
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            aria-label="Close full screen image"
          >
            &times;
          </button>
        </div>
      )}
    </section>
  );
};

export default GalleriesPage;
