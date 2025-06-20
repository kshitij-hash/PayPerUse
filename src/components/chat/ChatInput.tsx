'use client';

import React, { useState } from 'react';
import { Service, InputField } from '../../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatInputProps {
  onSendMessage: (message: string, additionalInputs?: Record<string, any>) => void;
  isLoading: boolean;
  agent: Service | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, agent }) => {
  const [message, setMessage] = useState('');
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [additionalInputs, setAdditionalInputs] = useState<Record<string, any>>({});

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    onSendMessage(message, additionalInputs);
    setMessage('');
    // Keep additional inputs for the next message
  };

  // Handle input change for additional inputs
  const handleInputChange = (name: string, value: string | number | boolean) => {
    setAdditionalInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle additional inputs panel
  const toggleAdditionalInputs = () => {
    setShowAdditionalInputs(prev => !prev);
  };

  return (
    <div className="w-full">
      {/* Additional inputs panel */}
      {showAdditionalInputs && agent && (
        <Card className="mb-4 bg-gray-800 border-gray-700 text-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-300">Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agent.inputs.filter((input: InputField) => input.name !== 'input' && 
                                         input.name !== 'text' && 
                                         input.name !== 'query' && 
                                         input.name !== 'topic' && 
                                         input.name !== 'prompt').map((input: InputField) => (
              <div key={input.name} className="flex flex-col">
                <label htmlFor={input.name} className="text-sm font-medium text-gray-300 mb-1">
                  {input.label} {input.required && <span className="text-red-500">*</span>}
                </label>
                
                {input.type === 'select' ? (
                  <select
                    id={input.name}
                    value={additionalInputs[input.name] || input.defaultValue || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={input.required}
                  >
                    {input.options?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : input.type === 'textarea' ? (
                  <textarea
                    id={input.name}
                    value={additionalInputs[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    placeholder={input.placeholder}
                    className={`border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${input.className || ''}`}
                    required={input.required}
                    rows={input.rows || 3}
                  />
                ) : (
                  <Input
                    type={input.type}
                    id={input.name}
                    value={additionalInputs[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    placeholder={input.placeholder}
                    className="border-gray-600 bg-gray-700 text-white"
                    required={input.required}
                  />
                )}
                
                {input.description && (
                  <p className="mt-1 text-xs text-gray-500">{input.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full pr-12 border-gray-600 bg-gray-700 text-white h-11"
            disabled={isLoading}
          />
          
          {/* Options button */}
          {agent && agent.inputs.some((input: InputField) => 
            input.name !== 'input' && 
            input.name !== 'text' && 
            input.name !== 'query' && 
            input.name !== 'topic' && 
            input.name !== 'prompt') && (
            <Button
              type="button"
              onClick={toggleAdditionalInputs}
              className={`absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 ${showAdditionalInputs ? 'text-blue-400' : ''}`}
              title="Show additional options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </Button>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || isLoading}
          className={`h-11 px-4 flex items-center justify-center ${
            !message.trim() || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
