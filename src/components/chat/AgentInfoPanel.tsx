'use client';

import React from 'react';
import { Service } from '../../types';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Info, Lightbulb } from 'lucide-react';

interface AgentInfoPanelProps {
  agent: Service;
}

const AgentInfoPanel: React.FC<AgentInfoPanelProps> = ({ agent }) => {
  const cardClassName = "bg-black/40 border border-gray-800/50 backdrop-blur-sm text-white shadow-lg hover:shadow-xl transition-all duration-300";

  const capabilities: Record<string, string[]> = {
    'translate': [
      'Translates text to multiple languages',
      'Preserves formatting and context',
      'Handles complex language nuances',
    ],
    'summarize': [
      'Creates concise summaries of long texts',
      'Extracts key points and main ideas',
      'Maintains important context',
    ],
    'legal-assistant': [
      'Provides legal information on various jurisdictions',
      'References relevant laws and regulations',
      'Includes appropriate legal disclaimers',
    ],
    'poetry-generator': [
      'Creates poems in various styles',
      'Adapts to different moods and themes',
      'Provides analysis of the generated poem',
    ],
    'code-assistant': [
      'Helps with coding problems and debugging',
      'Supports multiple programming languages',
      'Explains code concepts and patterns',
    ],
    'research-assistant': [
      'Conducts in-depth research on topics',
      'Provides structured information',
      'Adapts to different research depths and focuses',
    ],
    'write': [
      'Generates high-quality written content',
      'Adapts to different tones and styles',
      'Incorporates specified keywords',
    ],
    'text': [
      'Generates text based on prompts',
      'Creates creative and informative content',
      'Responds to complex instructions',
    ],
    'vision': [
      'Analyzes images and provides descriptions',
      'Extracts information from visual content',
      'Responds to prompts about images',
    ],
    'generate-image': [
      'Creates images from text descriptions',
      'Generates creative visual content',
      'Adapts to detailed prompts',
    ],
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pr-2">
      {/* Agent header */}
      <Card className={`${cardClassName} bg-gradient-to-br from-purple-900/20 to-black/40`}>
        <CardHeader>
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 font-bold">{agent.name}</CardTitle>
          <CardDescription className="text-gray-400">{agent.description}</CardDescription>
        </CardHeader>
      </Card>
      
      {/* Pricing info */}
      <Card className={`${cardClassName} bg-gradient-to-br from-black/40 to-purple-900/10`}>
        <CardHeader>
          <CardTitle className="text-sm text-gray-400 flex items-center"><Info className="h-4 w-4 mr-2"/>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white">${agent.pricing.amount}</span>
            <span className="ml-1.5 text-sm text-gray-400">{agent.pricing.currency} / request</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Payments are processed on the {agent.pricing.network || "base-sepolia"} network.
          </p>
        </CardContent>
      </Card>
      
      {/* Provider info */}
      {agent.provider && (
        <Card className={`${cardClassName} bg-gradient-to-br from-black/40 to-pink-900/10`}>
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-600/70 to-pink-600/70 text-white hover:from-purple-700/70 hover:to-pink-700/70 transition-all duration-300">{agent.provider}</Badge>
          </CardContent>
        </Card>
      )}
      
      {/* Input capabilities */}
      <Card className={`${cardClassName} bg-gradient-to-br from-black/40 to-purple-900/10`}>
        <CardHeader>
          <CardTitle className="text-sm text-gray-400 flex items-center"><CheckCircle className="h-4 w-4 mr-2"/>Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-300 space-y-2">
            {(capabilities[agent.id] || []).map((cap, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Usage tips */}
      <Card className={`${cardClassName} mt-auto bg-gradient-to-br from-black/40 to-pink-900/10`}>
        <CardHeader>
          <CardTitle className="text-sm text-gray-400 flex items-center"><Lightbulb className="h-4 w-4 mr-2"/>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-gray-400 space-y-2">
            <li className="flex items-start"><Info className="h-3 w-3 mr-2 mt-0.5"/>Be specific for better results.</li>
            <li className="flex items-start"><Info className="h-3 w-3 mr-2 mt-0.5"/>Use options for more control.</li>
            <li className="flex items-start"><Info className="h-3 w-3 mr-2 mt-0.5"/>Press Enter to send your message.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentInfoPanel;
