'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CdpWalletManager from '@/components/CdpWalletManager';
import { callPaidApi } from '@/lib/x402Client';
import { getWalletFromLocalStorage } from '@/lib/sessionWalletManager';

/**
 * CDP Wallet Demo Page
 * 
 * This page demonstrates:
 * 1. Creating and managing a CDP wallet
 * 2. Making calls to x402-paid AI services
 */
export default function WalletDemoPage() {
  // State for API inputs and results
  const [inputText, setInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [imagePrompt, setImagePrompt] = useState('');
  const [apiResult, setApiResult] = useState<{
    summary?: string;
    translation?: string;
    imageBase64?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<'summarize' | 'translate' | 'generate-image' | 'agents'>('summarize');
  
  // State for agents
  const [agents, setAgents] = useState<Array<{id: string, name: string}>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agentInput, setAgentInput] = useState<string>('');
  const [agentResult, setAgentResult] = useState<{
    agentId?: string;
    agentName?: string;
    input?: string;
    output?: string;
    steps?: Array<{
      stepId: string;
      serviceId: string;
      serviceName: string;
      result: Record<string, unknown>;
    }>;
  } | null>(null);

  /**
   * Load available agents from the server
   */
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        console.log('Fetching agents from /api/agents...');
        const response = await fetch('/api/agents');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from /api/agents:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Agents data received:', data);
        
        if (!data.agents || !Array.isArray(data.agents)) {
          throw new Error('Invalid agents data format');
        }
        
        const agentList = data.agents.map((agent: { id: string; name: string }) => ({
          id: agent.id,
          name: agent.name
        }));
        
        console.log('Setting agents list:', agentList);
        setAgents(agentList);
        
        if (agentList.length > 0) {
          console.log('Setting selected agent ID to:', agentList[0].id);
          setSelectedAgentId(agentList[0].id);
        } else {
          console.warn('No agents available');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to load agents:', errorMessage, err);
        setError(`Failed to load agents: ${errorMessage}`);
      }
    };
    
    fetchAgents();
  }, []);

  /**
   * Call the appropriate x402-paid API based on the active service
   */
  const callPaidService = async () => {
    // Get wallet from local storage
    const wallet = getWalletFromLocalStorage();
    if (!wallet) {
      setError('No wallet available. Please create a wallet first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResult(null);

    try {
      let response: {
        summary?: string;
        translation?: string;
        imageBase64?: string;
        [key: string]: unknown;
      };
      
      switch (activeService) {
        case 'agents':
          if (!agentInput.trim()) {
            throw new Error('Please enter input for the agent');
          }
          if (!selectedAgentId) {
            throw new Error('Please select an agent');
          }
          
          // Call the run-agent API
          const agentResponse = await fetch('/api/run-agent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agentId: selectedAgentId,
              input: agentInput,
              privateKey: wallet.id // Using wallet ID as the identifier
            })
          });
          
          if (!agentResponse.ok) {
            const errorData = await agentResponse.json();
            throw new Error(errorData.error || 'Failed to execute agent');
          }
          
          const agentData = await agentResponse.json();
          setAgentResult(agentData);
          break;
          
        case 'summarize':
          if (!inputText.trim()) {
            throw new Error('Please enter text to summarize');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/summarize',
            'POST',
            { input: inputText },
            wallet.address
          );
          setApiResult({ summary: (response?.result as string) || 'No summary returned' });
          break;
          
        case 'translate':
          if (!inputText.trim()) {
            throw new Error('Please enter text to translate');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/translate',
            'POST',
            { 
              text: inputText,
              targetLanguage: targetLanguage 
            },
            wallet.address
          );
          setApiResult({ translation: response?.translation || 'No translation returned' });
          break;
          
        case 'generate-image':
          if (!imagePrompt.trim()) {
            throw new Error('Please enter an image prompt');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/generate-image',
            'POST',
            { prompt: imagePrompt },
            wallet.address
          );
          setApiResult({ imageBase64: response?.imageBase64 || '' });
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make API call');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render the appropriate input form based on the active service
   */
  const renderServiceForm = () => {
    switch (activeService) {
      case 'agents':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Execution</h3>
            <div>
              <label className="block mb-2">Select Agent:</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Input:</label>
              <textarea
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                className="w-full p-2 border rounded"
                rows={5}
                placeholder="Enter input for the agent..."
              />
            </div>
          </div>
        );
      case 'summarize':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Text Summarization</h3>
            <div>
              <label className="block mb-2">Text to Summarize:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-2 border rounded"
                rows={5}
                placeholder="Enter text to summarize..."
              />
            </div>
          </div>
        );
        
      case 'translate':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Text Translation</h3>
            <div>
              <label className="block mb-2">Text to Translate:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-2 border rounded"
                rows={5}
                placeholder="Enter text to translate..."
              />
            </div>
            <div>
              <label className="block mb-2">Target Language:</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Chinese">Chinese</option>
                <option value="Russian">Russian</option>
              </select>
            </div>
          </div>
        );
        
      case 'generate-image':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Image Generation</h3>
            <div>
              <label className="block mb-2">Image Prompt:</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Describe the image you want to generate..."
              />
            </div>
          </div>
        );
    }
  };

  /**
   * Render the API result based on the active service
   */
  const renderApiResult = () => {
    if (activeService === 'agents') {
      if (!agentResult) return null;
      
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded text-black">
          <h4 className="font-semibold mb-2">Agent Result:</h4>
          <div className="mb-4">
            <h5 className="font-medium">Final Output:</h5>
            <p className="p-2 bg-white border rounded">{agentResult.output}</p>
          </div>
          
          <h5 className="font-medium mb-2">Step Results:</h5>
          <div className="space-y-3">
            {agentResult.steps?.map((step, index) => (
              <div key={index} className="p-2 border rounded bg-white">
                <p><strong>Step {index + 1}:</strong> {step.serviceName} ({step.serviceId})</p>
                <p className="mt-1"><strong>Result:</strong></p>
                <pre className="p-2 bg-gray-100 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(step.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (!apiResult) return null;
    
    switch (activeService) {
      case 'summarize':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded text-black">
            <h4 className="font-semibold mb-2">Summary:</h4>
            <p>{apiResult.summary}</p>
          </div>
        );
        
      case 'translate':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Translation ({targetLanguage}):</h4>
            <p>{apiResult.translation}</p>
          </div>
        );
        
      case 'generate-image':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Generated Image:</h4>
            {apiResult.imageBase64 ? (
              <Image 
                src={`data:image/png;base64,${apiResult.imageBase64}`} 
                alt="Generated image" 
                width={512}
                height={512}
                className="max-w-full h-auto border"
              />
            ) : (
              <p>No image data received</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CDP Wallet & x402-Paid AI Services Demo</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Manage Your CDP Wallet</h2>
        <CdpWalletManager />
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Use x402-Paid AI Services</h2>
        
        {/* Service Selection Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveService('summarize')}
            className={`py-2 px-4 ${activeService === 'summarize' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Summarize
          </button>
          <button
            onClick={() => setActiveService('translate')}
            className={`py-2 px-4 ${activeService === 'translate' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Translate
          </button>
          <button
            onClick={() => setActiveService('generate-image')}
            className={`py-2 px-4 ${activeService === 'generate-image' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Generate Image
          </button>
          <button
            onClick={() => setActiveService('agents')}
            className={`py-2 px-4 ${activeService === 'agents' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Agents
          </button>
        </div>
        
        {/* Service Form */}
        <div className="mb-4">
          {renderServiceForm()}
        </div>
        
        {/* Call API Button */}
        <button
          onClick={callPaidService}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Call Paid API'}
        </button>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {/* API Result */}
        {renderApiResult()}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded text-black">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Create a CDP wallet using the wallet manager above</li>
          <li>Optionally fund your wallet to make real payments</li>
          <li>Select an AI service (summarize, translate, or generate image)</li>
          <li>Enter your input and click &quot;Call Paid API&quot;</li>
          <li>The request is signed using your CDP wallet and the x402 payment header is attached</li>
          <li>The API verifies the payment and processes your request</li>
          <li>Results are displayed below the form</li>
        </ol>
      </div>
    </div>
  );
}
