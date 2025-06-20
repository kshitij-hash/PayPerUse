'use client';

import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'error';
    content: string;
    timestamp: string;
    paymentData?: any;
  }>;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            {...message}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="text-gray-600">Thinking...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
