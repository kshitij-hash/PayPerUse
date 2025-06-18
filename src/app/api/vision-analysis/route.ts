import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
// Note: In production, you should use environment variables for API keys
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); // Add your Gemini API key to .env.local

// Define models in order of preference
const MODELS = [
  "gemini-1.5-pro-vision",  // Primary model for vision tasks
  "gemini-1.0-pro-vision"   // Fallback model
];

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST handler for /api/vision-analysis
 * Analyzes images and generates text using Google's Gemini Vision API
 */
export async function POST(req: NextRequest) {
  try {
    
    // Parse the request body
    const { input, config } = await req.json();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Extract image data and text prompt
    const { imageUrl, prompt } = input;
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract configuration options with defaults
    const temperature = config?.temperature || 0.7;
    const maxOutputTokens = config?.maxOutputTokens || 1000;
    const topP = config?.topP || 0.95;
    const topK = config?.topK || 40;
    
    // Try each model with exponential backoff
    let lastError: unknown = null;
    let analysisResult: string | null = null;
    
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
          }
          
          // Prepare the request config
          const config: GeminiConfig = {
            temperature,
            maxOutputTokens,
            topP,
            topK
          };
          
          // Use @ts-expect-error to bypass type checking for the Gemini API
          // The type definitions may not be up to date with the latest API
          
          // Prepare the request based on the latest Gemini API documentation
          const requestConfig = {
            model: modelName,
            contents: [
              {
                parts: [
                  { image: { url: imageUrl } },
                  ...(prompt && typeof prompt === 'string' ? [{ text: prompt }] : [])
                ]
              }
            ],
            config
          };
          
          // Generate content using the simplified API
          const response = await ai.models.generateContent(requestConfig);
          
          // Extract the analysis result
          analysisResult = response.text || 'No analysis generated';
          
          // If we got here, the request succeeded
          console.log(`Successfully analyzed image using ${modelName}`);
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
      
      // If we got an analysis result, we're done
      if (analysisResult) {
        break;
      }
    }
    
    // If we got an analysis result, return it
    if (analysisResult) {
      return NextResponse.json({ output: analysisResult }, { status: 200 });
    }
    
    // If we got here, all models failed
    throw lastError || new Error('All models failed to analyze the image');
  } catch (error: unknown) {
    console.error('Error in vision analysis service:', error);
    
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
      { error: 'Failed to analyze image', details: String(error) },
      { status: 500 }
    );
  }
}
