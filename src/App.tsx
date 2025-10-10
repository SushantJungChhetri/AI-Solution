 import React from 'react';
 import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 import FloatingFeedbackIcon from './components/FloatingFeedbackIcon';
 import FloatingAIAssistant from './components/FloatingAIAssistant';
 import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ProjectsPage from './pages/ProjectsPage';
import FeedbackPage from './pages/FeedbackPage';
import ArticlesPage from './pages/ArticlesPage';
import EventsPage from './pages/EventsPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import GalleriesPage from './pages/GalleriesPage';

function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <Router>
      <RouteRender />
      {!isAdminRoute && <FloatingAIAssistant />}
      {!isAdminRoute && <FloatingFeedbackIcon />}
    </Router>
  );
}

function RouteRender() {
  const location = window.location.pathname;
  const isAdminRoute = location.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/event-gallery" element={<GalleriesPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
