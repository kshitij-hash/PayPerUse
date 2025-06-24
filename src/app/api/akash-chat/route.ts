import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with AkashChat base URL
const openai = new OpenAI({
  apiKey: process.env.AKASH_API_KEY || 'sk-xxxxxxxx', // Replace with your AkashChat API key in .env.local
  baseURL: 'https://chatapi.akash.network/api/v1'
});

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST handler for /api/akash-chat
 * Generates text responses using AkashChat's API (OpenAI-compatible)
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
              maxAmountRequired: "50000", // 0.05 USDC as defined in services.json
              resource: "https://flow-nu-two.vercel.app/api/akash-chat",
              description: "AkashChat Agent service",
              mimeType: "application/json",
              payTo: "0x9D9e34611ab141a704d24368E8C0E900FbE7b0DF", // Same payout address as other agents
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

    // Log the request headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Clone the request to avoid "Body already used" errors
    const clonedReq = req.clone();
    
    try {
      // Parse the request body
      const body = await clonedReq.json();
      console.log('Request body:', body);
      
      // Handle input from ServiceModal (which sends { input: string, model: string })
      // or direct API calls (which send { prompt: string, model: string })
      let prompt: string;
      let model: string;
      
      if (body.input && typeof body.input === 'string') {
        // This is from ServiceModal
        prompt = body.input;
        
        // Get model from request body or query parameters or use default
        if (body.model && typeof body.model === 'string') {
          model = body.model;
        } else {
          const url = new URL(req.url);
          model = url.searchParams.get('model') || 'Meta-Llama-3-1-8B-Instruct-FP8';
        }
      } else {
        // This is from a direct API call
        prompt = body.prompt;
        model = body.model;
      }
      
      if (!prompt || typeof prompt !== 'string') {
        console.log('Invalid prompt:', prompt);
        return NextResponse.json(
          { error: 'Prompt is required and must be a string' },
          { status: 400 }
        );
      }

      if (!model || typeof model !== 'string') {
        console.log('Invalid model:', model);
        return NextResponse.json(
          { error: 'Model selection is required' },
          { status: 400 }
        );
      }
      
      console.log(`Processing request with model: ${model} and prompt: ${prompt.substring(0, 50)}...`);
      
      // Continue with the rest of the function using the validated model and prompt
      // Configure retry parameters
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000; // Start with 1 second delay
      let lastError: unknown = null;
      
      // Try with exponential backoff
      while (retryCount < maxRetries) {
        try {
          console.log(`Calling AkashChat API with model ${model}, attempt ${retryCount + 1}`);
          
          // Call the AkashChat API (OpenAI-compatible)
          const response = await openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.95
          });
          
          // Extract the generated text
          const generatedText = response.choices[0]?.message?.content || 'No response generated';
          
          // Return the generated text
          return NextResponse.json({ result: generatedText });
          
        } catch (error: unknown) {
          lastError = error;
          const errorObj = error as { message?: string; status?: number; response?: { status?: number } };
          
          console.error(`Error calling AkashChat API: ${errorObj.message || 'Unknown error'}`);
          
          // Check if we should retry based on the error
          const statusCode = errorObj.status || errorObj.response?.status;
          const shouldRetry = statusCode === undefined || statusCode >= 500 || statusCode === 429;
          
          if (shouldRetry && retryCount < maxRetries - 1) {
            console.log(`Retrying in ${retryDelay}ms...`);
            await sleep(retryDelay);
            retryCount++;
            retryDelay *= 2; // Exponential backoff
          } else {
            break; // Don't retry anymore
          }
        }
      }
      
      // If we get here, all retries failed
      console.error('All attempts to call AkashChat API failed');
      const errorObj = lastError as { message?: string; status?: number; response?: { status?: number } };
      
      return NextResponse.json(
        { error: `Failed to generate text: ${errorObj.message || 'Unknown error'}` },
        { status: errorObj.status || errorObj.response?.status || 500 }
      );
      
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Failed to parse request body' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorObj = error as { message?: string };
    
    return NextResponse.json(
      { error: `Unexpected error: ${errorObj.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
