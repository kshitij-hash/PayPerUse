'use client';

import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot } from 'lucide-react';

interface ChatWindowProps {
  messages: Array<{
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'error';
    content: string;
    timestamp: string;
    paymentData?: Record<string, unknown>;
  }>;
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-purple-600/30 scrollbar-track-transparent">
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            {...message}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3 mb-6">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 pt-2 max-w-3xl">
              <div className="bg-black/40 border-l-4 border-l-purple-500 border-t border-r border-b border-gray-800/50 rounded-md p-4 shadow-lg">
                <div className="flex space-x-2">
                  <div className="h-3 w-32 bg-gradient-to-r from-purple-700/70 to-purple-600/50 rounded-full animate-pulse"></div>
                  <div className="h-3 w-24 bg-gradient-to-r from-purple-600/50 to-purple-500/30 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
