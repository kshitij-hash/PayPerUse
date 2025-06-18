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
 * POST handler for /api/write
 * Generates content using Google's Gemini API
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
              maxAmountRequired: "50000",
              resource: "http://localhost:3000/api/write",
              description: "Content writing service",
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
    const { topic, tone, length, keywords } = await req.json();
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }

    // Create the prompt
    let contents = `Please write content about the following topic: ${topic}`;
    
    // Add optional parameters to the prompt if provided
    if (tone && typeof tone === 'string') {
      contents += `\nTone: ${tone}`;
    }
    
    if (length && typeof length === 'string') {
      contents += `\nApproximate length: ${length}`;
    }
    
    if (keywords && Array.isArray(keywords)) {
      contents += `\nInclude these keywords: ${keywords.join(', ')}`;
    }
    
    // Try each model with exponential backoff
    let lastError: unknown = null;
    let generatedContent: string | null = null;
    
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
          
          // Extract the generated content
          generatedContent = response.text || 'No content generated';
          
          // If we got here, the request succeeded
          console.log(`Successfully generated content using ${modelName}`);
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
      
      // If we got content, we're done
      if (generatedContent) {
        break;
      }
    }
    
    // If we got content, return it
    if (generatedContent) {
      return NextResponse.json({ result: generatedContent }, { status: 200 });
    }
    
    // If we got here, all models failed
    throw lastError || new Error('All models failed to generate content');
  } catch (error: unknown) {
    console.error('Error in content writing service:', error);
    
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
      { error: 'Failed to generate content', details: String(error) },
      { status: 500 }
    );
  }
}
