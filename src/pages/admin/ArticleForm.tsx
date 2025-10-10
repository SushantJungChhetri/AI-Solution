import React, { useEffect, useState } from 'react';
import { adminArticlesAPI } from '../../utils/api';

export type ArticleInput = {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string;
  description?: string;
  author?: string;
  category?: string;
  tags?: string;        // comma separated in UI
  readTime?: number;
  featured?: boolean;
  image?: File | string;       // file or URL/filename
  date?: string;        // yyyy-mm-dd
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export default function ArticleForm({
  initial, onDone
}:{
  initial?: Partial<ArticleInput>,
  onDone: (createdOrUpdated?: any) => void
}) {
  const [form, setForm] = useState<ArticleInput>({
    title: '', author: '', category: '',
    excerpt: '', description: '', tags: '',
    readTime: 6, featured: false, image: '', date: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
      if (initial) {
        let imageVal = initial.image;
        if (typeof imageVal === 'string' && imageVal && !imageVal.startsWith('http')) {
          const apiBase = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
          const cleanImageVal = imageVal.replace(/^\/+/, '');
          imageVal = `${apiBase}/uploads/articles/${cleanImageVal}`;
          setImageInputMode('url'); // If image is string URL, set mode to URL
        } else if (typeof imageVal === 'string' && imageVal.startsWith('http')) {
          setImageInputMode('url');
        } else if (imageVal instanceof File) {
          setImageInputMode('upload');
        }
      setForm(prev => ({ ...prev, ...initial, image: imageVal, description: initial.description || '' }));
      }
  }, [initial]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(f => ({ ...f, [name]: type==='checkbox' ? checked : value }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm(f => ({ ...f, image: e.target.files![0] }));
      setImageInputMode('upload');
    }
  };

  const onUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, image: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('slug', form.slug && form.slug.length ? form.slug : slugify(form.title));
      if (form.excerpt) payload.append('excerpt', form.excerpt);
      if (form.description) payload.append('description', form.description);
      if (form.author) payload.append('author', form.author);
      if (form.category) payload.append('category', form.category);
      if (form.tags) {
        const tagsString = typeof form.tags === 'string' ? form.tags : '';
        tagsString.split(',').map(t => t.trim()).filter(Boolean).forEach(t => payload.append('tags[]', t));
      }
      payload.append('readTime', String(form.readTime || 0));
      payload.append('featured', String(!!form.featured));
      if (imageInputMode === 'upload' && form.image && typeof form.image !== 'string') {
        payload.append('image', form.image);
      } else if (imageInputMode === 'url' && form.image && typeof form.image === 'string') {
        // Append image URL as string field
        payload.append('image', form.image);
      }
      if (form.date) payload.append('publishedAt', form.date);

      const res = form.id
        ? await adminArticlesAPI.update(form.id, payload)
        : await adminArticlesAPI.create(payload);
      onDone(res);
    } catch (e:any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="text-sm">Title *</label>
          <input name="title" value={form.title} onChange={onChange}
                 required className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Slug (optional)</label>
          <input name="slug" value={form.slug || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2" placeholder="auto if empty"/></div>
      </div>

      <div><label className="text-sm">Excerpt</label>
        <textarea name="excerpt" rows={2} value={form.excerpt || ''} onChange={onChange}
                  className="w-full border rounded px-3 py-2"/></div>

      <div>
        <label className="text-sm">Description</label>
        <textarea name="description" rows={6} value={form.description || ''} onChange={onChange}
                  className="w-full border rounded px-3 py-2" placeholder="Enter article description in Markdown or HTML format"/>
        <p className="text-xs text-gray-500 mt-1">You can use Markdown or HTML to format the article description.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-sm">Author</label>
          <input name="author" value={form.author || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Category</label>
          <input name="category" value={form.category || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
        <div><label className="text-sm">Read time (min)</label>
          <input type="number" name="readTime" value={form.readTime || 0} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="text-sm">Tags (comma)</label>
          <input name="tags" value={form.tags || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2" placeholder="ai, cloud"/></div>
        <div>
          <label className="text-sm">Image</label>
          <div className="border rounded p-3">
            <div className="flex space-x-4 mb-3">
              <button
                type="button"
                className={`px-3 py-1 rounded ${imageInputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setImageInputMode('upload')}
              >
                Upload
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded ${imageInputMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setImageInputMode('url')}
              >
                URL
              </button>
            </div>
            {imageInputMode === 'upload' && (
              <>
                <input type="file" name="image" onChange={onFileChange}
                       className="w-full border rounded px-3 py-2" accept="image/*"/>
                {form.image && typeof form.image !== 'string' && (
                  <img src={URL.createObjectURL(form.image)} alt="Selected" className="mt-2 max-h-40 object-contain rounded" />
                )}
              </>
            )}
            {imageInputMode === 'url' && (
              <>
                <input type="text" name="imageUrl" value={typeof form.image === 'string' ? form.image : ''} onChange={onUrlChange}
                       className="w-full border rounded px-3 py-2" placeholder="Enter image URL"/>
                {form.image && typeof form.image === 'string' && (
                  <img
                    src={form.image}
                    alt="Selected"
                    className="mt-2 max-h-40 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const textNode = parent.querySelector('span.image-fallback-text');
                        if (!textNode) {
                          const span = document.createElement('span');
                          span.textContent = 'Image not available';
                          span.className = 'image-fallback-text text-red-600 text-sm mt-1 block';
                          parent.appendChild(span);
                        }
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
        <div><label className="text-sm">Published date</label>
          <input type="date" name="date" value={form.date || ''} onChange={onChange}
                 className="w-full border rounded px-3 py-2"/></div>
      </div>

      <div className="flex items-center gap-2">
        <input id="featured" type="checkbox" name="featured" checked={!!form.featured} onChange={onChange}/>
        <label htmlFor="featured">Featured</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
                disabled={saving}>
          {form.id ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </form>
  );
}
