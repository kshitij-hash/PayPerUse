'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Import shadcn/ui components
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: string;
  paymentData?: Record<string, any>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp, paymentData }) => {
  const [copied, setCopied] = useState(false);
  const formattedTime = format(new Date(timestamp), 'h:mm a');
  
  // Parse and format content if it's a JSON string
  const formatContent = (text: string): string => {
    try {
      // Check if the content starts with a JSON-like pattern
      if (text.trim().startsWith('{"result":')) {
        const parsedContent = JSON.parse(text);
        if (parsedContent.result) {
          // Replace escaped newlines with actual newlines
          return parsedContent.result.replace(/\\n/g, '\n');
        }
      }
    } catch (e) {
      // If parsing fails, return the original content
      console.error('Error parsing message content:', e);
    }
    return text;
  };

  // Format the content for display
  const displayContent = formatContent(content);
  
  // Function to copy content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  // Define avatar colors and icons based on role
  const avatarBg = 
    role === 'user' ? 'bg-blue-600' :
    role === 'assistant' ? 'bg-purple-600' :
    role === 'system' ? 'bg-gray-600' :
    'bg-red-600';
  
  // Define card variants based on role
  const cardVariant = 
    role === 'user' ? 'bg-blue-800 border-blue-700 text-white' :
    role === 'assistant' ? 'bg-gray-800 border-gray-700 text-gray-100' :
    role === 'system' ? 'bg-gray-700 border-gray-600 text-gray-200' :
    'bg-red-900 border-red-800 text-red-100';

  return (
    <div className={`flex space-x-3 ${role === 'user' ? 'justify-end' : ''}`}>
      {role !== 'user' && (
        <div className="flex-shrink-0">
          <Avatar className={`${avatarBg} text-white h-10 w-10`}>
            <AvatarFallback className="text-white">
              {role === 'assistant' ? 'AI' : 
               role === 'system' ? 'SYS' : 
               role === 'error' ? '!' :
               '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={`flex-1 max-w-3xl ${role === 'user' ? 'ml-auto' : ''}`}>
        <Card className={`shadow-sm border ${cardVariant} relative`}>
          {role === 'assistant' && (
            <button 
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
              title="Copy response"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>
          )}
          <CardContent className="p-4">
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold text-white mb-4 mt-6 border-b border-gray-700 pb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold text-gray-100 mb-3 mt-5" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-medium text-gray-200 mb-2 mt-4" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-base font-medium text-gray-300 mb-2 mt-3" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-4 text-gray-200 leading-relaxed" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 mb-4 text-gray-200" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 mb-4 text-gray-200" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="mb-1" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-4" {...props} />
                ),
                code: ({className, children}) => {
                  // Check if this is a code block (has language class)
                  const match = /language-(\w+)/.exec(className || '');
                  if (match) {
                    try {
                      return (
                        <div className="code-block my-4 rounded-md overflow-hidden">
                          <SyntaxHighlighter 
                            style={vs} 
                            language={match[1]}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    } catch (err) {
                      return <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-sm`}>{children}</code>;
                    }
                  }
                  return <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-sm`}>{children}</code>;
                }
              }}
            >
              {displayContent}
            </ReactMarkdown>
            </div>
            
            {/* Payment Required UI */}
            {paymentData && (
              <div className="mt-4 p-3 bg-yellow-900 border border-yellow-800 rounded-md">
                <h4 className="font-medium text-yellow-200">Payment Required</h4>
                <p className="text-sm text-yellow-300 mt-1">
                  This service requires payment to continue.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="secondary"
                    className="bg-yellow-700 text-white hover:bg-yellow-800"
                    onClick={() => {
                      // This would typically trigger your payment flow
                      console.log('Payment flow triggered', paymentData);
                      // You could dispatch an event or call a function passed as props
                    }}
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="text-xs text-gray-400 mt-1 px-2">{formattedTime}</div>
      </div>
      
      {role === 'user' && (
        <div className="flex-shrink-0">
          <Avatar className={`${avatarBg} text-white h-10 w-10`}>
            <AvatarFallback className="text-white font-bold">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
