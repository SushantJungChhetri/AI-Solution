import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { aiAPI } from '../utils/api';

interface AIChatModalProps {
  show: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const STORAGE_KEY = 'ai_chat_messages';

const AIChatModal: React.FC<AIChatModalProps> = ({ show, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    if (show) {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (err) {
          console.error('Failed to load chat messages:', err);
          // Initialize with default message if loading fails
          initializeChat();
        }
      } else {
        initializeChat();
      }
    }
  }, [show]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const initializeChat = () => {
    const initialMessage: Message = {
      id: 1,
      text: "Hello! I'm your AI assistant from AI-Solutions. How can I help you today? I can answer questions about our AI services, digital transformation, or general AI topics.",
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Convert messages to OpenAI format
      const conversationHistory = messages.concat(userMessage).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      const aiResponseText = await aiAPI.chat(conversationHistory);

      const aiResponse: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('AI API Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);

      // Add error message to chat
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${errorMessage}. Please check your OpenAI API key configuration or try again later.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    initializeChat();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white shadow-lg rounded-lg max-w-md w-full mx-4 h-96 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border rounded"
              title="Clear chat history"
            >
              Clear
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.text}</div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg max-w-xs">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '80px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 self-end"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;