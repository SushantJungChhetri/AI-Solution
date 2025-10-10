
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Shield, Users, ArrowRight, CheckCircle, Star, TrendingUp, MessageCircle, Calendar, Clock, User, Eye } from 'lucide-react';
import { feedbackPublicAPI, articlesPublicAPI, eventsPublicAPI } from '../utils/api';
import { motion } from 'framer-motion';

interface Feedback {
  id: number;
  name: string;
  company?: string;
  project?: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;
  is_approved?: boolean;
}

interface Article {
  id: number;
  title: string;
  slug?: string;
  excerpt: string;
  description?: string;
  author: string;
  date?: string;
  published_at?: string;
  publishedAt?: string;
  readTime?: number;
  category: string;
  tags: string[];
  views?: number;
  featured?: boolean;
  image?: string;
  image_filename?: string;
  imageUrl?: string | null;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'conference' | 'workshop' | 'webinar' | 'demo';
  status: 'upcoming' | 'past';
  attendees: number;
  maxAttendees: number;
  imageUrl: string;
  featured: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const cardHover = {
  scale: 1.05,
  boxShadow: '0px 10px 20px rgba(0,0,0,0.12)',
  transition: { duration: 0.3 }
};

const buttonHover = {
  scale: 1.05,
  boxShadow: '0px 8px 15px rgba(0,0,0,0.2)',
  transition: { duration: 0.3 }
};

const HomePage = () => {
  const [testimonials, setTestimonials] = useState<Feedback[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const [feedbackRes, articlesRes, eventsRes] = await Promise.all([
          feedbackPublicAPI.list({ verified: 'true', limit: '3' }),
          articlesPublicAPI.list({ limit: '3' }),
          eventsPublicAPI.list({ limit: '10' }),
        ]);
        setTestimonials((feedbackRes.items ?? feedbackRes) as Feedback[]);
        setArticles((articlesRes.items ?? articlesRes) as Article[]);
        // Filter only upcoming events and limit to 3
        console.log('Fetched events:', eventsRes);
        const upcomingEvents = (eventsRes.items ?? eventsRes as Event[]).filter((event: Event) => {
          console.log('Checking event:', event.title, 'date:', event.date, 'status:', event.status);
          // Temporarily only filter by status to debug
          return event.status === 'upcoming';
          // Uncomment below to re-enable date filtering after debugging
          /*
          const eventDate = new Date(event.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return eventDate >= today && event.status === 'upcoming';
          */
        }).slice(0, 3);
        setEvents(upcomingEvents);
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Solutions',
      description: 'Cutting-edge artificial intelligence solutions tailored to your business needs.'
    },
    {
      icon: Zap,
      title: 'Digital Transformation',
      description: 'Modernize your operations with our comprehensive digital transformation services.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee for all our solutions.'
    },
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Experienced team of engineers and AI specialists dedicated to your success.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Projects Completed' },
    { number: '150+', label: 'Happy Clients' },
    { number: '25+', label: 'Countries Served' },
    { number: '99.9%', label: 'Uptime Guarantee' }
  ];

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const openArticleModal = async (article: Article) => {
    if (!article.slug) {
      setError('Article slug not available');
      return;
    }
    try {
      const fullArticle = await articlesPublicAPI.getBySlug(article.slug);
      setSelectedArticle(fullArticle as Article);
      setIsArticleModalOpen(true);
    } catch (e: any) {
      setError(e.message || 'Failed to load article');
    }
  };

  const openEventModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  return (
    <div>
      {/* Hero Section */}
      <motion.section
        className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 text-white overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial="hidden"
              animate="visible"
            >
              {"Transform Your Business with".split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  className="inline-block mr-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                className="bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent block mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                AI-Powered Solutions
              </motion.span>
            </motion.h1>
            <motion.p
              className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Leading provider of artificial intelligence and computer systems engineering solutions. 
              We help businesses harness the power of AI to drive innovation, efficiency, and growth.
            </motion.p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.div whileHover={buttonHover} className="flex">
                <Link
                  to="/services"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center"
                >
                  Explore Our Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={buttonHover} className="flex">
                <Link
                  to="/contact"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center"
                >
                  Get Started Today
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-16 bg-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 bg-gray-50"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Why Choose AI-Solutions?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              We combine cutting-edge technology with industry expertise to deliver solutions that transform businesses.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md group"
                whileHover={cardHover}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * index }}
              >
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Services Overview */}
      <motion.section
        className="py-20 bg-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Comprehensive AI Solutions for Every Industry
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                From machine learning algorithms to complete digital transformation, 
                we provide end-to-end solutions that drive measurable results.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Custom AI Model Development</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Data Analytics & Business Intelligence</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Process Automation Solutions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">Cloud Infrastructure & DevOps</span>
                </div>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div
              className="mt-12 lg:mt-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                      <span className="font-semibold text-gray-900">Performance Boost</span>
                    </div>
                    <p className="text-gray-600">Average 40% increase in operational efficiency</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center mb-4">
                      <Star className="h-8 w-8 text-yellow-500 mr-3" />
                      <span className="font-semibold text-gray-900">Client Satisfaction</span>
                    </div>
                    <p className="text-gray-600">4.9/5 average rating from our clients</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        className="py-20 bg-gray-50"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              What Our Clients Say
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              Discover the experiences of our satisfied clients and partners.
            </motion.p>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading testimonials...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No testimonials available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  className="bg-white rounded-xl shadow-lg p-8 group"
                  whileHover={cardHover}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * index }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          {testimonial.name}
                          {(testimonial.verified ?? testimonial.is_approved) && (
                            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Verified
                            </span>
                          )}
                        </h3>
                        {testimonial.company && <p className="text-gray-600">{testimonial.company}</p>}
                        {testimonial.project && <p className="text-sm text-blue-600 font-medium">{testimonial.project}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-5 w-5 ${star <= testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(testimonial.date)}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{testimonial.comment}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center">
            <motion.div whileHover={buttonHover} className="inline-flex justify-center">
              <Link
                to="/feedback"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                View More Testimonials
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Articles Section */}
      <motion.section
        className="py-20 bg-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Latest Articles
            </motion.h2>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              Stay informed with the latest articles and insights from our experts.
            </motion.p>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading articles...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No articles available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group"
                  whileHover={cardHover}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * index }}
                >
                  {article.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{article.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{article.author}</span>
                      <span>{new Date(article.publishedAt ?? article.published_at ?? article.date ?? '').toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openArticleModal(article)}
                        className="text-blue-600 font-semibold hover:text-blue-700 flex items-center"
                      >
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center">
            <motion.div whileHover={buttonHover} className="inline-flex justify-center">
              <Link
                to="/articles"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                View More Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Events Section */}
      <motion.section
        className="py-20 bg-gray-50"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
              <motion.h2
                className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Events
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Discover upcoming events and stay connected with our community.
              </motion.p>
          </div>
          {loading ? (
            <div className="text-center py-12">Loading events...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-600">No events available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group"
                  whileHover={cardHover}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * index }}
                >
                  {event.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{event.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openEventModal(event)}
                        className="text-blue-600 font-semibold hover:text-blue-700 flex items-center"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="text-center">
            <motion.div whileHover={buttonHover} className="inline-flex justify-center">
              <Link
                to="/events"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                View More Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Ready to Transform Your Business?
          </motion.h2>
          <motion.p
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Join hundreds of companies that have already revolutionized their operations with our AI solutions.
          </motion.p>
          <motion.div whileHover={buttonHover} className="inline-flex justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-xl"
            >
              Start Your Project Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Article Modal */}
      {isArticleModalOpen && selectedArticle && (
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
                    <span className="mr-4">{formatDate(selectedArticle.publishedAt ?? selectedArticle.published_at ?? selectedArticle.date ?? '')}</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{selectedArticle.readTime ?? 8} min read</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsArticleModalOpen(false)}
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

      {/* Event Modal */}
      {isEventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setIsEventModalOpen(false)}
              aria-label="Close modal"
            >
              &#x2715;
            </button>
            {selectedEvent.imageUrl && (
              <img
                src={selectedEvent.imageUrl}
                alt={selectedEvent.title}
                className="w-full h-64 object-cover rounded-md mb-4"
              />
            )}
            <h2 className="text-3xl font-bold mb-2">{selectedEvent.title}</h2>
            <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{formatDate(selectedEvent.date)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>{selectedEvent.time}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                <span>{selectedEvent.attendees}/{selectedEvent.maxAttendees} Attending</span>
              </div>
            </div>
            <p className="text-gray-600"><strong>Location:</strong> {selectedEvent.location}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
