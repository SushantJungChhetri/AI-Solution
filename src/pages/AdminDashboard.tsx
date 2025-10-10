import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, Calendar, Download, Search, Eye, Trash2,
  FileText, Layers, Plus
} from 'lucide-react';

import {
  adminInquiriesAPI,
  adminArticlesAPI,
  adminEventsAPI,
  adminFeedbackAPI,
  adminGalleriesAPI,
  adminMetricsAPI,
  articlesPublicAPI,
  eventsPublicAPI,
} from '../utils/api';

import Modal from '../pages/admin/Modal';
import ArticleForm from '../pages/admin/ArticleForm';
import EventForm from '../pages/admin/EventForm';
import GalleriesPage from '../pages/admin/GalleriesPage';
import Sidebar from '../components/Sidebar';

// NEW: include dashboard tab
type Tab = 'dashboard'|'inquiries'|'articles'|'events'|'galleries'|'feedback';
type InquiryStatus = 'new'|'in-progress'|'completed'|'archived';

const StatCard = ({ icon, label, value, gradient }:{
  icon: React.ReactNode; label: string; value: number|string; gradient?: 'blue'|'green'|'purple'|'orange';
}) => {
  const grad = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }[gradient || 'blue'];
  return (
    <div className={`p-6 rounded-xl text-white bg-gradient-to-r ${grad}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/15">
          {icon}
        </div>
      </div>
    </div>
  );
};

const pill = (text: string, color: 'blue'|'purple'|'green'|'gray') => {
  const map = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-700'
  } as const;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[color]}`}>{text}</span>;
};

interface Inquiry {
  id: number; name: string; email: string; phone?: string; company?: string;
  country?: string; jobTitle?: string; jobDetails: string; submittedAt: string;
  status: InquiryStatus;
}
interface ArticleRow {
  id: number; title: string; author?: string; category?: string;
  publishedAt?: string; featured?: boolean;
}
interface EventRow {
  id: number; title: string; type: 'conference'|'workshop'|'webinar'|'demo';
  status: 'upcoming'|'past'; date: string; location?: string;
  imageUrl?: string; // add imageUrl for frontend display
}
interface FeedbackRow {
  id: number; name: string; company?: string; rating: number; date: string; verified: boolean; status: 'pending' | 'approved' | 'denied';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // DEFAULT: open Dashboard tab
  const [active, setActive] = useState<Tab>('dashboard');
  const [stats, setStats] = useState({ inquiries:0, articles:0, events:0, feedback:0, galleries:0 });

  // inquiries
  const [inq, setInq] = useState<Inquiry[]>([]);

  // galleries
  const [galleries, setGalleries] = useState<any[]>([]);
  const [inqSearch, setInqSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|InquiryStatus>('all');
  const [selectedInq, setSelectedInq] = useState<Inquiry|null>(null);

  // articles
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [artSearch, setArtSearch] = useState('');

  // events
  const [events, setEvents] = useState<EventRow[]>([]);
  const [evtSearch, setEvtSearch] = useState('');

  // feedback
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [fbSearch, setFbSearch] = useState('');


  // modals
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleRow|null>(null);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow|null>(null);


  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // session check (unchanged)
      const isAuth = localStorage.getItem('isAdminAuthenticated');
      const t = localStorage.getItem('adminLoginTime');
      if (!isAuth || !t) return navigate('/admin/login', { replace: true });

      const now = Date.now();
      if (now - new Date(t).getTime() > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminLoginTime');
        localStorage.removeItem('adminToken');
        return navigate('/admin/login', { replace: true });
      }

      try {
        const [
          inqRes, artsRes, evtsRes, fbRes, galleryRes, _metrics
        ] = await Promise.all([
          adminInquiriesAPI.list({ page: 1, limit: 200 }),
          articlesPublicAPI.list({ page: 1, limit: 100 }),
          eventsPublicAPI.list({}),
          adminFeedbackAPI.list({ page: 1, limit: 200 }).catch(() => []),
          adminGalleriesAPI.list().catch(() => []),
          adminMetricsAPI.get().catch(() => null)
        ]);

        if (!isMounted) return;

        const inqList: Inquiry[] = (inqRes.items ?? inqRes) as any[];
        const artList: ArticleRow[] = (artsRes.items ?? artsRes) as any[];
        const evtList: EventRow[] = (evtsRes.items ?? evtsRes) as any[];
        const fbList: FeedbackRow[] = (fbRes.items ?? fbRes) as any[];
        const galleryList: any[] = galleryRes;

        setInq(inqList);
        setArticles(artList);
        setEvents(evtList);
        setFeedback(fbList);
        setGalleries(galleryList);

        setStats({
          inquiries: inqList.length,
          articles: artList.length,
          events: evtList.length,
          feedback: fbList.length,
          galleries: galleryList.length,
        });
      } catch (e:any) {
        console.error('Load failed:', e);
        alert('Failed to load data: ' + (e?.message || e));
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('403')) {
          localStorage.removeItem('isAdminAuthenticated');
          localStorage.removeItem('adminLoginTime');
          localStorage.removeItem('adminToken');
          navigate('/admin/login', { replace: true });
        }
      }
    };

    run();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const updateInquiryStatus = async (id: number, status: InquiryStatus) => {
    await adminInquiriesAPI.updateStatus(id, status);
    setInq(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setSelectedInq(p => (p && p.id === id ? { ...p, status } : p));
  };

  const deleteInquiry = async (id: number) => {
    if (!confirm('Delete this inquiry?')) return;
    await adminInquiriesAPI.delete(id);
    setInq(prev => prev.filter(i => i.id !== id));
    setSelectedInq(p => p && p.id === id ? null : p);
    setStats(s => ({ ...s, inquiries: Math.max(0, s.inquiries - 1) }));
  };

  // Reply email send handler
  const sendReplyEmail = async () => {
    if (!replyMessage.trim()) {
      setReplyError('Reply message cannot be empty.');
      return;
    }
    setReplySending(true);
    setReplyError(null);
    try {
      await adminInquiriesAPI.reply(selectedInq!.id, replyMessage.trim());
      setShowReplyModal(false);
      setReplyMessage('');
      alert('Reply sent successfully.');
    } catch (error: any) {
      setReplyError(error?.message || 'Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  // filters
  const filteredInq = useMemo(() => {
    const q = inqSearch.trim().toLowerCase();
    return inq
      .filter(i => {
        const matches =
          i.name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.company?.toLowerCase().includes(q) ||
          i.jobTitle?.toLowerCase().includes(q) ||
          i.country?.toLowerCase().includes(q);
        const statOk = statusFilter === 'all' || i.status === statusFilter;
        return (!!q ? matches : true) && statOk;
      })
      .sort((a,b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [inq, inqSearch, statusFilter]);

  const filteredArticles = useMemo(() => {
    const q = artSearch.trim().toLowerCase();
    return articles.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    );
  }, [articles, artSearch]);

  const deleteArticle = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    await adminArticlesAPI.delete(id);
    setArticles(prev => prev.filter(a => a.id !== id));
    setStats(s => ({ ...s, articles: Math.max(0, s.articles - 1) }));
  };

  const filteredEvents = useMemo(() => {
    const q = evtSearch.trim().toLowerCase();
    return events.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.type?.toLowerCase().includes(q) ||
      e.status?.toLowerCase().includes(q)
    );
  }, [events, evtSearch]);

  const deleteEvent = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    await adminEventsAPI.delete(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setStats(s => ({ ...s, events: Math.max(0, s.events - 1) }));
  };


  const filteredFeedback = useMemo(() => {
    const q = fbSearch.trim().toLowerCase();
    return feedback.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.company?.toLowerCase().includes(q)
    );
  }, [feedback, fbSearch]);

  const updateFeedbackStatus = async (id: number, status: 'pending' | 'approved' | 'denied') => {
    await adminFeedbackAPI.updateStatus(id, status);
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  // --- Sections ---

  // DASHBOARD: KPIs + compact snapshots
  const DashboardSection = (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={<Users className="h-6 w-6" />} label="Inquiries" value={stats.inquiries} gradient="blue" />
        <StatCard icon={<FileText className="h-6 w-6" />} label="Articles" value={stats.articles} gradient="purple" />
        <StatCard icon={<Calendar className="h-6 w-6" />} label="Events" value={stats.events} gradient="green" />
        <StatCard icon={<MessageSquare className="h-6 w-6" />} label="Feedback" value={stats.feedback} gradient="blue" />
        <StatCard icon={<Layers className="h-6 w-6" />} label="Galleries" value={stats.galleries} gradient="orange" />
      </div>

      {/* Snapshots grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Inquiries</h3>
            <button onClick={() => setActive('inquiries')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-6 space-y-4">
            {(inq.slice(0,4)).map(i => (
              <div key={i.id} className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{i.name} <span className="text-sm text-gray-500">({i.company || '-'})</span></div>
                  <div className="text-sm text-gray-600 truncate">{i.email} • {i.jobTitle || '-'} • {i.country || '-'}</div>
                </div>
                {pill(i.status, i.status==='new'?'blue':i.status==='in-progress'?'purple':i.status==='completed'?'green':'gray')}
              </div>
            ))}
            {!inq.length && <div className="text-gray-500 text-center py-6">No inquiries yet</div>}
          </div>
        </div>

        {/* Latest Articles */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Latest Articles</h3>
            <button onClick={() => setActive('articles')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-6 space-y-4">
            {(articles.slice(0,4)).map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{a.title}</div>
                  <div className="text-sm text-gray-600 truncate">Author: {a.author ?? '-'} • Category: {a.category ?? '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '-'}</div>
              </div>
            ))}
            {!articles.length && <div className="text-gray-500 text-center py-6">No articles</div>}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming / Recent Events</h3>
            <button onClick={() => setActive('events')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-6 space-y-4">
            {(events.slice(0,4)).map(e => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{e.title}</div>
                  <div className="text-sm text-gray-600 truncate">Type: {e.type} • Status: {e.status} • {e.location ?? '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
              </div>
            ))}
            {!events.length && <div className="text-gray-500 text-center py-6">No events</div>}
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Latest Feedback</h3>
            <button onClick={() => setActive('feedback')} className="text-sm text-blue-600 hover:text-blue-700">Manage</button>
          </div>
          <div className="p-6 space-y-4">
            {(feedback.slice(0,4)).map(f => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{f.name}</div>
                  <div className="text-sm text-gray-600 truncate">{f.company || '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
              </div>
            ))}
            {!feedback.length && <div className="text-gray-500 text-center py-6">No feedback</div>}
          </div>
        </div>

        {/* Latest Articles */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Latest Articles</h3>
            <button onClick={() => setActive('articles')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-6 space-y-4">
            {(articles.slice(0,4)).map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{a.title}</div>
                  <div className="text-sm text-gray-600 truncate">Author: {a.author ?? '-'} • Category: {a.category ?? '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '-'}</div>
              </div>
            ))}
            {!articles.length && <div className="text-gray-500 text-center py-6">No articles</div>}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upcoming / Recent Events</h3>
            <button onClick={() => setActive('events')} className="text-sm text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-6 space-y-4">
            {(events.slice(0,4)).map(e => (
              <div key={e.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{e.title}</div>
                  <div className="text-sm text-gray-600 truncate">Type: {e.type} • Status: {e.status} • {e.location ?? '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
              </div>
            ))}
            {!events.length && <div className="text-gray-500 text-center py-6">No events</div>}
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Latest Feedback</h3>
            <button onClick={() => setActive('feedback')} className="text-sm text-blue-600 hover:text-blue-700">Manage</button>
          </div>
          <div className="p-6 space-y-4">
            {(feedback.slice(0,4)).map(f => (
              <div key={f.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{f.name}</div>
                  <div className="text-sm text-gray-600 truncate">{f.company || '-'}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
              </div>
            ))}
            {!feedback.length && <div className="text-gray-500 text-center py-6">No feedback</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // INQUIRIES (unchanged logic, cleaner container)
  const InquiriesSection = (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={inqSearch}
              onChange={(e) => setInqSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => {
              const headers = ['Name','Email','Phone','Company','Country','Job Title','Status','Submitted','Job Details'];
              const csv = [headers.join(','), ...filteredInq.map(i =>
                [
                  i.name ?? '',
                  i.email ?? '',
                  i.phone ?? '',
                  i.company ?? '',
                  i.country ?? '',
                  i.jobTitle ?? '',
                  i.status,
                  new Date(i.submittedAt).toLocaleDateString(),
                  `"${(i.jobDetails ?? '').replace(/"/g, '""')}"`
                ].join(',')
              )].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'inquiries.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* list */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Results</h3>
          </div>
          <div className="p-4 max-h-[560px] overflow-y-auto">
            <div className="space-y-3">
              {filteredInq.map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelectedInq(i)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedInq?.id === i.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {i.name} <span className="text-sm text-gray-500">({i.company || '-'})</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {i.email} • {i.jobTitle || '-'} • {i.country || '-'}
                      </div>
                    </div>
                    {pill(i.status, i.status==='new'?'blue':i.status==='in-progress'?'purple':i.status==='completed'?'green':'gray')}
                  </div>
                  <div className="mt-2 text-sm text-blue-700 line-clamp-2">{i.jobDetails}</div>
                  <div className="mt-2 text-xs text-gray-500">{new Date(i.submittedAt).toLocaleDateString()}</div>
                </button>
              ))}
              {!filteredInq.length && (
                <div className="text-center text-gray-500 p-8">No inquiries</div>
              )}
            </div>
          </div>
        </div>

        {/* details */}
        <div className="bg-white rounded-xl border shadow-sm h-max sticky top-6">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Inquiry Details</h3>
            {selectedInq && (
              <div className="flex items-center gap-2">
                <button onClick={() => deleteInquiry(selectedInq.id)} className="text-red-600 hover:text-red-700 p-2">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="text-blue-600 hover:text-blue-700 p-2"
                  title="Reply to Inquiry"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {selectedInq ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <p><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedInq.name}</span></p>
                  <p><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedInq.email}</span></p>
                  <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedInq.phone || '-'}</span></p>
                  <p><span className="text-gray-500">Company:</span> <span className="font-medium">{selectedInq.company || '-'}</span></p>
                  <p><span className="text-gray-500">Country:</span> <span className="font-medium">{selectedInq.country || '-'}</span></p>
                  <p><span className="text-gray-500">Submitted:</span> <span className="font-medium">{new Date(selectedInq.submittedAt).toLocaleDateString()}</span></p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Details</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">{selectedInq.jobDetails}</div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
                    value={selectedInq.status}
                    onChange={(e) => updateInquiryStatus(selectedInq.id, e.target.value as InquiryStatus)}
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 p-6">
                <Eye className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                Select an inquiry to view
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // ARTICLES
  const ArticlesSection = (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Articles</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title/author/category..."
            value={artSearch}
            onChange={(e) => setArtSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingArticle(null); setShowArticleModal(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          <Plus className="w-4 h-4" /> Add Article
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredArticles.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <div className="text-xs text-gray-500">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '-'}</div>
              </div>
              <p className="text-sm text-gray-600">
                Author: {a.author ?? '-'} • Category: {a.category ?? '-'}
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={async () => {
                    try {
                      const slug = (a as any).slug;
                      if (!slug) {
                        alert('Article slug not available for editing.');
                        return;
                      }
                      const fullArticle = await articlesPublicAPI.getBySlug(slug);
                      setEditingArticle(fullArticle);
                      setShowArticleModal(true);
                    } catch (error) {
                      alert('Failed to load article details for editing.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm"
                >
                  Edit
                </button>
                <button onClick={() => deleteArticle(a.id)} className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredArticles.length && (
          <div className="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl border">No articles</div>
        )}
      </div>
    </section>
  );

  // EVENTS
  const EventsSection = (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Events</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title/location/type/status..."
            value={evtSearch}
            onChange={(e) => setEvtSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((e) => (
          <div key={e.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="relative overflow-hidden">
              {e.imageUrl ? (
                <img
                  src={e.imageUrl}
                  alt={e.title}
                  className="w-full h-32 object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              ) : (
                <div className="w-full h-32 bg-gray-100" />
              )}
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{e.title}</h3>
                <div className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
              </div>
              <p className="text-sm text-gray-600">
                Type: {e.type} • Status: {e.status} • Location: {e.location ?? '-'}
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                onClick={async () => {
                  try {
                    const fullEvent = await adminEventsAPI.get(e.id);
                    // Map image_url to imageUrl and keep image_url for EventForm initial
                    const eventWithImage = {
                      ...fullEvent,
                      imageUrl: fullEvent.image_url || '',
                      image_url: fullEvent.image_url || ''
                    };
                    setEditingEvent(eventWithImage);
                    setShowEventModal(true);
                  } catch (error) {
                    alert('Failed to load event details for editing.');
                  }
                }}
                  className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm"
                >
                  Edit
                </button>
                <button onClick={() => deleteEvent(e.id)} className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredEvents.length && (
          <div className="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl border">No events</div>
        )}
      </div>
    </section>
  );


  // FEEDBACK
  const FeedbackSection = (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>

      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name/company..."
            value={fbSearch}
            onChange={(e) => setFbSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeedback.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{f.name}</h3>
                  <p className="text-sm text-gray-600">{f.company || '-'}</p>
                </div>
                <div className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                {f.status === 'pending' ? (
                  <>
                    <button
                      onClick={async () => { await updateFeedbackStatus(f.id, 'approved'); }}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => { await updateFeedbackStatus(f.id, 'denied'); }}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-sm"
                    >
                      Deny
                    </button>
                  </>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {f.status === 'approved' ? 'Approved' : 'Denied'}
                  </span>
                )}
                <button
                  onClick={async () => {
                    if (window.confirm('Delete this feedback?')) {
                      try {
                        await adminFeedbackAPI.delete(f.id);
                        setFeedback(prev => prev.filter(x => x.id !== f.id));
                        setStats(s => ({ ...s, feedback: Math.max(0, s.feedback - 1) }));
                      } catch (error: any) {
                        console.error('Failed to delete feedback:', error);
                        alert('Failed to delete feedback: ' + (error?.message || 'Unknown error'));
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {!filteredFeedback.length && (
          <div className="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl border">No feedback</div>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar with dashboard entry */}
      <Sidebar active={active} onSelect={setActive} onLogout={logout} />

      {/* Main content — NO TOP HEADER */}
      <div className="flex-1">
        {/* Only render KPIs/snapshots on Dashboard tab */}
        {active === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50">
                {DashboardSection}
              </div>
            </div>
          </div>
        )}

        {/* Feature pages: ONLY their own content */}
        {active !== 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50">
                {active === 'inquiries' && InquiriesSection}
                {active === 'articles' && ArticlesSection}
                {active === 'events' && EventsSection}
                {active === 'galleries' && <GalleriesPage />}
                {active === 'feedback' && FeedbackSection}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals (unchanged) */}
      {showArticleModal && (
        <Modal title={editingArticle ? 'Edit Article' : 'Add Article'} open={showArticleModal} onClose={() => setShowArticleModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <ArticleForm
              initial={editingArticle || undefined}
              onDone={(a) => {
                if (editingArticle) {
                  setArticles(prev => prev.map(x => x.id === a.id ? a : x));
                } else {
                  setArticles(prev => [...prev, a]);
                  setStats(s => ({ ...s, articles: s.articles + 1 }));
                }
                setShowArticleModal(false);
              }}
            />
          </div>
        </Modal>
      )}

      {showEventModal && (
        <Modal title={editingEvent ? 'Edit Event' : 'Add Event'} open={showEventModal} onClose={() => setShowEventModal(false)}>
          <EventForm
            initial={editingEvent || undefined}
              onDone={(e) => {
                if (editingEvent) {
                  // Map image_url to imageUrl for frontend display
                  const updatedEvent = { ...e, imageUrl: e.image_url || '' };
                  setEvents(prev => prev.map(x => x.id === updatedEvent.id ? updatedEvent : x));
                } else {
                  setEvents(prev => [...prev, e]);
                  setStats(s => ({ ...s, events: s.events + 1 }));
                }
                setShowEventModal(false);
              }}
          />
        </Modal>
      )}


      {showReplyModal && (
        <Modal title="Reply to Inquiry" open={showReplyModal} onClose={() => setShowReplyModal(false)}>
          <div className="p-4">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Enter your reply message..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
            {replyError && <p className="text-red-600 text-sm mt-2">{replyError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendReplyEmail}
                disabled={replySending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {replySending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AdminDashboard;
