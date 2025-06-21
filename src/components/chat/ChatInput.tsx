'use client';

import React, { useState } from 'react';
import { Service, InputField } from '../../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2, Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AdditionalInputs = Record<string, string | number | boolean>;

interface ChatInputProps {
  onSendMessage: (message: string, additionalInputs?: AdditionalInputs) => void;
  isLoading: boolean;
  agent: Service | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, agent }) => {
  const [message, setMessage] = useState('');
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [additionalInputs, setAdditionalInputs] = useState<AdditionalInputs>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSendMessage(message, additionalInputs);
    setMessage('');
  };

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setAdditionalInputs(prev => ({ ...prev, [name]: value }));
  };

  const toggleAdditionalInputs = () => {
    setShowAdditionalInputs(prev => !prev);
  };

  const hasAdditionalInputs = agent && agent.inputs.some(input => 
    !['input', 'text', 'query', 'topic', 'prompt'].includes(input.name)
  );

  return (
    <div className="w-full space-y-4">
      {showAdditionalInputs && hasAdditionalInputs && (
        <Card className="bg-black/40 border-gray-800/50 backdrop-blur-sm text-white shadow-lg bg-gradient-to-br from-black/40 to-purple-900/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-200">Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agent.inputs
              .filter(input => !['input', 'text', 'query', 'topic', 'prompt'].includes(input.name))
              .map((input: InputField) => (
                <div key={input.name} className="space-y-2">
                  <label htmlFor={input.name} className="text-sm font-medium text-gray-300">
                    {input.label} {input.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {input.type === 'select' ? (
                    <Select
                      value={String(additionalInputs[input.name] || input.defaultValue || '')}
                      onValueChange={(value: string) => handleInputChange(input.name, value)}
                      required={input.required}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 hover:border-purple-600/50 text-white focus:ring-purple-500/30 transition-all duration-300">
                        <SelectValue placeholder={input.placeholder || 'Select an option'} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800 text-white">
                        {input.options?.map((option: string) => (
                          <SelectItem key={option} value={option} className="hover:bg-purple-900/50 focus:bg-purple-900/70 transition-colors duration-200">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : input.type === 'textarea' ? (
                    <Textarea
                      id={input.name}
                      value={String(additionalInputs[input.name] || '')}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(input.name, e.target.value)}
                      placeholder={input.placeholder}
                      className="bg-gray-800/50 border-gray-700/50 hover:border-purple-600/50 focus:border-purple-600/80 text-white min-h-[80px] transition-all duration-300"
                      required={input.required}
                      rows={input.rows || 3}
                    />
                  ) : (
                    <Input
                      type={input.type}
                      id={input.name}
                      value={String(additionalInputs[input.name] || '')}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(input.name, e.target.value)}
                      placeholder={input.placeholder}
                      className="bg-gray-800/50 border-gray-700/50 hover:border-purple-600/50 focus:border-purple-600/80 text-white transition-all duration-300"
                      required={input.required}
                    />
                  )}
                  
                  {input.description && (
                    <p className="text-xs text-gray-500 pt-1">{input.description}</p>
                  )}
                </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message..."
            className="w-full h-12 pl-4 pr-24 bg-gray-900/50 border-2 border-gray-800/60 hover:border-purple-600/50 focus:border-purple-600/80 rounded-lg text-white transition-all duration-300 shadow-inner"
            disabled={isLoading}
          />
          
          {hasAdditionalInputs && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleAdditionalInputs}
              className={`absolute right-14 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-purple-400 transition-colors ${showAdditionalInputs ? 'text-purple-500 bg-purple-900/50' : ''}`}
              title="Show additional options"
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading}
          className="h-12 w-12 flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
