import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { eventsPublicAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

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

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await eventsPublicAPI.list({});
        setEvents((res.items ?? res) as Event[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(+d)) return dateString;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) return <div className="py-20 text-center">Loading events…</div>;
  if (error) return <div className="py-20 text-center text-red-600">{error}</div>;

  // Filter events into upcoming and past
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const pastEvents = events.filter((e) => e.status === 'past');

  // Rewrite imageUrl to use relative path if it starts with backend base URL
  const rewriteImageUrl = (url: string) => {
    console.log('rewriteImageUrl input:', url);
    if (!url) return '';
    if (url.startsWith(BACKEND_BASE_URL)) {
      const rewritten = url.replace(BACKEND_BASE_URL, '');
      console.log('rewriteImageUrl output:', rewritten);
      return rewritten;
    }
    console.log('rewriteImageUrl output:', url);
    return url;
  };

  return (
    <div className="py-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Events</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover upcoming and past events, and stay updated with our event gallery.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 mx-2 rounded-lg font-medium transition-colors ${
              activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-2 mx-2 rounded-lg font-medium transition-colors ${
              activeTab === 'past' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Events Section */}
        {(() => {
          const tabEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
          return (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                {activeTab === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
              </h2>
              {tabEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tabEvents.map((event) => (
                    <article
                      key={event.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
                    >
                      <div className="relative overflow-hidden">
                          {event.imageUrl ? (
                            <img
                              src={rewriteImageUrl(event.imageUrl)}
                              alt={event.title}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100" />
                          )}
                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium text-white ${
                          activeTab === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {event.attendees}/{event.maxAttendees}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center mb-3 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="mr-3">{formatDate(event.date)}</span>
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{event.time}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{event.description}</p>
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 font-semibold hover:text-blue-700 flex items-center"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No {activeTab} events found.
                </p>
              )}
            </section>
          );
        })()}

        {/* Gallery Button */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-12 text-center text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Our Event Gallery</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-lg mx-auto">
            <button
              onClick={() => navigate('/event-gallery')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
            >
              Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {isModalOpen && selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              &#x2715;
            </button>
            <img
              src={rewriteImageUrl(selectedEvent!.imageUrl)}
              alt={selectedEvent!.title}
              className="w-full h-64 object-cover rounded-md mb-4"
            />
            <div className="max-h-[60vh] overflow-y-auto">
              <h2 className="text-3xl font-bold mb-2">{selectedEvent!.title}</h2>
              <p className="text-gray-700 mb-4">{selectedEvent!.description}</p>
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatDate(selectedEvent!.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{selectedEvent!.time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{selectedEvent!.attendees} Attending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
