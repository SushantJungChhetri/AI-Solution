import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import AIChatModal from './AIChatModal';

const FloatingAIAssistant: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        aria-label="Chat with AI Assistant"
      >
        <MessageCircle size={24} />
      </button>
      <AIChatModal show={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default FloatingAIAssistant;