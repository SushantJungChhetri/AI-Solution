import React, { useEffect, useMemo, useState } from 'react';
import { Star, Users, TrendingUp, MessageCircle, ThumbsUp } from 'lucide-react';
import { feedbackPublicAPI } from '../utils/api';

interface Feedback {
  id: number;
  name: string;
  company?: string;
  project?: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;       // or is_approved
  is_approved?: boolean;
}

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await feedbackPublicAPI.list({ verified: 'true', page: 1, limit: 100 });
      setFeedbacks((res.items ?? res) as Feedback[]);
    } catch (e:any) {
      setError(e.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      fetchFeedback();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const visible = useMemo(() => {
    return feedbacks
      .filter(f => filterRating === null || f.rating === filterRating)
      .sort((a, b) => {
        if (sortBy === 'date') return +new Date(b.date) - +new Date(a.date);
        return b.rating - a.rating;
      });
  }, [feedbacks, sortBy, filterRating]);

  const averageRating = useMemo(
    () => (feedbacks.reduce((acc, f) => acc + f.rating, 0) / (feedbacks.length || 1)),
    [feedbacks]
  );
  const totalReviews = feedbacks.length;
  const ratingDistribution = useMemo(() =>
    [5,4,3,2,1].map(rating => ({
      rating,
      count: feedbacks.filter(f => f.rating === rating).length,
      percentage: totalReviews ? (feedbacks.filter(f => f.rating === rating).length / totalReviews) * 100 : 0
    })), [feedbacks, totalReviews]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  if (loading) return <div className="py-20 text-center">Loading feedback…</div>;
  if (error) return <div className="py-20 text-center text-red-600">{error}</div>;

  return (
    <div className="py-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Client Feedback</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover what our clients have to say about their experience working with AI-Solutions.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Rating Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`h-6 w-6 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-gray-600">Based on {totalReviews} reviews</p>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {ratingDistribution.map(item => (
                  <div key={item.rating} className="flex items-center">
                    <span className="text-sm text-gray-600 w-8">{item.rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards (kept) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-8 text-white text-center">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">{totalReviews}+</div>
            <div>Happy Clients</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-8 text-white text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">98%</div>
            <div>Satisfaction Rate</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-white text-center">
            <ThumbsUp className="h-12 w-12 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">95%</div>
            <div>Repeat Clients</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Most Recent</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by rating:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterRating(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterRating === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  All
                </button>
                {[5,4,3,2,1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center ${filterRating === rating ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {rating} <Star className="h-3 w-3 ml-1 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-8">
          {visible.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {feedback.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {feedback.name}
                      {(feedback.verified ?? feedback.is_approved) && (
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Verified Client
                        </span>
                      )}
                    </h3>
                    {feedback.company && <p className="text-gray-600">{feedback.company}</p>}
                    {feedback.project && <p className="text-sm text-blue-600 font-medium">{feedback.project}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center mb-2">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`h-5 w-5 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(feedback.date)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{feedback.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA (unchanged) */}
      </div>
    </div>
  );
};

export default FeedbackPage;
