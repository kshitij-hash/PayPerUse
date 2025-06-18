'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CdpWalletManager from '@/components/CdpWalletManager';
import { callPaidApi } from '@/lib/x402Client';
import { getWalletFromLocalStorage } from '@/lib/sessionWalletManager';
import { marked } from 'marked';

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
  const [contentTopic, setContentTopic] = useState('');
  const [contentTone, setContentTone] = useState('Professional');
  const [contentLength, setContentLength] = useState('500 words');
  const [contentKeywords, setContentKeywords] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [imagePrompt, setImagePrompt] = useState('');
  const [apiResult, setApiResult] = useState<{
    summary?: string;
    content?: string;
    translation?: string;
    imageBase64?: string;
    // Research Assistant properties
    outline?: string;
    keyQuestions?: Array<string | {title: string, description: string}>;
    subtopics?: Array<string | {title: string, description: string}>;
    introduction?: string;
    conclusion?: string;
    keywords?: string[];
    methodologySuggestions?: string;
    references?: string[];
    // Poetry Generator properties
    poem?: string;
    title?: string;
    style?: string;
    mood?: string;
    analysis?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<'summarize' | 'write' | 'translate' | 'generate-image' | 'agents' | 'code-assistant' | 'research-assistant' | 'poetry-generator'>('summarize');
  
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

  // State for code assistant inputs
  const [codeQuery, setCodeQuery] = useState<string>('');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [codingLanguage, setCodingLanguage] = useState<string>('javascript');

  // State for research assistant inputs
  const [researchTopic, setResearchTopic] = useState<string>('');
  const [researchDepth, setResearchDepth] = useState<string>('standard');
  const [researchFocus, setResearchFocus] = useState<string>('general');
  const [researchFormat, setResearchFormat] = useState<string>('academic');

  // State for poetry generator inputs
  const [poetryTopic, setPoetryTopic] = useState<string>('');
  const [poetryStyle, setPoetryStyle] = useState<string>('free verse');
  const [poetryMood, setPoetryMood] = useState<string>('reflective');

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
          
        case 'write':
          if (!contentTopic.trim()) {
            throw new Error('Please enter a topic to write about');
          }
          // Prepare keywords as an array if provided
          const keywords = contentKeywords.trim() ? contentKeywords.split(',').map(k => k.trim()) : [];
          
          response = await callPaidApi(
            wallet.id,
            '/api/write',
            'POST',
            { 
              topic: contentTopic,
              tone: contentTone,
              length: contentLength,
              keywords: keywords
            },
            wallet.address
          );
          setApiResult({ content: (response?.result as string) || 'No content returned' });
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
          
        case 'code-assistant':
          if (!codeQuery.trim()) {
            throw new Error('Please enter a coding question or error message');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/code-assistant',
            'POST',
            { 
              query: codeQuery,
              code: codeSnippet,
              language: codingLanguage
            },
            wallet.address
          );
          setApiResult({ content: (response?.result as string) || 'No content returned' });
          break;
          
        case 'research-assistant':
          if (!researchTopic.trim()) {
            throw new Error('Please enter a research topic');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/research-assistant',
            'POST',
            { 
              topic: researchTopic,
              depth: researchDepth,
              focus: researchFocus,
              format: researchFormat
            },
            wallet.address
          );
          setApiResult(response || {});
          break;
          
        case 'poetry-generator':
          if (!poetryTopic.trim()) {
            throw new Error('Please enter a topic for your poem');
          }
          response = await callPaidApi(
            wallet.id,
            '/api/poetry-generator',
            'POST',
            { 
              topic: poetryTopic,
              style: poetryStyle,
              mood: poetryMood
            },
            wallet.address
          );
          setApiResult(response || {});
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
        
      case 'write':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Content Writing</h3>
            <div>
              <label className="block mb-2">Topic:</label>
              <textarea
                value={contentTopic}
                onChange={(e) => setContentTopic(e.target.value)}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter the topic you want content about..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Tone:</label>
                <select
                  value={contentTone}
                  onChange={(e) => setContentTone(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="Professional">Professional</option>
                  <option value="Casual">Casual</option>
                  <option value="Formal">Formal</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Technical">Technical</option>
                  <option value="Persuasive">Persuasive</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Length:</label>
                <select
                  value={contentLength}
                  onChange={(e) => setContentLength(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="Short paragraph">Short paragraph</option>
                  <option value="300 words">300 words</option>
                  <option value="500 words">500 words</option>
                  <option value="800 words">800 words</option>
                  <option value="1000+ words">1000+ words</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-2">Keywords (comma separated):</label>
              <input
                type="text"
                value={contentKeywords}
                onChange={(e) => setContentKeywords(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="keyword1, keyword2, keyword3..."
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
        
      case 'code-assistant':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Code Assistant</h3>
            <div>
              <label className="block mb-2">Coding Question or Error Message:</label>
              <textarea
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter your coding question or paste an error message..."
              />
            </div>
            <div>
              <label className="block mb-2">Programming Language:</label>
              <select
                value={codingLanguage}
                onChange={(e) => setCodingLanguage(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Code Snippet (Optional):</label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full p-2 border rounded font-mono text-sm"
                rows={8}
                placeholder="Paste your code here if you need help with a specific snippet..."
              />
            </div>
          </div>
        );

      case 'research-assistant':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Research Assistant</h3>
            <div>
              <label className="block mb-2">Research Topic:</label>
              <textarea
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter your research topic or question..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">Research Depth:</label>
                <select
                  value={researchDepth}
                  onChange={(e) => setResearchDepth(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Research Focus:</label>
                <select
                  value={researchFocus}
                  onChange={(e) => setResearchFocus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="general">General</option>
                  <option value="historical">Historical</option>
                  <option value="contemporary">Contemporary</option>
                  <option value="analytical">Analytical</option>
                  <option value="comparative">Comparative</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Format Style:</label>
                <select
                  value={researchFormat}
                  onChange={(e) => setResearchFormat(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="academic">Academic</option>
                  <option value="business">Business</option>
                  <option value="educational">Educational</option>
                  <option value="journalistic">Journalistic</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'poetry-generator':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Poetry Generator</h3>
            <div>
              <label className="block mb-2">Topic or Theme:</label>
              <textarea
                value={poetryTopic}
                onChange={(e) => setPoetryTopic(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter a topic or theme for your poem..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Poetry Style:</label>
                <select
                  value={poetryStyle}
                  onChange={(e) => setPoetryStyle(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="free verse">Free Verse</option>
                  <option value="haiku">Haiku</option>
                  <option value="sonnet">Sonnet</option>
                  <option value="limerick">Limerick</option>
                  <option value="acrostic">Acrostic</option>
                  <option value="ballad">Ballad</option>
                  <option value="villanelle">Villanelle</option>
                  <option value="tanka">Tanka</option>
                  <option value="epic">Epic</option>
                  <option value="ode">Ode</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Mood/Tone:</label>
                <select
                  value={poetryMood}
                  onChange={(e) => setPoetryMood(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="reflective">Reflective</option>
                  <option value="joyful">Joyful</option>
                  <option value="melancholic">Melancholic</option>
                  <option value="romantic">Romantic</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="angry">Angry</option>
                  <option value="peaceful">Peaceful</option>
                  <option value="nostalgic">Nostalgic</option>
                  <option value="hopeful">Hopeful</option>
                  <option value="dramatic">Dramatic</option>
                </select>
              </div>
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
        
      case 'write':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded text-black">
            <h4 className="font-semibold mb-2">Generated Content:</h4>
            <div className="whitespace-pre-wrap">{apiResult.content}</div>
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
        
      case 'code-assistant':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded text-black">
            <h4 className="font-semibold mb-2">Code Assistant Response:</h4>
            <div className="mt-2 prose max-w-none code-assistant-response text-black">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(apiResult.content || '') }} />
            </div>
            <style jsx global>{`
              .code-assistant-response {
                color: #000000;
              }
              .code-assistant-response p, 
              .code-assistant-response h1, 
              .code-assistant-response h2, 
              .code-assistant-response h3, 
              .code-assistant-response h4, 
              .code-assistant-response h5, 
              .code-assistant-response h6, 
              .code-assistant-response ul, 
              .code-assistant-response ol, 
              .code-assistant-response li {
                color: #000000;
              }
              .code-assistant-response pre {
                background-color: #1e1e1e;
                color: #d4d4d4;
                padding: 1rem;
                border-radius: 0.375rem;
                overflow-x: auto;
                margin: 1rem 0;
              }
              .code-assistant-response code {
                color: #d4d4d4;
                background-color: rgba(110, 118, 129, 0.4);
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
              }
              .code-assistant-response pre code {
                background-color: transparent;
                padding: 0;
                color: inherit;
                display: block;
                line-height: 1.5;
              }
            `}</style>
          </div>
        );
        
      case 'research-assistant':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded text-black">
            <h4 className="font-semibold mb-2">Research Assistant Results:</h4>
            <div className="mt-4 space-y-6 research-assistant-response">
              {apiResult.outline && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Research Outline</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="whitespace-pre-wrap">{apiResult.outline}</div>
                  </div>
                </div>
              )}
              
              {apiResult.keyQuestions && apiResult.keyQuestions.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Key Research Questions</h5>
                  <div className="p-3 bg-white rounded border">
                    <ul className="list-disc pl-5 space-y-1">
                      {apiResult.keyQuestions.map((question, index) => (
                        <li key={index}>
                          {typeof question === 'string' ? (
                            question
                          ) : (
                            <>
                              <strong>{question.title}</strong>
                              {question.description && (
                                <div className="ml-2 text-sm text-gray-600">{question.description}</div>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {apiResult.subtopics && apiResult.subtopics.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Subtopics</h5>
                  <div className="p-3 bg-white rounded border">
                    <ul className="list-disc pl-5 space-y-1">
                      {apiResult.subtopics.map((subtopic, index) => (
                        <li key={index}>
                          {typeof subtopic === 'string' ? (
                            subtopic
                          ) : (
                            <>
                              <strong>{subtopic.title}</strong>
                              {subtopic.description && (
                                <div className="ml-2 text-sm text-gray-600">{subtopic.description}</div>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {apiResult.introduction && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Introduction</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="whitespace-pre-wrap">{apiResult.introduction}</div>
                  </div>
                </div>
              )}
              
              {apiResult.conclusion && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Conclusion</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="whitespace-pre-wrap">{apiResult.conclusion}</div>
                  </div>
                </div>
              )}
              
              {apiResult.keywords && apiResult.keywords.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Keywords</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="flex flex-wrap gap-2">
                      {apiResult.keywords.map((keyword: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {apiResult.methodologySuggestions && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Methodology Suggestions</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="whitespace-pre-wrap">{apiResult.methodologySuggestions}</div>
                  </div>
                </div>
              )}
              
              {apiResult.references && apiResult.references.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">References</h5>
                  <div className="p-3 bg-white rounded border">
                    <ol className="list-decimal pl-5 space-y-1">
                      {apiResult.references.map((reference: string, index: number) => (
                        <li key={index}>{reference}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
            <style jsx global>{`
              .research-assistant-response {
                color: #000000;
              }
            `}</style>
          </div>
        );
        
      case 'poetry-generator':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded text-black">
            <h4 className="font-semibold mb-2">Generated Poetry:</h4>
            <div className="mt-4 space-y-6 poetry-generator-response">
              {apiResult.title && (
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold">{apiResult.title}</h3>
                </div>
              )}
              
              {apiResult.poem && (
                <div className="mb-4">
                  <div className="p-6 bg-white rounded border font-serif">
                    <div className="whitespace-pre-wrap text-center">{apiResult.poem}</div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {apiResult.style && (
                  <div className="mb-4">
                    <h5 className="text-md font-semibold mb-2">Style</h5>
                    <div className="p-3 bg-white rounded border">
                      <div>{apiResult.style}</div>
                    </div>
                  </div>
                )}
                
                {apiResult.mood && (
                  <div className="mb-4">
                    <h5 className="text-md font-semibold mb-2">Mood</h5>
                    <div className="p-3 bg-white rounded border">
                      <div>{apiResult.mood}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {apiResult.analysis && (
                <div className="mb-4">
                  <h5 className="text-lg font-semibold mb-2">Analysis</h5>
                  <div className="p-3 bg-white rounded border">
                    <div className="whitespace-pre-wrap">{apiResult.analysis}</div>
                  </div>
                </div>
              )}
            </div>
            <style jsx global>{`
              .poetry-generator-response {
                color: #000000;
              }
            `}</style>
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
            onClick={() => setActiveService('write')}
            className={`py-2 px-4 ${activeService === 'write' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          >
            Write
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
          <button
            onClick={() => setActiveService('code-assistant')}
            className={`px-4 py-2 ${activeService === 'code-assistant' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-md`}
          >
            Code Assistant
          </button>
          <button
            onClick={() => setActiveService('research-assistant')}
            className={`px-4 py-2 ${activeService === 'research-assistant' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-md`}
          >
            Research Assistant
          </button>
          <button
            onClick={() => setActiveService('poetry-generator')}
            className={`px-4 py-2 ${activeService === 'poetry-generator' ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-md`}
          >
            Poetry Generator
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
          <li>Select an AI service (summarize, write, translate, or generate image)</li>
          <li>Enter your input and click &quot;Call Paid API&quot;</li>
          <li>The request is signed using your CDP wallet and the x402 payment header is attached</li>
          <li>The API verifies the payment and processes your request</li>
          <li>Results are displayed below the form</li>
        </ol>
      </div>
    </div>
  );
}
