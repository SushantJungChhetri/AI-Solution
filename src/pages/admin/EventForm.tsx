import React, { useEffect, useState } from 'react';
import { adminEventsAPI } from '../../utils/api';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export type EventInput = {
  id?: number;
  title: string;
  description?: string;
  date: string;         // yyyy-mm-dd
  time?: string;        // "09:00 - 17:00"
  location?: string;
  type: 'conference'|'workshop'|'webinar'|'demo';
  status: 'upcoming'|'past';
  attendees?: number;
  maxAttendees?: number;
  image_url?: string;   // URL
  imageFile?: File;     // Uploaded file
  image_filename?: string; // For distinguishing upload vs URL
  featured?: boolean;
};

export default function EventForm({
  initial, onDone
}:{
  initial?: Partial<EventInput>,
  onDone: (createdOrUpdated?: any) => void
}) {
  const [form, setForm] = useState<EventInput>({
    title:'', description:'', date:'', time:'', location:'',
    type:'conference', status:'upcoming', attendees:0, maxAttendees:100,
    image_url:'', featured:false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const [imageLoadError, setImageLoadError] = useState<{[key: string]: boolean}>({});

  useEffect(()=>{
    if (initial) {
      // Replace form state fully with initial data
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        date: initial.date || '',
        time: initial.time || '',
        location: initial.location || '',
        type: initial.type || 'conference',
        status: initial.status || 'upcoming',
        attendees: initial.attendees ?? 0,
        maxAttendees: initial.maxAttendees ?? 100,
        image_url: initial.image_url || (initial.image_filename ? `${BACKEND_BASE_URL}/uploads/events/${initial.image_filename}` : ''),
        imageFile: initial.imageFile ?? undefined,
        image_filename: initial.image_filename || '',
        featured: initial.featured || false,
        id: initial.id
      });
      if (initial.image_filename) {
        setImageMode('upload');
      } else if (initial.image_url) {
        setImageMode('url');
      } else {
        setImageMode('upload');
      }
      setClearImage(false); // Reset clearImage on new initial data

      // Prepend backend base URL if image_url is relative and not empty
      if (initial.image_url && !initial.image_url.startsWith('http') && initial.image_url.trim() !== '') {
        setForm(f => ({ ...f, image_url: `${BACKEND_BASE_URL}${initial.image_url}` }));
      }
    }
  }, [initial]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(f => ({ ...f, [name]: type==='checkbox' ? checked : value }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm(f => ({ ...f, imageFile: e.target.files![0], image_url: '' }));
      setImageMode('upload');
    }
  };

  const onUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, image_url: e.target.value, imageFile: undefined }));
    setImageMode('url');
  };


  // New useEffect to update imagePreviewUrl when imageFile changes
  React.useEffect(() => {
    if (form.imageFile) {
      const objectUrl = URL.createObjectURL(form.imageFile);
      setImagePreviewUrl(objectUrl);

      // Clean up the object URL when component unmounts or imageFile changes
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreviewUrl(null);
    }
  }, [form.imageFile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');

    // Validate date and status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(form.date);
    if (eventDate < today && form.status === 'upcoming') {
      setError('Please set status to "past" for past dates.');
      setSaving(false);
      return;
    }
    if (eventDate >= today && form.status === 'past') {
      setError('Please set status to "upcoming" for current or future dates.');
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      formData.append('date', form.date);
      formData.append('timeRange', form.time || '');
      formData.append('location', form.location || '');
      formData.append('type', form.type);
      formData.append('status', form.status);
      formData.append('attendees', String(Number(form.attendees) || 0));
      formData.append('max_attendees', String(Number(form.maxAttendees) || 0));
      formData.append('featured', form.featured ? 'true' : 'false');

      if (imageMode === 'upload' && form.imageFile) {
        formData.append('imageFile', form.imageFile);
      } else if (imageMode === 'url' && form.image_url) {
        formData.append('image_url', form.image_url);
      }

      if (clearImage) {
        formData.append('clearImage', 'true');
      }

      const res = form.id
        ? await adminEventsAPI.update(form.id, formData)
        : await adminEventsAPI.create(formData);
      setClearImage(false); // Reset after successful submit
      onDone(res);
    } catch (e:any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm">Title *</label>
          <input name="title" value={form.title} onChange={onChange} required
                 className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Type *</label>
          <select name="type" value={form.type} onChange={onChange}
                  className="w-full border rounded px-3 py-2">
            {['conference','workshop','webinar','demo'].map(t=>( 
              <option key={t} value={t}>{t}</option>
            ))}
          </select></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-sm">Date *</label>
          <input type="date" name="date" value={form.date} onChange={onChange} required
                 className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Time</label>
          <input name="time" value={form.time || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2" placeholder="09:00 - 17:00"/></div>
        <div><label className="text-sm">Status *</label>
          <select name="status" value={form.status} onChange={onChange}
                  className="w-full border rounded px-3 py-2">
            <option value="upcoming">upcoming</option>
            <option value="past">past</option>
          </select></div>
      </div>

      <div><label className="text-sm">Location</label>
        <input name="location" value={form.location || ''} onChange={onChange}
               className="w-full border rounded px-3 py-2"/></div>

      <div><label className="text-sm">Description</label>
        <textarea name="description" rows={4} value={form.description || ''} onChange={onChange}
                  className="w-full border rounded px-3 py-2"/></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm">Attendees</label>
          <input type="number" name="attendees" value={form.attendees ?? 0} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Max Attendees</label>
          <input type="number" name="maxAttendees" value={form.maxAttendees ?? 0} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
      </div>

      {/* Image section with tabs */} 
      <div>
        <label className="text-sm mb-2 block">Event Image</label>
        <div className="flex space-x-4 mb-3">
          <button
            type="button"
            className={`px-4 py-2 rounded border ${imageMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setImageMode('upload')}
          >
            Upload
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded border ${imageMode === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setImageMode('url')}
          >
            URL
          </button>
        </div>

        {imageMode === 'upload' && (
          <div>
            {/* Show preview from imagePreviewUrl if imageFile is set */}
            {form.imageFile && imagePreviewUrl && (
              <div className="mb-2 relative">
                <img src={imagePreviewUrl} alt="Event preview" className="max-h-40 rounded" />
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, imageFile: undefined, image_url: '' }));
                    setImagePreviewUrl(null);
                    setClearImage(true);
                  }}
                  className="absolute top-0 right-0 m-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Delete image"
                  style={{ width: '24px', height: '24px', lineHeight: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              onChange={onFileChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        )}

        {imageMode === 'url' && (
          <div>
            <input
              type="text"
              name="image_url"
              value={form.image_url || ''}
              onChange={onUrlChange}
              placeholder="Enter image URL"
              className="w-full border rounded px-3 py-2"
            />
            {form.image_url && (
              <div className="mt-2 relative">
                {imageLoading[form.image_url] && (
                  <div className="flex items-center justify-center max-h-40 rounded bg-gray-100">
                    <div className="text-gray-500">Loading image...</div>
                  </div>
                )}
                <img
                  src={form.image_url}
                  alt="Event"
                  className={`max-h-40 rounded ${imageLoading[form.image_url] ? 'hidden' : 'block'}`}
                  crossOrigin="anonymous"
                  onLoad={(e) => {
                    setImageLoading(prev => ({ ...prev, [form.image_url!]: false }));
                    setImageLoadError(prev => ({ ...prev, [form.image_url!]: false }));
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    setImageLoading(prev => ({ ...prev, [form.image_url!]: false }));
                    setImageLoadError(prev => ({ ...prev, [form.image_url!]: true }));
                    target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                  }}
                  onLoadStart={() => {
                    setImageLoading(prev => ({ ...prev, [form.image_url!]: true }));
                    setImageLoadError(prev => ({ ...prev, [form.image_url!]: false }));
                  }}
                />
                {imageLoadError[form.image_url] && (
                  <div className="text-red-500 text-sm mt-1">
                    Failed to load image. Please check the URL and try again.
                  </div>
                )}
                {!imageLoading[form.image_url] && !imageLoadError[form.image_url] && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, image_url: '' }));
                      setClearImage(true);
                      setImageLoading(prev => ({ ...prev, [form.image_url!]: false }));
                      setImageLoadError(prev => ({ ...prev, [form.image_url!]: false }));
                    }}
                    className="absolute top-0 right-0 m-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Delete image"
                    style={{ width: '24px', height: '24px', lineHeight: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Show existing image preview if no new upload or URL */}
      {!form.imageFile && form.image_url && (
        <div className="mb-4">
          <label className="text-sm mb-2 block">Current Image</label>
          <img
            src={form.image_url}
            alt="Current event"
            className="max-h-40 rounded"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input id="featuredEvt" type="checkbox" name="featured" checked={!!form.featured} onChange={onChange}/>
        <label htmlFor="featuredEvt">Featured</label>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50">
          {form.id ? 'Update Event' : 'Create Event'}
        </button>
      </div>

    </form>
  );
}
