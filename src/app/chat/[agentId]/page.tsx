"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { WalletButton } from "@/components/Header";

import ChatWindow from "../../../components/chat/ChatWindow";
import ChatInput from "../../../components/chat/ChatInput";
import AgentInfoPanel from "../../../components/chat/AgentInfoPanel";
import { Service, ChatMessage as ChatMessageType } from "../../../types";
import services from "../../../../services.json";
import { getWalletFromLocalStorage } from "../../../lib/sessionWalletManager";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Mappings for agent-specific logic
const agentInputMapping: Record<string, string> = {
  translate: "text",
  summarize: "input",
  "legal-assistant": "query",
  "poetry-generator": "topic",
  "code-assistant": "query",
  "research-assistant": "topic",
  write: "topic",
  "gemini-text": "input",
  "gemini-vision": "prompt",
};

interface AgentResponseData {
  translatedText?: string;
  summary?: string;
  jurisdiction?: string;
  information?: string;
  relevantLaws?: string[];
  disclaimer?: string;
  [key: string]: unknown; // For other potential properties
}

const agentResponseMapping: Record<string, (data: AgentResponseData) => string> = {
  translate: (data) => {
    // Handle both result key (from API) and translatedText key (from interface)
    return (typeof data.result === 'string' ? data.result : '') || data.translatedText || '';
  },
  summarize: (data) => {
    if (typeof data === "string") return data;
    return data.result as string || '';
  },
  "legal-assistant": (data) =>
    `**${data.jurisdiction || "Global"} Legal Information**

${
      data.information || ''
    }

**Relevant Laws:**
${data.relevantLaws?.join("\n") || 'None available'}\n\n*${
      data.disclaimer
    }*`,
  "poetry-generator": (data) => {
    // Extract the components from the API response
    const title = data.title || "## Poem";
    
    // Clean up the poem - remove the trailing marker if present
    let poem = (data.poem as string) || '';
    // Remove any trailing markers or partial analysis headers from the poem
    if (typeof poem === 'string') {
      // Remove any trailing dashes and Poetic Elements text
      poem = poem.replace(/---[\s\S]*?\*\*Poetic Elements.*$/g, '');
      // Also check for just the Poetic Elements text without dashes
      poem = poem.replace(/\*\*Poetic Elements.*$/g, '');
      // Trim any trailing whitespace
      poem = poem.trim();
    }
    
    // Format the analysis with proper markdown heading
    let analysis = '';
    if (typeof data.analysis === 'string') {
      const analysisText = data.analysis;
      
      // Check if analysis starts with "Analysis:**" pattern
      if (analysisText.startsWith('Analysis:**')) {
        // Create a combined bold heading for "Poetic Elements Analysis"
        analysis = '**Poetic Elements Analysis**\n' + analysisText.substring(11);
      } else {
        analysis = '**Analysis**\n' + analysisText;
      }
    }
    
    // Combine everything with proper markdown formatting
    return `${title}\n\n${poem}\n\n${analysis}`;
  },
  "code-assistant": (data) => {
    if (typeof data === "string") return data;
    return (data.content as string) || (data.text as string) || JSON.stringify(data);
  },
  "research-assistant": (data) => {
    if (typeof data === "string") return data;
    return (data.content as string) || (data.text as string) || JSON.stringify(data);
  },
  write: (data) => {
    if (typeof data === "string") return data;
    return (data.content as string) || (data.text as string) || JSON.stringify(data);
  },
  "gemini-text": (data) =>
    typeof data === "string" ? data : (data.output as string) || JSON.stringify(data),
  "gemini-vision": (data) =>
    typeof data === "string" ? data : (data.output as string) || JSON.stringify(data),
};

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Service | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const foundAgent = (services as { services: Service[] }).services.find(
      (s: Service) => s.id === agentId
    );
    if (foundAgent) {
      setAgent(foundAgent);
      const welcomeMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "system",
        content: `Welcome to ${foundAgent.name}! How can I help you today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } else {
      setError(`Agent "${agentId}" not found`);
    }
  }, [agentId]);

  const handleSendMessage = async (
    message: string,
    additionalInputs: Record<string, string | number | boolean | object> = {}
  ) => {
    if (!agent) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const payload: Record<string, string | number | boolean | object> = { ...additionalInputs };
      const primaryInputKey = agentInputMapping[agent.id] || "input";
      payload[primaryInputKey] = message;

      const userWallet = getWalletFromLocalStorage();
      if (!userWallet) {
        const systemMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: "system",
          content:
            "You need to connect a wallet before you can use this service. Please go to the wallet page to create or connect a wallet.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/x402-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: agent.endpoint,
          method: "POST",
          walletId: userWallet.id,
          walletAddress: userWallet.address,
          data: payload,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const paymentData = await response.json();
          const paymentMessage: ChatMessageType = {
            id: Date.now().toString(),
            role: "system",
            content: "Payment required. Please check your wallet and try again.",
            paymentData,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, paymentMessage]);
          return;
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const formatResponse = agentResponseMapping[agent.id];
      const formattedResponse = formatResponse
        ? formatResponse(data)
        : typeof data === "string"
        ? data
        : JSON.stringify(data);

      const assistantMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "assistant",
        content: formattedResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: Error | unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error sending message:", err);
      const errorMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: "error",
        content: `Error: ${error.message || "Failed to send message"}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !agent) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        <Card className="w-full max-w-md bg-gradient-to-br from-black/40 to-red-900/20 border border-red-500/50 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-400">
              Agent Not Found
            </CardTitle>
            <CardDescription className="text-gray-400">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 transform hover:scale-105"
            >
              <Link href="/services">Back to Services</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30 animate-gradient-slow" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute rounded-full bg-purple-500/10" 
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                animation: `pulse ${Math.random() * 5 + 3}s infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Sidebar with agent info */}
      <div className="hidden md:flex flex-col w-96 border-r border-white/10 bg-black/30 p-6 backdrop-blur-xl overflow-y-auto shadow-xl">
        {agent && <AgentInfoPanel agent={agent} />}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-lg bg-gradient-to-r from-black/40 via-purple-900/10 to-black/40 shadow-md">
          <div className="flex items-center space-x-4">
            <Link
              href="/services"
              className="text-gray-400 hover:text-purple-400 transition-all duration-300 transform hover:scale-110 p-2 rounded-full hover:bg-purple-900/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                {agent?.name || "Agent Chat"}
              </h1>
              {agent?.provider && (
                <p className="text-xs text-gray-400">Powered by {agent.provider}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <div className="px-3 py-1 rounded-full bg-purple-900/20 border border-purple-500/30 text-purple-300 text-xs font-medium animate-pulse">
                {agent?.pricing?.amount ? `$${agent.pricing.amount} / request` : 'AI Agent'}
              </div>
            </div>
            
            <WalletButton />
            
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full max-w-sm bg-black/80 border-l border-white/10 text-white p-0">
                  <SheetHeader className="p-6 border-b border-white/10">
                    <SheetTitle>Agent Information</SheetTitle>
                  </SheetHeader>
                  <div className="p-6 overflow-y-auto">
                    {agent && <AgentInfoPanel agent={agent} />}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-lg shadow-inner">
          <div className="animate-fade-in-up">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              agent={agent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
