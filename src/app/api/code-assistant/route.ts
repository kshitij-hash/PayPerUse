import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
// Note: In production, you should use environment variables for API keys
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); // Add your Gemini API key to .env.local

// Define models in order of preference
const MODELS = [
  "gemini-2.5-flash",  // Primary model (newest and fastest)
  "gemini-1.5-pro",    // Fallback model 1
  "gemini-1.0-pro"     // Fallback model 2
];

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST handler for /api/code-assistant
 * Provides code assistance using Google's Gemini API
 */
export async function POST(req: NextRequest) {
  try {
    // Check for x402 payment JWT header (both uppercase and lowercase)
    const paymentHeader = req.headers.get('X-PAYMENT') || req.headers.get('x-payment');
    
    // If the X-PAYMENT header is missing, return 402 Payment Required
    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              maxAmountRequired: "70000",
              resource: "http://localhost:3000/api/code-assistant",
              description: "Code assistance service",
              mimeType: "application/json",
              payTo: "0x9D9e34611ab141a704d24368E8C0E900FbE7b0DF", // Replace with your actual address
              maxTimeoutSeconds: 300,
              asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              extra: {
                name: "USDC",
                version: "2"
              }
            }
          ]
        },
        { status: 402 }
      );
    }
    
    // TODO: In a production environment, you would validate the X-PAYMENT JWT here
    // For now, we'll just proceed if the X-PAYMENT header is present
    
    // Parse the request body
    const { query, code, language } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Create the prompt based on the provided inputs
    let contents = '';
    
    if (code && typeof code === 'string') {
      // If code is provided, format a prompt for debugging or explaining code
      contents = `You are an expert programming assistant. Please help with the following code issue:

Query: ${query}

${language ? `Programming Language: ${language}` : ''}

\`\`\`
${code}
\`\`\`

Please provide a detailed explanation of the issue and a solution. If appropriate, include corrected code snippets. Format your code examples using markdown code blocks with the appropriate language syntax highlighting.`;
    } else {
      // If only a query is provided, format a prompt for general code assistance
      contents = `You are an expert programming assistant. Please help with the following coding question:

Query: ${query}

${language ? `Programming Language: ${language}` : ''}

Please provide a detailed response with explanations and examples. Format your code examples using markdown code blocks with the appropriate language syntax highlighting.`;
    }
    
    // Try each model with exponential backoff
    let lastError: unknown = null;
    let assistantResponse: string | null = null;
    
    // Try each model in order of preference
    for (const modelName of MODELS) {
      // Configure retry parameters
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000; // Start with 1 second delay
      
      while (retryCount < maxRetries) {
        try {
          // Generate content with the new API
          console.log(`Trying model ${modelName}, attempt ${retryCount + 1}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            // Optional safety settings can be added here if needed
          });
          
          // Extract the response text
          assistantResponse = response.text || 'No response generated';
          
          // If we got here, the request succeeded
          console.log(`Successfully generated code assistance using ${modelName}`);
          break;
        } catch (error: unknown) {
          lastError = error;
          const errorObj = error as { message?: string; status?: number; response?: { status?: number } };
          
          // Check if it's a rate limit error
          if (errorObj?.message?.includes('429 Too Many Requests') || 
              errorObj?.status === 429 || 
              errorObj?.response?.status === 429) {
            
            // Extract retry delay from error message if available
            let extractedDelay = 0;
            if (typeof errorObj.message === 'string') {
              const retryMatch = errorObj.message.match(/"retryDelay":"(\d+)s"/i);
              if (retryMatch && retryMatch[1]) {
                extractedDelay = parseInt(retryMatch[1]) * 1000; // Convert seconds to ms
              }
            }
            
            // Use extracted delay or exponential backoff
            const waitTime = extractedDelay || retryDelay;
            console.log(`Rate limit hit for ${modelName}. Retrying in ${waitTime/1000} seconds...`);
            
            // Wait before retrying
            await sleep(waitTime);
            
            // Increase delay for next retry (exponential backoff)
            retryDelay *= 2;
            retryCount++;
          } else {
            // Not a rate limit error, break and try next model
            console.log(`Error with model ${modelName}, trying next model:`, error);
            break;
          }
        }
      }
      
      // If we got a response, we're done
      if (assistantResponse) {
        break;
      }
    }
    
    // If we got a response, return it
    if (assistantResponse) {
      return NextResponse.json({ result: assistantResponse }, { status: 200 });
    }
    
    // If we got here, all models failed
    throw lastError || new Error('All models failed to generate a response');
  } catch (error: unknown) {
    console.error('Error in code assistance service:', error);
    
    // Check for rate limit errors from Gemini API
    const errorObj = error as { message?: string; status?: number; response?: { status?: number } };
    if (errorObj?.message?.includes('429 Too Many Requests') || 
        errorObj?.status === 429 || 
        errorObj?.response?.status === 429) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please try again later.', 
          details: 'The Gemini API quota has been exceeded for all available models.'
        },
        { status: 429 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Failed to generate code assistance', details: String(error) },
      { status: 500 }
    );
  }
}
