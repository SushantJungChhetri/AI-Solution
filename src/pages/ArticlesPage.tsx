import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, User, Clock, Search, ArrowRight, TrendingUp, Eye } from 'lucide-react';
import { articlesPublicAPI } from '../utils/api';

interface Article {
  id: number;
  title: string;
  slug?: string;
  excerpt: string;
  description?: string;
  author: string;
  date?: string;                  // legacy
  published_at?: string;          // legacy snake_case
  publishedAt?: string;           // camelCase
  readTime?: number;
  category: string;
  tags: string[];
  views?: number;
  featured?: boolean;
  image?: string;                 // legacy filename/url
  image_filename?: string;        // legacy filename
  imageUrl?: string | null;       // ✅ render-ready absolute URL
}

const ArticlesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Normalize to ensure imageUrl exists even if backend sends legacy fields
  const normalize = (a: any): Article => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:4000';
    const resolvedImageUrl =
      a.imageUrl ??
      (a.image && /^https?:\/\//i.test(a.image) ? a.image : undefined) ??
      (a.image ? `${apiBase}/uploads/articles/${a.image}` : undefined) ??
      (a.image_filename ? `${apiBase}/uploads/articles/${a.image_filename}` : undefined) ??
      null;

    return {
      ...a,
      imageUrl: resolvedImageUrl,
      publishedAt: a.publishedAt ?? a.published_at ?? a.date,
    };
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await articlesPublicAPI.list({ page: 1, limit: 50 });
      const listRaw: any[] = (res.items ?? res) as any[];
      const list: Article[] = listRaw.map(normalize);
      setArticles(list);
      setError(null);
    } catch (e:any) {
      setError(e.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchArticles();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))],
    [articles]
  );
  const allTags = useMemo(
    () => Array.from(new Set(articles.flatMap(a => a.tags || []))),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (article.title || '').toLowerCase().includes(q) ||
        (article.excerpt || '').toLowerCase().includes(q) ||
        (article.author || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesTag = !selectedTag || (article.tags || []).includes(selectedTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [articles, searchTerm, selectedCategory, selectedTag]);

  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  const formatDate = (iso?: string) => {
    const value = iso || '';
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(+d)) return value;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  };

  const formatViews = (views?: number) =>
    (views && views >= 1000 ? `${(views/1000).toFixed(1)}K` : `${views ?? 0}`);

  const openArticle = async (article: Article) => {
    if (!article.slug) {
      setError('Article slug not available');
      return;
    }
    try {
      const fullArticle = await articlesPublicAPI.getBySlug(article.slug);
      setSelectedArticle(normalize(fullArticle));
    } catch (e: any) {
      setError(e.message || 'Failed to load article');
    }
  };

  if (loading) return <div className="py-20 text-center">Loading articles…</div>;
  if (error) return <div className="py-20 text-center text-red-600">{error}</div>;

  return (
    <div className="py-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Articles & Insights</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Stay ahead with the latest insights, trends, and innovations in AI, technology, and digital transformation.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured */}
        {featuredArticles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center mb-8">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredArticles.slice(0, 2).map((article) => (
                <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                  <div className="relative overflow-hidden">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100" />
                    )}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {formatViews(article.views)}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center mb-4 text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      <span className="mr-4">{article.author}</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="mr-4">{formatDate(article.publishedAt || article.published_at || article.date)}</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{article.readTime ?? 8} min read</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {(article.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => openArticle(article)}
                        className="text-blue-600 font-semibold hover:text-blue-700 flex items-center"
                      >
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Latest */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularArticles.map((article) => (
              <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div className="relative overflow-hidden">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100" />
                  )}
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {article.category}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {formatViews(article.views)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3 text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-3">{article.author}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(article.publishedAt || article.published_at || article.date)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{article.readTime ?? 8} min read</span>
                    </div>
                    <button
                      onClick={() => openArticle(article)}
                      className="text-blue-600 font-semibold hover:text-blue-700 flex items-center"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(article.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Article Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h1>
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      <span className="mr-4">{selectedArticle.author}</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="mr-4">{formatDate(selectedArticle.publishedAt)}</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{selectedArticle.readTime ?? 8} min read</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                {selectedArticle.imageUrl && (
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <div className="prose prose-lg max-w-none">
                {selectedArticle.description ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedArticle.description }} />
                ) : (
                  <p>No description available.</p>
                )}
                </div>
                <div className="flex flex-wrap gap-2 mt-6">
                  {(selectedArticle.tags || []).map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter (unchanged) */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-12 text-center text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Our Latest Insights</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and never miss the latest trends, insights, and innovations in AI and technology.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full px-6 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;
