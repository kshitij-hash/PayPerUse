'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from '../../../components/chat/ChatWindow';
import ChatInput from '../../../components/chat/ChatInput';
import ChatMessageComponent from '../../../components/chat/ChatMessage';
import AgentInfoPanel from '../../../components/chat/AgentInfoPanel';
import { Service, ChatMessage as ChatMessageType } from '../../../types';
import services from '../../../../services.json';
import { getWalletFromLocalStorage } from '../../../lib/sessionWalletManager';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  
  const [agent, setAgent] = useState<Service | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Find the agent from services.json
  useEffect(() => {
    const foundAgent = (services as any).services.find((s: Service) => s.id === agentId);
    if (foundAgent) {
      setAgent(foundAgent);
      // Add a welcome message
      const welcomeMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'system',
        content: `Welcome to ${foundAgent.name}! How can I help you today?`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } else {
      setError(`Agent "${agentId}" not found`);
    }
  }, [agentId]);

  // Handle sending a message to the agent
  const handleSendMessage = async (message: string, additionalInputs: Record<string, any> = {}) => {
    if (!agent) return;
    
    // Create user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare the payload based on the agent's expected inputs
      const payload: Record<string, any> = {
        ...additionalInputs
      };
      
      // For agents that expect a primary text input, use different field names based on the agent
      if (agent.id === 'translate') {
        payload.text = message;
      } else if (agent.id === 'summarize') {
        payload.input = message;
      } else if (agent.id === 'legal-assistant') {
        payload.query = message;
      } else if (agent.id === 'poetry-generator') {
        payload.topic = message;
      } else if (agent.id === 'code-assistant') {
        payload.query = message;
      } else if (agent.id === 'research-assistant') {
        payload.topic = message;
      } else if (agent.id === 'write') {
        payload.topic = message;
      } else if (agent.id === 'gemini-text') {
        payload.input = message;
      } else if (agent.id === 'gemini-vision') {
        payload.prompt = message;
      } else {
        // Default fallback
        payload.input = message;
      }
      
      // Get the user's wallet from localStorage
      const userWallet = getWalletFromLocalStorage();
      
      // Check if the user has a wallet
      if (!userWallet) {
        // Add a system message about missing wallet
        const systemMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: 'system',
          content: 'You need to connect a wallet before you can use this service. Please go to the wallet page to create or connect a wallet.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, systemMessage]);
        setIsLoading(false);
        return;
      }
      
      // Send the request through the x402-proxy to handle payments
      const response = await fetch(`/api/x402-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: agent.endpoint,
          method: 'POST',
          walletId: userWallet.id,  // Use the user's wallet ID
          walletAddress: userWallet.address, // Include the wallet address
          data: payload  // Renamed from 'payload' to 'data' as expected by the proxy
        })
      });
      
      if (!response.ok) {
        // Handle payment required error
        if (response.status === 402) {
          const paymentData = await response.json();
          // Add a system message about payment
          const paymentMessage: ChatMessageType = {
            id: Date.now().toString(),
            role: 'system',
            content: 'Payment required. Please check your wallet and try again.',
            paymentData,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, paymentMessage]);
          return;
        }
        
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Format the response based on the agent type
      let formattedResponse = '';
      
      if (agent.id === 'translate') {
        formattedResponse = data.translatedText;
      } else if (agent.id === 'summarize') {
        formattedResponse = data.summary;
      } else if (agent.id === 'legal-assistant') {
        formattedResponse = `**${data.jurisdiction || 'Global'} Legal Information**\n\n${data.information}\n\n**Relevant Laws:**\n${data.relevantLaws.join('\n')}\n\n*${data.disclaimer}*`;
      } else if (agent.id === 'poetry-generator') {
        formattedResponse = `**${data.title || 'Poem'}**\n\n${data.poem}\n\n**Analysis:**\n${data.analysis}`;
      } else if (agent.id === 'code-assistant' || agent.id === 'research-assistant' || agent.id === 'write') {
        formattedResponse = data.content || data.text || JSON.stringify(data);
      } else {
        // Default fallback
        formattedResponse = typeof data === 'string' ? data : JSON.stringify(data);
      }
      
      // Add agent response to chat
      const assistantMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      
      // Add error message to chat
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'error',
        content: `Error: ${err.message || 'Failed to send message'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (error && !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-400">Error</CardTitle>
            <CardDescription className="text-gray-300">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              asChild
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Link href="/services">Return to Services</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar with agent info */}
      <div className="hidden md:block w-1/4 max-w-xs p-4 bg-gray-800 border-r border-gray-700 text-gray-200">
        {agent && <AgentInfoPanel agent={agent} />}
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between text-gray-200">
          <div className="flex items-center">
            <Link href="/services" className="mr-4 text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold">{agent?.name || 'Agent Chat'}</h1>
          </div>
        </header>
        
        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
          />
        </div>
        
        {/* Input area */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            agent={agent}
          />
        </div>
      </div>
    </div>
  );
}
