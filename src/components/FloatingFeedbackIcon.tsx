import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const FloatingFeedbackIcon: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        aria-label="Submit Feedback"
      >
        <MessageSquare size={24} />
      </button>
      <FeedbackModal show={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default FloatingFeedbackIcon;
