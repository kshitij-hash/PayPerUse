'use client';

import React from 'react';
import { Service } from '../../types';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface AgentInfoPanelProps {
  agent: Service;
}

const AgentInfoPanel: React.FC<AgentInfoPanelProps> = ({ agent }) => {
  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto">
      {/* Agent header */}
      <Card className="bg-gray-800 border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle className="text-xl text-white">{agent.name}</CardTitle>
          <CardDescription className="text-gray-300">{agent.description}</CardDescription>
        </CardHeader>
      </Card>
      
      {/* Pricing info */}
      <Card className="bg-blue-900 border-blue-800 text-blue-100">
        <CardHeader>
          <CardTitle className="text-sm text-blue-200">Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-blue-100">${agent.pricing.amount}</span>
            <span className="ml-1 text-sm text-blue-200">{agent.pricing.currency}</span>
            <span className="ml-2 text-xs text-blue-300">per request</span>
          </div>
          <p className="text-xs text-blue-300 mt-2">
            Payments processed via X402 on {agent.pricing.network || "base-sepolia"}
          </p>
        </CardContent>
      </Card>
      
      Provider info
      {agent.provider && (
        <Card className="bg-gray-800 border-gray-700 text-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-200">Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-gray-300">{agent.provider}</span>
          </CardContent>
        </Card>
      )}
      
      {/* Input capabilities */}
      <Card className="bg-gray-800 border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-300 space-y-1">
          {agent.id === 'translate' && (
            <>
              <li>• Translates text to multiple languages</li>
              <li>• Preserves formatting and context</li>
              <li>• Handles complex language nuances</li>
            </>
          )}
          {agent.id === 'summarize' && (
            <>
              <li>• Creates concise summaries of long texts</li>
              <li>• Extracts key points and main ideas</li>
              <li>• Maintains important context</li>
            </>
          )}
          {agent.id === 'legal-assistant' && (
            <>
              <li>• Provides legal information on various jurisdictions</li>
              <li>• References relevant laws and regulations</li>
              <li>• Includes appropriate legal disclaimers</li>
            </>
          )}
          {agent.id === 'poetry-generator' && (
            <>
              <li>• Creates poems in various styles</li>
              <li>• Adapts to different moods and themes</li>
              <li>• Provides analysis of the generated poem</li>
            </>
          )}
          {agent.id === 'code-assistant' && (
            <>
              <li>• Helps with coding problems and debugging</li>
              <li>• Supports multiple programming languages</li>
              <li>• Explains code concepts and patterns</li>
            </>
          )}
          {agent.id === 'research-assistant' && (
            <>
              <li>• Conducts in-depth research on topics</li>
              <li>• Provides structured information</li>
              <li>• Adapts to different research depths and focuses</li>
            </>
          )}
          {agent.id === 'write' && (
            <>
              <li>• Generates high-quality written content</li>
              <li>• Adapts to different tones and styles</li>
              <li>• Incorporates specified keywords</li>
            </>
          )}
          {agent.id === 'gemini-text' && (
            <>
              <li>• Generates text based on prompts</li>
              <li>• Creates creative and informative content</li>
              <li>• Responds to complex instructions</li>
            </>
          )}
          {agent.id === 'gemini-vision' && (
            <>
              <li>• Analyzes images and provides descriptions</li>
              <li>• Extracts information from visual content</li>
              <li>• Responds to prompts about images</li>
            </>
          )}
          {agent.id === 'generate-image' && (
            <>
              <li>• Creates images from text descriptions</li>
              <li>• Generates creative visual content</li>
              <li>• Adapts to detailed prompts</li>
            </>
          )}
        </ul>
        </CardContent>
      </Card>
      
      {/* Usage tips */}
      <Card className="mt-auto bg-gray-800 border-gray-700 text-gray-100">
        <CardHeader>
          <CardTitle className="text-sm text-gray-200">Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Be specific in your requests for better results</li>
            <li>• Use the options button for additional parameters</li>
            <li>• Press Enter to send your message</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentInfoPanel;
