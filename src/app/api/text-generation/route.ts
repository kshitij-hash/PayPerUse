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
 * POST handler for /api/text-generation
 * Generates text using Google's Gemini API
 */
export async function POST(req: NextRequest) {
  try {
    
    // Parse the request body
    const { input, config } = await req.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required and must be a string' },
        { status: 400 }
      );
    }

    // Extract configuration options with defaults
    const temperature = config?.temperature || 0.7;
    const maxOutputTokens = config?.maxOutputTokens || 1000;
    const topP = config?.topP || 0.95;
    const topK = config?.topK || 40;
    const systemInstruction = config?.systemInstruction || '';
    
    // Try each model with exponential backoff
    let lastError: unknown = null;
    let generatedText: string | null = null;
    
    // Try each model in order of preference
    for (const modelName of MODELS) {
      // Configure retry parameters
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000; // Start with 1 second delay
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Trying model ${modelName}, attempt ${retryCount + 1}`);
          
          // Define config type to include systemInstruction
          interface GeminiConfig {
            temperature: number;
            maxOutputTokens: number;
            topP: number;
            topK: number;
            systemInstruction?: string;
          }
          
          // Prepare the request based on the latest Gemini API documentation
          const config: GeminiConfig = {
            temperature,
            maxOutputTokens,
            topP,
            topK
          };
          
          // Add system instruction if provided
          if (systemInstruction) {
            config.systemInstruction = systemInstruction;
          }
          
          const requestConfig = {
            model: modelName,
            contents: [{ parts: [{ text: input }] }],
            config
          };
          
          // Generate content using the simplified API
          const response = await ai.models.generateContent(requestConfig);
          
          // Extract the generated text
          generatedText = response.text || 'No text generated';
          
          // If we got here, the request succeeded
          console.log(`Successfully generated text using ${modelName}`);
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
      
      // If we got generated text, we're done
      if (generatedText) {
        break;
      }
    }
    
    // If we got generated text, return it
    if (generatedText) {
      return NextResponse.json({ output: generatedText }, { status: 200 });
    }
    
    // If we got here, all models failed
    throw lastError || new Error('All models failed to generate text');
  } catch (error: unknown) {
    console.error('Error in text generation service:', error);
    
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
      { error: 'Failed to generate text', details: String(error) },
      { status: 500 }
    );
  }
}
